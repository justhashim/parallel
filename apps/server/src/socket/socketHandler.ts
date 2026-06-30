import { Server, Socket } from "socket.io";
import roomManager from "../rooms/roomManager";
import userManager from "../users/userManager";

export default function socketHandler(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`✅ Connected: ${socket.id}`);

    // ── join_room ──────────────────────────────────────────────────────────────
    
    socket.on("join_room", (data, ack) => {
      const { roomId, userId } = data;
      console.log(`📥 ${socket.id} joined room "${roomId}" as "${userId}"`);

      userManager.add(socket.id, userId, roomId);
      const result = roomManager.joinRoom(roomId, userId, socket.id);
      socket.join(roomId);

      // Send room info back to the joiner (Feature 2: existing members, Feature 4: currentUrl)
      if (typeof ack === "function") {
        ack({ isHost: result.isHost, members: result.members, currentUrl: result.currentUrl });
      }

      // Notify existing members
      socket.to(roomId).emit("user_joined", { userId });

      // Broadcast full member list to everyone (Feature 2: live member list)
      io.to(roomId).emit("room_members_update", { members: roomManager.getMembers(roomId) });
    });

    // ── leave_room ─────────────────────────────────────────────────────────────
    socket.on("leave_room", (data) => {
      const { roomId } = data;
      const { userId } = roomManager.leaveRoom(roomId, socket.id);
      userManager.remove(socket.id);
      socket.leave(roomId);

      if (userId) {
        io.to(roomId).emit("user_left", { userId });
        io.to(roomId).emit("room_members_update", { members: roomManager.getMembers(roomId) });
      }

      console.log(`📤 ${socket.id} left room "${roomId}"`);
    });

    // ── kick_user ──────────────────────────────────────────────────────────────
    // Feature 3: host-only kick. Server validates host status before acting.
    socket.on("kick_user", (data) => {
      const { roomId, targetUserId } = data;
      const { success, targetSocketId } = roomManager.kickUser(roomId, socket.id, targetUserId);

      if (success && targetSocketId) {
        console.log(`👢 ${socket.id} kicked "${targetUserId}" from "${roomId}"`);
        io.to(targetSocketId).emit("kicked", { roomId });
        io.to(roomId).emit("user_left", { userId: targetUserId });
        io.to(roomId).emit("room_members_update", { members: roomManager.getMembers(roomId) });
        // Force the kicked socket out of the room
        io.sockets.sockets.get(targetSocketId)?.leave(roomId);
      }
    });

    // ── realtime events ────────────────────────────────────────────────────────
    socket.on("cursor_move", (data) => socket.to(data.roomId).emit("cursor_move", data));
    socket.on("click",       (data) => socket.to(data.roomId).emit("click",       data));
    socket.on("scroll",      (data) => socket.to(data.roomId).emit("scroll",      data));

    socket.on("navigate", (data) => {
      roomManager.updateUrl(data.roomId, data.url); // Feature 4: track current page for late joiners
      socket.to(data.roomId).emit("navigate", data);
    });

    // Feature 1: text input sync
    socket.on("input_change", (data) => socket.to(data.roomId).emit("input_change", data));

    // report_url: member silently registers their current page URL.
    // Unlike "navigate", this does NOT broadcast to others — it just keeps
    // the server's stored URL up-to-date so late joiners can be prompted.
    socket.on("report_url", (data: { roomId: string; url: string }) => {
      roomManager.updateUrl(data.roomId, data.url);
    });

    // ── disconnect ─────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      const record = userManager.get(socket.id);
      if (record?.roomId) {
        const { userId } = roomManager.leaveRoom(record.roomId, socket.id);
        if (userId) {
          io.to(record.roomId).emit("user_left", { userId });
          io.to(record.roomId).emit("room_members_update", {
            members: roomManager.getMembers(record.roomId),
          });
        }
      }
      userManager.remove(socket.id);
      console.log(`❌ Disconnected: ${socket.id}${record ? ` (was "${record.userId}")` : ""}`);
    });
  });
}
