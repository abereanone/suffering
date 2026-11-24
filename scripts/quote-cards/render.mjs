// Quote cards: one 1080x1080 image per question (the question and its answer), for /quotes/ and
// for sharing. Same look as the books.freely.giving cards (look B, C:/code/books-freelygiv-ing
// docs/QUOTES-SPEC.md): a public-domain painting, white Crimson Pro, gold, the site's name lower left.
//
//   node scripts/quote-cards/render.mjs [--force]
//
// Runs on Michael's PC only: the paintings come from C:/code/books-freelygiv-ing/quote-art
// (gitignored there) and Chrome drives the layout. Writes public/quotes/<slug>.jpg and
// <slug>-480.jpg (gallery thumbnail), and skips cards whose text and painting have not changed.
// Re-run after editing an answer, then commit public/quotes/.
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
  unlinkSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import yaml from "js-yaml";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const puppeteer = require("C:/code/keeping-the-heart/node_modules/puppeteer-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../..");
const QDIR = join(ROOT, "src/content/questions");
const OUT = join(ROOT, "public/quotes");
const ART = "C:/code/books-freelygiv-ing/quote-art";
const MANIFEST = join(HERE, "manifest.json");
const FORCE = process.argv.includes("--force");
const u = (p) => pathToFileURL(p).href;

const SITE_TAG = "SUFFERING.CATECHIZE.ING";
const WORK = "Catechism of Suffering";
const GOLD = "#D9B65C",
  CREAM = "#F2EAD7";

// Painting mood by category. The last two sections are hopeful, so they get the light paintings.
const MOOD = {
  reality: "storm",
  reigns: "mountain",
  nearness: "forest",
  purpose: "road",
  comfort: "light",
  glory: "light",
};

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
// Markdown to plain card text: drop emphasis and link syntax, keep the words; curly apostrophes.
const plain = (s) =>
  s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(\w)'(\w)/g, "$1’$2");

function questions() {
  return readdirSync(QDIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const src = readFileSync(join(QDIR, f), "utf8").replace(/\r\n/g, "\n");
      const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      const fm = yaml.load(m[1]);
      const answer = plain(m[2].split(/^## /m)[0]);
      return {
        id: fm.id,
        slug: fm.slug,
        question: plain(fm.title),
        answer,
        category: fm.categories?.[0],
      };
    })
    .filter((q) => q.answer)
    .sort((a, b) => a.id - b.id);
}

// Paintings of one mood, taken in turn by question order so neighbours differ.
const credits = JSON.parse(readFileSync(join(ART, "credits.json"), "utf8"));
const byMood = {};
for (const c of credits) (byMood[c.mood] ||= []).push(c.file);
const all = questions();
const turn = {};
const paintingOf = new Map(
  all.map((q) => {
    const mood = byMood[MOOD[q.category]] ? MOOD[q.category] : "sky";
    const i = (turn[mood] = (turn[mood] ?? -1) + 1);
    return [q.slug, byMood[mood][i % byMood[mood].length]];
  })
);

const FONT = u(join(HERE, "fonts")) + "/";
const CSS = `
  @font-face{font-family:Crimson;src:url('${FONT}crimson-pro-latin-400-normal.woff2');font-weight:400}
  @font-face{font-family:Crimson;src:url('${FONT}crimson-pro-latin-600-normal.woff2');font-weight:600}
  @font-face{font-family:Crimson;src:url('${FONT}crimson-pro-latin-400-italic.woff2');font-style:italic}
  @font-face{font-family:Ribeye;src:url('${FONT}medium-rare-ribeye.ttf')}
  body{margin:0}
  .card{position:relative;width:1080px;height:1080px;overflow:hidden;background:#111}
  .card *{box-sizing:border-box;margin:0}
  .bg{position:absolute;inset:-20px;background-size:cover;background-position:center;filter:brightness(.68) blur(.6px) saturate(.95)}
  .veil{position:absolute;inset:0;background:radial-gradient(ellipse 74% 56% at 50% 47%,rgba(0,0,0,.7) 0%,rgba(0,0,0,.45) 55%,rgba(0,0,0,.14) 100%)}
  .body{position:absolute;left:100px;right:100px;top:80px;bottom:160px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}
  .ask{font-family:Crimson;font-weight:600;color:${GOLD};line-height:1.2;text-wrap:balance;text-shadow:0 0 14px rgba(0,0,0,.85),0 2px 4px rgba(0,0,0,.9)}
  .rule{width:120px;height:3px;background:${GOLD};opacity:.8;margin:34px 0}
  .q{font-family:Crimson;color:#fff;line-height:1.22;text-wrap:balance;text-shadow:0 2px 12px rgba(0,0,0,.5)}
  .book{margin-top:38px;font-family:Crimson;font-style:italic;color:${CREAM};opacity:.88;font-size:36px;text-shadow:0 1px 6px rgba(0,0,0,.8)}
  .tag{position:absolute;left:46px;bottom:44px;padding:10px 18px 8px;border-radius:999px;background:rgba(10,8,6,.62);font-family:Ribeye;color:${GOLD};font-size:30px;letter-spacing:.09em;text-shadow:0 0 6px rgba(0,0,0,.9)}
  .light .bg{filter:brightness(1.03) blur(.6px) saturate(.95)}
  .light .veil{background:radial-gradient(ellipse 74% 56% at 50% 47%,rgba(255,252,244,.86) 0%,rgba(255,252,244,.62) 55%,rgba(255,252,244,.14) 100%)}
  .light .q{color:#1d2630;text-shadow:0 1px 14px rgba(255,255,255,.8)}
  .light .ask{color:#5e430a;text-shadow:0 0 12px rgba(255,255,255,.95),0 0 3px rgba(255,255,255,.9)}
  .light .rule{background:#5e430a}
  .light .book{color:#1d2630;opacity:.9;text-shadow:0 0 8px rgba(255,255,255,.9)}
  .light .tag{color:#5e430a;background:rgba(255,252,244,.8);text-shadow:none}`;
// Shrink the answer (and the question with it) until both fit.
const FIT = `const b=document.querySelector('.body'),q=document.querySelector('.q'),a=document.querySelector('.ask');let s=84;
  const set=()=>{q.style.fontSize=s+'px';a.style.fontSize=Math.round(s*.66)+'px'};set();
  while(s>38&&b.scrollHeight>b.clientHeight){s-=2;set()}`;

const card = (q, bg) => `<!doctype html><meta charset="utf-8"><style>${CSS}</style>
<div class="card${/^light-/.test(bg) ? " light" : ""}"><div class="bg" style="background-image:url('${u(join(ART, bg))}')"></div><div class="veil"></div>
<div class="body"><div class="ask">${esc(q.question)}</div><div class="rule"></div><div class="q">${esc(q.answer).replace(/ (\S+)$/, "&nbsp;$1")}</div><div class="book">${WORK}, Q. ${q.id}</div></div>
<div class="tag">${SITE_TAG}</div></div>
<script>document.fonts.ready.then(()=>{${FIT};document.body.dataset.ready=1})</script>`;

const templateSig = createHash("sha1")
  .update(CSS + FIT + SITE_TAG + WORK)
  .digest("hex");
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
mkdirSync(OUT, { recursive: true });
const jobs = [];
for (const q of all) {
  const bg = paintingOf.get(q.slug);
  const sig = createHash("sha1")
    .update([q.question, q.answer, q.id, bg, templateSig].join("|"))
    .digest("hex");
  if (!FORCE && manifest[q.slug] === sig && existsSync(join(OUT, `${q.slug}.jpg`))) continue;
  jobs.push({ q, bg, sig });
}
if (jobs.length) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    args: ["--allow-file-access-from-files"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080 });
  const tmp = join(HERE, "_card.html");
  for (const { q, bg, sig } of jobs) {
    writeFileSync(tmp, card(q, bg));
    await page.goto(u(tmp));
    await page.waitForSelector("body[data-ready]");
    const png = await page.screenshot({ type: "png" });
    await sharp(png)
      .jpeg({ quality: 86, mozjpeg: true })
      .toFile(join(OUT, `${q.slug}.jpg`));
    await sharp(png)
      .resize(480, 480)
      .jpeg({ quality: 78, mozjpeg: true })
      .toFile(join(OUT, `${q.slug}-480.jpg`));
    manifest[q.slug] = sig;
  }
  unlinkSync(tmp);
  await browser.close();
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + "\n");
}
// Painting credits for the /quotes/ page: only the paintings in use.
const inUse = new Set(paintingOf.values());
const credited = credits
  .filter((c) => inUse.has(c.file))
  .map(({ title, artist, date, museum, url }) => ({ title, artist, date, museum, url }));
writeFileSync(join(ROOT, "src/data/quote-credits.json"), JSON.stringify(credited, null, 1) + "\n");
// The cards in question order, for the /quotes/ page.
writeFileSync(
  join(ROOT, "src/data/quote-cards.json"),
  JSON.stringify(
    all.map(({ id, slug, question, answer }) => ({ id, slug, question, answer })),
    null,
    1
  ) + "\n"
);
console.log(`${jobs.length} card(s) rendered; ${Object.keys(manifest).length} in public/quotes/`);
