/**
 * Row level security on every table, and nothing for Supabase's API roles. The
 * app connects as the tables' owner, which RLS doesn't apply to; Supabase's Data
 * API serves `public` to `anon` and `authenticated`, and by default grants them
 * everything on each new table. See docs/architecture.md → Database.
 */
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { is } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "./schema";

const migrationsFolder = path.resolve(process.cwd(), "src/db/migrations");
// `.enableRLS()` returns an Omit<…> of the table type, so narrow from unknown.
const tables = (Object.values(schema) as unknown[]).filter((v): v is PgTable => is(v, PgTable));

describe("row level security", () => {
  it("is declared on every table in the schema", () => {
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.map((t) => getTableConfig(t)).filter((t) => !t.enableRLS).map((t) => t.name)).toEqual([]);
  });

  describe("after every migration, on a database set up the way Supabase sets one up", () => {
    let client: PGlite;
    beforeAll(async () => {
      client = new PGlite();
      // Before any migration: the API roles, and default privileges handing them every new table.
      await client.exec(`
        create role anon nologin;
        create role authenticated nologin;
        alter default privileges in schema public grant all on tables to anon, authenticated;
        alter default privileges in schema public grant all on sequences to anon, authenticated;
      `);
      await migrate(drizzle(client, { schema }), { migrationsFolder });
    }, 60_000);
    afterAll(() => client.close());

    it("is on for every table in public", async () => {
      const { rows } = await client.query<{ name: string; rls: boolean }>(`
        select c.relname as name, c.relrowsecurity as rls
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind in ('r', 'p')`);
      expect(rows.map((r) => r.name).sort()).toEqual(tables.map((t) => getTableConfig(t).name).sort());
      expect(rows.filter((r) => !r.rls).map((r) => r.name)).toEqual([]);
    });

    it("leaves anon and authenticated no privilege on a table or sequence, now or by default", async () => {
      const { rows: granted } = await client.query(`
        select c.relname, a.grantee::regrole::text as grantee, a.privilege_type
        from pg_class c join pg_namespace n on n.oid = c.relnamespace, aclexplode(c.relacl) a
        where n.nspname = 'public' and c.relkind in ('r', 'p', 'S')
          and a.grantee::regrole::text in ('anon', 'authenticated')`);
      expect(granted).toEqual([]);

      const { rows: defaults } = await client.query(`
        select d.defaclobjtype, a.grantee::regrole::text as grantee, a.privilege_type
        from pg_default_acl d join pg_namespace n on n.oid = d.defaclnamespace, aclexplode(d.defaclacl) a
        where n.nspname = 'public' and a.grantee::regrole::text in ('anon', 'authenticated')`);
      expect(defaults).toEqual([]);
    });
  });
});
