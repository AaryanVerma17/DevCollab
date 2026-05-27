export interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  userId: string;
  actorId: string | null;
  resourceId: string | null;
  resourceType: string | null;
  createdAt: string;
  actor?: import("./user").User | null;
}

export interface ActivityLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceTitle: string;
  projectId: string;
  actorId: string;
  createdAt: string;
  actor?: import("./user").User;
}