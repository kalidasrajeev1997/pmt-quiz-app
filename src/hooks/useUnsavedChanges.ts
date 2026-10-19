import { useEffect } from "react";
import { useBlocker } from "@tanstack/react-router";

const selectionChangeEvent = "quizly:selection-change";

export function confirmSelectionChange(): boolean {
  return window.dispatchEvent(
    new Event(selectionChangeEvent, { cancelable: true }),
  );
}

export function useUnsavedChanges(isDirty: boolean) {
  const blocker = useBlocker({
    shouldBlockFn: () => isDirty,
    disabled: !isDirty,
    enableBeforeUnload: isDirty,
    withResolver: true,
  });

  useEffect(() => {
    function beforeSelectionChange(event: Event) {
      if (
        isDirty &&
        !window.confirm(
          "Discard your unsaved quiz changes and switch selection?",
        )
      ) {
        event.preventDefault();
      }
    }
    window.addEventListener(selectionChangeEvent, beforeSelectionChange);
    return () =>
      window.removeEventListener(selectionChangeEvent, beforeSelectionChange);
  }, [isDirty]);

  return blocker;
}
