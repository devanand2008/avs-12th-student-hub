import assert from "node:assert/strict";
import test from "node:test";
import {
  extractReadableMcqText,
  textPresentationFlags,
} from "../scripts/lib/textbook-question-text";

test("text extraction removes page metadata and keeps four real numeric choices", () => {
  const result = extractReadableMcqText(
    "A random variable has a standard deviation of how many units?\n" +
      "a) 6\nb) 4\nc) 3\nd) 2\n232 XII - Mathematics\n" +
      "XII U12 Mathematics.indd 232 01-01-2020 12:00:00\n" +
      "Answers\n1 b",
    "Mathematics",
  );
  assert.deepEqual(result.flags, []);
  assert.deepEqual(result.text?.options, ["6", "4", "3", "2"]);
});

test("clear text formulas are supported while lost fractions and exponents require transcription", () => {
  assert.deepEqual(
    textPresentationFlags(
      "Which expression equals x multiplied by x?",
      ["x²", "1/x", "x + 1", "x − 1"],
      "Mathematics",
    ),
    [],
  );
  for (const damaged of [
    "1 4",
    "8.80 × 10 –17 J",
    "Al O 2 3",
    "30 o",
    "f x ( )",
    "∆ 2",
  ]) {
    assert.ok(
      textPresentationFlags(
        "Which expression gives the correct result?",
        [damaged, "2", "3", "4"],
        "Chemistry",
      ).some((flag) => flag.includes("mathematical layout")),
      damaged,
    );
  }
});

test("proper Tamil text remains readable while separated marks and fragmented words require review", () => {
  assert.deepEqual(
    textPresentationFlags(
      "ஒரு நிறுவனத்தின் உரிமையாளர் யார்?",
      ["உரிமையாளர்", "மேலாளர்", "தொழிலாளர்", "வாடிக்கையாளர்"],
      "Commerce",
    ),
    [],
  );
  assert.ok(
    textPresentationFlags(
      "பி ன் வ ரு ம் வி டை க ள்",
      ["ஒன்று", "இரண்டு", "மூன்று", "நான்கு"],
      "Commerce",
    ).some((flag) => flag.includes("fragmented Tamil")),
  );
  assert.ok(
    textPresentationFlags(
      "ஒரு ை நிறுவனத்தின் உரிமையாளர் யார்?",
      ["ஒன்று", "இரண்டு", "மூன்று", "நான்கு"],
      "Commerce",
    ).some((flag) => flag.includes("Tamil letter marks")),
  );
});

test("source text containing an essential missing figure or private-use glyph stays in review", () => {
  for (const question of [
    "What is the resistance of the following resistor?",
    "Rank the electric flux through the Gaussian surfaces given in the diagram.",
    "Which expression contains the coefficient \uE012?",
  ]) {
    assert.ok(
      textPresentationFlags(
        question,
        ["One", "Two", "Three", "Four"],
        "Physics",
      ).length > 0,
    );
  }
  assert.deepEqual(
    textPresentationFlags(
      "A series circuit contains two resistors. What is its total resistance?",
      ["1 Ω", "2 Ω", "3 Ω", "4 Ω"],
      "Physics",
    ),
    [],
  );
});

test("assignment lines stay separate and uncertain option boundaries never become fake choices", () => {
  const result = extractReadableMcqText(
    "Which program adds two values?\na = 2\nb = 3\nprint(a + b)\n" +
      "a) print(a)\nb) print(a + b)\nc) print(a * b)\nd) print(a / b)",
    "Computer Science",
  );
  assert.ok(result.text?.questionText.includes("a = 2\nb = 3\nprint(a + b)"));
  assert.equal(result.text?.options[1], "print(a + b)");
  assert.deepEqual(result.flags, []);
  const incomplete = extractReadableMcqText(
    "Which answer is correct?\na) One\nb) Two\nc) Three",
    "Commerce",
  );
  assert.equal(incomplete.text, undefined);
  assert.ok(incomplete.flags.some((flag) => flag.includes("all four choices")));
});
