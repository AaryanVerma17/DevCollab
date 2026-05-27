export enum WorkspaceRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER",
}

export enum WorkspacePlan {
  FREE = "FREE",
  PRO = "PRO",
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: WorkspacePlan;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  members?: WorkspaceMember[];
  projects?: Project[];
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
  workspace?: Workspace;
  user?: import("./user").User;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  members?: ProjectMember[];
  workspace?: Workspace;
  _count?: { tasks: number; members: number };
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
  user?: import("./user").User;
}

export interface Invite {
  id: string;
  token: string;
  workspaceId: string;
  invitedById: string;
  email: string | null;
  role: WorkspaceRole;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
  workspace?: Workspace;
  invitedBy?: import("./user").User;
}

export interface CreateWorkspaceInput {
  name: string;
  slug: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  color?: string;
}