import { initCursorTracker }     from "./cursorTracker";
import { initClickTracker }      from "./clickTracker";
import { initScrollTracker }     from "./scrollTracker";
import { initNavigationTracker } from "./navigationTracker";
import { initInputTracker }      from "./inputTracker";        // Feature 1
import { routeEvent, handleUserLeft } from "../replay/eventRouter";
import { ParallelEvent } from "../types/events";

initCursorTracker();
initClickTracker();
initScrollTracker();
initNavigationTracker();
initInputTracker(); // Feature 1: text input sync

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.source !== "parallel-background") return;

  switch (message.kind) {
    case "remote_event":
      routeEvent(message.payload as ParallelEvent);
      break;
    case "user_left":
      handleUserLeft(message.payload.userId);
      break;

    // Feature 3: kicked by host
    case "kicked":
      showToast("🚫", "#F87171", "Removed from room", "You were kicked by the host.");
      break;

    // Feature 4: navigate prompt for late joiners
    case "navigate_prompt":
      showNavigatePrompt(message.payload.url);
      break;
  }

  sendResponse?.({ ok: true });
});

// ── UI helpers injected into the page ─────────────────────────────────────────

function showToast(icon: string, color: string, title: string, body: string) {
  const el = document.createElement("div");
  el.id = "parallel-toast";
  Object.assign(el.style, {
    position: "fixed", top: "20px", right: "20px", zIndex: "2147483647",
    background: "#1c1c24", border: `1px solid ${color}`, borderRadius: "10px",
    padding: "14px 18px", color: "#e5e5e5", fontFamily: "sans-serif",
    fontSize: "14px", boxShadow: "0 8px 32px rgba(0,0,0,.5)", maxWidth: "300px",
    animation: "parallel-fadein 0.2s ease",
  });
  el.innerHTML = `
    <style>@keyframes parallel-fadein{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}</style>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
      <span style="font-size:16px">${icon}</span>
      <strong style="color:${color}">${title}</strong>
    </div>
    <div style="color:#aaa;font-size:12px">${body}</div>
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

function showNavigatePrompt(url: string) {
  // Don't show if already on that page, or if a prompt is already visible
  if (window.location.href === url) return;
  if (document.getElementById("parallel-nav-prompt")) return;

  const overlay = document.createElement("div");
  overlay.id = "parallel-nav-prompt";
  const short = url.length > 60 ? url.slice(0, 57) + "…" : url;

  Object.assign(overlay.style, {
    position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)",
    zIndex: "2147483647", background: "#1c1c24", border: "1px solid #6366F1",
    borderRadius: "12px", padding: "16px 20px", color: "#e5e5e5",
    fontFamily: "sans-serif", fontSize: "14px",
    boxShadow: "0 8px 32px rgba(99,102,241,.35)", width: "400px", maxWidth: "92vw",
    animation: "parallel-fadein 0.2s ease",
  });

  overlay.innerHTML = `
    <style>@keyframes parallel-fadein{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%)}}</style>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span style="font-size:16px">⚡</span>
      <strong style="color:#818CF8">Parallel — Join the Room?</strong>
      <button id="parallel-nav-close" style="margin-left:auto;background:none;border:none;color:#555;font-size:16px;cursor:pointer;line-height:1">×</button>
    </div>
    <div style="color:#aaa;font-size:12px;margin-bottom:12px">
      Your room is browsing a different page:
      <div style="margin-top:5px;padding:6px 8px;background:#0f0f13;border-radius:6px;font-size:11px;color:#60A5FA;word-break:break-all">${short}</div>
    </div>
    <div style="display:flex;gap:8px">
      <button id="parallel-nav-yes" style="flex:1;padding:8px;background:#6366F1;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer">Go there</button>
      <button id="parallel-nav-no"  style="flex:1;padding:8px;background:#374151;color:#ccc;border:none;border-radius:6px;font-size:12px;cursor:pointer">Stay here</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const dismiss = () => overlay.remove();
  document.getElementById("parallel-nav-yes")?.addEventListener("click", () => { dismiss(); window.location.href = url; });
  document.getElementById("parallel-nav-no")?.addEventListener("click", dismiss);
  document.getElementById("parallel-nav-close")?.addEventListener("click", dismiss);
  setTimeout(dismiss, 20000); // auto-dismiss after 20s
}

console.log("[Parallel] Content script loaded on", window.location.href);