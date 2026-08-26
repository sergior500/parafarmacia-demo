import type { Metadata } from "next";
import Link from "next/link";

import imageReviewData from "@/data/image-review.json";
import { requireAdminCapability } from "@/server/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Revisión de imágenes · Panel interno",
};

interface ReviewImage {
  file: string;
  slug: string;
  variant: string;
  role: string;
  confidence: "Confirmado" | "Probable";
  notes?: string;
  imagePath: string;
  productPath: string;
}

const images = imageReviewData as ReviewImage[];
const highConfidence = images.filter(
  ({ confidence }) => confidence === "Confirmado",
);
const needsReview = images.filter(({ confidence }) => confidence === "Probable");

export default async function ImageReviewPage() {
  await requireAdminCapability("catalog:read", "/admin/revision-imagenes");

  return (
    <>
      <header className="mb-8 max-w-4xl">
        <p className="eyebrow">Catálogo de desarrollo</p>
        <h1 className="display-title text-forest mt-2 text-5xl sm:text-6xl">
          Revisión de imágenes
        </h1>
        <p className="text-ink-muted mt-4 text-base sm:text-lg">
          Las 104 fotografías facilitadas están visibles en este entorno para
          revisarlas. Ninguna se considera validada por la farmacia hasta que
          se confirme expresamente.
        </p>
      </header>

      <section className="mb-10 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Imágenes cargadas" value={images.length} />
        <SummaryCard
          label="Coincidencia alta pendiente"
          value={highConfidence.length}
          tone="green"
        />
        <SummaryCard
          label="Revisión necesaria"
          value={needsReview.length}
          tone="amber"
        />
      </section>

      <ReviewSection
        description="Estas imágenes tienen una asignación ambigua entre variantes. Deben revisarse antes de utilizarlas en producción."
        images={needsReview}
        title="Revisión necesaria"
        tone="amber"
      />
      <ReviewSection
        description="El archivo, la etiqueta, la carpeta y el producto del PDF coinciden, pero todavía falta la validación final de la farmacia."
        images={highConfidence}
        title="Coincidencia alta pendiente de validar"
        tone="green"
      />
    </>
  );
}

function SummaryCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "green" | "amber";
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-700/20 bg-emerald-50"
      : tone === "amber"
        ? "border-amber-700/25 bg-amber-50"
        : "border-forest/15 bg-white";
  return (
    <article className={`rounded-3xl border p-5 ${toneClass}`}>
      <p className="text-ink-muted text-sm font-bold">{label}</p>
      <p className="text-forest mt-2 text-4xl font-black">{value}</p>
    </article>
  );
}

function ReviewSection({
  title,
  description,
  images: sectionImages,
  tone,
}: {
  title: string;
  description: string;
  images: ReviewImage[];
  tone: "green" | "amber";
}) {
  const isAmber = tone === "amber";
  return (
    <section className="mb-14" id={isAmber ? "revisar" : "alta-confianza"}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-3xl">
          <h2 className="font-display text-forest text-3xl sm:text-4xl">
            {title}
          </h2>
          <p className="text-ink-muted mt-2">{description}</p>
        </div>
        <span
          className={`rounded-full px-4 py-2 text-sm font-black ${
            isAmber
              ? "bg-amber-200 text-amber-950"
              : "bg-emerald-100 text-emerald-900"
          }`}
        >
          {sectionImages.length} imágenes
        </span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sectionImages.map((image) => (
          <article
            className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${
              isAmber ? "border-amber-400/70" : "border-forest/10"
            }`}
            key={image.file}
          >
            <a
              aria-label={`Abrir imagen ${image.file}`}
              className="bg-white"
              href={image.imagePath}
              rel="noreferrer"
              target="_blank"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- The review needs the exact unprocessed source file. */}
              <img
                alt={`${image.variant} · ${image.slug}`}
                className="aspect-[3/4] w-full object-contain p-3"
                loading="lazy"
                src={image.imagePath}
              />
            </a>
            <div className="border-forest/10 border-t p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-wide ${
                    isAmber
                      ? "bg-amber-200 text-amber-950"
                      : "bg-emerald-100 text-emerald-900"
                  }`}
                >
                  {isAmber ? "Revisar" : "Coincidencia alta"}
                </span>
                <span className="text-ink-muted text-xs font-bold">
                  {image.role}
                </span>
              </div>
              <h3 className="text-forest mt-3 font-black">
                {image.slug.replaceAll("-", " ")}
              </h3>
              <p className="text-ink-muted mt-1 text-sm">{image.variant}</p>
              <p className="text-ink-muted mt-3 break-all text-xs">
                {image.file}
              </p>
              {image.notes ? (
                <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-950">
                  {image.notes}
                </p>
              ) : null}
              <Link
                className="text-forest mt-4 inline-flex min-h-11 items-center font-black underline decoration-2 underline-offset-4"
                href={image.productPath}
              >
                Ver ficha del producto
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
