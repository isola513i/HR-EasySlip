import type { NotificationKind, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface CreateNotificationInput {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  link?: string;
}

export async function createNotification(
  input: CreateNotificationInput,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
) {
  return tx.notification.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
    },
  });
}

export interface ListOptions {
  unreadOnly?: boolean;
  limit?: number;
}

export async function listNotifications(userId: string, opts: ListOptions = {}) {
  const where: Prisma.NotificationWhereInput = { userId };
  if (opts.unreadOnly) where.readAt = null;
  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 20,
  });
}

export async function countUnread(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markRead(userId: string, notificationId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
