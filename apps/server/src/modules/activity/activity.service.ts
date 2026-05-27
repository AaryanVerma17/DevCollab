import { prisma } from "../../db/prisma";
import { emitToRoom } from "../../socket";
import { SOCKET_EVENTS } from "@devcollab/types";

interface CreateActivityInput {
  action: string;
  resourceType: string;
  resourceId: string;
  resourceTitle: string;
  projectId: string;
  actorId: string;
  actorName: string;
  actorAvatar: string | null;
}

export async function createActivity(input: CreateActivityInput) {
  const log = await prisma.activityLog.create({
    data: {
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      resourceTitle: input.resourceTitle,
      projectId: input.projectId,
      actorId: input.actorId,
    },
    select: { id: true, action: true, resourceType: true, resourceId: true, resourceTitle: true, projectId: true, actorId: true, createdAt: true },
  });

  emitToRoom(`project:${input.projectId}`, SOCKET_EVENTS.ACTIVITY_NEW, {
    id: log.id,
    projectId: log.projectId,
    actorId: log.actorId,
    actorName: input.actorName,
    actorAvatar: input.actorAvatar,
    action: log.action,
    resourceType: log.resourceType,
    resourceId: log.resourceId,
    resourceTitle: log.resourceTitle,
    createdAt: log.createdAt.toISOString(),
  });

  return log;
}

export async function getProjectActivity(
  projectId: string,
  cursor?: string,
  limit: number = 20
) {
  const logs = await prisma.activityLog.findMany({
    where: { projectId },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      action: true,
      resourceType: true,
      resourceId: true,
      resourceTitle: true,
      projectId: true,
      createdAt: true,
      actor: { select: { id: true, name: true, avatar: true } },
    },
  });

  const hasMore = logs.length > limit;
  const items = hasMore ? logs.slice(0, -1) : logs;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { items, nextCursor, hasMore };
}