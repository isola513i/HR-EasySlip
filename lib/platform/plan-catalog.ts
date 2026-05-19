import { getControlPlane } from "@/lib/db/control-plane";

export interface PlanDef {
  code: string;
  name: string;
  priceTHB: number | null;
  maxEmployees: number | null;
  features: string[];
}

export async function getPlans(): Promise<PlanDef[]> {
  const cp = getControlPlane();
  const rows = await cp.plan.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((r) => ({
    code: r.code,
    name: r.name,
    priceTHB: r.priceTHB,
    maxEmployees: r.maxEmployees,
    features: r.features,
  }));
}

export async function getPlanByCode(code: string): Promise<PlanDef | null> {
  const cp = getControlPlane();
  const r = await cp.plan.findUnique({ where: { code } });
  if (!r) return null;
  return {
    code: r.code,
    name: r.name,
    priceTHB: r.priceTHB,
    maxEmployees: r.maxEmployees,
    features: r.features,
  };
}
