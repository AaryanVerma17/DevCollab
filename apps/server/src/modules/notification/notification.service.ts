import { prisma } from "../../db/prisma";
import { emitToRoom } from "../../socket";
import { SOCKET_EVENTS } from "@devcollab/types";

interface CreateNotificationInput {
  type: string;
  message: string;
  userId: string;
  actorId?: string;
  resourceId?: string;
  resourceType?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      type: input.type,
      message: input.message,
      userId: input.userId,
      actorId: input.actorId ?? null,
      resourceId: input.resourceId ?? null,
      resourceType: input.resourceType ?? null,
    },
    select: {
      id: true, type: true, message: true, isRead: true,
      resourceId: true, resourceType: true, createdAt: true,
      actor: { select: { id: true, name: true, avatar: true } },
    },
  });

  emitToRoom(`user:${input.userId}`, SOCKET_EVENTS.NOTIFICATION_NEW, {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    actorId: input.actorId ?? "",
    actorName: notification.actor?.name ?? "",
    actorAvatar: notification.actor?.avatar ?? null,
    resourceId: notification.resourceId ?? "",
    resourceType: notification.resourceType ?? "",
    createdAt: notification.createdAt.toISOString(),
  });

  return notification;
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId, isRead: false },
    select: {
      id: true, type: true, message: true, isRead: true,
      resourceId: true, resourceType: true, createdAt: true,
      actor: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}