import { ClickEvent } from "../types/events";
import { withReplayGuard } from "./replayState";

function resolveTarget(event: ClickEvent): Element | null {
  if (event.selector) {
    const el = document.querySelector(event.selector);
    if (el) return el;
  }
  // Fallback: whatever element is currently at those coordinates.
  return document.elementFromPoint(event.x, event.y);
}

export function replayClick(event: ClickEvent) {
  const target = resolveTarget(event);
  if (!target) return;

  withReplayGuard(() => {
    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: event.x,
      clientY: event.y,
    });
    target.dispatchEvent(clickEvent);
  });

  flashClickIndicator(event.x, event.y);
}

function flashClickIndicator(x: number, y: number) {
  const ripple = document.createElement("div");
  Object.assign(ripple.style, {
    position: "fixed",
    left: `${x - 10}px`,
    top: `${y - 10}px`,
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: "2px solid rgba(99, 102, 241, 0.8)",
    pointerEvents: "none",
    zIndex: "2147483647",
    transition: "transform 300ms ease-out, opacity 300ms ease-out",
  });
  document.body.appendChild(ripple);

  requestAnimationFrame(() => {
    ripple.style.transform = "scale(2)";
    ripple.style.opacity = "0";
  });

  setTimeout(() => ripple.remove(), 320);
}
