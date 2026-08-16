"use client";

import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  LoaderCircle,
  PackageCheck,
  ShieldAlert,
  ShoppingBag,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import type {
  ProductionReadinessReport,
  ReadinessCheck,
  ReadinessSection,
  ReadinessStatus,
} from "@/server/production-readiness";

const sectionIcons = {
  catalog: PackageCheck,
  shopify: ShoppingBag,
  business: ClipboardCheck,
};

const statusLabels: Record<ReadinessStatus, string> = {
  ready: "Listo",
  blocked: "Bloqueo",
  pending: "Por confirmar",
};

const statusClasses: Record<ReadinessStatus, string> = {
  ready: "bg-emerald-100 text-emerald-800",
  blocked: "bg-red-100 text-red-800",
  pending: "bg-amber-100 text-amber-800",
};

function summarize(
  report: ProductionReadinessReport,
  sections: ReadinessSection[],
): ProductionReadinessReport {
  const checks = sections.flatMap((section) => section.checks);
  const readyChecks = checks.filter((check) => check.status === "ready").length;
  const blockers = checks.filter((check) => check.status === "blocked").length;
  const pendingDecisions = checks.filter(
    (check) => check.status === "pending",
  ).length;
  return {
    ...report,
    sections,
    readyChecks,
    totalChecks: checks.length,
    blockers,
    pendingDecisions,
    score: checks.length ? Math.round((readyChecks / checks.length) * 100) : 0,
    canOpenStore: readyChecks === checks.length,
  };
}

function StatusIcon({ status }: { status: ReadinessStatus }) {
  if (status === "ready") {
    return (
      <CheckCircle2 aria-hidden="true" className="size-5 text-emerald-700" />
    );
  }
  if (status === "blocked") {
    return <TriangleAlert aria-hidden="true" className="size-5 text-red-700" />;
  }
  return <CircleDashed aria-hidden="true" className="size-5 text-amber-700" />;
}

export function ReadinessDashboard({
  initialReport,
}: {
  initialReport: ProductionReadinessReport;
}) {
  const [report, setReport] = useState(initialReport);
  const [savingId, setSavingId] = useState<string>();
  const [error, setError] = useState("");
  const blockers = useMemo(
    () =>
      report.sections
        .flatMap((section) => section.checks)
        .filter((check) => check.status !== "ready")
        .slice(0, 4),
    [report],
  );

  async function toggleManualCheck(check: ReadinessCheck) {
    const ready = check.status !== "ready";
    setSavingId(check.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/readiness/${check.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ready }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(body?.error || "No se pudo guardar el estado.");
      }
      setReport((current) =>
        summarize(
          current,
          current.sections.map((section) => ({
            ...section,
            checks: section.checks.map((item) =>
              item.id === check.id
                ? {
                    ...item,
                    status: ready ? "ready" : "pending",
                    detail: ready
                      ? "Validación confirmada por administración."
                      : "La validación se ha vuelto a abrir.",
                  }
                : item,
            ),
          })),
        ),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo guardar el estado.",
      );
    } finally {
      setSavingId(undefined);
    }
  }

  return (
    <>
      <Card className="from-forest to-forest/90 relative overflow-hidden bg-gradient-to-br p-6 text-white md:p-9">
        <div className="bg-coral/25 absolute -top-20 -right-14 size-72 rounded-full blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[auto_1fr_1fr] lg:items-center">
          <div
            aria-label={`${report.score} por ciento preparado`}
            className="grid size-36 place-items-center rounded-full p-3"
            style={{
              background: `conic-gradient(#f6a47d ${report.score}%, rgba(255,255,255,.14) 0)`,
            }}
          >
            <div className="bg-forest grid size-full place-items-center rounded-full text-center">
              <span>
                <strong className="block text-4xl font-black tracking-[-0.06em]">
                  {report.score}%
                </strong>
                <small className="text-xs font-bold text-white/70">
                  preparado
                </small>
              </span>
            </div>
          </div>

          <div>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${report.canOpenStore ? "bg-emerald-300 text-emerald-950" : "bg-coral-light text-coral"}`}
            >
              {report.canOpenStore ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <ShieldAlert className="size-4" />
              )}
              {report.canOpenStore
                ? "Apertura permitida"
                : "Apertura bloqueada"}
            </span>
            <h2 className="font-display mt-4 text-4xl leading-none md:text-5xl">
              {report.canOpenStore
                ? "La tienda está lista para abrir."
                : "Sabemos exactamente qué falta."}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/75">
              {report.readyChecks} de {report.totalChecks} comprobaciones
              superadas. La apertura solo cambia a verde cuando no queda ningún
              bloqueo ni decisión pendiente.
            </p>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/8 p-5 backdrop-blur-sm">
            <p className="text-xs font-black tracking-[0.16em] text-white/60 uppercase">
              Prioridad inmediata
            </p>
            <ul className="mt-4 grid gap-3">
              {blockers.map((check) => (
                <li className="flex items-start gap-3 text-sm" key={check.id}>
                  <StatusIcon status={check.status} />
                  <span>
                    <strong className="block">{check.title}</strong>
                    <span className="text-xs text-white/65">
                      {check.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
          {[
            ["Listas", report.readyChecks, "text-emerald-300"],
            ["Bloqueos automáticos", report.blockers, "text-red-300"],
            [
              "Decisiones pendientes",
              report.pendingDecisions,
              "text-amber-300",
            ],
          ].map(([label, value, tone]) => (
            <div
              className="rounded-2xl border border-white/15 bg-white/8 p-4"
              key={label}
            >
              <strong className={`block text-3xl ${tone}`}>{value}</strong>
              <span className="text-xs font-bold text-white/65">{label}</span>
            </div>
          ))}
        </div>
      </Card>

      {error ? (
        <p
          className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6">
        {report.sections.map((section) => {
          const SectionIcon = sectionIcons[section.id];
          const readyCount = section.checks.filter(
            (check) => check.status === "ready",
          ).length;
          return (
            <Card className="overflow-hidden" key={section.id}>
              <div className="border-forest/10 flex flex-wrap items-center justify-between gap-4 border-b p-6 md:px-8">
                <div className="flex items-center gap-4">
                  <span className="bg-sage text-forest grid size-11 shrink-0 place-items-center rounded-xl">
                    <SectionIcon className="size-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-forest text-3xl">
                      {section.title}
                    </h2>
                    <p className="text-ink-muted mt-1 max-w-2xl text-sm">
                      {section.description}
                    </p>
                  </div>
                </div>
                <span className="bg-cream text-forest rounded-full px-3 py-2 text-xs font-black">
                  {readyCount}/{section.checks.length} listas
                </span>
              </div>

              <div className="divide-forest/10 divide-y">
                {section.checks.map((check) => (
                  <div
                    className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-8"
                    key={check.id}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <StatusIcon status={check.status} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-forest font-black">
                            {check.title}
                          </h3>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-black ${statusClasses[check.status]}`}
                          >
                            {statusLabels[check.status]}
                          </span>
                          {check.metric ? (
                            <span className="text-ink-muted text-xs font-black">
                              {check.metric}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-ink-muted mt-1 text-sm leading-6">
                          {check.detail}
                        </p>
                      </div>
                    </div>

                    {check.manual ? (
                      <button
                        aria-checked={check.status === "ready"}
                        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-black transition ${check.status === "ready" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-forest hover:bg-forest/90 text-white"}`}
                        disabled={savingId === check.id}
                        onClick={() => void toggleManualCheck(check)}
                        role="switch"
                        type="button"
                      >
                        {savingId === check.id ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <Check className="size-4" />
                        )}
                        {check.status === "ready"
                          ? "Validación confirmada"
                          : "Marcar como validado"}
                      </button>
                    ) : check.actionHref && check.status !== "ready" ? (
                      <Link
                        className="text-coral inline-flex min-h-11 items-center justify-center gap-1 text-sm font-black"
                        href={check.actionHref}
                      >
                        {check.actionLabel} <ArrowUpRight className="size-4" />
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-ink-muted mt-5 text-xs">
        Última comprobación:{" "}
        {new Intl.DateTimeFormat("es-ES", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(report.generatedAt))}
        . Las confirmaciones manuales quedan registradas con la identidad del
        administrador.
      </p>
    </>
  );
}
