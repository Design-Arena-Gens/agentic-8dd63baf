"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { defaultAssumptions, defaultPeriods } from "@/lib/sample-data";
import type { AnalysisPayload, FinancialPeriod, ScenarioAssumptions } from "@/lib/analysis";
import { ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const numberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1
});

type AnalyzerState = {
  data: FinancialPeriod[];
  assumptions: ScenarioAssumptions;
};

const initialState: AnalyzerState = {
  data: defaultPeriods,
  assumptions: defaultAssumptions
};

const emptyPeriod = (): FinancialPeriod => ({
  label: "",
  revenue: 0,
  cogs: 0,
  operatingExpenses: 0,
  netIncome: 0,
  assets: 0,
  liabilities: 0,
  cash: 0,
  freeCashFlow: 0
});

async function fetchAnalysis(state: AnalyzerState): Promise<AnalysisPayload> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ periods: state.data, assumptions: state.assumptions })
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Unable to analyze dataset.");
  }

  const payload = await response.json();
  return payload.data as AnalysisPayload;
}

const insightVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
};

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-4 py-2 text-sm text-slate-300 shadow-sm ring-1 ring-white/5">
      <span className="text-xs uppercase tracking-wide text-brand-300/80">{label}</span>
      <span className="font-semibold text-slate-100">{value}</span>
    </span>
  );
}

export default function FinancialAnalyzer() {
  const [state, setState] = useState<AnalyzerState>(initialState);
  const [result, setResult] = useState<AnalysisPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = (nextState: AnalyzerState) => {
    startTransition(async () => {
      try {
        setError(null);
        const analysis = await fetchAnalysis(nextState);
        setResult(analysis);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to run analysis.");
      }
    });
  };

  useEffect(() => {
    refresh(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updatePeriod = (index: number, key: keyof FinancialPeriod, value: string) => {
    setState((prev) => {
      const updated = [...prev.data];
      const parsed = Number(value.replace(/[^\d.-]/g, ""));
      updated[index] = { ...updated[index], [key]: Number.isFinite(parsed) ? parsed : 0 } as FinancialPeriod;
      const nextState = { ...prev, data: updated };
      refresh(nextState);
      return nextState;
    });
  };

  const updateLabel = (index: number, value: string) => {
    setState((prev) => {
      const updated = [...prev.data];
      updated[index] = { ...updated[index], label: value };
      const nextState = { ...prev, data: updated };
      refresh(nextState);
      return nextState;
    });
  };

  const updateAssumption = (key: keyof ScenarioAssumptions, value: number) => {
    setState((prev) => {
      const nextState = {
        data: prev.data,
        assumptions: { ...prev.assumptions, [key]: value }
      } satisfies AnalyzerState;
      refresh(nextState);
      return nextState;
    });
  };

  const addPeriod = () => {
    setState((prev) => {
      const nextState = {
        data: [...prev.data, emptyPeriod()],
        assumptions: prev.assumptions
      } satisfies AnalyzerState;
      refresh(nextState);
      return nextState;
    });
  };

  const revenueSeries = useMemo(
    () =>
      state.data.map((period) => ({
        label: period.label || "Period",
        revenue: period.revenue,
        netIncome: period.netIncome,
        freeCashFlow: period.freeCashFlow
      })),
    [state.data]
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-24 pt-10">
      <section className="grid gap-8 lg:grid-cols-[2fr,1.2fr]">
        <div className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/40 p-8 shadow-2xl shadow-brand-900/30 backdrop-blur-xl">
          <header className="space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-brand-200 ring-1 ring-inset ring-brand-400/30">
              Autonomous Copilot
            </p>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">
              Aurora Analyst transforms your raw financials into strategic intelligence.
            </h1>
            <p className="max-w-2xl text-base text-slate-300">
              Upload trailing performance, tune forward-looking assumptions, and receive AI-authored insights on
              growth velocity, margin health, cash posture, and board-ready recommendations in seconds.
            </p>
          </header>
          <div className="flex flex-wrap gap-3">
            <MetricChip label="Overall Score" value={result ? `${result.healthScores.overall.toFixed(0)}` : "--"} />
            <MetricChip
              label="Revenue CAGR"
              value={result ? percentFormatter.format(result.metrics.cagr) : "--"}
            />
            <MetricChip
              label="Net Margin"
              value={result ? percentFormatter.format(result.metrics.netMargin) : "--"}
            />
            <MetricChip
              label="Burn Multiple"
              value={result ? result.metrics.burnMultiple.toFixed(1) : "--"}
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-brand-900/20"
        >
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Scenario Builder</h2>
              <p className="text-sm text-slate-400">
                Adjust operating assumptions to model a 3-year trajectory. Aurora recalibrates forecasts instantly.
              </p>
            </div>

            <div className="space-y-4">
              {(
                [
                  { key: "revenueGrowth", label: "Revenue Growth Delta" },
                  { key: "marginShift", label: "Net Margin Shift" },
                  { key: "efficiencyGain", label: "Operating Efficiency" },
                  { key: "cashConversion", label: "Cash Conversion" }
                ] as const
              ).map(({ key, label }) => (
                <label key={key} className="block space-y-2">
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                    <span>{label}</span>
                    <span>{state.assumptions[key].toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min={key === "marginShift" ? -10 : -20}
                    max={key === "revenueGrowth" ? 20 : 15}
                    step={0.5}
                    value={state.assumptions[key]}
                    onChange={(event) => updateAssumption(key, Number(event.target.value))}
                    className="h-1 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-brand-400"
                  />
                </label>
              ))}
            </div>

            <button
              onClick={() => refresh(state)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-400 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-900/30 transition hover:from-brand-400 hover:to-brand-300"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
              Re-run Analysis
            </button>
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          </div>

          {result ? (
            <div className="rounded-2xl border border-white/5 bg-slate-950/80 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Forward Outlook</h3>
              <div className="mt-3 h-40">
                <ResponsiveContainer>
                  <AreaChart data={result.scenario}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `$${numberFormatter.format(value)}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderRadius: 12,
                        border: "1px solid rgba(148, 163, 184, 0.25)",
                        color: "#e2e8f0"
                      }}
                      formatter={(value: number) => [`$${numberFormatter.format(value)}`, ""]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#38bdf8" fill="url(#revenueGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-xs text-slate-300">
                {result.scenario.map((period) => (
                  <div key={period.year} className="space-y-1 rounded-xl border border-white/5 bg-white/5 p-3">
                    <dt className="font-semibold text-brand-200">{period.year}</dt>
                    <dd>Rev {numberFormatter.format(period.revenue)}</dd>
                    <dd>NI {numberFormatter.format(period.netIncome)}</dd>
                    <dd>FCF {numberFormatter.format(period.freeCashFlow)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </motion.div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-lg shadow-brand-900/20">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Financial Periods</h2>
              <p className="text-sm text-slate-400">Edit trailing actuals or paste exported statements.</p>
            </div>
            <button
              onClick={addPeriod}
              className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 px-3 py-1.5 text-xs font-semibold text-brand-200 transition hover:border-brand-300 hover:text-brand-100"
            >
              <PlusIcon className="h-4 w-4" /> Add Period
            </button>
          </header>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full table-fixed text-sm text-slate-200">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                  {["Label", "Revenue", "COGS", "OpEx", "Net Income", "Assets", "Liabilities", "Cash", "Free Cash Flow"].map((column) => (
                    <th key={column} className="px-3 pb-3 text-left">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {state.data.map((period, index) => (
                  <tr key={`${period.label}-${index}`} className="transition hover:bg-white/5">
                    <td className="px-3 py-2">
                      <input
                        value={period.label}
                        onChange={(event) => updateLabel(index, event.target.value)}
                        placeholder="FY2024"
                        className="w-28 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-300"
                      />
                    </td>
                    {(
                      [
                        "revenue",
                        "cogs",
                        "operatingExpenses",
                        "netIncome",
                        "assets",
                        "liabilities",
                        "cash",
                        "freeCashFlow"
                      ] as (keyof FinancialPeriod)[]
                    ).map((key) => (
                      <td key={key} className="px-3 py-2">
                        <input
                          inputMode="decimal"
                          value={period[key].toString()}
                          onChange={(event) => updatePeriod(index, key, event.target.value)}
                          className="w-32 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-300"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-brand-900/30">
            <h2 className="text-lg font-semibold text-white">Momentum Lens</h2>
            <p className="text-sm text-slate-400">Visualize revenue, profitability, and free cash flow trajectories.</p>
            <div className="mt-6 h-52">
              <ResponsiveContainer>
                <AreaChart data={revenueSeries}>
                  <defs>
                    <linearGradient id="netIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="freeCashGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#facc15" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `$${numberFormatter.format(value)}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderRadius: 12,
                      border: "1px solid rgba(148, 163, 184, 0.25)",
                      color: "#e2e8f0"
                    }}
                    formatter={(value: number, key: string) => [
                      `$${numberFormatter.format(value)}`,
                      key === "netIncome" ? "Net Income" : key === "freeCashFlow" ? "Free Cash Flow" : "Revenue"
                    ]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#60a5fa" fill="#1d4ed8" fillOpacity={0.25} />
                  <Area type="monotone" dataKey="netIncome" stroke="#34d399" fill="url(#netIncomeGradient)" />
                  <Area type="monotone" dataKey="freeCashFlow" stroke="#facc15" fill="url(#freeCashGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {result ? (
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl shadow-brand-900/20">
              <h2 className="text-lg font-semibold text-white">Signal Detection</h2>
              <p className="text-sm text-slate-400">
                Aurora aggregates heuristics across liquidity, leverage, and efficiency to surface watchouts.
              </p>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                {result.riskSignals.length ? (
                  result.riskSignals.map((signal, index) => (
                    <motion.li
                      key={signal}
                      variants={insightVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.05 }}
                      className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-rose-200"
                    >
                      {signal}
                    </motion.li>
                  ))
                ) : (
                  <li className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-200">
                    No acute risks detected. Maintain continuous monitoring cadence.
                  </li>
                )}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      {result ? (
        <section className="space-y-8 rounded-3xl border border-white/10 bg-slate-900/40 p-8 shadow-2xl shadow-brand-900/30">
          <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={insightVariants}
              className="rounded-3xl border border-brand-400/20 bg-brand-500/5 p-6"
            >
              <h2 className="text-lg font-semibold text-brand-100">Strategic Narrative</h2>
              <p className="mt-3 text-sm leading-relaxed text-brand-50/90">{result.narrative}</p>
            </motion.div>

            <div className="grid gap-4">
              {Object.entries(result.healthScores).map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span className="uppercase tracking-wide text-slate-400">{key}</span>
                    <span className="text-2xl font-semibold text-white">{value.toFixed(0)}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-300"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {result.recommendations.map((section, index) => (
              <motion.div
                key={section.title}
                variants={insightVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.08 }}
                className="flex flex-col gap-3 rounded-3xl border border-white/5 bg-white/5 p-5"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                  <p className="text-sm text-slate-300">{section.highlight}</p>
                </div>
                <ul className="space-y-2 text-sm text-slate-200">
                  {section.bullets.map((item) => (
                    <li key={item} className="rounded-xl bg-slate-950/75 px-3 py-2">
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
