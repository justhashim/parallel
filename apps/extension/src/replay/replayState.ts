// Flips on while we're programmatically replaying a remote event (click,
// scroll, etc). Member 2's capture scripts should check isReplaying()
// before emitting, so we don't echo our own replay back into the room.

let replaying = false;

export function setReplaying(value: boolean) {
  replaying = value;
}

export function isReplaying(): boolean {
  return replaying;
}

/**
 * Runs `fn` with the replay flag set, then clears it shortly after.
 * The delay absorbs async DOM events (scroll, click handlers) that fire
 * as a side effect of the replayed action.
 */
export function withReplayGuard(fn: () => void, releaseAfterMs = 50) {
  setReplaying(true);
  try {
    fn();
  } finally {
    setTimeout(() => setReplaying(false), releaseAfterMs);
  }
}
