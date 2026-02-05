import { NextResponse } from "next/server";
import { runAnalysis, type FinancialPeriod, type ScenarioAssumptions } from "@/lib/analysis";

const sanitizeNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const normalizePeriods = (raw: unknown): FinancialPeriod[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (typeof row !== "object" || row === null) return null;
      const { label } = row as Partial<FinancialPeriod>;
      return {
        label: typeof label === "string" && label.trim().length ? label : "Period",
        revenue: sanitizeNumber((row as Record<string, unknown>).revenue),
        cogs: sanitizeNumber((row as Record<string, unknown>).cogs),
        operatingExpenses: sanitizeNumber((row as Record<string, unknown>).operatingExpenses),
        netIncome: sanitizeNumber((row as Record<string, unknown>).netIncome),
        assets: sanitizeNumber((row as Record<string, unknown>).assets),
        liabilities: sanitizeNumber((row as Record<string, unknown>).liabilities),
        cash: sanitizeNumber((row as Record<string, unknown>).cash),
        freeCashFlow: sanitizeNumber((row as Record<string, unknown>).freeCashFlow)
      } satisfies FinancialPeriod;
    })
    .filter(Boolean) as FinancialPeriod[];
};

const normalizeAssumptions = (raw: unknown): ScenarioAssumptions => {
  if (!raw || typeof raw !== "object") {
    return {
      revenueGrowth: 0,
      marginShift: 0,
      efficiencyGain: 0,
      cashConversion: 0
    } satisfies ScenarioAssumptions;
  }

  const source = raw as Record<string, unknown>;

  return {
    revenueGrowth: sanitizeNumber(source.revenueGrowth),
    marginShift: sanitizeNumber(source.marginShift),
    efficiencyGain: sanitizeNumber(source.efficiencyGain),
    cashConversion: sanitizeNumber(source.cashConversion)
  } satisfies ScenarioAssumptions;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const periods = normalizePeriods(body.periods);
    const assumptions = normalizeAssumptions(body.assumptions);

    if (!periods.length) {
      return NextResponse.json({ error: "No financial periods supplied." }, { status: 400 });
    }

    const analysis = runAnalysis(periods, assumptions);

    return NextResponse.json({ data: analysis });
  } catch (error) {
    console.error("Analysis error", error);
    return NextResponse.json({ error: "Unable to evaluate financials." }, { status: 500 });
  }
}
