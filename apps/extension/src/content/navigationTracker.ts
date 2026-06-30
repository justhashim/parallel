import { consumeRemoteNavigationFlag } from "../replay/replayNavigation";

export function initNavigationTracker() {
  // If this page load was triggered by a remote replay navigation,
  // skip emitting — otherwise we'd echo the navigation back into the room.
  if (consumeRemoteNavigationFlag()) return;

  let currentUrl = location.href;

  // Silently report the current page URL to the server on load.
  // This uses `report_url` (not `navigate`) so existing room members are
  // NOT redirected — it purely keeps the server's stored URL up-to-date
  // so the NEXT person to join sees the correct navigate_prompt.
  reportUrl(currentUrl);

  setInterval(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;

      // Real user navigation: broadcast to the whole room via `navigate`
      chrome.runtime.sendMessage({
        source: "parallel-content",
        kind: "track_event",
        payload: { eventType: "navigate", data: { url: currentUrl } },
      });
    }
  }, 500);
}

function reportUrl(url: string) {
  chrome.runtime.sendMessage({
    source: "parallel-content",
    kind: "track_event",
    payload: { eventType: "report_url", data: { url } },
  });
}