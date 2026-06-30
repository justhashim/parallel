// Feature 1: Track text input, textarea, and select changes and relay to room.
import { isReplaying } from "../replay/replayState";

// Never sync sensitive or non-text inputs
const BLOCKED_INPUT_TYPES = new Set(["password", "file", "hidden", "submit", "reset", "button", "image"]);

export function initInputTracker() {
  document.addEventListener("input", (e) => {
    if (isReplaying()) return;

    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (!target || !("value" in target)) return;

    // Block sensitive inputs
    if (target instanceof HTMLInputElement && BLOCKED_INPUT_TYPES.has(target.type)) return;

    const selector = buildSelector(target);
    if (!selector) return;

    chrome.runtime.sendMessage({
      source: "parallel-content",
      kind: "track_event",
      payload: {
        eventType: "input_change",
        data: {
          selector,
          value: target.value,
          inputType: target.tagName.toLowerCase(),
        },
      },
    });
  });
}

/**
 * Builds a reliable CSS selector for an input element.
 * Priority: id → name attr → data-testid → aria-label
 */
function buildSelector(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string | undefined {
  if (el.id) return `#${CSS.escape(el.id)}`;
  if (el.name) return `${el.tagName.toLowerCase()}[name="${el.name}"]`;
  const testId = (el as HTMLElement).dataset?.testid;
  if (testId) return `[data-testid="${testId}"]`;
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) return `${el.tagName.toLowerCase()}[aria-label="${ariaLabel}"]`;
  return undefined;
}
