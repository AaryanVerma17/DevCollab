import { prisma } from "../../db/prisma";
import { AppError } from "../../middleware/error-handler";
import { emitToRoom } from "../../socket";
import { SOCKET_EVENTS } from "@devcollab/types";
import { createActivity } from "../activity/activity.service";
import { createNotification } from "../notification/notification.service";

const TASK_SELECT = {
  id: true, title: true, description: true, status: true, priority: true,
  position: true, labels: true, dueDate: true, projectId: true,
  assigneeId: true, creatorId: true, createdAt: true, updatedAt: true,
  assignee: { select: { id: true, name: true, avatar: true } },
  creator: { select: { id: true, name: true, avatar: true } },
  _count: { select: { comments: true, attachments: true } },
};

function serializeTask(task: any) {
  return {
    ...task,
    dueDate: task.dueDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export async function createTask(
  projectId: string,
  creatorId: string,
  actor: { name: string; avatar: string | null },
  data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    dueDate?: string;
    labels?: string[];
  }
) {
  const maxPositionResult = await prisma.task.aggregate({
    where: { projectId, status: (data.status ?? "TODO") as any },
    _max: { position: true },
  });
  const position = (maxPositionResult._max.position ?? 0) + 1000;

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: (data.status ?? "TODO") as any,
      priority: (data.priority ?? "P2") as any,
      labels: data.labels ?? [],
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      position,
      projectId,
      creatorId,
      assigneeId: data.assigneeId ?? null,
    },
    select: TASK_SELECT,
  });

  const serialized = serializeTask(task);

  emitToRoom(`project:${projectId}`, SOCKET_EVENTS.BOARD_TASK_CREATED, {
    projectId,
    task: { ...serialized, commentCount: task._count.comments },
  });

  await createActivity({
    action: "created task",
    resourceType: "task",
    resourceId: task.id,
    resourceTitle: task.title,
    projectId,
    actorId: creatorId,
    actorName: actor.name,
    actorAvatar: actor.avatar,
  });

  return serialized;
}

export async function listTasksByProject(projectId: string) {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: TASK_SELECT,
    orderBy: { position: "asc" },
  });

  const grouped: Record<string, any[]> = {
    TODO: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [],
  };

  for (const task of tasks) {
    const serialized = serializeTask(task);
    grouped[task.status]?.push(serialized);
  }

  return grouped;
}

export async function getTask(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      ...TASK_SELECT,
      comments: {
        select: {
          id: true, content: true, createdAt: true, updatedAt: true,
          author: { select: { id: true, name: true, avatar: true } },
          mentions: { select: { userId: true, user: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "asc" },
      },
      attachments: {
        select: {
          id: true, filename: true, url: true, mimeType: true, size: true, createdAt: true,
          uploadedBy: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });
  if (!task) throw new AppError(404, "Task not found");
  return serializeTask(task);
}

export async function updateTask(
  taskId: string,
  actorId: string,
  actor: { name: string; avatar: string | null },
  data: Partial<{
    title: string; description: string; status: string; priority: string;
    assigneeId: string | null; dueDate: string | null; labels: string[];
  }>
) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true, title: true } });
  if (!task) throw new AppError(404, "Task not found");

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...data,
      status: data.status as any,
      priority: data.priority as any,
      dueDate: data.dueDate === null ? null : data.dueDate ? new Date(data.dueDate) : undefined,
    },
    select: TASK_SELECT,
  });

  const serialized = serializeTask(updated);

  emitToRoom(`project:${task.projectId}`, SOCKET_EVENTS.BOARD_TASK_UPDATED, {
    projectId: task.projectId,
    taskId,
    changes: data,
    updatedAt: serialized.updatedAt,
  });

  await createActivity({
    action: "updated task",
    resourceType: "task",
    resourceId: taskId,
    resourceTitle: updated.title,
    projectId: task.projectId,
    actorId,
    actorName: actor.name,
    actorAvatar: actor.avatar,
  });

  return serialized;
}

export async function moveTask(
  taskId: string,
  actorId: string,
  actor: { name: string; avatar: string | null },
  status: string,
  position: number
) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true, title: true } });
  if (!task) throw new AppError(404, "Task not found");

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status: status as any, position },
    select: { id: true, status: true, position: true, updatedAt: true, projectId: true },
  });

  emitToRoom(`project:task.projectId`, SOCKET_EVENTS.BOARD_TASK_MOVED, {
    projectId: task.projectId,
    taskId,
    status,
    position,
    updatedAt: updated.updatedAt.toISOString(),
  });

  return updated;
}

export async function deleteTask(taskId: string, actorId: string, actor: { name: string; avatar: string | null }) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true, title: true } });
  if (!task) throw new AppError(404, "Task not found");

  await prisma.task.delete({ where: { id: taskId } });

  emitToRoom(`project:${task.projectId}`, SOCKET_EVENTS.BOARD_TASK_DELETED, {
    projectId: task.projectId,
    taskId,
  });

  await createActivity({
    action: "deleted task",
    resourceType: "task",
    resourceId: taskId,
    resourceTitle: task.title,
    projectId: task.projectId,
    actorId,
    actorName: actor.name,
    actorAvatar: actor.avatar,
  });
}

export async function addComment(
  taskId: string,
  authorId: string,
  author: { name: string; avatar: string | null },
  content: string
) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true, title: true } });
  if (!task) throw new AppError(404, "Task not found");

  // Parse @mentions: match @username patterns
  const mentionPattern = /@([a-zA-Z0-9_.-]+)/g;
  const mentionMatches = [...content.matchAll(mentionPattern)].map((m) => m[1]);

  const comment = await prisma.taskComment.create({
    data: {
      content,
      taskId,
      authorId,
    },
    select: {
      id: true, content: true, createdAt: true, updatedAt: true,
      author: { select: { id: true, name: true, avatar: true } },
    },
  });

  // Resolve mentions by name and create notifications
  if (mentionMatches.length > 0) {
    const mentionedUsers = await prisma.user.findMany({
      where: { name: { in: mentionMatches } },
      select: { id: true, name: true },
    });

    if (mentionedUsers.length > 0) {
      await prisma.commentMention.createMany({
        data: mentionedUsers.map((u) => ({ commentId: comment.id, userId: u.id })),
        skipDuplicates: true,
      });

      for (const mentionedUser of mentionedUsers) {
        if (mentionedUser.id === authorId) continue;
        await createNotification({
          type: "mention",
          message: `${author.name} mentioned you in a comment on "${task.title}"`,
          userId: mentionedUser.id,
          actorId: authorId,
          resourceId: taskId,
          resourceType: "task",
        });
      }
    }
  }

  await createActivity({
    action: "commented on task",
    resourceType: "task",
    resourceId: taskId,
    resourceTitle: task.title,
    projectId: task.projectId,
    actorId: authorId,
    actorName: author.name,
    actorAvatar: author.avatar,
  });

  return comment;
}

export async function addAttachment(
  taskId: string,
  uploadedById: string,
  data: { filename: string; url: string; mimeType: string; size: number }
) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
  if (!task) throw new AppError(404, "Task not found");

  return prisma.taskAttachment.create({
    data: { ...data, taskId, uploadedById },
    select: {
      id: true, filename: true, url: true, mimeType: true, size: true, createdAt: true,
      uploadedBy: { select: { id: true, name: true, avatar: true } },
    },
  });
}