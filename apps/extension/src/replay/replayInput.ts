// Feature 1: Apply remote input changes to the local DOM.
import { InputChangeEvent } from "../types/events";
import { withReplayGuard } from "./replayState";

export function replayInput(event: InputChangeEvent) {
  const el = document.querySelector(event.selector) as
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement
    | null;

  if (!el || !("value" in el)) return;

  withReplayGuard(() => {
    el.value = event.value;
    // Fire both input and change so React/Vue/etc. controlled inputs update
    el.dispatchEvent(new Event("input",  { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
