"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const KEY = "parafarmacia-demo-cookie-choice";

export function CookiePreferences() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(
      () => setVisible(!localStorage.getItem(KEY)),
      0,
    );
    return () => window.clearTimeout(timer);
  }, []);
  if (!visible) return null;
  function choose(value: string) {
    localStorage.setItem(KEY, value);
    setVisible(false);
  }
  return (
    <aside
      className="border-forest/10 fixed right-3 bottom-3 left-3 z-[70] rounded-[1.5rem] border bg-white p-5 shadow-2xl sm:right-5 sm:left-auto sm:max-w-md"
      aria-label="Preferencias de cookies"
    >
      <strong className="text-forest block">
        Tu privacidad, explicada sin rodeos
      </strong>
      <p className="text-ink-muted mt-2 text-xs leading-relaxed">
        La demo no instala analítica. Este control muestra cómo se solicitarían
        preferencias antes de activar servicios opcionales.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => choose("essential")}>
          Solo esenciales
        </Button>
        <Button size="sm" variant="outline" onClick={() => choose("all")}>
          Aceptar demo
        </Button>
      </div>
    </aside>
  );
}
