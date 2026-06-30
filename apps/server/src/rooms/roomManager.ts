class RoomManager {
  private rooms = new Map<string, Set<string>>();

  joinRoom(roomId: string, userId: string) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }

    this.rooms.get(roomId)?.add(userId);
  }

  leaveRoom(roomId: string, userId: string) {
    this.rooms.get(roomId)?.delete(userId);
  }
}

export default new RoomManager();