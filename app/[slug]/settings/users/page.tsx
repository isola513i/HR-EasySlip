import { requireRoles, TENANT_ADMIN_ROLES } from "@/lib/security/rbac";
import { getTenantId } from "@/lib/db/tenant-context";
import { getTenantPrisma } from "@/lib/db/tenant";
import { getControlPlane } from "@/lib/db/control-plane";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { UserList } from "./user-list";

export type UserRow = {
  id: string; // CP User.id
  email: string;
  isDisabled: boolean; // true when membership.status === "SUSPENDED"
  createdAt: Date;
  employee: {
    id: string;
    firstNameTh: string;
    lastNameTh: string;
    employeeCode: string;
    roles: string[];
    employmentStatus: string;
  } | null;
};

export default async function UsersPage() {
  const caller = await requireRoles(TENANT_ADMIN_ROLES);
  const locale = await getLocale();
  const t = getDictionary(locale);
  const tu = t.tenantSettings.users;

  const tenantId = await getTenantId();
  const cp = getControlPlane();

  const [memberships, prisma] = await Promise.all([
    cp.tenantMembership.findMany({
      where: { tenantId, status: { not: "DELETED" } },
      include: {
        user: { select: { id: true, email: true, createdAt: true } },
      },
      orderBy: { user: { createdAt: "asc" } },
    }),
    getTenantPrisma(tenantId),
  ]);

  // Batch-fetch all employee records for this tenant by their IDs
  const employeeIds = memberships
    .map((m) => m.employeeRecordId)
    .filter((id): id is string => !!id);

  const employees = await prisma.employee.findMany({
    where: { id: { in: employeeIds } },
    select: {
      id: true,
      firstNameTh: true,
      lastNameTh: true,
      employeeCode: true,
      roles: true,
      employmentStatus: true,
    },
  });
  const employeeById = new Map(employees.map((e) => [e.id, e]));

  const users: UserRow[] = memberships.map((m) => ({
    id: m.user.id,
    email: m.user.email,
    isDisabled: m.status === "SUSPENDED",
    createdAt: m.user.createdAt,
    employee: m.employeeRecordId ? (employeeById.get(m.employeeRecordId) ?? null) : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{tu.title}</h1>
        <p className="text-sm text-muted-foreground">{tu.subtitle}</p>
      </div>
      <UserList
        users={users}
        currentUserId={caller.userId}
      />
    </div>
  );
}
