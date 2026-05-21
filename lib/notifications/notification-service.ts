import { Prisma, type NotificationKind } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";

export interface CreateNotificationInput {
  userId: string;
  kind: NotificationKind;
  /** Structured params for view-time i18n rendering. */
  meta?: Prisma.InputJsonValue;
  /** Foreign key to the referenced entity (e.g. PayrollCycle.id). */
  refId?: string;
  /** Optional pre-rendered fallback for kinds without a dictionary template. */
  title?: string;
  body?: string;
  link?: string;
}

/**
 * Insert a notification, idempotent on (userId, kind, refId) when refId
 * is present. Returns null if the unique constraint is hit (i.e. the
 * notification already exists for this triple).
 */
export async function createNotification(
  input: CreateNotificationInput,
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? (await getPrisma());
  try {
    return await client.notification.create({
      data: {
        userId: input.userId,
        kind: input.kind,
        meta: input.meta,
        refId: input.refId ?? null,
        title: input.title ?? null,
        body: input.body ?? null,
        link: input.link ?? null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return null;
    }
    throw err;
  }
}

export interface ListOptions {
  unreadOnly?: boolean;
  limit?: number;
}

export async function listNotifications(userId: string, opts: ListOptions = {}) {
  const prisma = await getPrisma();
  const where: Prisma.NotificationWhereInput = { userId };
  if (opts.unreadOnly) where.readAt = null;
  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 20,
  });
}

export async function countUnread(userId: string): Promise<number> {
  const prisma = await getPrisma();
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markRead(userId: string, notificationId: string) {
  const prisma = await getPrisma();
  return prisma.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(userId: string) {
  const prisma = await getPrisma();
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
