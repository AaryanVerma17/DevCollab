export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  DONE = "DONE",
}

export enum TaskPriority {
  P0 = "P0",
  P1 = "P1",
  P2 = "P2",
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  labels: string[];
  dueDate: string | null;
  projectId: string;
  assigneeId: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  assignee?: import("./user").User | null;
  creator?: import("./user").User;
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  _count?: { comments: number; attachments: number };
}

export interface TaskComment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  author?: import("./user").User;
  mentions?: CommentMention[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskAttachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  taskId: string;
  uploadedById: string;
  uploadedBy?: import("./user").User;
  createdAt: string;
}

export interface CommentMention {
  id: string;
  commentId: string;
  userId: string;
  user?: import("./user").User;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
  labels?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
  labels?: string[];
}

export interface MoveTaskInput {
  status: TaskStatus;
  position: number;
}

export interface TasksGroupedByStatus {
  [TaskStatus.TODO]: Task[];
  [TaskStatus.IN_PROGRESS]: Task[];
  [TaskStatus.IN_REVIEW]: Task[];
  [TaskStatus.DONE]: Task[];
}