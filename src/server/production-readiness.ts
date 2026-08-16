import { getDb } from "@db/index";
import { adminOperationLog, productionReadinessChecks } from "@db/schema";

import { pharmacyConfig } from "@/lib/config";
import type { AdminActor } from "@/server/admin-auth";
import { getCatalogHealth } from "@/server/catalog-repository";
import { testShopifyConnection } from "@/server/shopify/admin-api";
import { getPublicShopifyStatus } from "@/server/shopify/config";
import { listShopifyInventory } from "@/server/shopify/inventory";
import { listShopifyOrders } from "@/server/shopify/orders";
import { getShopifyStorefrontTokenStatus } from "@/server/shopify/storefront-token";
import { getShopifyWebhookStatus } from "@/server/shopify/webhook-subscriptions";

export const MANUAL_READINESS_CHECK_IDS = [
  "payments",
  "shipping",
  "notifications",
  "production_store",
  "final_purchase_test",
] as const;

export type ManualReadinessCheckId =
  (typeof MANUAL_READINESS_CHECK_IDS)[number];
export type ReadinessStatus = "ready" | "blocked" | "pending";
export type ReadinessSectionId = "catalog" | "shopify" | "business";

export interface ReadinessCheck {
  id: string;
  title: string;
  detail: string;
  status: ReadinessStatus;
  actionHref?: string;
  actionLabel?: string;
  metric?: string;
  manual?: boolean;
}

export interface ReadinessSection {
  id: ReadinessSectionId;
  title: string;
  description: string;
  checks: ReadinessCheck[];
}

export interface ProductionReadinessReport {
  generatedAt: string;
  score: number;
  readyChecks: number;
  totalChecks: number;
  blockers: number;
  pendingDecisions: number;
  canOpenStore: boolean;
  sections: ReadinessSection[];
}

export interface ReadinessSnapshot {
  catalog: Awaited<ReturnType<typeof getCatalogHealth>>;
  shopify: {
    configured: boolean;
    connected: boolean;
    permissionsReady: boolean;
    missingScopes: string[];
    webhooksReady: boolean;
    storefrontReady: boolean;
    ordersReachable: boolean;
    activeOnlineLocations: number;
    inventoryItems: number;
    trackedInventoryItems: number;
  };
  identity: {
    complete: boolean;
  };
  manual: Partial<Record<ManualReadinessCheckId, boolean>>;
}

function automaticCheck(input: {
  id: string;
  title: string;
  ready: boolean;
  readyDetail: string;
  blockedDetail: string;
  actionHref?: string;
  actionLabel?: string;
  metric?: string;
}): ReadinessCheck {
  return {
    id: input.id,
    title: input.title,
    detail: input.ready ? input.readyDetail : input.blockedDetail,
    status: input.ready ? "ready" : "blocked",
    actionHref: input.actionHref,
    actionLabel: input.actionLabel,
    metric: input.metric,
  };
}

function manualCheck(input: {
  id: ManualReadinessCheckId;
  title: string;
  ready: boolean;
  readyDetail: string;
  pendingDetail: string;
}): ReadinessCheck {
  return {
    id: input.id,
    title: input.title,
    detail: input.ready ? input.readyDetail : input.pendingDetail,
    status: input.ready ? "ready" : "pending",
    manual: true,
  };
}

export function buildProductionReadiness(
  snapshot: ReadinessSnapshot,
): ProductionReadinessReport {
  const { catalog, shopify, manual } = snapshot;
  const sections: ReadinessSection[] = [
    {
      id: "catalog",
      title: "Catálogo comercial",
      description:
        "Cada ficha debe tener información suficiente y una correspondencia fiable en Shopify.",
      checks: [
        automaticCheck({
          id: "catalog_price",
          title: "Precios verificados",
          ready: catalog.missingPrice === 0,
          readyDetail: "Todo el catálogo tiene precio de venta.",
          blockedDetail: `${catalog.missingPrice} productos siguen sin precio verificado.`,
          metric: `${catalog.total - catalog.missingPrice}/${catalog.total}`,
          actionHref: "/admin/productos",
          actionLabel: "Completar precios",
        }),
        automaticCheck({
          id: "catalog_stock",
          title: "Stock definido",
          ready: catalog.missingStock === 0,
          readyDetail: "Todo el catálogo tiene existencias definidas.",
          blockedDetail: `${catalog.missingStock} productos siguen sin stock confirmado.`,
          metric: `${catalog.total - catalog.missingStock}/${catalog.total}`,
          actionHref: "/admin/productos",
          actionLabel: "Completar stock",
        }),
        automaticCheck({
          id: "catalog_images",
          title: "Imágenes definitivas",
          ready: catalog.missingImage === 0,
          readyDetail: "Todas las fichas tienen una imagen definitiva.",
          blockedDetail: `${catalog.missingImage} productos siguen sin imagen definitiva.`,
          metric: `${catalog.total - catalog.missingImage}/${catalog.total}`,
          actionHref: "/admin/productos",
          actionLabel: "Revisar imágenes",
        }),
        automaticCheck({
          id: "catalog_size",
          title: "Formato confirmado",
          ready: catalog.missingSize === 0,
          readyDetail: "Todos los formatos de venta están confirmados.",
          blockedDetail: `${catalog.missingSize} productos siguen sin formato confirmado.`,
          metric: `${catalog.total - catalog.missingSize}/${catalog.total}`,
          actionHref: "/admin/productos",
          actionLabel: "Completar formatos",
        }),
        automaticCheck({
          id: "catalog_sync",
          title: "Sincronización con Shopify",
          ready: catalog.total > 0 && catalog.shopifySynced === catalog.total,
          readyDetail: "Todo el catálogo está vinculado con Shopify.",
          blockedDetail: `${catalog.total - catalog.shopifySynced} productos no están sincronizados.`,
          metric: `${catalog.shopifySynced}/${catalog.total}`,
          actionHref: "/admin/productos",
          actionLabel: "Abrir sincronización",
        }),
        automaticCheck({
          id: "catalog_errors",
          title: "Sin errores de sincronización",
          ready: catalog.shopifyErrors === 0,
          readyDetail: "Shopify no registra errores de catálogo.",
          blockedDetail: `${catalog.shopifyErrors} productos necesitan corregir su sincronización.`,
          metric: String(catalog.shopifyErrors),
          actionHref: "/admin/productos",
          actionLabel: "Corregir errores",
        }),
        automaticCheck({
          id: "catalog_published",
          title: "Productos disponibles para abrir",
          ready: catalog.published > 0,
          readyDetail: `${catalog.published} productos están aprobados para venta.`,
          blockedDetail: "Todavía no hay ningún producto aprobado para venta.",
          metric: String(catalog.published),
          actionHref: "/admin/productos",
          actionLabel: "Aprobar productos",
        }),
      ],
    },
    {
      id: "shopify",
      title: "Motor de comercio",
      description:
        "Shopify debe poder recibir catálogo, controlar inventario, crear el pago y devolver pedidos.",
      checks: [
        automaticCheck({
          id: "shopify_connection",
          title: "Conexión y permisos",
          ready:
            shopify.configured && shopify.connected && shopify.permissionsReady,
          readyDetail: "La aplicación está instalada con todos sus permisos.",
          blockedDetail: shopify.missingScopes.length
            ? `Faltan ${shopify.missingScopes.length} permisos de Shopify.`
            : "No se ha podido validar la conexión con Shopify.",
          actionHref: "/admin/configuracion",
          actionLabel: "Revisar conexión",
        }),
        automaticCheck({
          id: "shopify_checkout",
          title: "Checkout autorizado",
          ready: shopify.storefrontReady,
          readyDetail: "La web puede crear carritos reales y abrir Shopify.",
          blockedDetail: "Falta autorizar el acceso público del checkout.",
          actionHref: "/admin/configuracion",
          actionLabel: "Revisar checkout",
        }),
        automaticCheck({
          id: "shopify_webhooks",
          title: "Automatización en tiempo real",
          ready: shopify.webhooksReady,
          readyDetail: "Productos, stock y pedidos notifican sus cambios.",
          blockedDetail:
            "Los eventos automáticos de Shopify no están completos.",
          actionHref: "/admin/configuracion",
          actionLabel: "Activar eventos",
        }),
        automaticCheck({
          id: "shopify_locations",
          title: "Ubicación para pedidos online",
          ready: shopify.activeOnlineLocations > 0,
          readyDetail: `${shopify.activeOnlineLocations} ubicación disponible para pedidos online.`,
          blockedDetail:
            "No hay una ubicación activa que prepare pedidos online.",
          metric: String(shopify.activeOnlineLocations),
          actionHref: "/admin/inventario",
          actionLabel: "Revisar ubicaciones",
        }),
        automaticCheck({
          id: "shopify_inventory",
          title: "Inventario con seguimiento",
          ready:
            shopify.inventoryItems > 0 &&
            shopify.trackedInventoryItems === shopify.inventoryItems,
          readyDetail: "Todo el inventario comercial controla existencias.",
          blockedDetail: `${shopify.inventoryItems - shopify.trackedInventoryItems} variantes no controlan existencias.`,
          metric: `${shopify.trackedInventoryItems}/${shopify.inventoryItems}`,
          actionHref: "/admin/inventario",
          actionLabel: "Activar seguimiento",
        }),
        automaticCheck({
          id: "shopify_orders",
          title: "Pedidos accesibles",
          ready: shopify.ordersReachable,
          readyDetail: "El panel puede consultar y preparar pedidos.",
          blockedDetail: "El panel no ha podido consultar los pedidos.",
          actionHref: "/admin/pedidos",
          actionLabel: "Abrir pedidos",
        }),
      ],
    },
    {
      id: "business",
      title: "Negocio y apertura",
      description:
        "Decisiones que deben confirmarse antes de permitir una compra pública.",
      checks: [
        automaticCheck({
          id: "legal_identity",
          title: "Identidad legal y contacto",
          ready: snapshot.identity.complete,
          readyDetail: "Los datos visibles de la farmacia están completos.",
          blockedDetail:
            "Faltan razón social, dirección o datos de contacto definitivos.",
          actionHref: "/admin/configuracion",
          actionLabel: "Revisar identidad",
        }),
        manualCheck({
          id: "payments",
          title: "Tarjeta y Bizum probados",
          ready: manual.payments === true,
          readyDetail: "Los métodos de pago han sido validados.",
          pendingDetail:
            "Activa los proveedores y confirma una operación de prueba.",
        }),
        manualCheck({
          id: "shipping",
          title: "Envíos configurados",
          ready: manual.shipping === true,
          readyDetail: "Zonas, tarifas y transportista están confirmados.",
          pendingDetail:
            "Faltan zonas, costes, plazos y reglas de envío gratuito.",
        }),
        manualCheck({
          id: "notifications",
          title: "Correos transaccionales",
          ready: manual.notifications === true,
          readyDetail: "Las confirmaciones y avisos se han probado.",
          pendingDetail:
            "Configura el remitente y revisa las plantillas de pedido y envío.",
        }),
        manualCheck({
          id: "production_store",
          title: "Tienda definitiva abierta",
          ready: manual.production_store === true,
          readyDetail:
            "El dominio, el plan y la tienda definitiva están activos.",
          pendingDetail:
            "La tienda de desarrollo sigue protegida y deberá transferirse.",
        }),
        manualCheck({
          id: "final_purchase_test",
          title: "Compra completa validada",
          ready: manual.final_purchase_test === true,
          readyDetail:
            "Se ha validado pago, pedido, stock, aviso y preparación.",
          pendingDetail:
            "Realiza una compra final controlada antes de abrir al público.",
        }),
      ],
    },
  ];
  const checks = sections.flatMap((section) => section.checks);
  const readyChecks = checks.filter((check) => check.status === "ready").length;
  const blockers = checks.filter((check) => check.status === "blocked").length;
  const pendingDecisions = checks.filter(
    (check) => check.status === "pending",
  ).length;
  return {
    generatedAt: new Date().toISOString(),
    score: checks.length ? Math.round((readyChecks / checks.length) * 100) : 0,
    readyChecks,
    totalChecks: checks.length,
    blockers,
    pendingDecisions,
    canOpenStore: readyChecks === checks.length,
    sections,
  };
}

export async function listManualReadinessChecks() {
  const rows = await getDb().select().from(productionReadinessChecks);
  return Object.fromEntries(
    rows.map((row) => [row.checkId, row.ready]),
  ) as Partial<Record<ManualReadinessCheckId, boolean>>;
}

export function isManualReadinessCheckId(
  value: string,
): value is ManualReadinessCheckId {
  return MANUAL_READINESS_CHECK_IDS.includes(value as ManualReadinessCheckId);
}

export async function setManualReadinessCheck(
  checkId: ManualReadinessCheckId,
  ready: boolean,
  actor: AdminActor,
) {
  const now = new Date().toISOString();
  const db = getDb();
  await db.batch([
    db
      .insert(productionReadinessChecks)
      .values({
        checkId,
        ready,
        verifiedBy: ready ? actor.email : null,
        verifiedAt: ready ? now : null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: productionReadinessChecks.checkId,
        set: {
          ready,
          verifiedBy: ready ? actor.email : null,
          verifiedAt: ready ? now : null,
          updatedAt: now,
        },
      }),
    db.insert(adminOperationLog).values({
      auditId: crypto.randomUUID(),
      actorId: actor.userId,
      actorEmail: actor.email,
      action: ready ? "readiness_confirmed" : "readiness_reopened",
      resourceType: "production_readiness_check",
      resourceId: checkId,
      metadataJson: JSON.stringify({ ready }),
      createdAt: now,
    }),
  ]);
}

function identityIsComplete() {
  return Boolean(
    pharmacyConfig.legalName.trim() &&
    !pharmacyConfig.address.toLowerCase().includes("pendiente") &&
    !pharmacyConfig.phone.includes("000 000") &&
    !pharmacyConfig.email.endsWith(".invalid"),
  );
}

export async function getProductionReadiness() {
  const configuration = getPublicShopifyStatus();
  const [
    catalog,
    manual,
    connectionResult,
    webhooksResult,
    storefrontResult,
    inventoryResult,
    ordersResult,
  ] = await Promise.all([
    getCatalogHealth(),
    listManualReadinessChecks(),
    configuration.configured
      ? testShopifyConnection().catch(() => null)
      : Promise.resolve(null),
    configuration.configured
      ? getShopifyWebhookStatus().catch(() => null)
      : Promise.resolve(null),
    configuration.configured
      ? getShopifyStorefrontTokenStatus().catch(() => null)
      : Promise.resolve(null),
    configuration.configured
      ? listShopifyInventory().catch(() => null)
      : Promise.resolve(null),
    configuration.configured
      ? listShopifyOrders().catch(() => null)
      : Promise.resolve(null),
  ]);

  return buildProductionReadiness({
    catalog,
    manual,
    identity: { complete: identityIsComplete() },
    shopify: {
      configured: configuration.configured,
      connected: Boolean(connectionResult),
      permissionsReady: connectionResult?.permissionsReady ?? false,
      missingScopes: connectionResult?.missingScopes ?? [],
      webhooksReady: webhooksResult?.ready ?? false,
      storefrontReady: storefrontResult?.ready ?? false,
      ordersReachable: Boolean(ordersResult),
      activeOnlineLocations:
        inventoryResult?.locations.filter(
          (location) => location.isActive && location.fulfillsOnlineOrders,
        ).length ?? 0,
      inventoryItems: inventoryResult?.metrics.totalItems ?? 0,
      trackedInventoryItems: inventoryResult?.metrics.trackedItems ?? 0,
    },
  });
}
