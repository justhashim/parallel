import { ParallelEvent } from "../types/events";
import { replayCursor, removeCursor } from "./replayCursor";
import { replayClick }      from "./replayClick";
import { replayScroll }     from "./replayScroll";
import { replayNavigation } from "./replayNavigation";
import { replayInput }      from "./replayInput";

export function routeEvent(event: ParallelEvent) {
  switch (event.type) {
    case "cursor_move":   replayCursor(event);     break;
    case "click":         replayClick(event);      break;
    case "scroll":        replayScroll(event);     break;
    case "navigate":      replayNavigation(event); break;
    case "input_change":  replayInput(event);      break; // Feature 1
    default:
      console.warn("[Parallel] Unknown event type", event);
  }
}

export function handleUserLeft(userId: string) {
  removeCursor(userId);
}
