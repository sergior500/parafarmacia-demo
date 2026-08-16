import { describe, expect, it, vi } from "vitest";

vi.mock("@db/index", () => ({ getDb: vi.fn() }));
vi.mock("@/server/catalog-repository", () => ({
  getCatalogHealth: vi.fn(),
}));
vi.mock("@/server/shopify/admin-api", () => ({
  testShopifyConnection: vi.fn(),
}));
vi.mock("@/server/shopify/inventory", () => ({
  listShopifyInventory: vi.fn(),
}));
vi.mock("@/server/shopify/orders", () => ({ listShopifyOrders: vi.fn() }));
vi.mock("@/server/shopify/storefront-token", () => ({
  getShopifyStorefrontTokenStatus: vi.fn(),
}));
vi.mock("@/server/shopify/webhook-subscriptions", () => ({
  getShopifyWebhookStatus: vi.fn(),
}));

import {
  buildProductionReadiness,
  type ReadinessSnapshot,
} from "@/server/production-readiness";

function readySnapshot(): ReadinessSnapshot {
  return {
    catalog: {
      total: 10,
      pending: 0,
      reviewed: 0,
      published: 10,
      missingPrice: 0,
      missingStock: 0,
      missingImage: 0,
      missingSize: 0,
      shopifySynced: 10,
      shopifyErrors: 0,
    },
    identity: { complete: true },
    manual: {
      payments: true,
      shipping: true,
      notifications: true,
      production_store: true,
      final_purchase_test: true,
    },
    shopify: {
      configured: true,
      connected: true,
      permissionsReady: true,
      missingScopes: [],
      webhooksReady: true,
      storefrontReady: true,
      ordersReachable: true,
      activeOnlineLocations: 1,
      inventoryItems: 10,
      trackedInventoryItems: 10,
    },
  };
}

describe("production readiness", () => {
  it("permite abrir únicamente cuando todas las comprobaciones están listas", () => {
    const report = buildProductionReadiness(readySnapshot());

    expect(report.canOpenStore).toBe(true);
    expect(report.score).toBe(100);
    expect(report.readyChecks).toBe(report.totalChecks);
    expect(report.blockers).toBe(0);
    expect(report.pendingDecisions).toBe(0);
  });

  it("separa los bloqueos automáticos de las decisiones manuales", () => {
    const snapshot = readySnapshot();
    snapshot.catalog.missingPrice = 2;
    snapshot.manual.payments = false;

    const report = buildProductionReadiness(snapshot);
    const checks = report.sections.flatMap((section) => section.checks);

    expect(report.canOpenStore).toBe(false);
    expect(report.blockers).toBe(1);
    expect(report.pendingDecisions).toBe(1);
    expect(checks.find((check) => check.id === "catalog_price")?.status).toBe(
      "blocked",
    );
    expect(checks.find((check) => check.id === "payments")?.status).toBe(
      "pending",
    );
  });
});
