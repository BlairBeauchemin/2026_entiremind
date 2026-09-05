import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Invariant: only the user writes their intention.
 *
 * The weekly memory pass detects that someone's focus has drifted, and the
 * founder dashboard shows what it found — but neither may edit the
 * `intentions` table. The natural "improvement" to this feature is to make
 * detection apply the change, and that is precisely the regression to prevent:
 * silently rewriting a user's stated goal fails the trusted-friend test, and a
 * founder approving it on their behalf is the same act with a human in front
 * of it.
 *
 * This is a source-level guard rather than a behavioral one on purpose. The
 * write it forbids would live inside a Supabase call chain behind an LLM
 * response, where a mock-based test is easy to make pass without the invariant
 * actually holding.
 */

const WRITE_METHODS = ["insert", "update", "upsert", "delete"];

/** Files that may read intentions but must never write them. */
const READ_ONLY_ON_INTENTIONS = [
  "src/lib/ai/memory.ts",
  "src/lib/ai/steer.ts",
  "src/app/api/founder/intention-shifts/route.ts",
  "src/app/api/cron/weekly-memory/route.ts",
];

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), "utf8");
}

/**
 * Strip comments so prose explaining why a thing is forbidden doesn't read as
 * the forbidden thing.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

/**
 * Find every `.from("intentions")` and return the call chain that follows it,
 * up to the end of the statement.
 */
function intentionChains(source: string): string[] {
  const chains: string[] = [];
  const marker = /\.from\(\s*["'`]intentions["'`]\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = marker.exec(source)) !== null) {
    const rest = source.slice(match.index + match[0].length);
    const end = rest.indexOf(";");
    chains.push(end === -1 ? rest.slice(0, 400) : rest.slice(0, end));
  }
  return chains;
}

describe("intention authorship", () => {
  it.each(READ_ONLY_ON_INTENTIONS)("%s never writes to intentions", (file) => {
    for (const chain of intentionChains(stripComments(read(file)))) {
      for (const method of WRITE_METHODS) {
        expect(
          chain.includes(`.${method}(`),
          `${file} calls .${method}() on the intentions table. Only the user ` +
            `changes their own intention — detection nudges, it never writes.`,
        ).toBe(false);
      }
    }
  });

  it("the founder route offers no way to apply a detected shift", () => {
    const route = stripComments(
      read("src/app/api/founder/intention-shifts/route.ts"),
    );
    expect(route).not.toContain('"approve"');
    expect(route).toContain('"dismiss"');
  });

  it("detection records a nudge rather than a pending approval", () => {
    const memory = stripComments(read("src/lib/ai/memory.ts"));
    expect(memory).toContain('status: "notified"');
    expect(memory).not.toContain('status: "pending"');
  });
});
