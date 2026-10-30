import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { advancedModels } from "../src/lib/advanced-models";
import { learningModels } from "../src/lib/models";
import { modelChapters } from "../src/lib/model-curriculum";
import catalog from "../src/lib/textbooks-catalog.json";
import {
  binarySearchFrames,
  insertionSortFrames,
  circuit,
  parseLabArray,
  secantSlope,
  sineVoltage,
  tangent,
  thinLens,
  transformerVoltage,
  trophicEnergy,
} from "../src/lib/lab-math";
import { scienceGeometry } from "../src/components/learning/science-geometry";
import * as THREE from "three";
import additions from "../src/lib/additional-materials-catalog.json";
import resourceRows from "../src/lib/additional-materials-resources.json";
import { materialId } from "../scripts/lib/material-inspection";

test("every new lesson has a real book, checked source page, local concept check and honest limits", () => {
  assert.equal(learningModels.length, 30);
  assert.equal(advancedModels.length, 15);
  assert.equal(
    new Set(learningModels.map((m) => m.id)).size,
    learningModels.length,
  );
  for (const m of advancedModels) {
    const b = catalog.books.find((b) => b.id === m.bookId)!;
    assert.ok(b);
    assert.equal(b.subject, m.subject);
    assert.ok(m.pdfPage > 0 && m.pdfPage <= b.pages!);
    assert.ok(m.printedPage > 0);
    assert.ok(m.limitations.length > 50);
    assert.ok(
      modelChapters.some(
        (c) =>
          c.modelId === m.id &&
          c.bookId === m.bookId &&
          c.chapter === m.chapterNumber,
      ),
    );
    assert.ok(m.controls.length >= 2);
    assert.ok(m.check.options[m.check.answer]);
    assert.ok(m.parts.length >= 2);
  }
});
test("physical and mathematical relationships match known cases and reject singular cases", () => {
  assert.deepEqual(circuit(12, 6), { current: 2, power: 24 });
  assert.deepEqual(circuit(0, 10), { current: 0, power: 0 });
  assert.throws(() => circuit(12, 0));
  assert.deepEqual(thinLens(2), { imageDistance: 2, magnification: -1 });
  assert.deepEqual(thinLens(3), { imageDistance: 1.5, magnification: -0.5 });
  assert.throws(() => thinLens(1));
  assert.ok(Math.abs(sineVoltage(12, 2, 0.125) - 12) < 1e-10);
  assert.ok(Math.abs(sineVoltage(12, 2, 0.25)) < 1e-10);
  assert.equal(tangent(2, 3), 8);
  assert.equal(secantSlope(2, 0.1), 4.1);
  assert.throws(() => secantSlope(2, 0));
  assert.deepEqual(
    trophicEnergy(1000, 0.1).map((x) => Math.round(x)),
    [1000, 100, 10, 1],
  );
  assert.throws(() => trophicEnergy(1, 2));
  assert.equal(transformerVoltage(12, 2), 24);
  assert.equal(transformerVoltage(12, 0.5), 6);
});
test("binary search records actual bounded comparisons and handles absent and duplicate targets", () => {
  for (const a of [[4, 1, 3, 2], [0], [-3, -1, -1, 5], [9, 2, 8, 1, 6, 4]])
    for (const target of [-3, -1, 0, 1, 2, 4, 5, 9, 17]) {
      const trace = binarySearchFrames(a, target),
        last = trace.at(-1)!;
      assert.deepEqual(
        last.values,
        [...a].sort((x, y) => x - y),
      );
      if (a.includes(target)) assert.equal(last.values[last.found!], target);
      else assert.match(last.message, /not present/);
      for (const f of trace.filter((f) => f.low !== undefined)) {
        const mid = Math.floor((f.low! + f.high!) / 2);
        assert.deepEqual(f.active, [mid]);
      }
    }
});
test("insertion-sort trace shifts real values, preserves held keys, and produces a sorted permutation", () => {
  for (const a of [
    [13, 5, 21, 8, 3, 11],
    [1],
    [-2, 3, -2, 0],
    [4, 3, 2, 1],
    [2, 2, 2],
  ]) {
    const before = [...a],
      trace = insertionSortFrames(a);
    assert.deepEqual(a, before);
    assert.deepEqual(
      trace.at(-1)!.values,
      [...a].sort((x, y) => x - y),
    );
    for (let i = 1; i < trace.length; i++)
      if (trace[i].message.startsWith("Shift")) {
        const f = trace[i];
        assert.notEqual(f.key, undefined);
        assert.equal(f.values[f.active[0]], f.values[f.active[1]]);
      }
  }
  assert.deepEqual(parseLabArray("-3, 0 12"), [-3, 0, 12]);
  for (const s of ["", "1,x", "1.5", "1000", Array(13).fill(1).join(",")])
    assert.throws(() => parseLabArray(s));
});
test("all new procedural structures generate meshes with matching selectable part labels", () => {
  for (const lesson of advancedModels.filter((m) => m.kind === "3d")) {
    const group = new THREE.Group(),
      meshes: THREE.Mesh[] = [];
    const sphere = (
      pos: THREE.Vector3,
      scale: THREE.Vector3,
      color: number,
      part: string,
    ) => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(1, 8, 6),
        new THREE.MeshStandardMaterial({ color }),
      );
      m.position.copy(pos);
      m.scale.copy(scale);
      m.userData.part = part;
      group.add(m);
      meshes.push(m);
      return m;
    };
    const link = (
      a: THREE.Vector3,
      b: THREE.Vector3,
      color: number,
      part: string,
    ) => {
      sphere(
        a.clone().add(b).multiplyScalar(0.5),
        new THREE.Vector3(1, 1, 1),
        color,
        part,
      );
    };
    scienceGeometry(lesson.id, group, meshes, sphere, link);
    for (const p of lesson.parts)
      assert.ok(
        meshes.some((m) => m.userData.part === p.id),
        `${lesson.id}/${p.id}`,
      );
    assert.ok(meshes.length < 150);
    group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
  }
});
test("lab content stays separate from student bank and retains deferred rendering and cleanup", () => {
  const source = fs.readFileSync(
    "src/components/learning/LabSimulation.tsx",
    "utf8",
  );
  assert.doesNotMatch(source, /api\/practice|api\/quiz|supabase|localStorage/);
  const canvas = fs.readFileSync(
    "src/components/learning/ModelCanvas.tsx",
    "utf8",
  );
  for (const required of [
    "setAnimationLoop(null)",
    "controls.dispose()",
    "renderer.dispose()",
    "resize.disconnect()",
    "observer.disconnect()",
    "webglcontextlost",
  ])
    assert.ok(canvas.includes(required));
});

test("all additional resources retain stable source IDs, hashes, exact hosted paths and unverified descriptions", () => {
  assert.equal(resourceRows.length, additions.length);
  assert.equal(new Set(additions.map((s) => s.sha256)).size, additions.length);
  for (const source of additions) {
    const row = resourceRows.find(
      (r) =>
        r.resource.id ===
        materialId(source.kind as "note" | "video", source.file),
    );
    assert.ok(row);
    assert.equal(row.resource.sha256, source.sha256);
    assert.equal(row.resource.sourceFile, source.file);
    assert.equal(row.resource.sizeBytes, source.sizeBytes);
    assert.match(
      source.hostedUrl,
      new RegExp(
        `/learning-materials-2026-10-25/${source.sha256}\\.${source.kind === "note" ? "pdf" : "mp4"}$`,
      ),
    );
    assert.match(row.resource.description, /not been teacher-verified/);
    if (source.kind === "note") assert.ok(source.pageCount! > 0);
    else assert.ok(source.durationSeconds! > 0);
  }
});
