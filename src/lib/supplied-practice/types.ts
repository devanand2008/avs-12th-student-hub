export interface SuppliedSource {
  file: string;
  sha256: string;
  originalId: string;
  row: number;
  claimedSource: string;
  reference: string;
}
export interface SuppliedQuestion {
  id: string;
  fingerprint: string;
  collectionId: string;
  subject: string;
  volume: number | null;
  section: string;
  sectionTitle: string;
  questionEn: string;
  questionTa: string;
  optionsEn: string[];
  optionsTa: string[];
  proposedAnswer: number | null;
  explanationEn: string;
  explanationTa: string;
  originalDiagram: string | null;
  warnings: string[];
  sources: SuppliedSource[];
  reviewStatus: string;
  sourceContext?: string;
  answerConflict?: boolean;
}
export interface SuppliedCollection {
  id: string;
  subject: string;
  volume: number | null;
  count: number;
  sections: string[];
  mediums: string[];
  sourceFiles: string[];
  title?: string;
  sourceContext?: string;
}
export interface CollectionSummary extends SuppliedCollection {
  ready: number;
  held: number;
  available: number;
  sectionCounts: {
    id: string;
    title: string;
    total: number;
    ready: number;
    available: number;
  }[];
}
