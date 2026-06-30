import { socket } from "../socket/socketClient";

export function initClickTracker() {

    document.addEventListener("click", (e) => {

        socket.emit("click", {
            roomId: "room1",
            userId: "user1",
            x: e.clientX,
            y: e.clientY
        });

    });

}