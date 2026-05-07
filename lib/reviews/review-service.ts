import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import type { Caller, RequestMeta } from "@/lib/api/types";
import type { ReviewSubmitInput, ReviewSaveDraftInput } from "./schemas";

/** Reviews that the caller is responsible for completing (SELF + MANAGER). */
export async function listMyReviews(reviewerId: string) {
  return prisma.review.findMany({
    where: {
      reviewerId,
      cycle: { status: "ACTIVE" },
    },
    include: {
      cycle: { select: { id: true, name: true, cadence: true, endDate: true, templateId: true } },
      reviewee: { select: { id: true, employeeCode: true, firstNameTh: true, lastNameTh: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });
}

/** Reviews about the caller (e.g. own self-review + manager review of them). */
export async function listReviewsAboutMe(employeeId: string) {
  return prisma.review.findMany({
    where: { revieweeId: employeeId },
    include: {
      cycle: { select: { id: true, name: true, cadence: true, status: true } },
      reviewer: { select: { id: true, employeeCode: true, firstNameTh: true, lastNameTh: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getReview(reviewId: string, caller: Caller) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      cycle: { include: { template: true } },
      reviewee: { select: { id: true, employeeCode: true, firstNameTh: true, lastNameTh: true } },
      reviewer: { select: { id: true, employeeCode: true, firstNameTh: true, lastNameTh: true } },
    },
  });
  if (!review) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);

  // RBAC: reviewer (author) or reviewee (subject) may read
  if (review.reviewerId !== caller.employeeId && review.revieweeId !== caller.employeeId) {
    throw new DomainError("FORBIDDEN", {}, 403);
  }

  return review;
}

export async function saveDraft(
  caller: Caller,
  reviewId: string,
  input: ReviewSaveDraftInput,
  meta: RequestMeta,
) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
  if (review.reviewerId !== caller.employeeId) {
    throw new DomainError("FORBIDDEN", { message: "Only the assigned reviewer can save" }, 403);
  }
  if (review.status !== "DRAFT") {
    throw new DomainError(ErrorCodes.ALREADY_PROCESSED, { status: review.status });
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      answers: input.answers as object | undefined,
      overallRating: input.overallRating ?? null,
      comments: input.comments ?? null,
    },
  });

  await writeAuditLog({
    actorId: caller.userId,
    action: "review.draft_saved",
    entityType: "Review",
    entityId: reviewId,
    after: { hasAnswers: !!input.answers, hasComments: !!input.comments },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
}

export async function submitReview(
  caller: Caller,
  reviewId: string,
  input: ReviewSubmitInput,
  meta: RequestMeta,
) {
  return prisma.$transaction(async (tx) => {
    const review = await tx.review.findUnique({
      where: { id: reviewId },
      include: { cycle: { select: { status: true } } },
    });
    if (!review) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (review.cycle.status !== "ACTIVE") {
      throw new DomainError("CYCLE_NOT_ACTIVE", { status: review.cycle.status });
    }
    if (review.reviewerId !== caller.employeeId) {
      throw new DomainError("FORBIDDEN", { message: "Only the assigned reviewer can submit" }, 403);
    }
    if (review.status !== "DRAFT") {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED, { status: review.status });
    }

    const updated = await tx.review.update({
      where: { id: reviewId },
      data: {
        answers: input.answers,
        overallRating: input.overallRating ?? null,
        comments: input.comments ?? null,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    await writeAuditLog({
      actorId: caller.userId,
      action: "review.submitted",
      entityType: "Review",
      entityId: reviewId,
      before: review,
      after: updated,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    }, tx);

    return updated;
  });
}
