import { describe, expect, it } from "vitest";
import { ROUTES, decide, findRoute, homeFor, type Role } from "@/lib/roles";
import { safeNext } from "@/lib/routes";
import { normalizePhone } from "@/lib/phone";

describe("access table (PRD §8, AC-01)", () => {
  it("sends anonymous visitors to login for protected paths", () => {
    expect(decide("/sk/guru", null)).toBe("login");
    expect(decide("/beranda", null)).toBe("login");
  });

  it("allows public and token paths without a session", () => {
    expect(decide("/sk/daftar", null)).toBe("allow");
    expect(decide("/sk/daftar/individu", null)).toBe("allow");
    expect(decide("/sk/referensi/abc123", null)).toBe("allow");
    expect(decide("/konseling/konseli", null)).toBe("allow");
    expect(decide("/akses-ditolak", null)).toBe("allow");
  });

  it("denies a role outside the allowed list", () => {
    expect(decide("/sk/admin", ["parent"])).toBe("deny");
    expect(decide("/konseling/konselor", ["sk_admin"])).toBe("deny");
    expect(decide("/pengurus", ["markom"])).toBe("deny");
  });

  it("keeps counseling admin out of the konselor workspace and vice versa", () => {
    expect(decide("/konseling/konselor", ["konseling_admin"])).toBe("deny");
    expect(decide("/konseling/admin", ["konselor"])).toBe("deny");
    // super_admin is not a bypass for counseling (PRD §9.3)
    expect(decide("/konseling/konselor", ["super_admin"])).toBe("deny");
    expect(decide("/konseling/admin", ["super_admin"])).toBe("deny");
  });

  it("denies unknown paths under an app prefix by default", () => {
    expect(decide("/sk/tidak-ada", ["sk_admin"])).toBe("deny");
    expect(decide("/ktb/rahasia", ["super_admin"])).toBe("deny");
  });

  it("lets a multi-role person act only as the active role", () => {
    const roles: Role[] = ["parent", "sk_admin"];
    expect(decide("/sk/admin", roles)).toBe("allow");
    expect(decide("/sk/admin", roles, "parent")).toBe("deny");
    expect(decide("/sk/keluarga", roles, "sk_admin")).toBe("deny");
  });

  it("resolves the most specific rule first", () => {
    expect(findRoute("/sk/admin/wawancara/saya")?.access).toEqual(["interviewer"]);
    expect(findRoute("/sk/admin/jurnal")?.access).toEqual(["journal_reader"]);
    expect(findRoute("/sk/daftar/status")?.access).toEqual(["prospect_parent"]);
  });

  it("gives every role with a home page access to it", () => {
    const roles = new Set<Role>();
    ROUTES.forEach((r) => Array.isArray(r.access) && r.access.forEach((x) => roles.add(x as Role)));
    for (const role of roles) {
      if (role === "parent") continue;
      expect(decide(homeFor(role), [role]), `${role} -> ${homeFor(role)}`).toBe("allow");
    }
  });
});

describe("safeNext", () => {
  it("accepts same-site paths only", () => {
    expect(safeNext("/sk/guru")).toBe("/sk/guru");
    for (const bad of ["https://evil.test", "//evil.test", "/\\evil.test", "javascript:alert(1)", "", null, undefined, 42]) {
      expect(safeNext(bad)).toBeNull();
    }
  });
});

describe("normalizePhone", () => {
  it("maps local and international forms to one value", () => {
    expect(normalizePhone("0812-3456-789")).toBe("628123456789");
    expect(normalizePhone("+62 812 3456 789")).toBe("628123456789");
    expect(normalizePhone("628123456789")).toBe("628123456789");
  });
});
