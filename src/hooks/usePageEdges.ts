import { useLayoutEffect, useRef } from "react";

function resolveBrowserColor(color: string) {
  if (!/^(oklch|oklab|lch|lab|color)\(/i.test(color)) return color;

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d");
  if (!context) return color;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
  return alpha === 255
    ? `rgb(${red}, ${green}, ${blue})`
    : `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`;
}

export function usePageEdges() {
  const pageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const root = document.documentElement;
    const body = document.body;
    const sharedProperties = [
      [root, "background-color"],
      [body, "background-color"],
      [root, "--edge-top-background"],
      [root, "--edge-bottom-background"],
    ] as const;
    const previousStyles = sharedProperties.map(([element, property]) => ({
      element,
      property,
      value: element.style.getPropertyValue(property),
      priority: element.style.getPropertyPriority(property),
    }));
    const existingMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    const meta = existingMeta ?? document.createElement("meta");
    const previousThemeColor = meta.getAttribute("content");
    if (!existingMeta) {
      meta.name = "theme-color";
      document.head.append(meta);
    }

    const setStyle = (
      element: HTMLElement,
      property: string,
      value: string,
    ) => {
      if (element.style.getPropertyValue(property) !== value) {
        element.style.setProperty(property, value);
      }
    };
    let previousPalette = "";
    const update = () => {
      const styles = getComputedStyle(page);
      const background =
        styles.getPropertyValue("--page-background").trim() || "#fff";
      const sourcePalette = {
        background,
        top:
          styles.getPropertyValue("--page-top-background").trim() || background,
        bottom:
          styles.getPropertyValue("--page-bottom-background").trim() ||
          background,
      };
      const paletteKey = JSON.stringify(sourcePalette);
      if (paletteKey === previousPalette) return;
      previousPalette = paletteKey;
      const colors = new Map(
        Object.values(sourcePalette).map((color) => [color, ""]),
      );
      for (const color of colors.keys()) {
        colors.set(color, resolveBrowserColor(color));
      }
      const palette = {
        background: colors.get(sourcePalette.background)!,
        top: colors.get(sourcePalette.top)!,
        bottom: colors.get(sourcePalette.bottom)!,
      };

      setStyle(page, "--visible-page-background", palette.background);
      setStyle(page, "--visible-top-background", palette.top);
      setStyle(page, "--visible-bottom-background", palette.bottom);
      setStyle(root, "--edge-top-background", palette.top);
      setStyle(root, "--edge-bottom-background", palette.bottom);
      setStyle(root, "background-color", palette.top);
      setStyle(body, "background-color", palette.bottom);
      if (meta.content !== palette.top) meta.content = palette.top;
    };
    let frame: number | undefined;
    const scheduleUpdate = () => {
      if (frame !== undefined) return;
      frame = requestAnimationFrame(() => {
        frame = undefined;
        update();
      });
    };
    const viewport = window.visualViewport;
    const observer = new MutationObserver(scheduleUpdate);
    for (const element of [root, body, page]) {
      observer.observe(element, {
        attributes: true,
        attributeFilter: ["class", "style"],
      });
    }
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduleUpdate);
    resizeObserver?.observe(page);
    window.addEventListener("scroll", scheduleUpdate, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("pageshow", scheduleUpdate);
    viewport?.addEventListener("resize", scheduleUpdate);
    viewport?.addEventListener("scroll", scheduleUpdate);
    update();
    scheduleUpdate();

    return () => {
      observer.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", scheduleUpdate, true);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("pageshow", scheduleUpdate);
      viewport?.removeEventListener("resize", scheduleUpdate);
      viewport?.removeEventListener("scroll", scheduleUpdate);
      if (frame !== undefined) cancelAnimationFrame(frame);
      for (const { element, property, value, priority } of previousStyles) {
        if (value) element.style.setProperty(property, value, priority);
        else element.style.removeProperty(property);
      }
      if (!existingMeta) meta.remove();
      else if (previousThemeColor === null) meta.removeAttribute("content");
      else meta.setAttribute("content", previousThemeColor);
    };
  }, []);

  return pageRef;
}
