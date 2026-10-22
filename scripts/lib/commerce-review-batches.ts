import definition from "../data/commerce-source-section.json";
import { loadConfiguredReviewBatches } from "./computer-review-batches";

export const commerceReviewDefinition = {
  ...definition,
  stopBeforeQuestion: 6,
  sourceWarnings: [] as string[],
  diagramQuestions: [] as number[],
};
export function loadCommerceReviewBatches(root: string) {
  return loadConfiguredReviewBatches(
    root,
    [commerceReviewDefinition],
    "commerce",
  );
}
