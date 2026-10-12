/* Standalone local UI: never uses the deployed app or Supabase. */
const el = (id) => document.getElementById(id);
let state,
  currentId,
  loading = false;
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
  el("title").textContent = `Question ${c.number} · ${c.chapterTitle}`;
  el("references").textContent =
    `${c.id}\nPhysics · Tamil · Volume 1 · Unit 1 · ${c.extractionEvidence.sourceFile}\nPDF ${c.page}–${c.endPage} (indices ${c.page - 1}–${c.endPage - 1}); printed ${c.extractionEvidence.printedPages.join(", ")} · Key: PDF ${c.keyPage}, printed ${c.extractionEvidence.keyPrintedPage}\nSHA-256 ${c.sourceSha256}`;
  el("original").textContent = c.originalExtraction.questionText;
  list("originalOptions", c.originalExtraction.options);
  el("raw").textContent = c.extractionEvidence.originalRawSpan;
  el("proposed").textContent =
    c.extractionEvidence.proposedTranscription.questionText;
  list("proposedOptions", c.extractionEvidence.proposedTranscription.options);
  el("answer").textContent =
    `Proposed answer: ${c.correctAnswer}. Printed entry: ${c.extractionEvidence.printedKeyEntry}. Key match is evidence only, not approval.`;
  el("key").textContent = c.reviewPreparation.keyPageText;
  el("diagramEvidence").textContent =
    c.extractionEvidence.diagramEvidence ||
    "No required source diagram identified.";
  list("warnings", c.qualityFlags);
  el("incomplete").hidden = c.extractionEvidence.completeTextOptions;
  el("diagramLabel").hidden = !c.extractionEvidence.requiresDiagram;
  const pages = [
    ...new Set([
      c.page,
      ...Array.from({ length: c.endPage - c.page + 1 }, (_, i) => c.page + i),
      c.keyPage,
    ]),
  ];
  el("images").replaceChildren(
    ...pages.map((page) => {
      const figure = document.createElement("figure"),
        link = document.createElement("a"),
        image = document.createElement("img"),
        label = document.createElement("label"),
        check = document.createElement("input");
      link.href = `/source/${page}.png`;
      link.target = "_blank";
      link.rel = "noopener";
      image.src = link.href;
      image.alt = `Original textbook PDF page ${page}, printed page ${page - 8}`;
      image.loading = "lazy";
      link.append(image);
      check.type = "checkbox";
      check.dataset.page = page;
      check.id = `inspected-${page}`;
      label.append(
        check,
        ` I inspected original PDF page ${page} / printed ${page - 8}.`,
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
  el("decision").querySelector('[value="approved"]').disabled =
    !c.extractionEvidence.completeTextOptions;
  el("history").replaceChildren(
    ...entry.history.map((h) => {
      const p = document.createElement("p");
      p.textContent = `${h.at} · ${h.reviewer.name} (${h.reviewer.email}) · ${h.decision}\n${h.notes}\nUnresolved: ${h.unresolvedIssues.join("; ") || "None recorded"}`;
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
    `Local decisions: ${JSON.stringify(counts)}. Candidates held: 15. Published here: 0.`;
}
async function refresh() {
  state = await request("/api/queue");
  el("identity").textContent =
    `Signed in locally as ${state.reviewer.name} (${state.reviewer.email})`;
  el("question").replaceChildren(
    ...state.candidates.map((c) => {
      const option = document.createElement("option");
      option.value = c.id;
      option.textContent = `Question ${c.number}${c.extractionEvidence.requiresDiagram ? " · diagram" : ""}`;
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
el("export").onclick = async () => {
  el("export").disabled = true;
  try {
    const response = await fetch("/api/export");
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Local export failed");
    }
    const savedPath = response.headers.get("X-Local-Export-Path");
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = "tamil-physics-unit1-decisions.json";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message(
      `Export saved locally at ${savedPath}. Browser download: tamil-physics-unit1-decisions.json (location depends on browser settings). No decision or candidate status changed.`,
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
  el("previous").disabled = true;
  el("next").disabled = true;
  try {
    await request("/api/decision", {
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
    el("previous").disabled = state.candidates[0].id === currentId;
    el("next").disabled = state.candidates.at(-1).id === currentId;
  }
});
refresh().catch(() => {});
