const appVersion = "0.1.0";
const siteName = "suffering.catechize.ing";
const defaultDescription =
  "Catechism of Suffering: sixty questions and answers on affliction, by Matthew Statler";
const branding = {
  siteName,
  tagline: "The God Who Comforts and Conforms",
  description: defaultDescription,
  logoPath: "/images/site-logo.svg",
  logoAlt: `${siteName} logo`,
} as const;
const defaultSiteUrl = "https://suffering.catechize.ing";

export const siteSettings = {
  version: appVersion,
  branding,
  issueReportURL: "https://github.com/abereanone/suffering.catechize.ing/issues/new",
  integrations: {
    googleAnalyticsId: "",
  },
  openGraph: {
    title: branding.siteName,
    description: branding.description,
    url: defaultSiteUrl,
    image: "/images/og-card.png",
    imageAlt: `${branding.siteName} logo`,
    type: "website",
    twitterCard: "summary_large_image",
  },
  showQuestionId: true,
  showAuthor: false,
  enablePagination: true,
  questionsPerPage: 30,
} as const;

export type SiteSettings = typeof siteSettings;
