import assert from "node:assert/strict";

export interface SharedOptionGroup {
  question: number;
  rubricEndPattern: string;
  optionLabelPattern: string;
  labels: string[];
  subitems: { label: string; startPattern: string; responsePattern: string; page: number }[];
}
export interface SourceOccurrence {
  ordinal: number; printedNumber: number; pdfPage: number;
  existingId?: string; section: string; reason: string;
}
export interface SharedOptionSpan {
  number: number; pdfPage: number; pdfEndPage: number; raw: string;
  occurrence?: SourceOccurrence;
  sourceEvidencePages?: number[];
  sharedRubric?: {
    label: string; originalRubric: string; originalGroupSpan: string;
    labels: string[]; options: string[]; responseRow: string;
  };
}

/** Split only explicitly inventoried printed subitems, reusing literal shared choices. */
export function expandSharedOptionSubitems(
  groups: SharedOptionSpan[],
  definitions: SharedOptionGroup[] | undefined,
  occurrences: SourceOccurrence[] | undefined,
  pages: { page: number; columnOrderedText: string }[],
): SharedOptionSpan[] {
  if (!definitions?.length) return groups;
  assert.equal(new Set(definitions.map(d => d.question)).size, definitions.length);
  const result = groups.flatMap(group => {
    const definition = definitions.find(d => d.question === group.number);
    if (!definition) return [group];
    const endMatches = [...group.raw.matchAll(new RegExp(definition.rubricEndPattern, "gm"))];
    assert.equal(endMatches.length, 1, "Shared rubric must end at one verified first subitem");
    const originalRubric = group.raw.slice(0, endMatches[0].index).trim();
    const labels = [...originalRubric.matchAll(new RegExp(definition.optionLabelPattern, "gmu"))];
    assert.deepEqual(labels.map(m => m[1]), definition.labels, "Shared printed rubric labels changed");
    const options = labels.map((m, i) => originalRubric.slice(m.index! + m[0].length, labels[i + 1]?.index ?? originalRubric.length).trim().replace(/\s+/gu, " "));
    assert(options.length >= 2 && options.every(o => o.length), "Shared options must come from nonempty source text");
    const starts = definition.subitems.map(subitem => {
      const matches = [...group.raw.matchAll(new RegExp(subitem.startPattern, "gm"))];
      assert.equal(matches.length, 1, "Missing or repeated printed subitem");
      const physicalPages = pages.filter(p => new RegExp(subitem.startPattern, "m").test(p.columnOrderedText));
      assert.deepEqual(physicalPages.map(p => p.page), [subitem.page], "Printed subitem source page changed");
      return matches[0].index!;
    });
    assert.deepEqual([...starts].sort((a,b)=>a-b), starts, "Subitem order changed");
    return definition.subitems.map((subitem, i): SharedOptionSpan => {
      const source = group.raw.slice(starts[i], starts[i + 1] ?? group.raw.length).trim();
      const responses = [...source.matchAll(new RegExp(subitem.responsePattern, "gm"))];
      assert.equal(responses.length, 1, "Printed response row must be preserved, not interpreted as empty choices");
      assert.equal(source.slice(responses[0].index! + responses[0][0].length).trim(), "", "Uninventoried text after subitem response row");
      return {
        number: group.number, pdfPage: subitem.page, pdfEndPage: subitem.page,
        raw: source.slice(0, responses[0].index).trim(),
        sourceEvidencePages: Array.from({length:subitem.page-group.pdfPage+1},(_,i)=>group.pdfPage+i),
        sharedRubric: { label:subitem.label, originalRubric, originalGroupSpan:group.raw, labels:definition.labels, options, responseRow:responses[0][0].trim() },
      };
    });
  });
  assert(occurrences && occurrences.length === result.length, "Every expanded source occurrence needs explicit identity metadata");
  return result.map((span,i)=>{
    const occurrence=occurrences[i];
    assert.equal(occurrence.ordinal,i+1);assert.equal(occurrence.printedNumber,span.number);assert.equal(occurrence.pdfPage,span.pdfPage);
    return {...span,occurrence};
  });
}
