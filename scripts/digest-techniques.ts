/**
 * Technique digest: turn raw book notes into draft playbook techniques.
 *
 * Paste your takeaways from a book into a markdown file (with a
 * `Source: <title> — <author>` line), run this, and Claude drafts technique
 * rows in Entiremind's house voice — distilled into original wording, given
 * new house names, and written as recipes that enact a question rather than
 * teach a lesson. Rows are inserted as status='draft'; the founder reviews and
 * activates them in the dashboard. Nothing is ever auto-activated.
 *
 * Usage: npx tsx scripts/digest-techniques.ts <notes.md>
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { DISTORTIONS } from "../src/lib/persona/types";

// Load .env.local manually (matches scripts/import-quotes.ts)
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

const CONTENT_TYPES = ["reflection", "check-in", "action", "gratitude"];
const SENTIMENTS = ["positive", "neutral", "struggling"];
const TONES = ["gentle", "direct", "socratic", "celebratory"];

interface DraftTechnique {
  name: string;
  principle: string;
  prompt_recipe: string;
  content_types: string[];
  target_distortions: string[];
  target_sentiments: string[];
  tone_compatibility: string[];
  gentle: boolean;
  source_title: string | null;
  source_author: string | null;
}

const SYSTEM_PROMPT = `You curate the Technique Playbook for Entiremind, a lightly magical SMS-based manifestation and reflection companion. A "technique" is a distilled thinking-tool the daily-message engine uses to shape ONE short SMS question (under 160 characters) for a user, matched to their psychology.

You will receive raw notes a founder took from a self-development book. Turn them into 1-5 techniques.

HARD RULES:
- Distill the IDEA into your own words. Never reproduce a book's branded exercise, trademarked name, or verbatim phrasing.
- Give each technique a fresh, evocative HOUSE NAME (2-4 words) that is ours, not the book's.
- The "prompt_recipe" is an instruction to the generator, telling it to turn the idea into ONE question that ENACTS the technique. It must never teach, explain, or name the technique to the user. Calm, warm voice; no productivity language; no emojis.
- "principle" is a 1-2 sentence distillation in house voice.
- Choose "gentle": true if the technique is safe for someone who is struggling or withdrawn; false if it asks for effort/action better suited to steady or upbeat moments.

VOCABULARIES (use only these values):
- content_types (which message types it can ride; [] = any): ${CONTENT_TYPES.join(", ")}
- target_distortions (the inner-critic patterns it helps; [] = any): ${DISTORTIONS.join(", ")}
- target_sentiments (when it fits; [] = any): ${SENTIMENTS.join(", ")}
- tone_compatibility (which user tone preferences suit it; [] = all): ${TONES.join(", ")}

Respond with ONLY a JSON array:
[{
  "name": "House Name",
  "principle": "...",
  "prompt_recipe": "...",
  "content_types": ["reflection"],
  "target_distortions": ["catastrophizing"],
  "target_sentiments": ["neutral","struggling"],
  "tone_compatibility": ["gentle"],
  "gentle": true
}]`;

function coerceArray(value: unknown, allowed: string[]): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is string => typeof v === "string" && allowed.includes(v),
  );
}

async function main() {
  const notesPath = process.argv[2];
  if (!notesPath) {
    console.error("Usage: npx tsx scripts/digest-techniques.ts <notes.md>");
    process.exit(1);
  }

  let notes: string;
  try {
    notes = readFileSync(resolve(process.cwd(), notesPath), "utf-8");
  } catch {
    console.error(`Could not read notes file: ${notesPath}`);
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
    process.exit(1);
  }
  if (!anthropicKey) {
    console.error("Missing ANTHROPIC_API_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  // Pull an optional "Source: Title — Author" line to attach as internal lineage
  const sourceMatch = notes.match(
    /^\s*Source:\s*(.+?)(?:\s+[—-]\s+(.+))?\s*$/im,
  );
  const sourceTitle = sourceMatch?.[1]?.trim() ?? null;
  const sourceAuthor = sourceMatch?.[2]?.trim() ?? null;

  console.log("Drafting techniques from notes...");
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MEMORY_MODEL || "claude-sonnet-4-6",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: notes }],
  });

  const block = response.content[0];
  if (block.type !== "text") {
    console.error("Empty response from Anthropic");
    process.exit(1);
  }
  const text = block.text.trim();
  const jsonStart = text.indexOf("[");
  const jsonEnd = text.lastIndexOf("]");
  if (jsonStart < 0 || jsonEnd <= jsonStart) {
    console.error("Response contained no JSON array:\n", text.slice(0, 500));
    process.exit(1);
  }

  let drafts: DraftTechnique[];
  try {
    drafts = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  } catch (err) {
    console.error("Failed to parse JSON:", err);
    process.exit(1);
  }

  const rows = drafts
    .filter((d) => d.name && d.principle && d.prompt_recipe)
    .map((d) => ({
      name: d.name.trim(),
      principle: d.principle.trim(),
      prompt_recipe: d.prompt_recipe.trim(),
      content_types: coerceArray(d.content_types, CONTENT_TYPES),
      target_distortions: coerceArray(d.target_distortions, [...DISTORTIONS]),
      target_sentiments: coerceArray(d.target_sentiments, SENTIMENTS),
      tone_compatibility: coerceArray(d.tone_compatibility, TONES),
      gentle: Boolean(d.gentle),
      source_title: sourceTitle,
      source_author: sourceAuthor,
      status: "draft" as const,
    }));

  if (rows.length === 0) {
    console.log("No valid techniques drafted.");
    return;
  }

  const { error } = await supabase
    .from("techniques")
    .upsert(rows, { onConflict: "name", ignoreDuplicates: true });
  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }

  console.log(`\nDrafted ${rows.length} technique(s) as status='draft':`);
  for (const r of rows) {
    console.log(`  • ${r.name} — ${r.principle}`);
    console.log(`      recipe: ${r.prompt_recipe}`);
    console.log(
      `      distortions: [${r.target_distortions.join(", ")}]  gentle: ${r.gentle}`,
    );
  }
  console.log("\nReview and activate them on /dashboard/founder.");
}

main().catch((err) => {
  console.error("Digest failed:", err);
  process.exit(1);
});
