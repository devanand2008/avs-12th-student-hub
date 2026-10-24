import definitions from "../data/shared-source-sections.json";

// A draft inventory must not interrupt established extraction or teacher review.
// Switching to source_checked is an explicit source-reconciliation step, never
// a teacher approval or a publication action.
export const draftSourceDefinitions = definitions.filter(d => "preparationStatus" in d && d.preparationStatus !== "source_checked");
export const readySourceDefinitions = definitions.filter(d => !("preparationStatus" in d) || d.preparationStatus === "source_checked");
