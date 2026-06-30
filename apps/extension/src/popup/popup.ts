import { RoomMemberInfo } from "../types/events";

// ── DOM refs ──────────────────────────────────────────────────────────────────
const sessionFormEl   = document.getElementById("session-form")!;
const activeSessionEl = document.getElementById("active-session")!;
const roomIdInput     = document.getElementById("roomId")    as HTMLInputElement;
const userIdInput     = document.getElementById("userId")    as HTMLInputElement;
const joinBtn         = document.getElementById("joinBtn")   as HTMLButtonElement;
const leaveBtn        = document.getElementById("leaveBtn")  as HTMLButtonElement;
const errorMsgEl      = document.getElementById("errorMsg")  as HTMLParagraphElement;
const membersListEl   = document.getElementById("membersList")!;
const sessionInfoEl   = document.getElementById("sessionInfo")!;
const statusDotEl     = document.getElementById("statusDot")!;

interface RoomState {
  connected: boolean;
  roomId: string | null;
  userId: string | null;
  isHost: boolean;
  members: RoomMemberInfo[];
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderState(state: RoomState) {
  if (!state.connected || !state.roomId) {
    sessionFormEl.classList.remove("hidden");
    activeSessionEl.classList.add("hidden");
    return;
  }

  sessionFormEl.classList.add("hidden");
  activeSessionEl.classList.remove("hidden");

  // Status dot
  statusDotEl.className = "dot connected";

  // Session info line
  sessionInfoEl.innerHTML =
    `Room: <strong>${state.roomId}</strong> &nbsp;·&nbsp; ` +
    `You: <strong>${state.userId}</strong>` +
    (state.isHost ? ' <span class="chip host-chip">HOST</span>' : "");

  // Members list
  membersListEl.innerHTML = "";
  if (!state.members.length) {
    membersListEl.innerHTML = `<div class="empty">No members yet…</div>`;
    return;
  }

  for (const m of state.members) {
    const isSelf = m.userId === state.userId;
    const row = document.createElement("div");
    row.className = "member-row";
    row.innerHTML =
      `<span class="member-dot"></span>` +
      `<span class="member-name">${m.userId}` +
        (m.isHost ? ' <span class="chip host-chip">HOST</span>' : "") +
        (isSelf    ? ' <span class="chip you-chip">you</span>'  : "") +
      `</span>` +
      // Kick button: visible only to host, not on themselves
      (state.isHost && !isSelf && !m.isHost
        ? `<button class="kick-btn" data-userid="${m.userId}">Kick</button>`
        : "");
    membersListEl.appendChild(row);
  }

  // Kick button listeners
  membersListEl.querySelectorAll<HTMLButtonElement>(".kick-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetUserId = btn.dataset.userid;
      if (!targetUserId) return;
      btn.disabled = true;
      btn.textContent = "…";
      chrome.runtime.sendMessage({
        source: "parallel-popup",
        kind: "kick_user",
        payload: { targetUserId },
      });
    });
  });
}

// ── Data fetching ─────────────────────────────────────────────────────────────
function refreshStatus() {
  chrome.runtime.sendMessage(
    { source: "parallel-popup", kind: "get_status" },
    (response: RoomState | undefined) => {
      if (response) renderState(response);
    }
  );
}

// ── Event listeners ───────────────────────────────────────────────────────────
joinBtn.addEventListener("click", () => {
  const roomId = roomIdInput.value.trim();
  const userId = userIdInput.value.trim();
  if (!roomId || !userId) {
    errorMsgEl.textContent = "Please fill in both fields.";
    return;
  }
  errorMsgEl.textContent = "";
  joinBtn.disabled = true;
  joinBtn.textContent = "Joining…";

  chrome.runtime.sendMessage(
    { source: "parallel-popup", kind: "join_room", payload: { roomId, userId } },
    () => {
      joinBtn.disabled = false;
      joinBtn.textContent = "Join Room";
      refreshStatus();
    }
  );
});

leaveBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage(
    { source: "parallel-popup", kind: "leave_room" },
    () => refreshStatus()
  );
});

// Feature 2 & 3: live updates pushed from background
chrome.runtime.onMessage.addListener((message) => {
  if (
    message?.source === "parallel-background" &&
    message.kind === "room_state_update"
  ) {
    renderState(message.payload as RoomState);
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────
refreshStatus();
