import { describe, expect, it } from "vitest";

import { formatFileSize } from "./file";

describe("formatFileSize", () => {
  it("muestra bytes, KB y MB con unidades comprensibles", () => {
    expect(formatFileSize(900)).toBe("900 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
