import { isReplaying } from "../replay/replayState";

export function initCursorTracker() {
  document.addEventListener("mousemove", (e) => {
    // Fix #3: don't re-emit events caused by our own replay
    if (isReplaying()) return;

    // Fix #2: route through background — no direct socket in content scripts
    chrome.runtime.sendMessage({
      source: "parallel-content",
      kind: "track_event",
      payload: {
        eventType: "cursor_move",
        data: { x: e.clientX, y: e.clientY },
      },
    });
  });
}