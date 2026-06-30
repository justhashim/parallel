// NOTE: this should eventually move into packages/shared-types so the
// web app, capture scripts, and replay scripts all import the same source.

export interface BaseEvent {
  roomId: string;
  userId: string;
}

export interface CursorMoveEvent extends BaseEvent {
  type: "cursor_move";
  x: number; // viewport-relative (clientX)
  y: number; // viewport-relative (clientY)
}

export interface ClickEvent extends BaseEvent {
  type: "click";
  x: number;
  y: number;
  selector?: string; // optional CSS selector for more reliable targeting
}

export interface ScrollEvent extends BaseEvent {
  type: "scroll";
  x: number; // window.scrollX
  y: number; // window.scrollY
}

export interface NavigateEvent extends BaseEvent {
  type: "navigate";
  url: string;
}

// Feature 1: text input sync
export interface InputChangeEvent extends BaseEvent {
  type: "input_change";
  selector: string;   // CSS selector to locate the element
  value: string;      // current value of the field
  inputType: string;  // "input" | "textarea" | "select"
}

export type ParallelEvent =
  | CursorMoveEvent
  | ClickEvent
  | ScrollEvent
  | NavigateEvent
  | InputChangeEvent;

export interface UserJoinedPayload {
  userId: string;
}

export interface UserLeftPayload {
  userId: string;
}

// Feature 2 & 3: room member info
export interface RoomMemberInfo {
  userId: string;
  isHost: boolean;
}

export interface RoomInfoPayload {
  isHost: boolean;
  members: RoomMemberInfo[];
  currentUrl: string;
}