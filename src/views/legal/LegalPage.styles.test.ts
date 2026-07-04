import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const cssPath = join(process.cwd(), "src/views/legal/LegalPage.module.css");

function getHeaderBlock() {
  const css = readFileSync(cssPath, "utf8");
  const match = css.match(/\.header\s*\{(?<body>[\s\S]*?)\n\}/);

  if (!match?.groups?.body) {
    throw new Error("LegalPage header CSS block was not found.");
  }

  return match.groups.body;
}

describe("LegalPage styles", () => {
  it("keeps the legal page header transparent", () => {
    const headerBlock = getHeaderBlock();

    expect(headerBlock).not.toMatch(/\bbackground\s*:/);
    expect(headerBlock).not.toMatch(/\bbackdrop-filter\s*:/);
  });
});
