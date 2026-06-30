import { socket } from "../socket/socketClient";

export function initScrollTracker() {

    window.addEventListener("scroll", () => {

        socket.emit("scroll", {
            roomId: "room1",
            userId: "user1",
            scrollX: window.scrollX,
            scrollY: window.scrollY
        });

    });

}