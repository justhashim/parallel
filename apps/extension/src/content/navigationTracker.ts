import { socket } from "../socket/socketClient";

export function initNavigationTracker() {

    let currentUrl = location.href;

    setInterval(() => {

        if (location.href !== currentUrl) {

            currentUrl = location.href;

            socket.emit("navigate", {
                roomId: "room1",
                userId: "user1",
                url: currentUrl
            });

        }

    }, 500);

}