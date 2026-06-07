"use client";

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Clock3,
  Loader2,
  Package2,
  QrCode,
  Search,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { fetchRepairByCode, type RepairTrackingRecord } from "@/lib/repair-tracking";

type LoadState = "idle" | "loading" | "ready" | "missing" | "unconfigured" | "error";

function formatMoment(value: string): string {
  if (!value) return "Unavailable";

  const parsed = Date.parse(value.replace(" ", "T"));
  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(parsed));
}

function statusTone(status: string): string {
  const normalized = status.trim().toUpperCase();
  if (["DELIVERED", "READY", "REPAIRED"].includes(normalized)) {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-100";
  }
  if (["WAITING_PARTS", "DIAGNOSING"].includes(normalized)) {
    return "border-amber-500/40 bg-amber-500/10 text-amber-100";
  }
  if (["RECEIVED", "IN_PROGRESS"].includes(normalized)) {
    return "border-sky-500/40 bg-sky-500/10 text-sky-100";
  }
  return "border-slate-500/40 bg-slate-500/10 text-slate-100";
}

function labelize(status: string): string {
  return status
    .trim()
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

const sampleRepair: RepairTrackingRecord = {
  id: "20481",
  trackingCode: "RP-12AB34CD56EF",
  customerName: "Ahmed B.",
  deviceModel: "iPhone 13 Pro",
  currentStatus: "IN_PROGRESS",
  createdAt: "2026-06-07 10:15",
  lastUpdatedAt: "2026-06-07 11:20",
  phone: "+213 555 000 000",
  timeline: [
    { status: "RECEIVED", changedAt: "2026-06-07 10:15", note: "Device checked in at the counter." },
    { status: "DIAGNOSING", changedAt: "2026-06-07 11:20", note: "Technician is confirming the fault." },
    { status: "WAITING_PARTS", changedAt: "2026-06-07 12:05", note: "Parts are being prepared for replacement." },
  ],
};

export default function RepairTrackingPage() {
  const [code, setCode] = useState("RP-12AB34CD56EF");
  const [record, setRecord] = useState<RepairTrackingRecord | null>(null);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState("");

  async function lookup(nextCode: string) {
    const normalized = nextCode.trim().toUpperCase();
    if (!normalized) {
      setState("missing");
      setRecord(null);
      setError("Enter a repair code to continue.");
      return;
    }

    setState("loading");
    setError("");

    const result = await fetchRepairByCode(normalized);
    if (result.kind === "success") {
      setRecord(result.repair);
      setState("ready");
      return;
    }

    if (result.kind === "missing") {
      setRecord(null);
      setState("missing");
      setError(result.message);
      return;
    }

    if (result.kind === "unconfigured") {
      setRecord(sampleRepair);
      setState("unconfigured");
      setError(result.message);
      return;
    }

    setRecord(sampleRepair);
    setState("error");
    setError(result.message);
  }

  useEffect(() => {
    const url = new URL(window.location.href);
    const initialCode = url.searchParams.get("code")?.trim().toUpperCase() ?? "";
    if (initialCode) {
      setCode(initialCode);
      void lookup(initialCode);
      return;
    }

    setRecord(sampleRepair);
    setState("idle");
  }, []);

  const lastUpdated = useMemo(() => {
    return record ? formatMoment(record.lastUpdatedAt || record.createdAt) : "";
  }, [record]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void lookup(code);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.22),_transparent_35%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#020617_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_24px_120px_rgba(2,6,23,0.45)] backdrop-blur">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative p-6 sm:p-8 lg:p-10">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.10),transparent_40%,rgba(16,185,129,0.08))]" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-100">
                  <QrCode className="h-3.5 w-3.5" />
                  Public repair tracking
                </div>

                <h1 className="mt-5 max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Scan the QR code or enter the repair code to follow the phone&apos;s progress.
                </h1>
                <p className="mt-2 max-w-2xl text-xs uppercase tracking-[0.2em] text-slate-400">
                  The QR opens this page and the repair code below can be typed manually.
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  This page reads live repair data from Firebase Firestore when your Firebase config is set. If it is not configured yet, the page shows a sample repair preview so you can see the layout.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1">
                    <label htmlFor="repair-code" className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Repair code
                    </label>
                    <input
                      id="repair-code"
                      value={code}
                      onChange={(event) => setCode(event.target.value.toUpperCase())}
                      placeholder="RP-12AB34CD56EF"
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="mt-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-4 text-sm font-semibold text-white transition hover:bg-sky-400"
                  >
                    <Search className="h-4 w-4" />
                    Track repair
                  </button>
                </form>

                {state === "loading" ? (
                  <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm text-sky-100">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading repair status...
                  </div>
                ) : null}

                {state === "missing" || state === "unconfigured" || state === "error" ? (
                  <div
                    className={cn(
                      "mt-6 rounded-2xl border p-4 text-sm",
                      state === "error" ? "border-rose-400/30 bg-rose-500/10 text-rose-100" : "border-amber-400/30 bg-amber-400/10 text-amber-50",
                    )}
                  >
                    {error}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-t border-white/10 bg-slate-950/60 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.95))] p-5 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-200">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Live overview</p>
                    <p className="text-lg font-semibold text-white">Repair progress</p>
                  </div>
                </div>

                {record ? (
                  <div className="mt-6 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoTile icon={<UserRound className="h-4 w-4" />} label="Customer" value={record.customerName} />
                      <InfoTile icon={<Package2 className="h-4 w-4" />} label="Device" value={record.deviceModel} />
                      <InfoTile icon={<QrCode className="h-4 w-4" />} label="Code" value={record.trackingCode} mono />
                      <InfoTile icon={<Clock3 className="h-4 w-4" />} label="Last update" value={lastUpdated} />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Current status</p>
                          <p className="mt-1 text-xl font-semibold text-white">{labelize(record.currentStatus)}</p>
                        </div>
                        <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]", statusTone(record.currentStatus))}>
                          {record.currentStatus}
                        </span>
                      </div>
                      <div className="mt-4 text-sm text-slate-300">
                        Repair #{record.id} is being tracked with code <span className="font-semibold text-white">{record.trackingCode}</span>.
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status history</p>
                        <p className="text-xs text-slate-400">{record.timeline.length} update{record.timeline.length === 1 ? "" : "s"}</p>
                      </div>

                      <div className="space-y-3">
                        {record.timeline.length > 0 ? (
                          record.timeline.map((event, index) => (
                            <div key={`${event.changedAt}-${index}`} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-200">
                                <ShieldCheck className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold text-white">{labelize(event.status)}</p>
                                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.16em] text-slate-300">
                                    {formatMoment(event.changedAt)}
                                  </span>
                                </div>
                                {event.note ? <p className="mt-1 text-sm text-slate-300">{event.note}</p> : null}
                                {event.employeeName ? <p className="mt-1 text-xs text-slate-500">Updated by {event.employeeName}</p> : null}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-sm text-slate-300">
                            No timeline updates have been published yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-[1.25rem] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm leading-6 text-slate-300">
                    Enter the repair code from the receipt to see the current repair stage, history, and the most recent update time.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoTile({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
        <span className="text-slate-400">{icon}</span>
        {label}
      </div>
      <p className={cn("mt-2 text-sm font-medium text-white", mono ? "font-mono tracking-[0.12em]" : "")}>{value}</p>
    </div>
  );
}
