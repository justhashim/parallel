import { io, Socket } from "socket.io-client";
import { RoomMemberInfo } from "../types/events";

const SERVER_URL = "http://localhost:3001";

let socket: Socket | null = null;
let currentRoomId:  string | null = null;
let currentUserId:  string | null = null;
let currentIsHost   = false;
let currentMembers: RoomMemberInfo[] = [];

// ── State broadcast ────────────────────────────────────────────────────────────
// Pushes current state to the popup (if open) whenever something changes.
function broadcastRoomState() {
  chrome.runtime.sendMessage({
    source: "parallel-background",
    kind: "room_state_update",
    payload: buildStatus(),
  }).catch(() => {}); // popup may be closed — that's fine
}

function buildStatus() {
  return {
    roomId:    currentRoomId,
    userId:    currentUserId,
    connected: !!socket?.connected,
    isHost:    currentIsHost,
    members:   currentMembers,
  };
}

// ── Socket ─────────────────────────────────────────────────────────────────────
function connectSocket(): Socket {
  if (socket) return socket;

  socket = io(SERVER_URL, { transports: ["websocket"] });

  socket.on("connect", () => {
    console.log("[Parallel] Connected to server:", socket?.id);
    if (currentRoomId && currentUserId) {
      socket?.emit("join_room", { roomId: currentRoomId, userId: currentUserId }, () => {});
    }
  });

  // ── relay realtime events to content scripts ─────────────────────────────────
  socket.on("cursor_move",  (p) => forwardToAllTabs("remote_event", p));
  socket.on("click",        (p) => forwardToAllTabs("remote_event", p));
  socket.on("scroll",       (p) => forwardToAllTabs("remote_event", p));
  socket.on("navigate",     (p) => forwardToAllTabs("remote_event", p));
  socket.on("input_change", (p) => forwardToAllTabs("remote_event", p)); // Feature 1

  // Feature 2: live member list updates
  socket.on("room_members_update", (data: { members: RoomMemberInfo[] }) => {
    currentMembers = data.members;
    // Re-derive isHost from updated list
    currentIsHost = currentMembers.some(
      (m) => m.userId === currentUserId && m.isHost
    );
    broadcastRoomState();
  });

  socket.on("user_joined", (data) => {
    console.log("[Parallel] User joined:", data.userId);
  });

  socket.on("user_left", (data) => {
    forwardToAllTabs("user_left", data);
  });

  // Feature 3: kicked by host
  socket.on("kicked", () => {
    currentRoomId  = null;
    currentUserId  = null;
    currentIsHost  = false;
    currentMembers = [];
    broadcastRoomState();
    forwardToAllTabs("kicked", {});
  });

  socket.on("disconnect", () => console.log("[Parallel] Disconnected from server"));

  return socket;
}

// ── Tab messaging helpers ──────────────────────────────────────────────────────
function forwardToAllTabs(kind: string, payload: unknown) {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id === undefined) continue;
      chrome.tabs.sendMessage(
        tab.id,
        { source: "parallel-background", kind, payload },
        () => void chrome.runtime.lastError
      );
    }
  });
}

function forwardToActiveTabs(kind: string, payload: unknown) {
  // lastFocusedWindow: true ensures we target only the user's current window,
  // not a background window that happens to have an active tab.
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    for (const tab of tabs) {
      if (tab.id === undefined) continue;
      chrome.tabs.sendMessage(
        tab.id,
        { source: "parallel-background", kind, payload },
        () => void chrome.runtime.lastError
      );
    }
  });
}

// ── Message handler (from popup & content scripts) ────────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (
    message?.source !== "parallel-popup" &&
    message?.source !== "parallel-content"
  ) return;

  switch (message.kind) {

    case "join_room": {
      currentRoomId = message.payload.roomId;
      currentUserId = message.payload.userId;
      const s = connectSocket();

      // Respond to popup immediately so UI doesn't hang
      sendResponse({ ok: true });

      // Socket.IO ack brings back: isHost, members[], currentUrl
      s.emit(
        "join_room",
        { roomId: currentRoomId, userId: currentUserId },
        (info: { isHost: boolean; members: RoomMemberInfo[]; currentUrl: string }) => {
          currentIsHost  = info.isHost;
          currentMembers = info.members;
          broadcastRoomState(); // Feature 2: push member list to popup

          if (info.currentUrl) {
            // Room already has a tracked page → show prompt to the new joiner
            forwardToActiveTabs("navigate_prompt", { url: info.currentUrl });
          } else {
            // Room has no tracked page yet (we are the first/only member).
            // Silently report our current tab URL so the NEXT person to join
            // will get the navigate_prompt correctly.
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
              const url = tabs[0]?.url;
              if (url && s.connected && currentRoomId) {
                s.emit("report_url", { roomId: currentRoomId, url });
              }
            });
          }
        }
      );
      break;
    }

    case "leave_room": {
      if (socket && currentRoomId && currentUserId) {
        socket.emit("leave_room", { roomId: currentRoomId, userId: currentUserId });
      }
      currentRoomId  = null;
      currentUserId  = null;
      currentIsHost  = false;
      currentMembers = [];
      broadcastRoomState();
      sendResponse({ ok: true });
      break;
    }

    case "get_status": {
      sendResponse(buildStatus());
      break;
    }

    // Feature 3: host kicks a member
    case "kick_user": {
      if (socket?.connected && currentRoomId && currentIsHost) {
        socket.emit("kick_user", {
          roomId: currentRoomId,
          targetUserId: message.payload.targetUserId,
        });
      }
      sendResponse({ ok: true });
      break;
    }

    // Route tracker events to socket
    case "track_event": {
      if (socket?.connected && currentRoomId && currentUserId) {
        const { eventType, data } = message.payload as {
          eventType: string;
          data: Record<string, unknown>;
        };
        socket.emit(eventType, {
          ...data,
          roomId: currentRoomId,
          userId: currentUserId,
          type: eventType,
        });
      }
      sendResponse({ ok: true });
      break;
    }
  }

  return true; // keep message channel open for async sendResponse
});