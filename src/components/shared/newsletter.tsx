"use client";

import { ArrowRight, Mail } from "lucide-react";
import { useState } from "react";

export function Newsletter() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <section className="bg-petrol relative overflow-hidden rounded-[2.25rem] px-6 py-10 text-white md:px-10 md:py-12">
      <span className="absolute -right-20 -bottom-28 size-72 rounded-full border-[3rem] border-white/5" />
      <div className="relative grid gap-7 lg:grid-cols-[1fr_.9fr] lg:items-end">
        <div>
          <span className="grid size-11 place-items-center rounded-2xl bg-white/10">
            <Mail aria-hidden="true" className="size-5" />
          </span>
          <h2 className="display-title mt-5 max-w-xl text-4xl">
            Una guía útil al mes. Sin ruido.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70">
            Rutinas sencillas, comparativas honestas y avisos de temporada. Este
            formulario es visual y no envía datos.
          </p>
        </div>
        <form
          className="flex rounded-full border border-white/15 bg-white/10 p-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          <label className="sr-only" htmlFor="newsletter-email">
            Correo electrónico
          </label>
          <input
            id="newsletter-email"
            className="min-w-0 flex-1 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/50"
            placeholder="tu@email.com"
            required
            type="email"
          />
          <button
            className="bg-coral hover:bg-coral/90 grid size-11 place-items-center rounded-full"
            type="submit"
            aria-label="Apuntarme a la selección mensual"
          >
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
        </form>
        {submitted ? (
          <p
            className="text-peach text-xs font-bold lg:col-start-2"
            role="status"
          >
            Preferencia guardada solo para esta demostración; no se ha enviado
            tu correo.
          </p>
        ) : null}
      </div>
    </section>
  );
}
