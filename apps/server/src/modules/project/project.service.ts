import { prisma } from "../../db/prisma";
import { AppError } from "../../middleware/error-handler";
import { createActivity } from "../activity/activity.service";

const PROJECT_SELECT = {
  id: true, name: true, description: true, color: true,
  workspaceId: true, createdAt: true, updatedAt: true,
  _count: { select: { tasks: true, members: true } },
};

export async function createProject(
  workspaceId: string,
  userId: string,
  data: { name: string; description?: string; color?: string },
  actor: { name: string; avatar: string | null }
) {
  await assertWorkspaceMember(workspaceId, userId);

  const project = await prisma.project.create({
    data: {
      ...data,
      workspaceId,
      members: { create: { userId, role: "OWNER" } },
    },
    select: PROJECT_SELECT,
  });

  await createActivity({
    action: "created project",
    resourceType: "project",
    resourceId: project.id,
    resourceTitle: project.name,
    projectId: project.id,
    actorId: userId,
    actorName: actor.name,
    actorAvatar: actor.avatar,
  });

  return project;
}

export async function listProjects(workspaceId: string, userId: string) {
  await assertWorkspaceMember(workspaceId, userId);
  return prisma.project.findMany({
    where: { workspaceId },
    select: PROJECT_SELECT,
    orderBy: { createdAt: "asc" },
  });
}

export async function getProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      ...PROJECT_SELECT,
      members: {
        select: {
          id: true, role: true, joinedAt: true,
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      },
    },
  });
  if (!project) throw new AppError(404, "Project not found");
  await assertWorkspaceMember(project.workspaceId, userId);
  return project;
}

export async function updateProject(
  projectId: string,
  userId: string,
  data: { name?: string; description?: string; color?: string }
) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { workspaceId: true } });
  if (!project) throw new AppError(404, "Project not found");
  await assertWorkspaceMember(project.workspaceId, userId);

  return prisma.project.update({
    where: { id: projectId },
    data,
    select: PROJECT_SELECT,
  });
}

export async function deleteProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { workspaceId: true } });
  if (!project) throw new AppError(404, "Project not found");
  await assertWorkspaceMember(project.workspaceId, userId, ["OWNER", "ADMIN"]);
  await prisma.project.delete({ where: { id: projectId } });
}

async function assertWorkspaceMember(
  workspaceId: string,
  userId: string,
  roles?: string[]
) {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  });
  if (!member) throw new AppError(403, "Not a member of this workspace");
  if (roles && !roles.includes(member.role)) {
    throw new AppError(403, `Requires ${roles.join(" or ")} role`);
  }
}