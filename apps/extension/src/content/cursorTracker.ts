import { socket } from "../socket/socketClient";

export function initCursorTracker() {

    document.addEventListener("mousemove", (e) => {

        socket.emit("cursor_move", {
            roomId: "room1",
            userId: "user1",
            x: e.clientX,
            y: e.clientY
        });

    });

}