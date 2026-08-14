import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import EventEditor from "./EventEditor";
import type { EditorProps } from "@monaco-editor/react";

describe("EventEditor", () => {
  it("renders container with event-editor class and passes language to EditorComponent", () => {
    const EditorStub = ({ language, value }: EditorProps) =>
      createElement("div", {
        "data-language": language,
        "data-value": value ?? "",
      });

    const markup = renderToStaticMarkup(
      createElement(EventEditor, {
        EditorComponent: EditorStub,
        value: 'type: meeting\nname: "demo"',
        height: 200,
        className: "custom-class",
      }),
    );

    expect(markup).toContain('class="event-editor custom-class"');
    expect(markup).toContain('data-language="event-dsl"');
    expect(markup).toContain("type: meeting");
    expect(markup).toContain("height:200px");
  });

  it("uses dark background CSS variable when darkMode is true", () => {
    const EditorStub = () => createElement("div");
    const onMount = vi.fn();

    const markup = renderToStaticMarkup(
      createElement(EventEditor, {
        EditorComponent: EditorStub,
        darkMode: true,
        onMount,
      }),
    );

    expect(markup).toContain("--event-editor-bg-color-dark");
  });
});
