interface UserRecord {
  userId: string;
  roomId: string | null;
}

class UserManager {
  private users = new Map<string, UserRecord>();

  add(socketId: string, userId: string, roomId: string | null = null): void {
    this.users.set(socketId, { userId, roomId });
  }

  setRoom(socketId: string, roomId: string): void {
    const r = this.users.get(socketId);
    if (r) r.roomId = roomId;
  }

  remove(socketId: string): void {
    this.users.delete(socketId);
  }

  get(socketId: string): UserRecord | undefined {
    return this.users.get(socketId);
  }
}

export default new UserManager();