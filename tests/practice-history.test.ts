import assert from "node:assert/strict";
import test from "node:test";
import {
  getPracticeHistory,
  savePracticeAttempt,
  clearPracticeHistory,
} from "../src/lib/practice-history";

test("practice history survives reads, deduplicates sessions and isolates shared-device accounts", () => {
  const savedWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const savedStorage = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
  Object.defineProperty(globalThis, "window", {
    value: {},
    configurable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
  });
  try {
    const attempt = {
      id: "session-1",
      subjectId: "subject-1",
      chapterId: "chapter-1",
      mode: "quick",
      sourceFilter: "Book-In" as const,
      score: 1,
      totalQuestions: 2,
      correctCount: 1,
      wrongCount: 1,
      unansweredCount: 0,
      accuracy: 50,
    };
    storage.setItem("skillup_practice_history", JSON.stringify([attempt]));
    assert.deepEqual(getPracticeHistory("student-b"), []);
    savePracticeAttempt("student-a", attempt);
    savePracticeAttempt("student-a", attempt);
    assert.equal(getPracticeHistory("student-a").length, 1);
    assert.equal(getPracticeHistory("student-a")[0].sourceFilter, "Book-In");
    assert.deepEqual(getPracticeHistory("student-b"), []);
    savePracticeAttempt("student-b", { ...attempt, id: "session-2" });
    clearPracticeHistory("student-a");
    assert.equal(getPracticeHistory("student-b").length, 1);
    assert.ok(storage.getItem("skillup_practice_history"));
    storage.setItem(
      "skillup_practice_history:student-a",
      '[null,{}, {"subjectId":42}]',
    );
    assert.deepEqual(getPracticeHistory("student-a"), []);
    savePracticeAttempt("student-a", { ...attempt, correctCount: 2 });
    assert.deepEqual(getPracticeHistory("student-a"), []);
    storage.setItem("skillup_practice_history:student-a", "broken JSON");
    assert.deepEqual(getPracticeHistory("student-a"), []);
  } finally {
    for (const [name, original] of [
      ["window", savedWindow],
      ["localStorage", savedStorage],
    ] as const) {
      if (original) Object.defineProperty(globalThis, name, original);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
});
