"use client";

let csrfTokenPromise: Promise<string> | null = null;

async function csrfToken(forceRefresh = false): Promise<string> {
  if (forceRefresh) csrfTokenPromise = null;
  csrfTokenPromise ??= fetch("/api/admin/security/csrf", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
  }).then(async (response) => {
    const body = (await response.json().catch(() => null)) as {
      token?: string;
      error?: string;
    } | null;
    if (!response.ok || !body?.token) {
      csrfTokenPromise = null;
      throw new Error(
        body?.error || "No se pudo preparar la operación segura.",
      );
    }
    return body.token;
  });
  return csrfTokenPromise;
}

export async function secureAdminFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return fetch(input, { ...init, credentials: "same-origin" });
  }

  const execute = async (forceRefresh = false) => {
    const headers = new Headers(init.headers);
    headers.set("x-picual-csrf-token", await csrfToken(forceRefresh));
    headers.set("x-picual-operation-id", crypto.randomUUID());
    return fetch(input, {
      ...init,
      headers,
      credentials: "same-origin",
      cache: "no-store",
    });
  };

  const response = await execute();
  return response.status === 419 ? execute(true) : response;
}
