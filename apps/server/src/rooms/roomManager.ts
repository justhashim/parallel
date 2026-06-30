interface RoomMember {
  userId: string;
  socketId: string;
}

interface RoomState {
  members: RoomMember[];
  hostUserId: string;
  currentUrl: string;
}

class RoomManager {
  private rooms = new Map<string, RoomState>();

  joinRoom(
    roomId: string,
    userId: string,
    socketId: string
  ): {
    isHost: boolean;
    members: Array<{ userId: string; isHost: boolean }>;
    currentUrl: string;
  } {
    if (!this.rooms.has(roomId)) {
      // First joiner becomes the host
      this.rooms.set(roomId, { members: [], hostUserId: userId, currentUrl: "" });
    }

    const room = this.rooms.get(roomId)!;
    // Remove stale entry for same userId (reconnect)
    room.members = room.members.filter((m) => m.userId !== userId);
    room.members.push({ userId, socketId });

    return {
      isHost: room.hostUserId === userId,
      currentUrl: room.currentUrl,
      members: this.shapedMembers(room),
    };
  }

  leaveRoom(roomId: string, socketId: string): { userId: string | null } {
    const room = this.rooms.get(roomId);
    if (!room) return { userId: null };

    const leaving = room.members.find((m) => m.socketId === socketId);
    if (!leaving) return { userId: null };

    room.members = room.members.filter((m) => m.socketId !== socketId);

    // Assign a new host if the host left
    if (room.hostUserId === leaving.userId && room.members.length > 0) {
      room.hostUserId = room.members[0].userId;
    }

    if (room.members.length === 0) {
      this.rooms.delete(roomId);
    }

    return { userId: leaving.userId };
  }

  kickUser(
    roomId: string,
    requestingSocketId: string,
    targetUserId: string
  ): { success: boolean; targetSocketId: string | null } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, targetSocketId: null };

    const requester = room.members.find((m) => m.socketId === requestingSocketId);
    if (!requester || requester.userId !== room.hostUserId) {
      return { success: false, targetSocketId: null };
    }

    const target = room.members.find((m) => m.userId === targetUserId);
    if (!target) return { success: false, targetSocketId: null };

    room.members = room.members.filter((m) => m.userId !== targetUserId);
    return { success: true, targetSocketId: target.socketId };
  }

  updateUrl(roomId: string, url: string): void {
    const room = this.rooms.get(roomId);
    if (room) room.currentUrl = url;
  }

  getMembers(roomId: string): Array<{ userId: string; isHost: boolean }> {
    const room = this.rooms.get(roomId);
    return room ? this.shapedMembers(room) : [];
  }

  private shapedMembers(room: RoomState): Array<{ userId: string; isHost: boolean }> {
    return room.members.map((m) => ({
      userId: m.userId,
      isHost: m.userId === room.hostUserId,
    }));
  }
}

export default new RoomManager();