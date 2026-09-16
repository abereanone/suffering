# suffering.catechize.ing

Static Astro site for [suffering.catechize.ing](https://suffering.catechize.ing), a web edition of
_Catechism of Suffering: The God Who Comforts and Conforms_ by Matthew Statler -- sixty questions
and answers on affliction, in six sections, with the Scripture proofs under every answer.

The booklet is freely given by its author: "You can copy, translate, modify, and distribute this
resource without restriction and without needing to ask permission." The complete original is at
[books.freely.giving](https://books.freely.giving/books/matthew-statler/catechism-of-suffering/).

The site publishes the questions as browsable, searchable Q&A with category pages, an author page,
and a Scripture index that reverse-looks-up every proof text.

## Stack

- [Astro](https://astro.build/) 6.x
- TypeScript project configuration (`tsconfig.json`)
- Markdown content in `src/content/questions/`
- Generated question/search/Bible artifacts for fast page rendering
- Static assets in `public/`

## Project Structure

```text
.
|-- public/
|   |-- assets/search-client.js    # Search UI source file
|   `-- _redirects                 # Cloudflare Pages redirect rules
|-- bsb-data-pipeline/bsb.json     # Full BSB text; source for the verse tooltips
|-- scripts/
|   |-- build-questions.mjs        # Generates question/search artifacts
|   |-- build-bible-cited.mjs      # Generates the cited-verse artifact from bsb.json
|   |-- check-questions.mjs        # Validates question files without writing
|   |-- new-question.mjs           # Scaffolds a new question file
|   |-- import-suffering-catechism.mjs      # One-time import from the KDP PDF text
|   `-- catechism_suffering_extracted.txt   # That import's source text
|-- src/
|   |-- components/                # Reusable UI pieces
|   |-- config/                    # Site-wide settings
|   |-- content/questions/         # Canonical question files with frontmatter
|   |-- data/
|   |   |-- categories.json        # Optional category sort/group config
|   |   `-- resources.json         # Optional author/resource metadata
|   |-- generated/                 # questions.json + bible-cited.json; ignored by git
|   |-- layouts/
|   |-- lib/
|   |-- pages/
|   `-- styles/theme.css           # Shared theme styles (bundled by Astro)
`-- package.json
```

## Canonical Content Model

Each question lives in one Markdown file under `src/content/questions/`.

Example:

```md
---
id: 1
title: What is suffering?
slug: cos-1
categories:
  - reality
authorId: mstatler
---

Suffering is the experience of pain, loss, and sorrow that entered the world through sin.

## Proofs

- Romans 8:20-22
- Genesis 3:16-19
```

Notes:

- The filename is the default slug. Add `slug:` in frontmatter only if you need a custom URL.
- `published` defaults to `true`.
- `suppressAuthor` defaults to `false`.
- `relatedAnswers` uses slugs, not numeric IDs.
- A `## Proofs` section is a plain list of Bible references, one per bullet. They are linked and
  given hover previews in the browser, and they are what the Scripture index is built from.

## Generated Files

These are generated and should not be edited by hand:

- `src/generated/questions.json`
- `src/generated/bible-cited.json`
- `public/assets/search-index.json`

`questions.json` and the search index are rebuilt by `npm run build:questions`; `bible-cited.json`
is rebuilt by `npm run build:bible`, which reads `questions.json`, so it must run second.
They are intended to be untracked build artifacts, not source files.

## Local Development

Requirements: Node.js 22.12.0+ and npm (Astro 6 requirement).

```bash
npm install
npm run dev
```

`npm run dev` regenerates the question/search artifacts first, then starts Astro at `http://localhost:4321/`.

## Build and Preview

```bash
npm run build
npm run preview
```

`npm run build` regenerates the question/search/Bible artifacts before running `astro build`.

## Content Workflow

1. Create a new question with `npm run new:question -- "Your title here"` or add a Markdown file manually under `src/content/questions/`.
2. Fill in the frontmatter and body in that file.
3. Update `src/data/categories.json` only when you need category sort order or a `groupCode`.
4. Update `src/data/resources.json` only when you need author/resource metadata such as name, bio, URL, or sort order.
5. Run `npm run check:questions` to validate the corpus.
6. Run `npm run build:questions && npm run build:bible` if you want to refresh the generated
   artifacts without doing a full site build.

To re-import the whole corpus from the booklet instead, run `npm run import:suffering`. It
**deletes and rewrites every file** in `src/content/questions/`, so any hand edits are lost.

## Grouped Question IDs

- Add `groupCode` to a category in `src/data/categories.json` to place questions in a named group.
- Questions tagged with that category get grouped ID routes such as `/questions/REAL8`.
- Visiting `/questions/<id>` still works. If multiple grouped questions share that numeric ID, the site shows a selection page.

Example category config:

```json
[
  { "id": "reality", "name": "The Reality of Suffering", "sortOrder": 10, "groupCode": "real" },
  { "id": "glory", "name": "The Glory to Come", "sortOrder": 60, "groupCode": "glory" }
]
```

Example effect:

- Question 1 is in `reality`, so `/questions/real1` reaches it, as does `/questions/1`.
- Question 51 is in `glory`, so `/questions/glory51` reaches it.
- If no category on a question has a `groupCode`, the question just uses its normal numeric or slug route.

The six `groupCode` values are also what the per-section card and chip colours key off in
`src/styles/theme.css` (`[data-question-group="..."]`, `[data-category-group="..."]`).

## Scripts

- `npm run dev` - rebuild generated content, then start the local Astro dev server.
- `npm run build:questions` - validate question files and regenerate `src/generated/questions.json` plus `public/assets/search-index.json`.
- `npm run build:bible` - regenerate `src/generated/bible-cited.json` (the verse text behind the
  reference tooltips) from `bsb-data-pipeline/bsb.json`. Run after `build:questions`.
- `npm run import:suffering` - rebuild the whole question corpus from the booklet text. Destructive.
- `npm run check:questions` - validate question files without writing generated output.
- `npm run new:question -- "Title"` - scaffold a new question Markdown file with the next numeric ID.
- `npm run build` - production build.
- `npm run preview` - preview the production build locally.
- `npm run astro ...` - run the Astro CLI directly.

## Deployment

The site deploys to **Cloudflare Pages** as static assets. Pages clones the repo, runs
`npm run build`, and publishes `dist/`. There is no Worker and no `functions/` directory:
the build log confirms `No functions dir at /functions found. Skipping.`

Because there is no server-side code, **redirects live in `public/_redirects`**, which Astro
copies verbatim into `dist/`. That is the only place redirect rules take effect.

To preview the way Pages will actually serve the site (including `_redirects`):

```bash
npm run build
npx wrangler pages dev dist
```

Note that `npm run preview` (`astro preview`) serves the static files but does **not**
apply `_redirects`, so legacy `/q/...` URLs will 404 there.

## Notes for Future Updates

- `src/lib/questions.ts` reads from `src/generated/questions.json`, not directly from the Markdown files.
- Search UI source lives in `public/assets/search-client.js`. It is self-contained and fetches
  `public/assets/search-index.json` in the browser on the first search.
- Redirects belong in `public/_redirects` (Cloudflare Pages). The 404 page is served by Pages
  automatically from `dist/404.html`.
- The source of truth for question content is always `src/content/questions/*.md`.
- Bible references in answers are plain text in the Markdown. `src/scripts/bibleReferences.js`
  links them in the browser inside any element marked `data-bible-autolink`.
- The Scripture index (`/scriptures`) is derived at build time in `src/lib/scriptures.ts` by
  re-scanning the rendered answers, so it needs no separate data file.
- If the generated JSON files are removed from git, `npm run dev` and `npm run build` will recreate them automatically.

## Credits and License

The catechism is by **Matthew Statler**, pastor and biblical counselor at Sierra Vista Baptist
Church, and is freely given (Matthew 10:8) without restriction. The site is built and maintained by
**Michael Coughlin**.

Site code: CC0 1.0 Universal - see `LICENSE`.
