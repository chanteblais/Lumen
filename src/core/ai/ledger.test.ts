import { describe, expect, it } from "vitest";
import { ledgerLines } from "./ledger";

const done = (type: string, input: Record<string, unknown>, output: Record<string, unknown>) => ({ type, state: "output-available", input, output });

describe("ledgerLines", () => {
  it("says what was written, in order, skipping errors and unfinished calls", () => {
    const lines = ledgerLines([
      done("tool-create_intention", { title: "Buy headphones" }, { id: "a", title: "Buy headphones", list: "Personal" }),
      done("tool-complete_intention", { id: "b" }, { id: "b", title: "Water plants" }),
      done("tool-update_intention", { id: "c" }, { error: "not found" }),
      { type: "tool-drop_intention", state: "input-available", input: { id: "d" } },
      { type: "text", state: undefined },
    ]);
    expect(lines).toEqual(["Noted · Buy headphones · Personal", "Done · Water plants"]);
  });

  it("folds an update of a thing noted in the same reply into its Noted line", () => {
    const lines = ledgerLines([
      done("tool-create_intention", { title: "Buy headphones" }, { id: "a", title: "Buy headphones", list: "Personal" }),
      done("tool-create_intention", { title: "Call Kendra" }, { id: "b", title: "Call Kendra", list: "Personal" }),
      done("tool-update_intention", { id: "a", due_at: null }, { id: "a", title: "Buy headphones", list: "Personal", changed: ["dueAt"] }),
      done("tool-update_intention", { id: "b", due_at: null }, { id: "b", title: "Call Kendra", list: "Personal", changed: ["dueAt"] }),
    ]);
    expect(lines).toEqual(["Noted · Buy headphones · Personal", "Noted · Call Kendra · Personal"]);
  });

  it("stays quiet about an update that changed nothing", () => {
    const lines = ledgerLines([
      done("tool-update_intention", { id: "x", list: "Personal" }, { id: "x", title: "Grant report", list: "Personal", changed: [] }),
      done("tool-update_intention", { id: "y", list: "Work" }, { id: "y", title: "Budget", list: "Work", changed: ["list"] }),
    ]);
    expect(lines).toEqual(["Updated · Budget"]);
  });

  it("still reports an older update part that carries no changed field", () => {
    expect(ledgerLines([done("tool-update_intention", { id: "y" }, { id: "y", title: "Budget" })])).toEqual(["Updated · Budget"]);
  });
});
