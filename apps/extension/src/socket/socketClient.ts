// socketClient.ts is intentionally unused.
//
// Previously, content scripts created their own socket connection here,
// causing a duplicate connection alongside the background service worker.
//
// Fix #2: All socket I/O is now centralised in background/background.ts.
// Content scripts communicate with the background via chrome.runtime.sendMessage
// using { source: "parallel-content", kind: "track_event", payload: {...} }.
//
// This file is kept as a reference but should NOT be imported anywhere.