/**
 * Rebuilds src/content/questions/ from the text extracted out of the KDP PDF
 * (scripts/catechism_suffering_extracted.txt).
 *
 * The PDF is laid out as a flat run of blocks: a section heading, then repeating
 * triplets of "<n>. <question>", "A: <answer>", "Scripture: <refs>". Section headings
 * are what map a question onto a category -- there is nothing else in the source that
 * groups them.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

import {
  QUESTION_CONTENT_DIR,
  ROOT_DIR,
  serializeQuestionFrontmatter,
} from "./lib/questions-core.mjs";

const SOURCE_FILE = path.join(ROOT_DIR, "scripts", "catechism_suffering_extracted.txt");
const AUTHOR_ID = "mstatler";
const SLUG_PREFIX = "cos";
const EXPECTED_QUESTIONS = 60;

// Keyed by the section number in the booklet; the ids must match src/data/categories.json.
const SECTION_CATEGORIES = {
  1: "reality",
  2: "reigns",
  3: "nearness",
  4: "purpose",
  5: "comfort",
  6: "glory",
};

async function main() {
  const raw = await fs.readFile(SOURCE_FILE, "utf8");
  const entries = parseEntries(raw);

  if (entries.length !== EXPECTED_QUESTIONS) {
    throw new Error(`Expected ${EXPECTED_QUESTIONS} questions but parsed ${entries.length}.`);
  }

  const missingCategory = entries.find((entry) => !entry.category);
  if (missingCategory) {
    throw new Error(`Question ${missingCategory.id} was not preceded by a section heading.`);
  }

  await removeExistingQuestionFiles();

  for (const entry of entries) {
    const slug = `${SLUG_PREFIX}-${entry.id}`;
    const frontmatter = serializeQuestionFrontmatter({
      id: entry.id,
      title: entry.question,
      slug,
      categories: [entry.category],
      authorId: AUTHOR_ID,
      relatedAnswers: relatedFor(entry, entries),
    });

    const lines = [entry.answer];
    if (entry.scripture) {
      // One bullet per reference. The booklet prints them as a single semicolon-separated
      // run, but the scripture index keys off individual references, and a comma inside a
      // reference ("Psalm 119:67, 71") is a continuation of the same book, not a new proof.
      const proofs = entry.scripture
        .split(";")
        .map((reference) => expandBookName(reference.trim()))
        .filter(Boolean);
      lines.push("", "## Proofs", ...proofs.map((reference) => `- ${reference}`));
    }

    await fs.writeFile(
      path.join(QUESTION_CONTENT_DIR, `${slug}.md`),
      `${frontmatter}\n\n${lines.join("\n")}\n`,
      "utf8"
    );
  }

  console.log(`Imported ${entries.length} Catechism of Suffering questions.`);
}

/**
 * The other questions in the same section, nearest first. The booklet has no
 * cross-references of its own, and a section is ten questions on one theme, so its
 * neighbours are the only defensible "related" set.
 */
function relatedFor(entry, entries) {
  return entries
    .filter((other) => other.category === entry.category && other.id !== entry.id)
    .sort((a, b) => Math.abs(a.id - entry.id) - Math.abs(b.id - entry.id))
    .slice(0, 6)
    .map((other) => `${SLUG_PREFIX}-${other.id}`);
}

function parseEntries(raw) {
  const entries = [];
  let category = null;
  let current = null;

  for (const rawLine of raw.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line) continue;

    const section = /^Section (\d+):/u.exec(line);
    if (section) {
      category = SECTION_CATEGORIES[Number(section[1])] ?? null;
      if (!category) throw new Error(`Unmapped section heading: ${line}`);
      current = null;
      continue;
    }

    const question = /^(\d+)\.\s*(.+)$/u.exec(line);
    if (question) {
      current = {
        id: Number(question[1]),
        question: normalize(question[2]),
        answer: "",
        scripture: "",
        category,
      };
      entries.push(current);
      continue;
    }

    if (!current) continue; // Front matter; the about page carries it instead.

    if (line.startsWith("A:")) {
      current.answer = normalize(line.slice(2));
    } else if (line.startsWith("Scripture:")) {
      current.scripture = normalize(line.slice("Scripture:".length)).replace(/\.$/u, "");
    }
  }

  return entries;
}

// The booklet spells every book out except one stray "Rom 12:21", and the scripture
// index groups by the book name as written, so an abbreviation would split the book in two.
const BOOK_ABBREVIATIONS = { Rom: "Romans" };

function expandBookName(reference) {
  return reference.replace(
    /^((?:[123]\s+)?[A-Za-z]+)/u,
    (book) => BOOK_ABBREVIATIONS[book] ?? book
  );
}

/** Straighten the PDF's typographic punctuation; en dashes in refs become plain hyphens. */
function normalize(value) {
  return value
    .replace(/’/gu, "'")
    .replace(/‘/gu, "'")
    .replace(/[“”]/gu, '"')
    .replace(/–/gu, "-")
    .replace(/\s+/gu, " ")
    .trim();
}

async function removeExistingQuestionFiles() {
  await fs.mkdir(QUESTION_CONTENT_DIR, { recursive: true });
  const files = await fs.readdir(QUESTION_CONTENT_DIR);
  await Promise.all(
    files
      .filter((file) => file.endsWith(".md"))
      .map((file) => fs.rm(path.join(QUESTION_CONTENT_DIR, file)))
  );
}

await main();
