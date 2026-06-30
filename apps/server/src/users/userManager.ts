class UserManager {
  private users = new Map<string, string>();

  add(socketId: string, userId: string) {
    this.users.set(socketId, userId);
  }

  remove(socketId: string) {
    this.users.delete(socketId);
  }

  get(socketId: string) {
    return this.users.get(socketId);
  }
}

export default new UserManager();