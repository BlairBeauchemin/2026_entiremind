import type {
  CampaignContact,
  CreateDraftCampaignResult,
  DraftCampaignInput,
  EmailCampaignProviderAdapter,
  SyncContactsResult,
} from "../types";

/**
 * ActiveCampaign adapter.
 *
 * Contact sync uses the modern v3 REST API (contact/sync + contactLists +
 * tags). Draft campaign creation uses the legacy v1 API (message_add +
 * campaign_create) because v3 can create campaigns and messages but has no
 * way to link a message to a campaign. Both APIs accept the same API key.
 *
 * Env: ACTIVECAMPAIGN_API_URL (e.g. https://youraccount.api-us1.com),
 *      ACTIVECAMPAIGN_API_KEY, ACTIVECAMPAIGN_LIST_ID,
 *      ACTIVECAMPAIGN_FROM_EMAIL, ACTIVECAMPAIGN_FROM_NAME (optional)
 */

const REQUEST_DELAY_MS = 250; // v3 rate limit: 5 requests/second

function getConfig() {
  const baseUrl = process.env.ACTIVECAMPAIGN_API_URL?.replace(/\/$/, "");
  const apiKey = process.env.ACTIVECAMPAIGN_API_KEY;
  const listId = process.env.ACTIVECAMPAIGN_LIST_ID;
  if (!baseUrl || !apiKey || !listId) {
    throw new Error(
      "ActiveCampaign not configured: set ACTIVECAMPAIGN_API_URL, ACTIVECAMPAIGN_API_KEY, ACTIVECAMPAIGN_LIST_ID",
    );
  }
  return { baseUrl, apiKey, listId };
}

async function v3Request<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const { baseUrl, apiKey } = getConfig();
  const res = await fetch(`${baseUrl}/api/3/${path}`, {
    method: init.method ?? "GET",
    headers: {
      "Api-Token": apiKey,
      "Content-Type": "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `ActiveCampaign ${path} returned ${res.status}: ${text.slice(0, 300)}`,
    );
  }
  return (await res.json()) as T;
}

/** Legacy v1 API call (form-encoded). Used only where v3 has no equivalent. */
async function v1Request(
  action: string,
  fields: Record<string, string>,
): Promise<Record<string, unknown>> {
  const { baseUrl, apiKey } = getConfig();
  const params = new URLSearchParams({
    api_action: action,
    api_key: apiKey,
    api_output: "json",
  });
  const body = new URLSearchParams(fields);
  const res = await fetch(`${baseUrl}/admin/api.php?${params}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `ActiveCampaign v1 ${action} returned ${res.status}: ${text.slice(0, 300)}`,
    );
  }
  const data = (await res.json()) as Record<string, unknown>;
  if (data.result_code !== 1) {
    throw new Error(
      `ActiveCampaign v1 ${action} failed: ${String(data.result_message ?? "unknown error")}`,
    );
  }
  return data;
}

/** Find-or-create a contact tag, returning its id. Cached per process. */
const tagIdCache = new Map<string, string>();

async function ensureTagId(tagName: string): Promise<string> {
  const cached = tagIdCache.get(tagName);
  if (cached) return cached;

  const search = await v3Request<{ tags: Array<{ id: string; tag: string }> }>(
    `tags?search=${encodeURIComponent(tagName)}`,
  );
  const existing = search.tags?.find((t) => t.tag === tagName);
  if (existing) {
    tagIdCache.set(tagName, existing.id);
    return existing.id;
  }

  const created = await v3Request<{ tag: { id: string } }>("tags", {
    method: "POST",
    body: { tag: { tag: tagName, tagType: "contact", description: "" } },
  });
  tagIdCache.set(tagName, created.tag.id);
  return created.tag.id;
}

export const activeCampaignAdapter: EmailCampaignProviderAdapter = {
  provider: "activecampaign",

  isConfigured(): boolean {
    return Boolean(
      process.env.ACTIVECAMPAIGN_API_URL &&
      process.env.ACTIVECAMPAIGN_API_KEY &&
      process.env.ACTIVECAMPAIGN_LIST_ID,
    );
  },

  async syncContacts(contacts: CampaignContact[]): Promise<SyncContactsResult> {
    const { listId } = getConfig();
    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const contact of contacts) {
      try {
        // Upsert the contact by email
        const syncResult = await v3Request<{ contact: { id: string } }>(
          "contact/sync",
          {
            method: "POST",
            body: {
              contact: {
                email: contact.email,
                firstName: contact.name?.split(" ")[0] ?? "",
              },
            },
          },
        );
        const contactId = syncResult.contact.id;

        // Subscribe to the list (status 1 = active)
        await v3Request("contactLists", {
          method: "POST",
          body: {
            contactList: { list: listId, contact: contactId, status: "1" },
          },
        });

        // Apply tags (user/lead). Already-applied tags return an error we
        // can safely ignore — the association is idempotent in effect.
        for (const tag of contact.tags) {
          const tagId = await ensureTagId(tag);
          try {
            await v3Request("contactTags", {
              method: "POST",
              body: { contactTag: { contact: contactId, tag: tagId } },
            });
          } catch {
            // duplicate tag application — fine
          }
        }

        synced++;
      } catch (err) {
        failed++;
        errors.push(
          `${contact.email}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
    }

    return { synced, failed, errors };
  },

  async createDraftCampaign(
    input: DraftCampaignInput,
  ): Promise<CreateDraftCampaignResult> {
    const { listId } = getConfig();
    const fromEmail = process.env.ACTIVECAMPAIGN_FROM_EMAIL;
    const fromName = process.env.ACTIVECAMPAIGN_FROM_NAME || "Entiremind";
    if (!fromEmail) {
      return {
        success: false,
        error: "ACTIVECAMPAIGN_FROM_EMAIL not set",
      };
    }

    try {
      // 1. Create the message (email content) via the v1 API
      const messageResult = await v1Request("message_add", {
        format: "html",
        subject: input.subject,
        fromemail: fromEmail,
        fromname: fromName,
        reply2: fromEmail,
        priority: "3",
        charset: "utf-8",
        encoding: "quoted-printable",
        htmlconstructor: "editor",
        html: input.html,
        textconstructor: "editor",
        text: input.plainText,
        [`p[${listId}]`]: listId,
      });
      const messageId = String(messageResult.id);

      // 2. Create the campaign as a draft (status 0) pointing at the message
      const campaignResult = await v1Request("campaign_create", {
        type: "single",
        name: input.name,
        sdate: formatAcDate(new Date()),
        status: "0", // draft — founder reviews and sends in the AC UI
        public: "1",
        tracklinks: "all",
        [`p[${listId}]`]: listId,
        [`m[${messageId}]`]: "100",
      });

      return { success: true, campaignId: String(campaignResult.id) };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
};

/** AC v1 expects "YYYY-MM-DD HH:MM:SS" */
function formatAcDate(d: Date): string {
  return d.toISOString().slice(0, 19).replace("T", " ");
}
