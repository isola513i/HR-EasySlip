import { requireRoles, TENANT_ADMIN_ROLES } from "@/lib/security/rbac";
import { getTenantId } from "@/lib/db/tenant-context";
import { getTenantPrisma } from "@/lib/db/tenant";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { UserList } from "./user-list";

export type UserRow = {
  id: string;
  email: string;
  isDisabled: boolean;
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
  const prisma = await getTenantPrisma(tenantId);

  const users = await prisma.user.findMany({
    include: {
      employee: {
        select: {
          id: true,
          firstNameTh: true,
          lastNameTh: true,
          employeeCode: true,
          roles: true,
          employmentStatus: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{tu.title}</h1>
        <p className="text-sm text-muted-foreground">{tu.subtitle}</p>
      </div>
      <UserList
        users={users as UserRow[]}
        currentUserId={caller.userId}
      />
    </div>
  );
}
