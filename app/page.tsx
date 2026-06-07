"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleAlert, QrCode, Search, ShieldCheck, Sparkles } from "lucide-react";

import { RepairCodeField } from "@/components/repair-code-field";
import { cn } from "@/lib/utils";

const sampleTimeline = [
  { stage: "Received", time: "10:15 AM", note: "Device checked in at the counter." },
  { stage: "Diagnosing", time: "11:20 AM", note: "Technician is confirming the fault." },
  { stage: "Waiting parts", time: "Today", note: "Parts are being prepared for replacement." },
];

function StatusPill({ text, tone }: { text: string; tone: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        tone,
      )}
    >
      {text}
    </span>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [repairCode, setRepairCode] = useState("");

  function handleTrackRepair(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = repairCode.trim();
    if (!code) return;
    router.push(`/repair-tracking?code=${encodeURIComponent(code)}`);
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-4 shadow-glow backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">ReparNova Client</p>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Repair progress portal</p>
            </div>
          </div>

          <a
            href="#track"
            className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/20"
          >
            Track a repair
            <ArrowRight className="h-4 w-4" />
          </a>
        </header>

        <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-10">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[rgba(5,13,24,0.7)] p-6 shadow-[0_24px_100px_rgba(0,0,0,0.35)] backdrop-blur sm:p-8 lg:p-10">
            <div className="absolute inset-0 bg-repair-grid bg-[length:42px_42px] opacity-20" />
            <div className="absolute left-6 top-6 h-44 w-44 rounded-full bg-sky-400/10 blur-3xl animate-floaty" />
            <div className="absolute right-4 top-16 h-36 w-36 rounded-full bg-amber-300/10 blur-3xl animate-floaty [animation-delay:1.2s]" />

            <div className="relative">
              <StatusPill text="Client facing" tone="border-sky-400/30 bg-sky-400/10 text-sky-100" />

              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Scan the receipt QR code and see exactly where the phone repair stands.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                This web app is designed for customers. It lets them scan the QR code printed on the repair receipt or type the repair code manually to follow the status, timeline, and last update.
              </p>

              <div id="track" className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-200">
                      <QrCode className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Scan QR</p>
                      <p className="text-sm text-slate-400">Opens the repair page directly</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-200">
                      <Search className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Type code</p>
                      <p className="text-sm text-slate-400">Manual lookup for any customer</p>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleTrackRepair} className="mt-8 flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <RepairCodeField
                    value={repairCode}
                    onChange={setRepairCode}
                    onScan={(code) => router.push(`/repair-tracking?code=${encodeURIComponent(code)}`)}
                    placeholder="Enter repair code"
                    label="Repair code"
                    showLabel={false}
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                >
                  Track repair
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,23,40,0.95),rgba(6,12,22,0.95))] p-6 shadow-glow">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Example repair</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">iPhone 13 Pro</h2>
                </div>
                <StatusPill text="In progress" tone="border-sky-400/30 bg-sky-500/10 text-sky-100" />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MiniStat label="Customer" value="Ahmed B." />
                <MiniStat label="Code" value="Unique per repair" mono />
                <MiniStat label="Last update" value="Today, 11:20" />
                <MiniStat label="Repair #" value="#20481" />
              </div>

              <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 text-emerald-300" />
                  <div>
                    <p className="font-semibold text-white">Timeline preview</p>
                    <p className="mt-1 text-sm text-slate-300">
                      The final website can show the repair history published by the admin side.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {sampleTimeline.map((item) => (
                    <div key={item.stage} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{item.stage}</p>
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.time}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-400/20 bg-amber-400/10 p-6 text-amber-50">
              <div className="flex items-center gap-3">
                <CircleAlert className="h-5 w-5" />
                <p className="font-semibold">Ready for connection</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-amber-50/90">
                This project is scaffolded for React + Tailwind CSS and can be connected to your online repair database/API when you’re ready.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function MiniStat({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className={cn("mt-2 text-sm font-medium text-white", mono && "font-mono tracking-[0.08em]")}>{value}</p>
    </div>
  );
}
