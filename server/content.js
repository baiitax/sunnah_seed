import { z } from "zod";

export const CONTENT_TYPES = [
  "article",
  "hadith",
  "quran",
  "seerah",
  "sunnah",
  "dua",
  "character",
  "story",
  "book",
  "video",
];
export const WORKFLOW = [
  "DRAFT",
  "EDITORIAL_REVIEW",
  "ISLAMIC_SOURCE_REVIEW",
  "VISUAL_REVIEW",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
];

const base = z
  .object({
    type: z.enum(CONTENT_TYPES),
    title: z.string().trim().min(3).max(180),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    excerpt: z.string().max(400).default(""),
    body: z.string().default(""),
    ageGroup: z.string().min(1),
    language: z.enum(["en", "ar", "ha", "fr"]).default("en"),
    source: z.string().default(""),
    status: z.enum(WORKFLOW).default("DRAFT"),
    scheduledAt: z.string().datetime().nullable().optional(),
  })
  .passthrough();

export const contentSchema = base.superRefine((value, ctx) => {
  const leavingDraft = value.status !== "DRAFT";
  if (leavingDraft && !value.source)
    ctx.addIssue({
      code: "custom",
      path: ["source"],
      message: "A source is required before review",
    });
  if (value.type === "hadith" && leavingDraft) {
    for (const field of [
      "arabic",
      "translation",
      "collection",
      "referenceNumber",
      "grading",
    ]) {
      if (!value[field])
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `${field} is mandatory for Hadith`,
        });
    }
  }
  if (value.type === "quran" && leavingDraft) {
    for (const field of ["surah", "ayah", "arabic", "translation"]) {
      if (!value[field])
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `${field} is mandatory for Qur’an lessons`,
        });
    }
  }
  if (value.status === "SCHEDULED" && !value.scheduledAt)
    ctx.addIssue({
      code: "custom",
      path: ["scheduledAt"],
      message: "Scheduled date is required",
    });
});

const prefixes = {
  hadith: "HAD",
  quran: "QUR",
  seerah: "SEA",
  sunnah: "SUN",
  dua: "DUA",
  character: "CHAR",
  story: "KID",
  book: "BOOK",
  video: "VID",
  article: "ART",
};
export function makeContentId(type, sequence) {
  return `SS-${prefixes[type] || "CNT"}-${String(sequence).padStart(4, "0")}`;
}

export function publicationWarnings(item) {
  const warnings = [];
  if (!item.source) warnings.push("Missing source");
  if (!item.ageGroup) warnings.push("Missing age classification");
  if (item.type === "hadith" && !item.grading)
    warnings.push("Missing Hadith grading");
  if (item.type === "quran" && (!item.surah || !item.ayah))
    warnings.push("Missing Qur’an reference");
  if (
    !item.islamicReviewerApproved &&
    ["APPROVED", "SCHEDULED", "PUBLISHED"].includes(item.status)
  )
    warnings.push("No Islamic reviewer approval");
  return warnings;
}
