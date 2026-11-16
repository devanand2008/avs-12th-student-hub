"use client";

import React, { useMemo } from "react";

interface MathTextProps {
  text: string;
  className?: string;
  as?: "span" | "div" | "p" | "code";
}

const SUB_MAP: Record<string, string> = {
  "₀": "0",
  "₁": "1",
  "₂": "2",
  "₃": "3",
  "₄": "4",
  "₅": "5",
  "₆": "6",
  "₇": "7",
  "₈": "8",
  "₉": "9",
  "₊": "+",
  "₋": "-",
};

const SUP_MAP: Record<string, string> = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
  "⁺": "+",
  "⁻": "-",
  "ⁿ": "n",
  "ᵀ": "T",
};

interface MathToken {
  type: "text" | "vector" | "hat" | "sub" | "sup" | "degree" | "blank";
  value: string;
}

function parseTokens(rawText: string): MathToken[] {
  if (!rawText) return [];

  const tokens: MathToken[] = [];
  // Tokenizer pattern:
  // 1: Vector ([a-zA-Z0-9]+)\u20D7 or \vec{...}
  // 2: Hat/unit-vector ([a-zA-Z0-9]+)\u0302 or \hat{...}
  // 3 & 4: Explicit sub _\{([^}]+)\} or _([a-zA-Z0-9+\-±]+)
  // 5 & 6: Explicit sup \^\{([^}]+)\} or \^([a-zA-Z0-9+\-±]+)
  // 7: Unicode sub [₀₁₂₃₄₅₆₇₈₉₊₋]+
  // 8: Unicode sup [⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿᵀ]+
  // 9: Degree °
  // 10: Blank slot [?]
  const tokenRegex =
    /(?:([a-zA-Z0-9]+)\u20D7|\\vec\{([^}]+)\})|(?:([a-zA-Z0-9]+)\u0302|\\hat\{([^}]+)\})|_\{([^}]+)\}|_([a-zA-Z0-9+\-±]+)|\^\{([^}]+)\}|\^([a-zA-Z0-9+\-±]+)|([₀₁₂₃₄₅₆₇₈₉₊₋]+)|([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿᵀ]+)|(°)|(\[\?\])/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: "text",
        value: rawText.slice(lastIndex, match.index),
      });
    }

    const vectorVal = match[1] || match[2];
    const hatVal = match[3] || match[4];
    const explicitSub = match[5] || match[6];
    const explicitSup = match[7] || match[8];
    const unicodeSub = match[9];
    const unicodeSup = match[10];
    const degree = match[11];
    const blank = match[12];

    if (vectorVal !== undefined) {
      tokens.push({ type: "vector", value: vectorVal });
    } else if (hatVal !== undefined) {
      tokens.push({ type: "hat", value: hatVal });
    } else if (explicitSub !== undefined) {
      tokens.push({ type: "sub", value: explicitSub });
    } else if (explicitSup !== undefined) {
      tokens.push({ type: "sup", value: explicitSup });
    } else if (unicodeSub !== undefined) {
      const converted = unicodeSub
        .split("")
        .map((c) => SUB_MAP[c] || c)
        .join("");
      tokens.push({ type: "sub", value: converted });
    } else if (unicodeSup !== undefined) {
      const converted = unicodeSup
        .split("")
        .map((c) => SUP_MAP[c] || c)
        .join("");
      tokens.push({ type: "sup", value: converted });
    } else if (degree !== undefined) {
      tokens.push({ type: "degree", value: "°" });
    } else if (blank !== undefined) {
      tokens.push({ type: "blank", value: "?" });
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < rawText.length) {
    tokens.push({ type: "text", value: rawText.slice(lastIndex) });
  }

  return tokens;
}

export const MathText: React.FC<MathTextProps> = ({
  text,
  className = "",
  as = "span",
}) => {
  const tokens = useMemo(() => parseTokens(text), [text]);

  const Component = as;

  return (
    <Component className={`inline-block ${className}`} aria-label={text}>
      {tokens.map((token, idx) => {
        switch (token.type) {
          case "vector":
            return (
              <span
                key={idx}
                className="inline-flex flex-col items-center leading-none mx-[1.5px] align-baseline select-text"
              >
                <span
                  aria-hidden="true"
                  className="text-[0.62em] font-sans font-black leading-none opacity-85 -mb-[1px] select-none text-current"
                >
                  →
                </span>
                <span className="font-bold leading-none">{token.value}</span>
              </span>
            );

          case "hat":
            return (
              <span
                key={idx}
                className="inline-flex flex-col items-center leading-none mx-[1.5px] align-baseline select-text"
              >
                <span
                  aria-hidden="true"
                  className="text-[0.65em] font-sans font-black leading-none opacity-85 -mb-[1px] select-none text-current"
                >
                  ^
                </span>
                <span className="font-bold leading-none">{token.value}</span>
              </span>
            );

          case "sub":
            return (
              <sub
                key={idx}
                className="text-[0.72em] font-bold leading-none align-baseline relative -bottom-[0.25em] px-[0.5px]"
              >
                {token.value}
              </sub>
            );

          case "sup":
            return (
              <sup
                key={idx}
                className="text-[0.72em] font-bold leading-none align-baseline relative -top-[0.45em] px-[0.5px]"
              >
                {token.value}
              </sup>
            );

          case "degree":
            return (
              <sup
                key={idx}
                className="text-[0.7em] font-bold leading-none align-baseline relative -top-[0.45em] select-none"
              >
                °
              </sup>
            );

          case "blank":
            return (
              <span
                key={idx}
                className="inline-flex items-center justify-center min-w-[2.2rem] px-2 py-0.5 mx-1 rounded-md bg-amber-200/90 text-amber-950 font-black text-[0.85em] border border-amber-400 shadow-2xs animate-pulse select-none"
              >
                ?
              </span>
            );

          case "text":
          default:
            return <React.Fragment key={idx}>{token.value}</React.Fragment>;
        }
      })}
    </Component>
  );
};

export default MathText;
