import { afterEach, describe, expect, it } from "vitest";

import { getPublicShopifyStatus, normalizeShopifyStoreDomain } from "@/server/shopify/config";

const originalDomain = process.env.SHOPIFY_STORE_DOMAIN;
const originalToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

afterEach(() => {
  process.env.SHOPIFY_STORE_DOMAIN = originalDomain;
  process.env.SHOPIFY_ADMIN_ACCESS_TOKEN = originalToken;
});

describe("Shopify configuration", () => {
  it("normalizes a myshopify domain", () => {
    expect(normalizeShopifyStoreDomain("https://amapola.myshopify.com/")).toBe(
      "amapola.myshopify.com",
    );
  });

  it("rejects domains outside Shopify", () => {
    expect(normalizeShopifyStoreDomain("example.com")).toBeNull();
  });

  it("never exposes the admin token in its public status", () => {
    process.env.SHOPIFY_STORE_DOMAIN = "amapola.myshopify.com";
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN = "shpat_secret";
    const publicStatus = getPublicShopifyStatus();
    expect(publicStatus.configured).toBe(true);
    expect(JSON.stringify(publicStatus)).not.toContain("shpat_secret");
  });
});
