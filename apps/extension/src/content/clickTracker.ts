import { isReplaying } from "../replay/replayState";

export function initClickTracker() {
  document.addEventListener("click", (e) => {
    // Fix #3: don't re-emit events caused by our own replay
    if (isReplaying()) return;

    // Fix #2: route through background — no direct socket in content scripts
    chrome.runtime.sendMessage({
      source: "parallel-content",
      kind: "track_event",
      payload: {
        eventType: "click",
        data: {
          x: e.clientX,
          y: e.clientY,
          selector: e.target instanceof Element
            ? getSelector(e.target)
            : undefined,
        },
      },
    });
  });
}

/** Returns a best-effort CSS selector for the clicked element. */
function getSelector(el: Element): string | undefined {
  if (el.id) return `#${el.id}`;
  if (el instanceof HTMLElement && el.dataset.testid) {
    return `[data-testid="${el.dataset.testid}"]`;
  }
  return undefined;
}