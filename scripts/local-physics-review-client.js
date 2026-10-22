/* Standalone local UI: never uses the deployed app or Supabase. */
const el = (id) => document.getElementById(id);
let state,
  currentId,
  batchId = "unit-1",
  loading = false;
const batchRoute = (route) => `${route}?batch=${encodeURIComponent(batchId)}`;
const message = (text, error = false) => {
  el("message").textContent = text;
  el("message").className = error ? "error" : "success";
};
async function request(path, body) {
  const response = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Local request failed");
  return data;
}
function list(id, values) {
  el(id).replaceChildren(
    ...values.map((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      return li;
    }),
  );
}
function render() {
  const c = state.candidates.find((c) => c.id === currentId);
  const entry = state.manifest.entries.find((e) => e.id === currentId);
  const occurrence = c.sourceOccurrence
    ? ` · source occurrence ${c.sourceOccurrence.ordinal} (${c.sourceOccurrence.section})`
    : "";
  el("title").textContent =
    `Question ${c.number}${occurrence} · ${c.chapterTitle}`;
  const mainPrintedPages = c.extractionEvidence.sourcePageReferences
    ? c.extractionEvidence.sourcePageReferences.filter(p=>p.pdfPage>=c.page&&p.pdfPage<=c.endPage).map(p=>p.printedPage)
    : c.extractionEvidence.printedPages;
  el("references").textContent =
    `${c.id}\n${c.reviewPreparation.subject} · ${c.reviewPreparation.medium}${c.reviewPreparation.volume ? ` · Volume ${c.reviewPreparation.volume}` : ""} · ${state.batches.find((b) => b.id === batchId).title} · ${c.reviewPreparation.batchId}\n${c.extractionEvidence.sourceFile}\nPDF ${c.page}–${c.endPage} (indices ${c.page - 1}–${c.endPage - 1}); printed ${mainPrintedPages.join(", ")} · Key: ${c.keyPage ? `PDF ${c.keyPage}, printed ${c.extractionEvidence.keyPrintedPage}` : "not located; answer unknown"}\nSHA-256 ${c.sourceSha256}`;
  el("original").textContent = c.originalExtraction.questionText;
  if (c.extractionEvidence.sourcePageReferences)
    el("references").textContent += `\nSource/rubric pages: ${c.extractionEvidence.sourcePageReferences.map(p=>`PDF ${p.pdfPage} / printed ${p.printedPage}`).join("; ")}`;
  list("originalOptions", c.originalExtraction.options);
  el("raw").textContent = c.extractionEvidence.originalRawSpan;
  if (c.extractionEvidence.sharedSourceOptions) {
    const shared = c.extractionEvidence.sharedSourceOptions;
    const responseLabel = c.keyPage && /^\d+$/.test(shared.label)
      ? "Original printed answer entry (evidence only; not teacher approval)"
      : "Original selectable response row";
    el("raw").textContent = `Original shared printed rubric for subitem ${shared.label}:\n${shared.originalRubric}\n\n${responseLabel}:\n${shared.responseRow}\n\nOriginal source-page extraction:\n${c.extractionEvidence.originalRawSpan}`;
  }
  for (const id of ["original", "originalOptions", "raw", "proposed", "proposedOptions", "correctedQuestion", "correctedA", "correctedB", "correctedC", "correctedD", "correctedE"])
    el(id).lang = c.reviewPreparation.medium === "Tamil" ? "ta" : "en";
  el("proposed").textContent =
    c.extractionEvidence.proposedTranscription.questionText;
  list("proposedOptions", c.extractionEvidence.proposedTranscription.options);
  const printedLabels = state.printedOptionLabels?.[c.id];
  el("printedLabels").textContent = printedLabels?.length
    ? `Original printed labels in option order: ${printedLabels.join(" / ")}. The A–E list markers above indicate review positions.${new Set(printedLabels).size !== printedLabels.length ? " Duplicate printed labels remain unresolved." : ""}`
    : "";
  const sourceProposal = state.transcriptionProposals?.find(
    (proposal) => proposal.candidateId === c.id,
  );
  el("sourceTranscriptionSection").hidden = !sourceProposal;
  el("sourceTranscriptionStatus").textContent = sourceProposal
    ? `${sourceProposal.status} · PDF ${sourceProposal.source.pdfPages.join(", ")} · printed ${sourceProposal.source.printedPages.join(", ")} · answer unknown`
    : "";
  el("sourceTranscriptionText").textContent =
    sourceProposal?.proposedQuestionText ||
    (sourceProposal
      ? "Complete corrected wording remains uncertain; no transcription has been invented."
      : "");
  list("sourceTranscriptionOptions", sourceProposal?.proposedOptions || []);
  list(
    "sourceTranscriptionWarnings",
    sourceProposal
      ? [...sourceProposal.notes, ...sourceProposal.unresolvedIssues]
      : [],
  );
  el("answer").textContent =
    `Proposed answer: ${c.correctAnswer || (c.localReviewRequirements?.answerEvidenceUnavailable ? "unknown; no prepared answer evidence" : "withheld: incomplete choices")}. Printed entry: ${c.extractionEvidence.printedKeyEntry}. Key match is evidence only, not approval.`;
  el("key").textContent = c.reviewPreparation.keyPageText;
  el("diagramEvidence").textContent =
    c.extractionEvidence.diagramEvidence ||
    (c.extractionEvidence.requiresDiagram
      ? "Required diagram, table or notation: inspect the original source-page images below. No separate crop has been prepared."
      : "No required source diagram identified.");
  list("warnings", c.qualityFlags);
  el("incomplete").hidden = c.extractionEvidence.completeTextOptions;
  el("answerUnavailable").hidden =
    !c.localReviewRequirements?.answerEvidenceUnavailable;
  el("diagramLabel").hidden = !c.extractionEvidence.requiresDiagram;
  const requirements = c.localReviewRequirements;
  const assets = [
    ...(requirements?.figures || []),
    ...(requirements?.optionRecovery ? [requirements.optionRecovery] : []),
  ];
  el("figureSection").hidden = !assets.length;
  el("figures").replaceChildren(
    ...assets.map((asset) => {
      const figure = document.createElement("figure"),
        img = document.createElement("img"),
        caption = document.createElement("figcaption"),
        link = document.createElement("a");
      img.src = batchRoute(`/figure/${asset.file}`);
      const printedPage = c.extractionEvidence.sourcePageReferences?.find(p=>p.pdfPage===asset.page)?.printedPage ?? c.extractionEvidence.printedPages[asset.page - c.page];
      img.alt = `${asset.label} · ${c.id} · PDF ${asset.page}, printed ${printedPage ?? "unknown"}`;
      img.style.maxWidth = "650px";
      img.dataset.candidateId = c.id;
      link.href = img.src;
      link.target = "_blank";
      link.rel = "noopener";
      link.append(img);
      caption.textContent = `${asset.option ? `Choice ${asset.option}: ` : ""}${asset.label} · PDF ${asset.page}, printed ${printedPage ?? "unknown"}`;
      figure.append(link, caption);
      return figure;
    }),
  );
  el("sourceEvidence").open = !requirements;
  el("correctionFields").hidden = !requirements;
  const correction = [...entry.history]
    .reverse()
    .find((event) => event.correction)?.correction;
  el("correctedQuestion").value = correction?.questionText || "";
  for (const [index, letter] of [..."ABCDE"].entries()) {
    el(`corrected${letter}`).value = correction?.options[index] || "";
    el(`corrected${letter}`).closest("label").hidden =
      index >= c.options.length;
  }
  for (const option of el("correctedAnswer").options)
    option.disabled = Boolean(
      option.value && "ABCD".indexOf(option.value) >= c.options.length,
    );
  el("correctedAnswer").value =
    correction?.correctAnswer ||
    c.correctAnswer ||
    requirements?.proposedPrintedAnswer ||
    "";
  el("mappingConfirmed").checked = false;
  const pages = [
    ...new Set([
      c.page,
      ...Array.from({ length: c.endPage - c.page + 1 }, (_, i) => c.page + i),
      ...(c.keyPage ? [c.keyPage] : []),
      ...(c.extractionEvidence.sourcePageReferences?.map(p=>p.pdfPage) || []),
    ]),
  ];
  if (c.extractionEvidence.sourcePageReferences) pages.sort((a,b)=>a-b);
  el("images").replaceChildren(
    ...pages.map((page) => {
      const figure = document.createElement("figure"),
        link = document.createElement("a"),
        image = document.createElement("img"),
        label = document.createElement("label"),
        check = document.createElement("input");
      link.href = batchRoute(`/source/${page}.png`);
      link.target = "_blank";
      link.rel = "noopener";
      image.src = link.href;
      const printedPage =
        page === c.keyPage
          ? c.extractionEvidence.keyPrintedPage
          : c.extractionEvidence.sourcePageReferences?.find(p=>p.pdfPage===page)?.printedPage ?? c.extractionEvidence.printedPages[page - c.page];
      image.alt = `Original textbook PDF page ${page}, printed page ${printedPage ?? "unknown"}`;
      image.loading = "lazy";
      link.append(image);
      check.type = "checkbox";
      check.dataset.page = page;
      check.id = `inspected-${page}`;
      label.append(
        check,
        ` I inspected original PDF page ${page} / printed ${printedPage ?? "unknown"}.`,
      );
      figure.append(link, label);
      return figure;
    }),
  );
  el("decision").value = entry.decision;
  el("notes").value = entry.notes;
  el("issues").value = entry.unresolvedIssues.join("\n");
  // Confirmations must be made afresh for each saved action.
  for (const id of ["textConfirmed", "keyConfirmed", "diagramConfirmed"])
    el(id).checked = false;
  el("keyConfirmed").disabled = Boolean(
    c.localReviewRequirements?.answerEvidenceUnavailable,
  );
  el("decision").querySelector('[value="approved"]').disabled =
    !c.extractionEvidence.completeTextOptions ||
    Boolean(c.localReviewRequirements?.answerEvidenceUnavailable);
  el("history").replaceChildren(
    ...entry.history.map((h) => {
      const p = document.createElement("p");
      p.textContent = `${h.at} · ${h.reviewer.name} (${h.reviewer.email}) · ${h.decision}\n${h.notes}\nUnresolved: ${h.unresolvedIssues.join("; ") || "None recorded"}${h.correction ? `\nSeparately recorded teacher correction:\n${h.correction.questionText}\n${h.correction.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join("\n")}\nAnswer ${h.correction.correctAnswer}; source mapping confirmed: ${h.correction.sourceMappingConfirmed}` : ""}`;
      p.className = "text";
      return p;
    }),
  );
  if (!entry.history.length)
    el("history").textContent = "No teacher decisions recorded.";
  el("previous").disabled = state.candidates[0].id === currentId;
  el("next").disabled = state.candidates.at(-1).id === currentId;
  el("question").value = currentId;
  const counts = state.manifest.entries.reduce((m, e) => {
    m[e.decision] = (m[e.decision] || 0) + 1;
    return m;
  }, {});
  el("counts").textContent =
    `Selected unit local decisions: ${JSON.stringify(counts)}. Candidates held: ${state.candidates.length}. Published here: 0.`;
}
async function refresh() {
  state = await request(batchRoute("/api/queue"));
  el("batch").replaceChildren(
    ...state.batches.map((b) => {
      const option = document.createElement("option");
      option.value = b.id;
      option.textContent = b.title;
      return option;
    }),
  );
  el("batch").value = batchId;
  el("identity").textContent =
    `Signed in locally as ${state.reviewer.name} (${state.reviewer.email})`;
  el("question").replaceChildren(
    ...state.candidates.map((c) => {
      const option = document.createElement("option");
      option.value = c.id;
      option.textContent = `Question ${c.number}${c.sourceOccurrence ? ` · occurrence ${c.sourceOccurrence.ordinal} · PDF ${c.page}` : ""}${c.extractionEvidence.requiresDiagram ? " · diagram" : ""}`;
      return option;
    }),
  );
  currentId ||= state.candidates[0].id;
  el("login").hidden = true;
  el("review").hidden = false;
  render();
}
el("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await request("/api/login", {
      email: el("email").value,
      password: el("password").value,
    });
    el("password").value = "";
    await refresh();
    message("Signed in to the local review workflow.");
  } catch (e) {
    message(e.message, true);
  }
});
el("logout").onclick = async () => {
  try {
    await request("/api/logout", {});
    location.reload();
  } catch (e) {
    message(e.message, true);
  }
};
el("batch").onchange = async () => {
  const previous = batchId,
    previousId = currentId;
  batchId = el("batch").value;
  currentId = undefined;
  try {
    await refresh();
    message("");
  } catch (error) {
    batchId = previous;
    currentId = previousId;
    el("batch").value = previous;
    message(error.message, true);
  }
};
el("export").onclick = async () => {
  el("export").disabled = true;
  try {
    const response = await fetch(batchRoute("/api/export"));
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Local export failed");
    }
    const savedPath = response.headers.get("X-Local-Export-Path");
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    const filename =
      batchId === "unit-1"
        ? "tamil-physics-unit1-decisions.json"
        : batchId.startsWith("unit-")
          ? `tamil-physics-${batchId}-decisions.json`
          : `textbook-${batchId}-decisions.json`;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message(
      `Export saved locally at ${savedPath}. Browser download: ${filename} (location depends on browser settings). No decision or candidate status changed.`,
    );
  } catch (e) {
    message(e.message, true);
  } finally {
    el("export").disabled = false;
  }
};
el("question").onchange = () => {
  currentId = el("question").value;
  render();
  message("");
};
for (const [id, delta] of [
  ["previous", -1],
  ["next", 1],
])
  el(id).onclick = () => {
    const index = state.candidates.findIndex((c) => c.id === currentId);
    currentId = state.candidates[index + delta].id;
    render();
    message("");
  };
el("decisionForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (loading) return;
  const entry = state.manifest.entries.find((e) => e.id === currentId);
  loading = true;
  el("save").disabled = true;
  el("question").disabled = true;
  el("batch").disabled = true;
  el("previous").disabled = true;
  el("next").disabled = true;
  try {
    const c = state.candidates.find((c) => c.id === currentId);
    const correctionText = el("correctedQuestion").value.trim();
    const correctionOptions = [..."ABCDE"]
      .slice(0, c.options.length)
      .map((letter) => el(`corrected${letter}`).value.trim());
    const hasCorrection =
      c.localReviewRequirements &&
      (correctionText || correctionOptions.some(Boolean));
    await request(batchRoute("/api/decision"), {
      id: currentId,
      expectedRevision: entry.revision,
      decision: el("decision").value,
      notes: el("notes").value,
      unresolvedIssues: el("issues")
        .value.split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      inspectedPages: [...document.querySelectorAll("[data-page]:checked")].map(
        (i) => Number(i.dataset.page),
      ),
      textConfirmed: el("textConfirmed").checked,
      keyConfirmed: el("keyConfirmed").checked,
      diagramConfirmed: el("diagramConfirmed").checked,
      ...(hasCorrection
        ? {
            correction: {
              questionText: correctionText,
              options: correctionOptions,
              correctAnswer: el("correctedAnswer").value || null,
              sourceMappingConfirmed: el("mappingConfirmed").checked,
            },
          }
        : {}),
    });
    await refresh();
    message(
      "Individual decision saved locally. Candidate remains held; nothing was published.",
    );
  } catch (e) {
    message(e.message, true);
  } finally {
    loading = false;
    el("save").disabled = false;
    el("question").disabled = false;
    el("batch").disabled = false;
    el("previous").disabled = state.candidates[0].id === currentId;
    el("next").disabled = state.candidates.at(-1).id === currentId;
  }
});
refresh().catch(() => {});
