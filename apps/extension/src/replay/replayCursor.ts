import { CursorMoveEvent } from "../types/events";

const CURSOR_ID_PREFIX = "parallel-remote-cursor-";
const cursors = new Map<string, HTMLDivElement>();

const COLORS = ["#F87171", "#60A5FA", "#34D399", "#FBBF24", "#A78BFA", "#F472B6"];

function colorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function createCursorElement(userId: string): HTMLDivElement {
  const el = document.createElement("div");
  el.id = CURSOR_ID_PREFIX + userId;
  Object.assign(el.style, {
    position: "fixed",
    top: "0",
    left: "0",
    pointerEvents: "none",
    zIndex: "2147483647",
    transition: "transform 60ms linear",
    willChange: "transform",
  });

  const color = colorForUser(userId);
  el.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.4));">
      <path d="M0 0 L0 14 L4 11 L6.5 16 L8.5 15 L6 10 L11 10 Z" fill="${color}" />
    </svg>
    <span style="
      position: absolute; left: 14px; top: 2px;
      background: ${color}; color: white; font: 11px/1.4 sans-serif;
      padding: 1px 6px; border-radius: 4px; white-space: nowrap;
    ">${userId}</span>
  `;

  document.body.appendChild(el);
  return el;
}

export function replayCursor(event: CursorMoveEvent) {
  let el = cursors.get(event.userId);
  if (!el) {
    el = createCursorElement(event.userId);
    cursors.set(event.userId, el);
  }
  el.style.transform = `translate(${event.x}px, ${event.y}px)`;
}

export function removeCursor(userId: string) {
  const el = cursors.get(userId);
  if (el) {
    el.remove();
    cursors.delete(userId);
  }
}
