import { describe, expect, it } from 'vitest'
import { auditRouteSource, hasUseServerDirective, stripComments } from './check-route-auth.mjs'

const gates = (src) => Object.fromEntries(auditRouteSource(src).handlers.map((h) => [h.name, h.gate]))

describe('auditRouteSource', () => {
  it('checks each exported handler in its own body', () => {
    const src = `
      import { requireUser } from "@/lib/auth";
      export async function GET(req: Request) { const user = await requireUser(); return Response.json(user) }
      export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
        return Response.json({ ok: true })
      }`
    expect(gates(src)).toEqual({ GET: 'requireUser()', DELETE: null })
  })

  it('reads arrow and function-expression handlers', () => {
    const src = `
      export const POST = async (req: Request): Promise<Response> => {
        const { user } = await requireVisit()
        return new Response("ok")
      }
      export const PATCH = withSomething(handler)
      export const maxDuration = 60`
    expect(gates(src)).toEqual({ POST: 'requireVisit()', PATCH: null })
  })

  it('skips a return type with braces to find the body', () => {
    const src = `export async function GET(): Promise<{ ok: boolean }> { await requireUser(); return { ok: true } }
      export function PUT(): { ok: boolean } { return { ok: true } }`
    expect(gates(src)).toEqual({ GET: 'requireUser()', PUT: null })
  })

  it('ignores a gate that appears only in a comment or a string', () => {
    const src = `
      // requireUser() is called below
      /* requireVisit() */
      export async function POST() {
        const note = "requireUser()"; // requireUser()
        return new Response(note)
      }`
    expect(gates(src)).toEqual({ POST: null })
  })

  it("doesn't let a gated helper or neighbour cover an ungated handler", () => {
    const src = `
      async function gated() { return requireUser() }
      export async function GET() { return Response.json(await load()) }
      export async function POST() { await requireUser(); return new Response() }`
    expect(gates(src)).toEqual({ GET: null, POST: 'requireUser()' })
  })

  it("keeps braces inside strings and regexes from breaking the parse", () => {
    const src = `
      const UUID = /^[0-9a-f]{8}-"[}]{4}$/i;
      export async function GET() { const s = "}"; const t = \`\${"{"}\`; await requireUser(); return new Response(s + t) }
      export async function HEAD() { return new Response() }`
    expect(gates(src)).toEqual({ GET: 'requireUser()', HEAD: null })
  })

  it("reports handlers it can't see", () => {
    expect(auditRouteSource(`export { handler as GET, other as POST }`).problems).toHaveLength(2)
    expect(auditRouteSource(`export * from "./impl"`).problems).toHaveLength(1)
    expect(auditRouteSource(`export const { GET, POST } = handlers`).problems).toHaveLength(1)
  })
})

describe('hasUseServerDirective', () => {
  it('finds a top-level directive, after other directives and comments', () => {
    expect(hasUseServerDirective(stripComments(`"use server";\nexport async function save() {}`))).toBe(true)
    expect(hasUseServerDirective(stripComments(`// actions\n'use strict'\n'use server'\n`))).toBe(true)
  })

  it('ignores an inline directive and one in a comment', () => {
    expect(hasUseServerDirective(stripComments(`import x from "y"\nasync function a() { "use server" }`))).toBe(false)
    expect(hasUseServerDirective(stripComments(`// "use server"\nexport const a = 1`))).toBe(false)
  })
})
