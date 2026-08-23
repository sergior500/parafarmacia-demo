import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAdminOperation } from "@/server/admin-audit";
import {
  authorizeAdminMutation,
  authorizeAdminRead,
} from "@/server/admin-request-guard";
import { ADMIN_RATE_LIMITS } from "@/server/admin-security";
import { validateAdminUserChange } from "@/server/admin-user-policy";
import {
  type AdminUserRecord,
  countEnabledOwners,
  createAdminUser,
  getAdminUserByEmail,
  listAdminUsers,
  updateAdminUser,
} from "@/server/admin-users";
import {
  readLimitedJsonBody,
  requestBodyErrorResponse,
} from "@/server/request-security";

export const dynamic = "force-dynamic";

const adminUserSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  displayName: z.string().trim().min(2).max(100),
  role: z.enum(["owner", "catalog_manager", "operations_manager", "auditor"]),
  enabled: z.boolean(),
});

function publicUser(user: AdminUserRecord) {
  return {
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    enabled: user.enabled,
    linked: Boolean(user.userId),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function GET() {
  const authorization = await authorizeAdminRead("team:read");
  if (authorization.response) return authorization.response;
  return NextResponse.json(
    { users: (await listAdminUsers()).map(publicUser) },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}

export async function POST(request: Request) {
  const authorization = await authorizeAdminMutation(request, {
    capability: "team:write",
    rateLimit: ADMIN_RATE_LIMITS.team,
  });
  if (authorization.response) return authorization.response;
  const parsed = await parseAdminUserRequest(request);
  if (parsed.response) return parsed.response;

  try {
    const user = await createAdminUser(parsed.data, authorization.actor.userId);
    await recordAdminOperation({
      actor: authorization.actor,
      action: "admin_user.created",
      resourceType: "admin_user",
      resourceId: user.email,
      metadata: { role: user.role, enabled: user.enabled },
    });
    return NextResponse.json({ user: publicUser(user) }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Ya existe un acceso con ese correo o no se pudo crear." },
      { status: 409 },
    );
  }
}

export async function PATCH(request: Request) {
  const authorization = await authorizeAdminMutation(request, {
    capability: "team:write",
    rateLimit: ADMIN_RATE_LIMITS.team,
  });
  if (authorization.response) return authorization.response;
  const parsed = await parseAdminUserRequest(request);
  if (parsed.response) return parsed.response;
  const current = await getAdminUserByEmail(parsed.data.email);
  if (!current) {
    return NextResponse.json(
      { error: "El acceso no existe." },
      { status: 404 },
    );
  }

  const policyError = validateAdminUserChange({
    actor: authorization.actor,
    current,
    next: parsed.data,
    enabledOwners: await countEnabledOwners(),
  });
  if (policyError) {
    return NextResponse.json({ error: policyError }, { status: 409 });
  }

  const user = await updateAdminUser(parsed.data, authorization.actor.userId);
  if (!user) {
    return NextResponse.json(
      { error: "El acceso no existe." },
      { status: 404 },
    );
  }
  await recordAdminOperation({
    actor: authorization.actor,
    action: "admin_user.updated",
    resourceType: "admin_user",
    resourceId: user.email,
    metadata: {
      previousRole: current.role,
      role: user.role,
      previousEnabled: current.enabled,
      enabled: user.enabled,
    },
  });
  return NextResponse.json({ user: publicUser(user) });
}

async function parseAdminUserRequest(
  request: Request,
): Promise<
  | { data: z.infer<typeof adminUserSchema>; response?: never }
  | { data?: never; response: Response }
> {
  let body: unknown;
  try {
    body = await readLimitedJsonBody(request, 8 * 1024);
  } catch (error) {
    return {
      response:
        requestBodyErrorResponse(error) ??
        NextResponse.json(
          { error: "No se pudo leer la petición." },
          { status: 400 },
        ),
    };
  }
  const parsed = adminUserSchema.safeParse(body);
  return parsed.success
    ? { data: parsed.data }
    : {
        response: NextResponse.json(
          { error: "Revisa el correo, el nombre y el rol." },
          { status: 400 },
        ),
      };
}
