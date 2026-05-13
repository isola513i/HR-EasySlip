import type { PrismaClient } from "@prisma/client";
import type { EmployeeRecord } from "./employees";

export async function seedAssets(
  prisma: PrismaClient,
  employeeMap: Map<string, EmployeeRecord>,
): Promise<{ assets: number; assignments: number }> {
  const nattapat = employeeMap.get("ES0010");
  const suda = employeeMap.get("ES0011");
  const nattapol = employeeMap.get("ES0012");
  const panitan = employeeMap.get("ES0017"); // Product Manager

  if (!nattapat || !suda || !nattapol) {
    throw new Error("Required employees missing for asset seeding");
  }

  // Idempotent: clear all assignments then assets
  await prisma.assetAssignment.deleteMany({});
  await prisma.asset.deleteMany({});

  type AssetDef = {
    tag: string;
    type: "LAPTOP" | "PHONE" | "MONITOR" | "HEADSET" | "TABLET" | "OTHER";
    brand: string;
    model: string;
    serialNumber: string;
    purchaseDate: Date;
    status: "AVAILABLE" | "ASSIGNED" | "RETIRED" | "REPAIR";
    notes?: string;
  };

  const assetDefs: AssetDef[] = [
    { tag: "LAP001", type: "LAPTOP", brand: "Apple", model: 'MacBook Pro 14" M3', serialNumber: "C02XG1WJMD8P", purchaseDate: new Date("2024-01-15"), status: "ASSIGNED" },
    { tag: "LAP002", type: "LAPTOP", brand: "Apple", model: 'MacBook Air 15" M2', serialNumber: "C02YH2XKND9Q", purchaseDate: new Date("2023-08-01"), status: "ASSIGNED" },
    { tag: "LAP003", type: "LAPTOP", brand: "Dell", model: "XPS 13 9340", serialNumber: "DELL-XPS13-2024-0091", purchaseDate: new Date("2024-03-10"), status: "ASSIGNED" },
    { tag: "LAP004", type: "LAPTOP", brand: "Lenovo", model: "ThinkPad X1 Carbon G12", serialNumber: "LNV-X1C-2024-0112", purchaseDate: new Date("2024-06-01"), status: "ASSIGNED" },
    { tag: "LAP005", type: "LAPTOP", brand: "Lenovo", model: "ThinkPad E14 G5", serialNumber: "LNV-E14-2023-0055", purchaseDate: new Date("2023-03-01"), status: "AVAILABLE" },
    { tag: "PHO001", type: "PHONE", brand: "Apple", model: "iPhone 15 Pro", serialNumber: "DNPXX8A1PL4T", purchaseDate: new Date("2023-12-01"), status: "ASSIGNED" },
    { tag: "PHO002", type: "PHONE", brand: "Samsung", model: "Galaxy S24", serialNumber: "R58NC1BETPF", purchaseDate: new Date("2024-02-15"), status: "AVAILABLE" },
    { tag: "MON001", type: "MONITOR", brand: "LG", model: "UltraFine 27UK850-W", serialNumber: "LG27UK-2023-0047", purchaseDate: new Date("2023-05-20"), status: "RETIRED", notes: "Dead pixel — retired 2026-03-15" },
    { tag: "MON002", type: "MONITOR", brand: "Dell", model: "UltraSharp U2723DE", serialNumber: "DELL-U27-2024-0213", purchaseDate: new Date("2024-04-01"), status: "AVAILABLE" },
    { tag: "HEAD001", type: "HEADSET", brand: "Sony", model: "WH-1000XM5", serialNumber: "SN-1000XM5-20240055", purchaseDate: new Date("2024-02-01"), status: "ASSIGNED" },
  ];

  const assetIds: Record<string, string> = {};
  for (const def of assetDefs) {
    const asset = await prisma.asset.create({
      data: {
        type: def.type,
        brand: def.brand,
        model: def.model,
        serialNumber: def.serialNumber,
        purchaseDate: def.purchaseDate,
        status: def.status,
        notes: def.notes,
      },
    });
    assetIds[def.tag] = asset.id;
  }

  type AssignmentDef = { tag: string; emp: EmployeeRecord | undefined; assignedAt: Date };
  const assignments: AssignmentDef[] = [
    { tag: "LAP001", emp: nattapat, assignedAt: new Date("2025-06-03") },
    { tag: "LAP002", emp: suda, assignedAt: new Date("2022-03-15") },
    { tag: "LAP003", emp: nattapol, assignedAt: new Date("2024-03-10") },
    { tag: "LAP004", emp: panitan ?? suda, assignedAt: new Date("2024-06-01") },
    { tag: "PHO001", emp: panitan ?? nattapat, assignedAt: new Date("2023-12-01") },
    { tag: "HEAD001", emp: suda, assignedAt: new Date("2024-02-01") },
  ];

  let assignmentCount = 0;
  for (const a of assignments) {
    if (!a.emp) continue;
    await prisma.assetAssignment.create({
      data: { assetId: assetIds[a.tag], employeeId: a.emp.id, assignedAt: a.assignedAt },
    });
    assignmentCount++;
  }

  return { assets: assetDefs.length, assignments: assignmentCount };
}
