import { headers } from "next/headers";

export interface AdminActor {
  userId: string;
  email: string;
  displayName: string;
}

export async function getAdminActor(): Promise<AdminActor | null> {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id")?.trim();
  const email = requestHeaders
    .get("oai-authenticated-user-email")
    ?.trim()
    .toLowerCase();
  const fullName = requestHeaders.get("oai-authenticated-user-full-name")?.trim();

  if (userId && email) {
    return { userId, email, displayName: fullName || email };
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      userId: "local-admin",
      email: "local@demo.invalid",
      displayName: "Administración local",
    };
  }

  return null;
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}
