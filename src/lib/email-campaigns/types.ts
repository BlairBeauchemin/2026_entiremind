/**
 * Email campaign provider abstraction (mirrors the SMS provider layer).
 * The app drafts campaigns and syncs contacts; approval, sending, and
 * unsubscribe compliance all live in the provider's UI.
 */

export type EmailCampaignProvider = "activecampaign";

export interface CampaignContact {
  email: string;
  name?: string;
  /** e.g. "user" | "lead" — applied as provider tags */
  tags: string[];
}

export interface DraftCampaignInput {
  /** Internal campaign name shown in the provider UI */
  name: string;
  subject: string;
  html: string;
  plainText: string;
}

export interface SyncContactsResult {
  synced: number;
  failed: number;
  errors: string[];
}

export interface CreateDraftCampaignResult {
  success: boolean;
  campaignId?: string;
  error?: string;
}

export interface EmailCampaignProviderAdapter {
  provider: EmailCampaignProvider;

  /** Upsert contacts into the provider's list with tags */
  syncContacts(contacts: CampaignContact[]): Promise<SyncContactsResult>;

  /** Create a draft campaign the founder reviews and sends in the provider UI */
  createDraftCampaign(
    input: DraftCampaignInput,
  ): Promise<CreateDraftCampaignResult>;
}
