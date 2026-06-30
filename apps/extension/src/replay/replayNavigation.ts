import { NavigateEvent } from "../types/events";

const NAV_FLAG_KEY = "parallel_remote_navigation";

export function replayNavigation(event: NavigateEvent) {
  if (window.location.href === event.url) return;

  // Page is about to fully reload, so in-memory flags (replayState.ts)
  // won't survive. Use sessionStorage instead.
  sessionStorage.setItem(NAV_FLAG_KEY, "1");
  window.location.href = event.url;
}

/**
 * Member 2's navigationTracker.ts should call this once on page load.
 * If it returns true, skip emitting a `navigate` event for this load —
 * it was caused by our own replay, not a real user action.
 */
export function consumeRemoteNavigationFlag(): boolean {
  const flagged = sessionStorage.getItem(NAV_FLAG_KEY) === "1";
  if (flagged) sessionStorage.removeItem(NAV_FLAG_KEY);
  return flagged;
}
