import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import type { Caller, RequestMeta } from "@/lib/api/types";
import type { AssetCreateInput, AssetUpdateInput, AssetAssignInput, AssetReturnInput } from "./schemas";

export async function listAssets(filters: { status?: string; type?: string }) {
  return prisma.asset.findMany({
    where: {
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(filters.type ? { type: filters.type as never } : {}),
    },
    include: {
      assignments: {
        where: { returnedAt: null },
        include: {
          employee: {
            select: { id: true, employeeCode: true, firstNameTh: true, lastNameTh: true },
          },
        },
        take: 1,
      },
    },
    orderBy: [{ status: "asc" }, { type: "asc" }, { createdAt: "desc" }],
  });
}

export async function listMyAssignments(employeeId: string) {
  return prisma.assetAssignment.findMany({
    where: { employeeId, returnedAt: null },
    include: {
      asset: {
        select: { id: true, type: true, brand: true, model: true, serialNumber: true, status: true },
      },
    },
    orderBy: { assignedAt: "desc" },
  });
}

export async function createAsset(caller: Caller, input: AssetCreateInput, meta: RequestMeta) {
  const asset = await prisma.asset.create({
    data: {
      type: input.type,
      brand: input.brand,
      model: input.model,
      serialNumber: input.serialNumber,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
      notes: input.notes,
    },
  });

  await writeAuditLog({
    actorId: caller.userId,
    action: "asset.created",
    entityType: "Asset",
    entityId: asset.id,
    after: asset,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return asset;
}

export async function updateAsset(caller: Caller, id: string, input: AssetUpdateInput, meta: RequestMeta) {
  const before = await prisma.asset.findUnique({ where: { id } });
  if (!before) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);

  const after = await prisma.asset.update({
    where: { id },
    data: {
      ...input,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
    },
  });

  await writeAuditLog({
    actorId: caller.userId,
    action: "asset.updated",
    entityType: "Asset",
    entityId: id,
    before,
    after,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return after;
}

export async function assignAsset(caller: Caller, assetId: string, input: AssetAssignInput, meta: RequestMeta) {
  return prisma.$transaction(async (tx) => {
    const asset = await tx.asset.findUnique({
      where: { id: assetId },
      include: { assignments: { where: { returnedAt: null }, take: 1 } },
    });
    if (!asset) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (asset.status === "RETIRED") {
      throw new DomainError("ASSET_RETIRED", { message: "Cannot assign a retired asset" });
    }
    if (asset.assignments.length > 0) {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED, { message: "Asset already assigned" });
    }

    const employee = await tx.employee.findUnique({ where: { id: input.employeeId }, select: { id: true } });
    if (!employee) throw new DomainError(ErrorCodes.EMPLOYEE_NOT_FOUND, {}, 404);

    const assignment = await tx.assetAssignment.create({
      data: { assetId, employeeId: input.employeeId },
    });
    const updated = await tx.asset.update({
      where: { id: assetId },
      data: { status: "ASSIGNED" },
    });

    await writeAuditLog({
      actorId: caller.userId,
      action: "asset.assigned",
      entityType: "Asset",
      entityId: assetId,
      after: { assignmentId: assignment.id, employeeId: input.employeeId },
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    }, tx);

    return { asset: updated, assignment };
  });
}

export async function returnAsset(caller: Caller, assetId: string, input: AssetReturnInput, meta: RequestMeta) {
  return prisma.$transaction(async (tx) => {
    const open = await tx.assetAssignment.findFirst({
      where: { assetId, returnedAt: null },
    });
    if (!open) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, { message: "No open assignment" }, 404);

    const closed = await tx.assetAssignment.update({
      where: { id: open.id },
      data: { returnedAt: new Date(), returnCondition: input.returnCondition ?? null },
    });
    const updated = await tx.asset.update({
      where: { id: assetId },
      data: { status: "AVAILABLE" },
    });

    await writeAuditLog({
      actorId: caller.userId,
      action: "asset.returned",
      entityType: "Asset",
      entityId: assetId,
      after: { assignmentId: closed.id, returnCondition: input.returnCondition ?? null },
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    }, tx);

    return { asset: updated, assignment: closed };
  });
}
