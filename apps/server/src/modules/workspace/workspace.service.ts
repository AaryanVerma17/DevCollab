import { prisma } from "../../db/prisma";
import { AppError } from "../../middleware/error-handler";
import { createActivity } from "../activity/activity.service";

const WORKSPACE_SELECT = {
  id: true,
  name: true,
  slug: true,
  plan: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
};

const MEMBER_SELECT = {
  id: true,
  role: true,
  joinedAt: true,
  user: { select: { id: true, name: true, email: true, avatar: true } },
};

export async function createWorkspace(userId: string, name: string, slug: string) {
  const existing = await prisma.workspace.findUnique({ where: { slug } });
  if (existing) throw new AppError(409, `Slug "${slug}" is already taken`, "SLUG_TAKEN");

  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      members: { create: { userId, role: "OWNER" } },
    },
    select: { ...WORKSPACE_SELECT, members: { select: MEMBER_SELECT } },
  });

  return workspace;
}

export async function listWorkspacesForUser(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    select: {
      role: true,
      joinedAt: true,
      workspace: {
        select: {
          ...WORKSPACE_SELECT,
          _count: { select: { members: true, projects: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return memberships
    .filter((m) => !m.workspace.deletedAt)
    .map((m) => ({ ...m.workspace, myRole: m.role }));
}

export async function getWorkspaceBySlug(slug: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    select: {
      ...WORKSPACE_SELECT,
      members: { select: MEMBER_SELECT },
      projects: {
        select: { id: true, name: true, color: true, description: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!workspace || workspace.deletedAt) throw new AppError(404, "Workspace not found");

  const isMember = workspace.members.some((m) => m.user.id === userId);
  if (!isMember) throw new AppError(403, "Not a member of this workspace");

  return workspace;
}

export async function updateWorkspace(
  workspaceId: string,
  userId: string,
  data: { name?: string }
) {
  await assertRole(workspaceId, userId, ["OWNER", "ADMIN"]);

  return prisma.workspace.update({
    where: { id: workspaceId },
    data,
    select: WORKSPACE_SELECT,
  });
}

export async function deleteWorkspace(workspaceId: string, userId: string) {
  await assertRole(workspaceId, userId, ["OWNER"]);

  return prisma.workspace.update({
    where: { id: workspaceId },
    data: { deletedAt: new Date() },
    select: { id: true },
  });
}

async function assertRole(workspaceId: string, userId: string, roles: string[]) {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  });
  if (!member) throw new AppError(403, "Not a member of this workspace");
  if (!roles.includes(member.role)) {
    throw new AppError(403, `Requires ${roles.join(" or ")} role`);
  }
}