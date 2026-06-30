import { isReplaying } from "../replay/replayState";

export function initScrollTracker() {
  window.addEventListener("scroll", () => {
    // Fix #3: don't re-emit events caused by our own replay
    if (isReplaying()) return;

    // Fix #2: route through background — no direct socket in content scripts
    // Fix #5: use x/y keys to match the ScrollEvent type (was wrongly scrollX/scrollY)
    chrome.runtime.sendMessage({
      source: "parallel-content",
      kind: "track_event",
      payload: {
        eventType: "scroll",
        data: { x: window.scrollX, y: window.scrollY },
      },
    });
  });
}