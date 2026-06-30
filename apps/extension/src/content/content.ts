import { initCursorTracker } from "./cursorTracker";
import { initClickTracker } from "./clickTracker";
import { initScrollTracker } from "./scrollTracker";
import { initNavigationTracker } from "./navigationTracker";
import { socket } from "../socket/socketClient";

socket.emit("join_room", {
  roomId: "room1",
  userId: "user1"
});

initCursorTracker();
initClickTracker();
initScrollTracker();
initNavigationTracker();

console.log("Parallel extension loaded");