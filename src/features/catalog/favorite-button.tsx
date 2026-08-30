"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export const FAVORITES_STORAGE_KEY = "farmacia-picual-favorites-v1";

export function readFavoriteProductIds(): string[] {
  try {
    const value = JSON.parse(
      localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]",
    ) as unknown;
    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (item): item is string =>
                typeof item === "string" && item.length <= 100,
            ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}

export function saveFavoriteProduct(productId: string): void {
  const favorites = readFavoriteProductIds();
  if (favorites.includes(productId)) return;
  localStorage.setItem(
    FAVORITES_STORAGE_KEY,
    JSON.stringify([...favorites, productId]),
  );
}

export function FavoriteButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const [favorite, setFavorite] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFavorite(readFavoriteProductIds().includes(productId));
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [productId]);

  function toggle() {
    const favorites = readFavoriteProductIds();
    const next = favorites.includes(productId)
      ? favorites.filter((id) => id !== productId)
      : [...favorites, productId];
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
    setFavorite(next.includes(productId));
  }

  return (
    <button
      aria-label={favorite ? "Quitar de favoritos" : "Guardar en favoritos"}
      aria-pressed={favorite}
      className={cn(
        "border-forest/10 hover:bg-coral-light text-forest grid size-11 place-items-center rounded-full border bg-white transition-colors disabled:opacity-50",
        className,
      )}
      disabled={!ready}
      type="button"
      onClick={toggle}
    >
      <Heart
        aria-hidden="true"
        className={cn("size-5", favorite && "fill-coral text-coral")}
      />
    </button>
  );
}
