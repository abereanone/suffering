// Where the share images live, and their names. Made by C:/code/quote-cards (render.mjs); each
// card comes in three looks: <slug>-dark.jpg, <slug>-light.jpg, <slug>-solid.jpg, plus a
// 480px <name>-480.jpg thumbnail of each.
// Until they are on R2 the dev server serves a local copy from public/quotes/ (gitignored);
// set PUBLIC_QUOTE_IMAGE_BASE to the R2 address (e.g. https://images.catechize.ing/suffering).
export const QUOTE_IMAGE_BASE: string = import.meta.env.PUBLIC_QUOTE_IMAGE_BASE || "/quotes";

export const TONES = ["dark", "light", "solid"] as const;
export type Tone = (typeof TONES)[number];
export const TONE_LABELS: Record<Tone, string> = { dark: "Dark", light: "Light", solid: "Solid" };

export const quoteImage = (slug: string, tone: Tone, thumb = false) =>
  `${QUOTE_IMAGE_BASE}/${slug}-${tone}${thumb ? "-480" : ""}.jpg`;

// The look a card shows first, and in the "Mixed" gallery: taken in turn, so neighbours differ.
export const defaultTone = (id: number): Tone => TONES[id % 3];
