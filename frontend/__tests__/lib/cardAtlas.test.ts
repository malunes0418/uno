import { describe, it, expect } from "vitest";
import {
  atlasBackgroundStyle,
  atlasBackgroundStyleFromUv,
  uvForCard,
  uvForBack,
} from "@/lib/cards/cardAtlas";

function expectedStyleFromUv(uv: ReturnType<typeof uvForCard>) {
  const col = uv.u / uv.w;
  const row = (1 - uv.v - uv.h) / uv.h;
  return {
    backgroundSize: "1200% 600%",
    backgroundPosition: `${(col / 11) * 100}% ${(row / 5) * 100}%`,
  };
}

describe("cardAtlas", () => {
  it("atlasBackgroundStyle_matchesRedFiveUv", () => {
    const uv = uvForCard("Red", "Five");
    const style = atlasBackgroundStyle("Red", "Five");
    const expected = expectedStyleFromUv(uv);

    expect(style.backgroundSize).toBe(expected.backgroundSize);
    expect(style.backgroundPosition).toBe(expected.backgroundPosition);
  });

  it("atlasBackgroundStyleFromUv_matchesBack", () => {
    const uv = uvForBack();
    const style = atlasBackgroundStyleFromUv(uv);
    const expected = expectedStyleFromUv(uv);

    expect(style.backgroundSize).toBe(expected.backgroundSize);
    expect(style.backgroundPosition).toBe(expected.backgroundPosition);
  });
});
