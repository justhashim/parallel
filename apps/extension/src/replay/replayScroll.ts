import { ScrollEvent } from "../types/events";
import { withReplayGuard } from "./replayState";

export function replayScroll(event: ScrollEvent) {
  withReplayGuard(() => {
    window.scrollTo({
      left: event.x,
      top: event.y,
      behavior: "auto", // keep it instant; "smooth" lags behind live updates
    });
  });
}
