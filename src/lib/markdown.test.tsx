import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "./markdown";
import { getSafeHttpUrl } from "./urls";

describe("safe recipe markdown", () => {
  it("renders common markdown without changing the source text", () => {
    const source = "## Sauce\n\n1. Zwiebeln **anbraten**\n2. *Tomaten* hinzufügen";
    const html = renderToStaticMarkup(<MarkdownContent content={source} />);

    expect(html).toContain("<h2>Sauce</h2>");
    expect(html).toContain("<strong>anbraten</strong>");
    expect(html).toContain("<ol>");
    expect(source).toContain("**anbraten**");
  });

  it("does not render executable HTML or embedded images", () => {
    const html = renderToStaticMarkup(
      <MarkdownContent
        content={'<script>alert(1)</script>\n\n<img src="https://evil.example/x" onerror="alert(2)">\n\n[bad](javascript:alert(3))'}
      />,
    );

    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("bad");
  });
});

describe("safe http URLs", () => {
  it.each(["javascript:alert(1)", "data:text/html,test", "ftp://example.com/video"]) (
    "rejects %s",
    (value) => {
      expect(getSafeHttpUrl(value)).toBeUndefined();
    },
  );

  it("accepts HTTP and HTTPS URLs", () => {
    expect(getSafeHttpUrl("https://example.com/video")).toBe("https://example.com/video");
    expect(getSafeHttpUrl("/video", "https://sonntagskueche.example")).toBe("https://sonntagskueche.example/video");
  });
});
