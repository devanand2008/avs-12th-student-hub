import { loadEnvConfig } from "@next/env";
import {
  chatRequestSchema,
  generateLocalAnswer,
  getLocalModelStatus,
} from "../src/lib/ai/local-gemma";

loadEnvConfig(process.cwd(), true);

async function main() {
  const status = await getLocalModelStatus();
  if (!status.ready)
    throw new Error(
      "Local Gemma is unavailable. Start it with npm run ai:start first.",
    );
  console.log(`Ready: ${status.model}`);
  const started = Date.now();
  const response = await generateLocalAnswer(
    chatRequestSchema.parse({
      message: "Explain pure functions briefly",
      language: process.argv.includes("--tamil") ? "Tamil" : "English",
    }),
    [
      {
        subjectName: "Computer Science",
        chapterTitle: "Function (diagnostic excerpt)",
        chunkText:
          "A pure function always returns the same value for the same arguments and has no side effects. An impure function can modify global state or produce different results for the same input.",
        chunkTextTamil:
          "தூய செயல்கூறு ஒரே உள்ளீட்டிற்கு எப்போதும் ஒரே விடையைத் தரும். அது பக்கவிளைவுகளை ஏற்படுத்தாது.",
      },
    ],
  );
  console.log(
    `Local inference completed in ${((Date.now() - started) / 1000).toFixed(1)} seconds.\n${response}`,
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
