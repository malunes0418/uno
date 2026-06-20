import { describe, it, expect, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

import { metadata } from "@/app/layout";

describe("RootLayout", () => {
  it("layout_metadata_hasUnoClassicTitle", () => {
    expect(metadata.title).toBe("UNO Classic");
  });
});
