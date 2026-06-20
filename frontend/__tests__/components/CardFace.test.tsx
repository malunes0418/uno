import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CardFace } from "@/components/ui/CardFace";
import { atlasBackgroundStyle, uvForBack, atlasBackgroundStyleFromUv } from "@/lib/cards/cardAtlas";

describe("CardFace", () => {
  it("rendersSpriteStylesForFrontAndBack", () => {
    const { container: front } = render(
      <CardFace color="Red" type="Five" faceUp size="md" />,
    );
    const frontEl = front.firstChild as HTMLElement;
    expect(frontEl.style.backgroundImage).toContain("/uno_classic.png");
    expect(frontEl.style.backgroundSize).toBe(atlasBackgroundStyle("Red", "Five").backgroundSize);
    expect(frontEl.style.backgroundPosition).toBe(
      atlasBackgroundStyle("Red", "Five").backgroundPosition,
    );

    const { container: back } = render(<CardFace faceUp={false} size="sm" />);
    const backEl = back.firstChild as HTMLElement;
    const backStyle = atlasBackgroundStyleFromUv(uvForBack());
    expect(backEl.style.backgroundSize).toBe(backStyle.backgroundSize);
    expect(backEl.style.backgroundPosition).toBe(backStyle.backgroundPosition);
    expect(backEl.dataset.face).toBe("back");
  });
});
