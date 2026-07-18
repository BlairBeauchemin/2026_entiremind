/**
 * Quote library import: fetch candidate quotes from a public quotes API,
 * filter for SMS length + quality, categorize into Entiremind's manifestation
 * themes (tag mapping first, AI for the rest), and insert into the `quotes`
 * table. Rerunnable — dedupes by quote text via ON CONFLICT DO NOTHING.
 *
 * Usage: npx tsx scripts/import-quotes.ts [--source zenquotes|quotable] [--target 200]
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { QUOTE_THEMES, type QuoteTheme } from "../src/lib/quotes/types";

// Load .env.local manually (matches scripts/test-sms.ts)
const envPath = resolve(process.cwd(), ".env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0 && !process.env[key]) {
        process.env[key] = valueParts.join("=");
      }
    }
  }
} catch {
  console.error(
    "Could not load .env.local - make sure you're in the project root",
  );
}

const MAX_TEXT_LENGTH = 120; // `"text" — Author` must fit one 160-char SMS segment
const AI_BATCH_SIZE = 25;
const REJECTED_AUTHORS = new Set(["unknown", "anonymous", "anon", ""]);

interface RawQuote {
  text: string;
  author: string;
  tags: string[];
}

interface CandidateQuote extends RawQuote {
  theme: QuoteTheme;
  source: string;
}

// ---------------------------------------------------------------------------
// Fetchers (pluggable — quote APIs are flaky, so we persist to our own table)
// ---------------------------------------------------------------------------

/** ZenQuotes bulk endpoint: 50 random quotes per call, keyless.
 *  Free tier: 5 requests / 30 seconds, attribution link required. */
async function fetchFromZenQuotes(calls: number): Promise<RawQuote[]> {
  const results: RawQuote[] = [];
  for (let i = 0; i < calls; i++) {
    console.log(`  ZenQuotes call ${i + 1}/${calls}...`);
    const res = await fetch("https://zenquotes.io/api/quotes");
    if (!res.ok) {
      throw new Error(`ZenQuotes returned ${res.status}`);
    }
    const data = (await res.json()) as Array<{ q: string; a: string }>;
    for (const item of data) {
      results.push({ text: item.q, author: item.a, tags: [] });
    }
    if (i < calls - 1) {
      await new Promise((r) => setTimeout(r, 7000)); // rate limit: 5/30s
    }
  }
  return results;
}

/** Quotable open dataset (GitHub JSON dump) — includes tags, no rate limits. */
async function fetchFromQuotableDataset(): Promise<RawQuote[]> {
  const url =
    "https://raw.githubusercontent.com/quotable-io/data/master/data/quotes.json";
  console.log("  Downloading Quotable dataset...");
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Quotable dataset returned ${res.status}`);
  }
  const data = (await res.json()) as Array<{
    content: string;
    author: string;
    tags: string[];
  }>;
  return data.map((q) => ({
    text: q.content,
    author: q.author,
    tags: (q.tags ?? []).map((t) => t.toLowerCase()),
  }));
}

// ---------------------------------------------------------------------------
// Categorization
// ---------------------------------------------------------------------------

/** Cheap tag → theme mapping for sources that provide tags. */
function mapTagsToTheme(tags: string[]): QuoteTheme | null {
  const tagMap: Record<string, QuoteTheme> = {
    gratitude: "gratitude",
    thankfulness: "gratitude",
    love: "love",
    friendship: "love",
    perseverance: "resilience",
    adversity: "resilience",
    courage: "resilience",
    success: "abundance",
    wealth: "abundance",
    opportunity: "abundance",
    "self-confidence": "confidence",
    confidence: "confidence",
    "self-esteem": "confidence",
    spirituality: "trusting-the-process",
    faith: "trusting-the-process",
    hope: "trusting-the-process",
    patience: "trusting-the-process",
    purpose: "purpose",
    work: "purpose",
    dreams: "purpose",
    mindfulness: "presence",
    "living-in-the-present": "presence",
    time: "presence",
  };
  for (const tag of tags) {
    const theme = tagMap[tag];
    if (theme) return theme;
  }
  return null;
}

const CATEGORIZE_SYSTEM_PROMPT = `You curate quotes for Entiremind, a lightly magical SMS-based manifestation companion. The brand voice is calm, warm, and wise — never hustle-culture, cynical, preachy, or productivity-obsessed.

You will receive a numbered list of quotes. For each, assign exactly one theme from this list, or "reject" if the quote does not fit the brand (too aggressive, cynical, business/hustle-flavored, or just not wise):
${QUOTE_THEMES.join(", ")}

Respond with ONLY a JSON array, one entry per quote: [{"index": 0, "theme": "gratitude"}, {"index": 1, "theme": "reject"}, ...]`;

async function categorizeWithAi(
  quotes: RawQuote[],
): Promise<Map<number, QuoteTheme>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set — needed to categorize quotes");
  }
  const anthropic = new Anthropic({ apiKey });
  const assignments = new Map<number, QuoteTheme>();
  const themeSet = new Set<string>(QUOTE_THEMES);

  for (let start = 0; start < quotes.length; start += AI_BATCH_SIZE) {
    const batch = quotes.slice(start, start + AI_BATCH_SIZE);
    const listing = batch
      .map((q, i) => `${i}. "${q.text}" — ${q.author}`)
      .join("\n");
    console.log(
      `  AI categorizing ${start + 1}-${start + batch.length} of ${quotes.length}...`,
    );

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: CATEGORIZE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: listing }],
    });

    const block = response.content[0];
    if (block.type !== "text") continue;
    const text = block.text.trim();
    const jsonStart = text.indexOf("[");
    const jsonEnd = text.lastIndexOf("]");
    if (jsonStart < 0 || jsonEnd <= jsonStart) {
      console.warn("  Skipping batch: no JSON array in response");
      continue;
    }

    try {
      const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as Array<{
        index: number;
        theme: string;
      }>;
      for (const entry of parsed) {
        if (
          typeof entry.index === "number" &&
          entry.index >= 0 &&
          entry.index < batch.length &&
          themeSet.has(entry.theme)
        ) {
          assignments.set(start + entry.index, entry.theme as QuoteTheme);
        }
      }
    } catch (err) {
      console.warn("  Skipping batch: failed to parse JSON", err);
    }
  }

  return assignments;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const sourceArg = args.includes("--source")
    ? args[args.indexOf("--source") + 1]
    : "zenquotes";
  const target = args.includes("--target")
    ? parseInt(args[args.indexOf("--target") + 1], 10)
    : 200;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // 1. Fetch candidates (with fallback between sources)
  let raw: RawQuote[] = [];
  let source = sourceArg;
  console.log(`Fetching candidates from ${source}...`);
  try {
    raw =
      source === "quotable"
        ? await fetchFromQuotableDataset()
        : await fetchFromZenQuotes(Math.ceil((target * 2) / 50));
  } catch (err) {
    const fallback = source === "quotable" ? "zenquotes" : "quotable";
    console.warn(`${source} failed (${err}), falling back to ${fallback}`);
    source = fallback;
    raw =
      fallback === "quotable"
        ? await fetchFromQuotableDataset()
        : await fetchFromZenQuotes(Math.ceil((target * 2) / 50));
  }
  console.log(`Fetched ${raw.length} candidates`);

  // 2. Filter: length, author quality, in-batch + DB dedupe
  const { data: existing } = await supabase.from("quotes").select("text");
  const seen = new Set((existing ?? []).map((q) => q.text.toLowerCase()));

  const filtered: RawQuote[] = [];
  for (const q of raw) {
    const text = q.text.trim();
    const author = q.author.trim();
    const key = text.toLowerCase();
    if (
      text.length === 0 ||
      text.length > MAX_TEXT_LENGTH ||
      REJECTED_AUTHORS.has(author.toLowerCase()) ||
      seen.has(key)
    ) {
      continue;
    }
    seen.add(key);
    filtered.push({ text, author, tags: q.tags });
  }
  console.log(`${filtered.length} candidates after filtering`);

  // 3. Categorize: tags first, AI for the rest
  const candidates: CandidateQuote[] = [];
  const needsAi: RawQuote[] = [];
  for (const q of filtered) {
    const theme = mapTagsToTheme(q.tags);
    if (theme) {
      candidates.push({ ...q, theme, source });
    } else {
      needsAi.push(q);
    }
  }
  console.log(
    `${candidates.length} categorized by tags, ${needsAi.length} going to AI`,
  );

  if (needsAi.length > 0) {
    const assignments = await categorizeWithAi(needsAi);
    let rejected = 0;
    needsAi.forEach((q, i) => {
      const theme = assignments.get(i);
      if (theme) {
        candidates.push({ ...q, theme, source });
      } else {
        rejected++;
      }
    });
    console.log(`AI kept ${assignments.size}, rejected/skipped ${rejected}`);
  }

  // 4. Insert (cap at target, keep theme balance by round-robin)
  const byTheme = new Map<QuoteTheme, CandidateQuote[]>();
  for (const c of candidates) {
    const list = byTheme.get(c.theme) ?? [];
    list.push(c);
    byTheme.set(c.theme, list);
  }
  const toInsert: CandidateQuote[] = [];
  let added = true;
  while (toInsert.length < target && added) {
    added = false;
    for (const theme of QUOTE_THEMES) {
      const list = byTheme.get(theme);
      if (list && list.length > 0 && toInsert.length < target) {
        toInsert.push(list.shift()!);
        added = true;
      }
    }
  }

  if (toInsert.length === 0) {
    console.log("Nothing new to insert.");
  } else {
    const { error } = await supabase.from("quotes").upsert(
      toInsert.map((q) => ({
        text: q.text,
        author: q.author,
        theme: q.theme,
        source: q.source,
        source_tags: q.tags,
      })),
      { onConflict: "text", ignoreDuplicates: true },
    );
    if (error) {
      console.error("Insert failed:", error.message);
      process.exit(1);
    }
    console.log(`Inserted up to ${toInsert.length} quotes`);
  }

  // 5. Per-theme summary + balance warning
  const { data: all } = await supabase
    .from("quotes")
    .select("theme")
    .eq("active", true);
  const counts = new Map<string, number>();
  for (const row of all ?? []) {
    counts.set(row.theme, (counts.get(row.theme) ?? 0) + 1);
  }
  console.log("\nLibrary by theme:");
  for (const theme of QUOTE_THEMES) {
    const count = counts.get(theme) ?? 0;
    const warning = count < 10 ? "  ⚠ under 10" : "";
    console.log(`  ${theme}: ${count}${warning}`);
  }
  if (source === "zenquotes") {
    console.log(
      '\nNote: ZenQuotes free tier requires attribution ("Quotes via ZenQuotes.io") on surfaces that display these quotes.',
    );
  }
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
