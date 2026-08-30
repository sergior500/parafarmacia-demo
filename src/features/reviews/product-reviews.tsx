"use client";

import { BadgeCheck, LoaderCircle, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  ProductReview,
  ProductReviewSummary,
} from "@/domain/review/review";
import type { ProductReviewViewerStatus } from "@/server/review-viewer";

export function ProductReviews({
  productId,
  productSlug,
  reviews,
  summary,
  viewerStatus,
}: {
  productId: string;
  productSlug: string;
  reviews: ProductReview[];
  summary: ProductReviewSummary;
  viewerStatus: ProductReviewViewerStatus;
}) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId, rating, title, body }),
      });
      const responseBody = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
      } | null;
      if (!response.ok) {
        throw new Error(responseBody?.error || "No se pudo enviar la opinión.");
      }
      setMessage(responseBody?.message || "Opinión recibida para moderación.");
      setTitle("");
      setBody("");
      setRating(5);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo enviar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="border-forest/10 border-t py-14" id="opiniones">
      <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr]">
        <div>
          <p className="eyebrow">Opiniones verificadas</p>
          <h2 className="display-title text-forest mt-3 text-4xl">
            Experiencias de compra reales.
          </h2>
          {summary.totalReviews ? (
            <div className="mt-6 flex items-center gap-3">
              <strong className="text-forest text-4xl">
                {summary.averageRating.toLocaleString("es-ES")}
              </strong>
              <span>
                <Stars rating={Math.round(summary.averageRating)} />
                <span className="text-ink-muted mt-1 block text-xs">
                  {summary.totalReviews}{" "}
                  {summary.totalReviews === 1 ? "opinión" : "opiniones"}
                </span>
              </span>
            </div>
          ) : (
            <p className="text-ink-muted mt-5 text-sm leading-6">
              Aún no hay opiniones publicadas. Solo aceptamos valoraciones de
              compras verificadas y las revisamos antes de mostrarlas.
            </p>
          )}
          <ReviewAction
            body={body}
            error={error}
            message={message}
            productSlug={productSlug}
            rating={rating}
            saving={saving}
            setBody={setBody}
            setRating={setRating}
            setTitle={setTitle}
            submit={submit}
            title={title}
            viewerStatus={viewerStatus}
          />
        </div>

        <div className="grid content-start gap-3">
          {reviews.length ? (
            reviews.map((review) => (
              <Card className="p-6" key={review.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Stars rating={review.rating} />
                  <span className="text-ink-muted text-xs">
                    {new Intl.DateTimeFormat("es-ES", {
                      dateStyle: "medium",
                    }).format(new Date(review.createdAt))}
                  </span>
                </div>
                <h3 className="text-forest mt-4 font-black">{review.title}</h3>
                <p className="text-ink-muted mt-2 text-sm leading-6">
                  {review.body}
                </p>
                {review.verifiedPurchase ? (
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-black text-emerald-700">
                    <BadgeCheck className="size-4" /> Compra verificada
                  </span>
                ) : null}
              </Card>
            ))
          ) : (
            <Card className="border-dashed p-8 text-center">
              <Star className="text-coral mx-auto size-7" />
              <strong className="text-forest mt-4 block">
                Sé la primera persona en opinar
              </strong>
              <p className="text-ink-muted mt-2 text-sm">
                La opción se habilita automáticamente después de una compra
                pagada con tu cuenta.
              </p>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}

function ReviewAction({
  viewerStatus,
  productSlug,
  rating,
  title,
  body,
  saving,
  message,
  error,
  setRating,
  setTitle,
  setBody,
  submit,
}: {
  viewerStatus: ProductReviewViewerStatus;
  productSlug: string;
  rating: number;
  title: string;
  body: string;
  saving: boolean;
  message: string;
  error: string;
  setRating: (rating: number) => void;
  setTitle: (title: string) => void;
  setBody: (body: string) => void;
  submit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  if (message) {
    return (
      <p
        className="mt-7 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800"
        role="status"
      >
        {message}
      </p>
    );
  }
  if (viewerStatus === "guest") {
    const returnTo = `/productos/${productSlug}#opiniones`;
    return (
      <Button asChild className="mt-7" variant="outline">
        <Link
          href={`/api/customer/auth/login?return_to=${encodeURIComponent(returnTo)}`}
        >
          Entrar para valorar una compra
        </Link>
      </Button>
    );
  }
  if (viewerStatus === "already_submitted") {
    return (
      <p className="bg-sage/60 text-forest mt-7 rounded-2xl p-4 text-sm font-bold">
        Ya has enviado una opinión para este producto.
      </p>
    );
  }
  if (viewerStatus === "not_purchased") {
    return (
      <p className="bg-sage/60 text-forest mt-7 rounded-2xl p-4 text-sm font-bold">
        Podrás valorar este producto después de comprarlo con tu cuenta.
      </p>
    );
  }
  if (viewerStatus === "unavailable") {
    return (
      <p className="text-ink-muted mt-7 text-sm">
        No podemos comprobar tus compras en este momento. Inténtalo más tarde.
      </p>
    );
  }
  return (
    <form className="mt-7 grid gap-4" onSubmit={(event) => void submit(event)}>
      <fieldset>
        <legend className="field-label">Puntuación</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              aria-label={`${value} ${value === 1 ? "estrella" : "estrellas"}`}
              aria-pressed={rating === value}
              className="grid size-10 place-items-center"
              key={value}
              onClick={() => setRating(value)}
              type="button"
            >
              <Star
                className={
                  value <= rating
                    ? "fill-ochre text-ochre size-5"
                    : "text-forest/25 size-5"
                }
              />
            </button>
          ))}
        </div>
      </fieldset>
      <label>
        <span className="field-label">Título</span>
        <Input
          maxLength={90}
          minLength={3}
          onChange={(event) => setTitle(event.target.value)}
          required
          value={title}
        />
      </label>
      <label>
        <span className="field-label">Tu experiencia</span>
        <Textarea
          maxLength={1200}
          minLength={20}
          onChange={(event) => setBody(event.target.value)}
          required
          rows={5}
          value={body}
        />
      </label>
      {error ? (
        <p className="text-sm font-bold text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <Button disabled={saving} type="submit">
        {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {saving ? "Enviando…" : "Enviar para moderación"}
      </Button>
      <p className="text-ink-muted text-xs">
        Publicaremos únicamente contenido relevante y respetuoso. No se muestra
        tu nombre ni ningún dato de tu cuenta.
      </p>
    </form>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} de 5 estrellas`} className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          aria-hidden="true"
          className={
            value <= rating
              ? "fill-ochre text-ochre size-4"
              : "text-forest/20 size-4"
          }
          key={value}
        />
      ))}
    </span>
  );
}
