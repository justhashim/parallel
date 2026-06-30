// postbuild.mjs — copies static extension files into dist/ after Vite compiles the TS.
// This ensures Chrome finds popup.html and manifest.json at the flat root of dist/.

import { copyFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");   // apps/extension/
const dist = resolve(root, "dist");

// 1. Copy manifest.json → dist/
copyFileSync(resolve(root, "manifest.json"), resolve(dist, "manifest.json"));
console.log("✅ Copied manifest.json → dist/");

// 2. Write popup.html → dist/  (HTML matches popup.ts's DOM expectations exactly)
const popupHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      width: 260px; padding: 14px 14px 12px;
      background: #0f0f13; color: #e5e5e5;
    }

    /* ── header ── */
    h3 { font-size: 15px; font-weight: 700; margin-bottom: 14px; color: #fff; }
    h3 span { color: #818CF8; }

    /* ── utility ── */
    .hidden { display: none !important; }
    .section-title {
      font-size: 10px; font-weight: 600; text-transform: uppercase;
      letter-spacing: .06em; color: #555; margin: 12px 0 6px;
    }

    /* ── form ── */
    label { display: block; font-size: 11px; color: #888; margin-bottom: 3px; text-transform: uppercase; letter-spacing:.05em; }
    input {
      width: 100%; padding: 7px 9px; margin-bottom: 10px;
      background: #1c1c24; border: 1px solid #2e2e40;
      border-radius: 6px; color: #e5e5e5; font-size: 13px;
      outline: none; transition: border-color .15s;
    }
    input:focus { border-color: #6366F1; }
    input::placeholder { color: #555; }
    #errorMsg { font-size: 11px; color: #F87171; min-height: 14px; margin-bottom: 8px; }

    /* ── buttons ── */
    button {
      width: 100%; padding: 8px 0; border: none; border-radius: 6px;
      font-size: 12px; font-weight: 600; cursor: pointer; transition: opacity .15s;
    }
    button:hover:not(:disabled) { opacity: .85; }
    button:disabled { opacity: .5; cursor: default; }
    #joinBtn  { background: #6366F1; color: #fff; }
    #leaveBtn { background: #374151; color: #ccc; margin-top: 10px; }

    /* ── status row ── */
    .status-row {
      display: flex; align-items: center; gap: 7px;
      padding: 8px 10px; background: #1c1c24;
      border: 1px solid #2e2e40; border-radius: 8px;
      font-size: 12px; color: #aaa;
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .connected { background: #34D399; }
    .disconnected { background: #F87171; }
    #sessionInfo { font-size: 12px; color: #ccc; line-height: 1.5; }
    #sessionInfo strong { color: #fff; }

    /* ── chips ── */
    .chip {
      display: inline-block; padding: 1px 6px; border-radius: 4px;
      font-size: 10px; font-weight: 700; line-height: 1.6; vertical-align: middle;
    }
    .host-chip { background: #6366F1; color: #fff; }
    .you-chip  { background: #374151; color: #aaa; }

    /* ── members list ── */
    #membersList { display: flex; flex-direction: column; gap: 4px; }
    .member-row {
      display: flex; align-items: center; gap: 7px;
      padding: 6px 8px; background: #1c1c24; border-radius: 6px;
      border: 1px solid #1e1e2e;
    }
    .member-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #34D399; flex-shrink: 0;
    }
    .member-name { flex: 1; font-size: 12px; color: #ddd; }
    .kick-btn {
      width: auto; padding: 3px 8px; background: #7f1d1d;
      color: #fca5a5; font-size: 10px; font-weight: 600;
      border-radius: 4px; border: 1px solid #991b1b;
      cursor: pointer; transition: background .15s;
    }
    .kick-btn:hover { background: #991b1b; }
    .empty { font-size: 12px; color: #555; padding: 4px 2px; }
  </style>
</head>
<body>
  <h3>⚡ <span>Parallel</span></h3>

  <!-- ── Join Form (shown when not in a room) ── -->
  <div id="session-form">
    <label for="roomId">Room ID</label>
    <input id="roomId" type="text" placeholder="e.g. my-room-42" autocomplete="off" />

    <label for="userId">Your Name</label>
    <input id="userId" type="text" placeholder="e.g. alice" autocomplete="off" />

    <p id="errorMsg"></p>
    <button id="joinBtn">Join Room</button>
  </div>

  <!-- ── Active Session (shown when connected) ── -->
  <div id="active-session" class="hidden">
    <div class="status-row">
      <span class="dot connected" id="statusDot"></span>
      <div id="sessionInfo">Connected</div>
    </div>

    <div class="section-title">Members</div>
    <div id="membersList"></div>

    <button id="leaveBtn">Leave Room</button>
  </div>

  <script type="module" src="./popup.js"></script>
</body>
</html>`;

writeFileSync(resolve(dist, "popup.html"), popupHtml);
console.log("✅ Wrote popup.html → dist/");
