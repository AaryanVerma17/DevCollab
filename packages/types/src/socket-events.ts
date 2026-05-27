export const SOCKET_EVENTS = {
  // Board events
  BOARD_TASK_CREATED: "board:task-created",
  BOARD_TASK_UPDATED: "board:task-updated",
  BOARD_TASK_DELETED: "board:task-deleted",
  BOARD_TASK_MOVED: "board:task-moved",

  // Presence events
  PRESENCE_JOIN: "presence:join",
  PRESENCE_LEAVE: "presence:leave",
  PRESENCE_UPDATE: "presence:update",

  // Notification events
  NOTIFICATION_NEW: "notification:new",

  // Activity events
  ACTIVITY_NEW: "activity:new",

  // Wiki events
  WIKI_PAGE_UPDATED: "wiki:page-updated",

  // AI events
  AI_JOB_COMPLETE: "ai:job-complete",
  AI_JOB_ERROR: "ai:job-error",
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

// ─── Payload Interfaces ────────────────────────────────────────────────────

export interface BoardTaskCreatedPayload {
  projectId: string;
  task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    position: number;
    assigneeId: string | null;
    dueDate: string | null;
    labels: string[];
    commentCount: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface BoardTaskUpdatedPayload {
  projectId: string;
  taskId: string;
  changes: Partial<{
    title: string;
    description: string;
    status: string;
    priority: string;
    assigneeId: string | null;
    dueDate: string | null;
    labels: string[];
  }>;
  updatedAt: string;
}

export interface BoardTaskDeletedPayload {
  projectId: string;
  taskId: string;
}

export interface BoardTaskMovedPayload {
  projectId: string;
  taskId: string;
  status: string;
  position: number;
  updatedAt: string;
}

export interface PresenceJoinPayload {
  userId: string;
  name: string;
  avatar: string | null;
  room: string;
  taskId?: string;
}

export interface PresenceLeavePayload {
  userId: string;
  room: string;
}

export interface PresenceUpdatePayload {
  room: string;
  users: Array<{
    userId: string;
    name: string;
    avatar: string | null;
    taskId?: string;
  }>;
}

export interface NotificationNewPayload {
  id: string;
  type: string;
  message: string;
  actorId: string;
  actorName: string;
  actorAvatar: string | null;
  resourceId: string;
  resourceType: string;
  createdAt: string;
}

export interface ActivityNewPayload {
  id: string;
  projectId: string;
  actorId: string;
  actorName: string;
  actorAvatar: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceTitle: string;
  createdAt: string;
}

export interface WikiPageUpdatedPayload {
  projectId: string;
  pageId: string;
  title: string;
  updatedById: string;
  updatedAt: string;
}

export interface AiJobCompletePayload {
  jobId: string;
  userId: string;
  result: string;
  jobType: string;
}

export interface AiJobErrorPayload {
  jobId: string;
  userId: string;
  error: string;
  jobType: string;
}

// ─── Master Event Map ──────────────────────────────────────────────────────

export interface SocketEventMap {
  [SOCKET_EVENTS.BOARD_TASK_CREATED]: BoardTaskCreatedPayload;
  [SOCKET_EVENTS.BOARD_TASK_UPDATED]: BoardTaskUpdatedPayload;
  [SOCKET_EVENTS.BOARD_TASK_DELETED]: BoardTaskDeletedPayload;
  [SOCKET_EVENTS.BOARD_TASK_MOVED]: BoardTaskMovedPayload;
  [SOCKET_EVENTS.PRESENCE_JOIN]: PresenceJoinPayload;
  [SOCKET_EVENTS.PRESENCE_LEAVE]: PresenceLeavePayload;
  [SOCKET_EVENTS.PRESENCE_UPDATE]: PresenceUpdatePayload;
  [SOCKET_EVENTS.NOTIFICATION_NEW]: NotificationNewPayload;
  [SOCKET_EVENTS.ACTIVITY_NEW]: ActivityNewPayload;
  [SOCKET_EVENTS.WIKI_PAGE_UPDATED]: WikiPageUpdatedPayload;
  [SOCKET_EVENTS.AI_JOB_COMPLETE]: AiJobCompletePayload;
  [SOCKET_EVENTS.AI_JOB_ERROR]: AiJobErrorPayload;
}