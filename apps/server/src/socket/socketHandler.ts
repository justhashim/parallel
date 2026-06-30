import { Server, Socket } from "socket.io";

export default function socketHandler(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`✅ Connected: ${socket.id}`);

    socket.on("join_room", (data) => {
      console.log(`📥 ${socket.id} joined room ${data.roomId}`);

      socket.join(data.roomId);

      socket.to(data.roomId).emit("user_joined", {
        userId: data.userId,
      });
    });

    socket.on("leave_room", (data) => {
      console.log(`📤 ${socket.id} left room ${data.roomId}`);

      socket.leave(data.roomId);

      socket.to(data.roomId).emit("user_left", {
        userId: data.userId,
      });
    });

    socket.on("cursor_move", (data) => {
      console.log("🖱 Cursor:", data);

      socket.to(data.roomId).emit("cursor_move", data);
    });

    socket.on("click", (data) => {
      console.log("👆 Click:", data);

      socket.to(data.roomId).emit("click", data);
    });

    socket.on("scroll", (data) => {
      console.log("📜 Scroll:", data);

      socket.to(data.roomId).emit("scroll", data);
    });

    socket.on("navigate", (data) => {
      console.log("🌐 Navigate:", data);

      socket.to(data.roomId).emit("navigate", data);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Disconnected: ${socket.id}`);
    });
  });
}