import { describe, test, expect, mock, beforeEach } from "bun:test";
import type { Role } from "@prisma/client";
import type { Caller, DocumentCategory } from "./types";

// ── Mock Prisma — only Employee.findUnique used by isManagerOfOwner ──
const mockFindUnique = mock(
  (): Promise<{ managerId: string | null } | null> => Promise.resolve(null),
);
const mockPrismaClient = {
  employee: { findUnique: mockFindUnique },
};

mock.module("@/lib/prisma", () => ({
  getPrisma: async () => mockPrismaClient,
}));

// `@/lib/security/rbac` transitively imports next-auth + env validation,
// neither of which is needed for these pure-function tests. Stub the
// module to expose just the HR_ROLES constant we depend on.
mock.module("@/lib/security/rbac", () => ({
  HR_ROLES: ["HRMG", "HR_AUTHORIZED", "CEO", "CTO", "COO", "ADMIN"] as readonly Role[],
}));

// Import AFTER mocks are registered so the module resolves to the stubs.
const { canRead, canWrite, isHr, isOwner, isManagerOfOwner } = await import("./rbac");

beforeEach(() => {
  mockFindUnique.mockReset();
  mockFindUnique.mockImplementation(() => Promise.resolve(null));
});

const OWNER_ID = "emp-owner";
const HR_ID = "emp-hr";
const MGR_ID = "emp-mgr";
const PEER_ID = "emp-peer";

const owner: Caller = { userId: "u-1", employeeId: OWNER_ID, roles: ["EMPLOYEE"] as Role[] };
const hr: Caller = { userId: "u-2", employeeId: HR_ID, roles: ["HR_AUTHORIZED"] as Role[] };
const ceo: Caller = { userId: "u-3", employeeId: HR_ID, roles: ["CEO"] as Role[] };
const manager: Caller = { userId: "u-4", employeeId: MGR_ID, roles: ["MANAGER"] as Role[] };
const peer: Caller = { userId: "u-5", employeeId: PEER_ID, roles: ["EMPLOYEE"] as Role[] };
const orphan: Caller = { userId: "u-6", employeeId: null, roles: ["EMPLOYEE"] as Role[] };

describe("rbac primitives", () => {
  test("isOwner — true only when caller.employeeId matches", () => {
    expect(isOwner(owner, OWNER_ID)).toBe(true);
    expect(isOwner(peer, OWNER_ID)).toBe(false);
    expect(isOwner(orphan, OWNER_ID)).toBe(false);
  });

  test("isHr — true for any HR_ROLES role", () => {
    expect(isHr(hr)).toBe(true);
    expect(isHr(ceo)).toBe(true);
    expect(isHr(owner)).toBe(false);
    expect(isHr(manager)).toBe(false);
  });

  test("isManagerOfOwner — true only when target.managerId === caller.employeeId", async () => {
    mockFindUnique.mockImplementationOnce(() => Promise.resolve({ managerId: MGR_ID }));
    expect(await isManagerOfOwner(manager, OWNER_ID)).toBe(true);

    mockFindUnique.mockImplementationOnce(() => Promise.resolve({ managerId: "someone-else" }));
    expect(await isManagerOfOwner(manager, OWNER_ID)).toBe(false);

    // Caller without an employee record can never be a manager.
    expect(await isManagerOfOwner(orphan, OWNER_ID)).toBe(false);
  });
});

describe("canWrite per category", () => {
  const cases: ReadonlyArray<readonly [DocumentCategory, Caller, boolean, string]> = [
    // contract — HR-only writes
    ["contract", hr, true, "HR can write contract"],
    ["contract", ceo, true, "CEO can write contract"],
    ["contract", owner, false, "owner CANNOT write contract"],
    ["contract", peer, false, "peer cannot write contract"],
    ["contract", manager, false, "manager cannot write contract"],
    // certificate / general / leave_attachment / time_correction_proof — owner OR HR
    ["certificate", owner, true, "owner can write certificate"],
    ["certificate", hr, true, "HR can write certificate"],
    ["certificate", peer, false, "peer cannot write certificate"],
    ["general", owner, true, "owner can write general"],
    ["general", manager, false, "manager cannot write general"],
    ["leave_attachment", owner, true, "owner can write leave_attachment"],
    ["leave_attachment", manager, false, "manager cannot write leave_attachment"],
    ["time_correction_proof", owner, true, "owner can write time_correction_proof"],
    ["time_correction_proof", peer, false, "peer cannot write time_correction_proof"],
  ];

  for (const [category, caller, expected, label] of cases) {
    test(label, () => {
      expect(canWrite(caller, OWNER_ID, category)).toBe(expected);
    });
  }
});

describe("canRead per category", () => {
  const employeeScoped: DocumentCategory[] = ["contract", "certificate", "general"];
  const requestScoped: DocumentCategory[] = ["leave_attachment", "time_correction_proof"];

  test("owner always reads own", async () => {
    for (const cat of [...employeeScoped, ...requestScoped]) {
      expect(await canRead(owner, { ownerEmployeeId: OWNER_ID, category: cat })).toBe(true);
    }
  });

  test("HR always reads", async () => {
    for (const cat of [...employeeScoped, ...requestScoped]) {
      expect(await canRead(hr, { ownerEmployeeId: OWNER_ID, category: cat })).toBe(true);
    }
  });

  test("peer cannot read employee-scoped", async () => {
    for (const cat of employeeScoped) {
      expect(await canRead(peer, { ownerEmployeeId: OWNER_ID, category: cat })).toBe(false);
    }
  });

  test("manager-of-owner can read leave/time-correction; peer manager cannot", async () => {
    // direct manager → managerId match
    mockFindUnique.mockImplementation(() => Promise.resolve({ managerId: MGR_ID }));
    for (const cat of requestScoped) {
      expect(await canRead(manager, { ownerEmployeeId: OWNER_ID, category: cat })).toBe(true);
    }

    // manager of a different employee
    mockFindUnique.mockImplementation(() => Promise.resolve({ managerId: "someone-else" }));
    for (const cat of requestScoped) {
      expect(await canRead(manager, { ownerEmployeeId: OWNER_ID, category: cat })).toBe(false);
    }
  });

  test("manager-of-owner CANNOT read employee-scoped contract/certificate/general", async () => {
    mockFindUnique.mockImplementation(() => Promise.resolve({ managerId: MGR_ID }));
    for (const cat of employeeScoped) {
      expect(await canRead(manager, { ownerEmployeeId: OWNER_ID, category: cat })).toBe(false);
    }
  });

  test("orphan caller (no employeeId) is denied across the matrix", async () => {
    for (const cat of [...employeeScoped, ...requestScoped]) {
      expect(await canRead(orphan, { ownerEmployeeId: OWNER_ID, category: cat })).toBe(false);
    }
  });
});
