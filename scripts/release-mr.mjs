// The release MR's title in its two states, for both modes of
// scripts/release-train.mjs. GitLab refuses to merge an MR whose title starts
// with "Draft:", so the title is the whole switch: the train opens the MR as a
// draft, and the Monday schedule (`release-train.mjs --ready`) drops the
// prefix.

const DRAFT_PREFIX = /^\s*draft:\s*/i;

export function releaseTitle(version, { draft }) {
  return `${draft ? "Draft: " : ""}release: ${version}`;
}

export function readyTitle(title) {
  return title.replace(DRAFT_PREFIX, "");
}
