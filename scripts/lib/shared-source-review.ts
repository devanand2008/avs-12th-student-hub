import definitions from "../data/shared-source-sections.json";
import { loadConfiguredReviewBatches } from "./computer-review-batches";

/** All subjects use the same candidate schema and existing individual review store. */
export function loadSharedSourceReviewBatches(root: string) {
  return loadConfiguredReviewBatches(root, definitions, "source");
}
