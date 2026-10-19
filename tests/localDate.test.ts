import { describe, expect, it } from "bun:test";
import { parseLocalDate } from "../src/utils/localDate";

describe("datas de extrato", () => {
  it("dia 01 continua dia 01 (não vira 31 do mês anterior)", () => {
    const d = parseLocalDate("2026-10-01");
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate()]).toEqual([2026, 10, 1]);
  });
  it("dia 13 continua dia 13", () => {
    expect(parseLocalDate("2026-10-13").getDate()).toBe(13);
  });
});
