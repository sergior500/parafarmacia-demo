import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnvironment = {
  domain: process.env.SHOPIFY_STORE_DOMAIN,
  token: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
  clientId: process.env.SHOPIFY_CLIENT_ID,
  clientSecret: process.env.SHOPIFY_CLIENT_SECRET,
};

function restoreEnvironment(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

beforeEach(() => {
  vi.resetModules();
  process.env.SHOPIFY_STORE_DOMAIN = "99vh1p-pz.myshopify.com";
  process.env.SHOPIFY_ADMIN_ACCESS_TOKEN = "";
  process.env.SHOPIFY_CLIENT_ID = "test-client";
  process.env.SHOPIFY_CLIENT_SECRET = "test-secret";
});

afterEach(() => {
  vi.unstubAllGlobals();
  restoreEnvironment("SHOPIFY_STORE_DOMAIN", originalEnvironment.domain);
  restoreEnvironment("SHOPIFY_ADMIN_ACCESS_TOKEN", originalEnvironment.token);
  restoreEnvironment("SHOPIFY_CLIENT_ID", originalEnvironment.clientId);
  restoreEnvironment("SHOPIFY_CLIENT_SECRET", originalEnvironment.clientSecret);
});

describe("Shopify client credentials", () => {
  it("requests one expiring token and reuses it while it remains valid", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({ access_token: "temporary-token", expires_in: 86_399 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getShopifyAdminAccessToken } =
      await import("@/server/shopify/admin-api");
    await expect(getShopifyAdminAccessToken()).resolves.toBe("temporary-token");
    await expect(getShopifyAdminAccessToken()).resolves.toBe("temporary-token");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = fetchMock.mock.calls[0]?.[1] as { body?: URLSearchParams };
    expect(request.body?.get("grant_type")).toBe("client_credentials");
    expect(request.body?.get("client_id")).toBe("test-client");
    expect(request.body?.get("client_secret")).toBe("test-secret");
  });

  it("explains when the app has not been installed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => "Oauth error app_not_installed",
      }),
    );

    const { getShopifyAdminAccessToken } =
      await import("@/server/shopify/admin-api");
    await expect(getShopifyAdminAccessToken()).rejects.toThrow(
      "La aplicación todavía no está instalada",
    );
  });

  it("reports the permissions that still need approval", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            access_token: "temporary-token",
            expires_in: 86_399,
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            shop: {
              id: "gid://shopify/Shop/1",
              name: "Farmacia Picual",
              myshopifyDomain: "99vh1p-pz.myshopify.com",
            },
            currentAppInstallation: {
              accessScopes: [{ handle: "write_products" }],
            },
          },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { testShopifyConnection } =
      await import("@/server/shopify/admin-api");
    const result = await testShopifyConnection();

    expect(result.permissionsReady).toBe(false);
    expect(result.grantedScopes).toEqual(["write_products"]);
    expect(result.missingScopes).toEqual([
      "read_publications",
      "write_publications",
      "write_inventory",
      "read_locations",
      "read_orders",
      "write_orders",
      "read_customers",
      "write_discounts",
      "write_merchant_managed_fulfillment_orders",
      "unauthenticated_read_product_listings",
      "unauthenticated_write_checkouts",
      "unauthenticated_read_checkouts",
    ]);
  });
});
