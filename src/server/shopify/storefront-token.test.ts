import { describe, expect, it } from "vitest";

import {
  hasRequiredStorefrontScopes,
  selectReusableStorefrontToken,
} from "@/server/shopify/storefront-token";

const requiredScopes = [
  "unauthenticated_read_product_listings",
  "unauthenticated_write_checkouts",
  "unauthenticated_read_checkouts",
].map((handle) => ({ handle }));

describe("Shopify Storefront token", () => {
  it("acepta únicamente tokens con los tres permisos del checkout", () => {
    expect(
      hasRequiredStorefrontScopes({
        accessToken: "public-token",
        title: "Farmacia Picual checkout",
        accessScopes: requiredScopes,
      }),
    ).toBe(true);
    expect(
      hasRequiredStorefrontScopes({
        accessToken: "old-token",
        title: "Farmacia Picual checkout",
        accessScopes: requiredScopes.slice(0, 1),
      }),
    ).toBe(false);
  });

  it("reutiliza el token estable y no uno antiguo con otro nombre", () => {
    expect(
      selectReusableStorefrontToken([
        {
          accessToken: "legacy",
          title: "New Storefront Access Token",
          accessScopes: requiredScopes,
        },
        {
          accessToken: "picual",
          title: "Farmacia Picual checkout",
          accessScopes: requiredScopes,
        },
      ])?.accessToken,
    ).toBe("picual");
  });
});
