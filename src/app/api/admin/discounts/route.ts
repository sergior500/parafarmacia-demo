import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAdminOperation } from "@/server/admin-audit";
import { authorizeAdminMutation } from "@/server/admin-request-guard";
import { ADMIN_RATE_LIMITS } from "@/server/admin-security";
import {
  readLimitedJsonBody,
  requestBodyErrorResponse,
} from "@/server/request-security";
import {
  createShopifyBasicDiscount,
  setShopifyDiscountActive,
} from "@/server/shopify/discounts";

export const dynamic = "force-dynamic";

const operationId = z.string().uuid();

const createSchema = z
  .object({
    operationId,
    title: z.string().trim().min(3).max(80),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9][A-Z0-9_-]{2,31}$/),
    kind: z.enum(["percentage", "fixed"]),
    value: z.number().positive().max(10_000),
    endsAt: z.string().datetime({ offset: true }).optional(),
    usageLimit: z.number().int().positive().max(1_000_000).optional(),
    appliesOncePerCustomer: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.kind === "percentage" && value.value > 100) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message: "El porcentaje no puede superar el 100 %.",
      });
    }
    if (value.endsAt && Date.parse(value.endsAt) <= Date.now()) {
      context.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "La fecha final debe estar en el futuro.",
      });
    }
  });

const statusSchema = z.object({
  operationId,
  discountId: z.string().regex(/^gid:\/\/shopify\/DiscountCodeNode\/\d+$/),
  active: z.boolean(),
});

export async function POST(request: Request) {
  const authorization = await authorizeAdminMutation(request, {
    capability: "discounts:write",
    rateLimit: ADMIN_RATE_LIMITS.discounts,
  });
  if (authorization.response) return authorization.response;
  const parsed = await parseBody(request, createSchema);
  if (parsed.response) return parsed.response;
  try {
    const result = await createShopifyBasicDiscount(parsed.data);
    await recordAdminOperation({
      actor: authorization.actor,
      action: "discount.created",
      resourceType: "shopify_discount",
      resourceId: result.id,
      metadata: {
        operationId: parsed.data.operationId,
        kind: parsed.data.kind,
        value: parsed.data.value,
        usageLimit: parsed.data.usageLimit,
        hasEndDate: Boolean(parsed.data.endsAt),
      },
    });
    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    return conflictResponse(error, "No se pudo crear la promoción.");
  }
}

export async function PATCH(request: Request) {
  const authorization = await authorizeAdminMutation(request, {
    capability: "discounts:write",
    rateLimit: ADMIN_RATE_LIMITS.discounts,
  });
  if (authorization.response) return authorization.response;
  const parsed = await parseBody(request, statusSchema);
  if (parsed.response) return parsed.response;
  try {
    await setShopifyDiscountActive(parsed.data.discountId, parsed.data.active);
    await recordAdminOperation({
      actor: authorization.actor,
      action: parsed.data.active ? "discount.activated" : "discount.paused",
      resourceType: "shopify_discount",
      resourceId: parsed.data.discountId,
      metadata: { operationId: parsed.data.operationId },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return conflictResponse(error, "No se pudo cambiar la promoción.");
  }
}

async function parseBody<T>(request: Request, schema: z.ZodType<T>) {
  try {
    const parsed = schema.safeParse(
      await readLimitedJsonBody(request, 8 * 1024),
    );
    if (!parsed.success) {
      return {
        response: NextResponse.json(
          { error: "Revisa los datos de la promoción." },
          { status: 400 },
        ),
      } as const;
    }
    return { data: parsed.data } as const;
  } catch (error) {
    return {
      response:
        requestBodyErrorResponse(error) ??
        NextResponse.json(
          { error: "No se pudo leer la petición." },
          { status: 400 },
        ),
    } as const;
  }
}

function conflictResponse(error: unknown, fallback: string) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : fallback },
    { status: 409 },
  );
}
