import ts from "typescript";
/** Read literal data without executing any script from a supplied HTML file. */
function literal(n: ts.Expression): unknown {
  if (ts.isParenthesizedExpression(n)) return literal(n.expression);
  if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n))
    return n.text;
  if (ts.isNumericLiteral(n)) return Number(n.text);
  if (n.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (n.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (n.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isPrefixUnaryExpression(n) && n.operator === ts.SyntaxKind.MinusToken)
    return -Number(literal(n.operand));
  if (ts.isArrayLiteralExpression(n))
    return n.elements.map((e) => literal(e as ts.Expression));
  if (ts.isObjectLiteralExpression(n))
    return Object.fromEntries(
      n.properties.map((p) => {
        if (!ts.isPropertyAssignment(p))
          throw Error("Executable object member rejected");
        const key =
          ts.isIdentifier(p.name) ||
          ts.isStringLiteral(p.name) ||
          ts.isNumericLiteral(p.name)
            ? p.name.text
            : null;
        if (!key || ["__proto__", "constructor", "prototype"].includes(key))
          throw Error("Unsafe property");
        return [key, literal(p.initializer)];
      }),
    );
  throw Error(`Executable expression rejected: ${ts.SyntaxKind[n.kind]}`);
}
export function readHtmlLiteralData(html: string) {
  const result: Record<string, unknown> = {};
  const names = new Set([
    "QUESTION_BANK",
    "QUESTIONS",
    "ALL_QUESTIONS",
    "CHAPTERS",
    "CHAPTERS_META",
    "UNIT_META",
    "UNITS_META",
  ]);
  for (const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    const ast = ts.createSourceFile(
      "source.js",
      m[1],
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.JS,
    );
    for (const statement of ast.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      for (const d of statement.declarationList.declarations) {
        if (ts.isIdentifier(d.name) && names.has(d.name.text) && d.initializer)
          result[d.name.text] = literal(d.initializer);
      }
    }
  }
  return result;
}
