"use client";

import { Check, ExternalLink, LoaderCircle, Star, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { secureAdminFetch } from "@/features/admin/secure-admin-fetch";
import type { AdminProductReview } from "@/server/review-repository";

const statusLabel = {
  pending: "Pendiente",
  approved: "Publicada",
  rejected: "Rechazada",
} as const;

export function ReviewsManager({
  initialReviews,
  canModerate,
}: {
  initialReviews: AdminProductReview[];
  canModerate: boolean;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [status, setStatus] = useState<"all" | AdminProductReview["status"]>(
    "pending",
  );
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const filtered = useMemo(
    () =>
      reviews.filter((review) => status === "all" || review.status === status),
    [reviews, status],
  );

  async function moderate(
    reviewId: string,
    nextStatus: "approved" | "rejected",
  ) {
    setSavingId(reviewId);
    setError("");
    try {
      const response = await secureAdminFetch(
        `/api/admin/reviews/${reviewId}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) throw new Error(body?.error || "No se pudo moderar.");
      setReviews((current) =>
        current.map((review) =>
          review.id === reviewId ? { ...review, status: nextStatus } : review,
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "No se pudo moderar.",
      );
    } finally {
      setSavingId("");
    }
  }

  return (
    <>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filtrar reseñas"
      >
        {(["pending", "approved", "rejected", "all"] as const).map((value) => (
          <button
            aria-pressed={status === value}
            className={`rounded-full border px-4 py-2 text-sm font-black ${status === value ? "border-forest bg-forest text-white" : "border-forest/15 text-forest bg-white"}`}
            key={value}
            onClick={() => setStatus(value)}
            type="button"
          >
            {value === "all" ? "Todas" : statusLabel[value]}
          </button>
        ))}
      </div>

      {error ? (
        <p
          className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4">
        {filtered.length ? (
          filtered.map((review) => (
            <Card className="p-6" key={review.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="text-coral text-xs font-black uppercase">
                    {statusLabel[review.status]}
                  </span>
                  <h2 className="text-forest mt-1 text-lg font-black">
                    {review.productName}
                  </h2>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className="flex"
                      aria-label={`${review.rating} de 5 estrellas`}
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          aria-hidden="true"
                          className={
                            value <= review.rating
                              ? "fill-ochre text-ochre size-4"
                              : "text-forest/20 size-4"
                          }
                          key={value}
                        />
                      ))}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      Compra verificada
                    </span>
                  </div>
                </div>
                <Link
                  className="text-forest inline-flex items-center gap-1 text-xs font-black"
                  href={`/productos/${review.productSlug}#opiniones`}
                >
                  Ver ficha <ExternalLink className="size-3.5" />
                </Link>
              </div>
              <h3 className="text-forest mt-5 font-black">{review.title}</h3>
              <p className="text-ink-muted mt-2 text-sm leading-6">
                {review.body}
              </p>
              <p className="text-ink-muted mt-4 text-xs">
                Recibida el{" "}
                {new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(
                  new Date(review.createdAt),
                )}
              </p>
              {canModerate ? (
                <div className="border-forest/10 mt-5 flex flex-wrap gap-2 border-t pt-5">
                  <Button
                    disabled={
                      savingId === review.id || review.status === "approved"
                    }
                    onClick={() => void moderate(review.id, "approved")}
                    size="sm"
                  >
                    {savingId === review.id ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    Publicar
                  </Button>
                  <Button
                    disabled={
                      savingId === review.id || review.status === "rejected"
                    }
                    onClick={() => void moderate(review.id, "rejected")}
                    size="sm"
                    variant="outline"
                  >
                    <X className="size-4" /> Rechazar
                  </Button>
                </div>
              ) : null}
            </Card>
          ))
        ) : (
          <Card className="p-10 text-center">
            <Star className="text-coral mx-auto size-7" />
            <strong className="text-forest mt-4 block">
              No hay reseñas en este estado
            </strong>
            <p className="text-ink-muted mt-2 text-sm">
              Las nuevas opiniones verificadas aparecerán aquí para su revisión.
            </p>
          </Card>
        )}
      </div>
    </>
  );
}
