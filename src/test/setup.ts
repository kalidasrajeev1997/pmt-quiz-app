import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import React from "react";
import { afterEach, vi } from "vitest";

// Ensure React is globally available in test environments
(globalThis as unknown as { React: typeof React }).React = React;

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// Polyfill DOM APIs not implemented in JSDOM that components might call
if (typeof window !== "undefined") {
  window.scrollTo = vi.fn();
  window.scroll = vi.fn();
  window.scrollBy = vi.fn();

  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList;
  }
  if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = () => {};
  }
  if (!window.HTMLElement.prototype.scrollTo) {
    window.HTMLElement.prototype.scrollTo = vi.fn();
  }
  if (!window.HTMLElement.prototype.hasPointerCapture) {
    window.HTMLElement.prototype.hasPointerCapture = () => false;
  }
  if (!window.HTMLElement.prototype.releasePointerCapture) {
    window.HTMLElement.prototype.releasePointerCapture = () => {};
  }
}

// Mock @base-ui/react/scroll-area to prevent ScrollAreaRoot un-act-wrapped state updates in JSDOM
vi.mock("@base-ui/react/scroll-area", () => ({
  ScrollArea: {
    Root: ({
      children,
      className,
      ...props
    }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement("div", { className, ...props }, children),
    Viewport: ({
      children,
      className,
      ...props
    }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement("div", { className, ...props }, children),
    Scrollbar: () => null,
    Thumb: () => null,
    Corner: () => null,
  },
}));
