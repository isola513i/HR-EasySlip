import { prisma } from "@/lib/prisma";

export interface OrgChartNode {
  id: string;
  employeeCode: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn: string | null;
  lastNameEn: string | null;
  positionName: string | null;
  departmentName: string | null;
  managerId: string | null;
  hasProfilePicture: boolean;
  profilePictureUploadedAt: string | null;
  children: OrgChartNode[];
}

interface FlatRow {
  id: string;
  employeeCode: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn: string | null;
  lastNameEn: string | null;
  managerId: string | null;
  position: { name: string } | null;
  department: { name: string } | null;
  hasProfilePicture: boolean;
  profilePictureUploadedAt: Date | null;
}

function toNode(row: FlatRow, children: OrgChartNode[]): OrgChartNode {
  return {
    id: row.id,
    employeeCode: row.employeeCode,
    firstNameTh: row.firstNameTh,
    lastNameTh: row.lastNameTh,
    firstNameEn: row.firstNameEn,
    lastNameEn: row.lastNameEn,
    positionName: row.position?.name ?? null,
    departmentName: row.department?.name ?? null,
    managerId: row.managerId,
    hasProfilePicture: row.hasProfilePicture,
    profilePictureUploadedAt: row.profilePictureUploadedAt?.toISOString() ?? null,
    children,
  };
}

/** Build a forest of OrgChartNode rooted at employees with no manager. */
export async function getOrgChart(): Promise<OrgChartNode[]> {
  const rows = await prisma.employee.findMany({
    where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] }, isAnonymized: false },
    select: {
      id: true,
      employeeCode: true,
      firstNameTh: true,
      lastNameTh: true,
      firstNameEn: true,
      lastNameEn: true,
      managerId: true,
      hasProfilePicture: true,
      profilePictureUploadedAt: true,
      position: { select: { name: true } },
      department: { select: { name: true } },
    },
    orderBy: [{ position: { level: "desc" } }, { employeeCode: "asc" }],
  });

  const childrenMap = new Map<string | null, FlatRow[]>();
  for (const row of rows) {
    const list = childrenMap.get(row.managerId) ?? [];
    list.push(row);
    childrenMap.set(row.managerId, list);
  }

  const build = (parentId: string | null): OrgChartNode[] =>
    (childrenMap.get(parentId) ?? []).map((row) => toNode(row, build(row.id)));

  // Roots = employees whose managerId is null OR points to an employee not in the active set
  const activeIds = new Set(rows.map((r) => r.id));
  const roots = rows.filter((r) => !r.managerId || !activeIds.has(r.managerId));

  return roots.map((row) => toNode(row, build(row.id)));
}
