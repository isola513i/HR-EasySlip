import { z } from "zod";

export const AssetTypeEnum = z.enum(["LAPTOP", "PHONE", "MONITOR", "HEADSET", "TABLET", "OTHER"]);
export const AssetStatusEnum = z.enum(["AVAILABLE", "ASSIGNED", "RETIRED", "REPAIR"]);

export const AssetCreateSchema = z.object({
  type: AssetTypeEnum,
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  purchaseDate: z.string().date().optional(),
  notes: z.string().max(2000).optional(),
});

// Status transitions go through assignAsset / returnAsset / retireAsset to
// preserve invariants with AssetAssignment. Generic update intentionally
// excludes `status`.
export const AssetUpdateSchema = AssetCreateSchema.partial();
export const AssetRetireSchema = z.object({
  notes: z.string().max(500).optional(),
});

export const AssetAssignSchema = z.object({
  employeeId: z.string().min(1),
  notes: z.string().max(500).optional(),
});

export const AssetReturnSchema = z.object({
  returnCondition: z.string().max(500).optional(),
});

export const AssetListFiltersSchema = z.object({
  status: AssetStatusEnum.optional(),
  type: AssetTypeEnum.optional(),
});

export type AssetCreateInput = z.infer<typeof AssetCreateSchema>;
export type AssetUpdateInput = z.infer<typeof AssetUpdateSchema>;
export type AssetAssignInput = z.infer<typeof AssetAssignSchema>;
export type AssetReturnInput = z.infer<typeof AssetReturnSchema>;
export type AssetRetireInput = z.infer<typeof AssetRetireSchema>;
