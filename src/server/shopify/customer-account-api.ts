import {
  getShopifyCustomerAccountConfiguration,
  type ShopifyCustomerAccountConfiguration,
} from "@/server/shopify/customer-account-config";
import {
  createPkceChallenge,
  type CustomerOAuthAttempt,
  randomBase64Url,
} from "@/server/shopify/customer-account-security";
import type { CustomerTokenSet } from "@/server/shopify/customer-account-session";

interface OpenIdConfiguration {
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint: string;
  issuer: string;
}

interface ApiConfiguration {
  graphql_api: string;
}

interface GraphqlEnvelope<T> {
  data?: T;
  errors?: Array<{ message?: string }>;
}

export interface CustomerAccountAddress {
  id: string;
  name?: string | null;
  formatted: string[];
}

export interface CustomerAccountOrder {
  id: string;
  name: string;
  processedAt: string;
  financialStatus?: string | null;
  fulfillmentStatus: string;
  statusPageUrl: string;
  totalPrice: { amount: string; currencyCode: string };
  lineItems: {
    nodes: Array<{
      productId?: string | null;
      variantId?: string | null;
    }>;
  };
}

export interface CustomerAccountProfile {
  id: string;
  displayName: string;
  firstName?: string | null;
  lastName?: string | null;
  emailAddress?: { emailAddress: string } | null;
  defaultAddress?: CustomerAccountAddress | null;
  addresses: { nodes: CustomerAccountAddress[] };
  orders: { nodes: CustomerAccountOrder[] };
}

export class ShopifyCustomerAccountError extends Error {
  constructor(
    message: string,
    public readonly reason:
      | "configuration"
      | "authentication"
      | "authorization"
      | "upstream" = "upstream",
  ) {
    super(message);
    this.name = "ShopifyCustomerAccountError";
  }
}

let discoveryCache:
  | {
      storeDomain: string;
      openId: OpenIdConfiguration;
      api: ApiConfiguration;
      expiresAt: number;
    }
  | undefined;

export async function createCustomerAuthorization() {
  const configuration = requireConfiguration();
  const discovery = await discover(configuration);
  const attempt: CustomerOAuthAttempt = {
    state: randomBase64Url(32),
    verifier: randomBase64Url(48),
    nonce: randomBase64Url(32),
    returnTo: "/cuenta",
    issuedAt: Date.now(),
  };
  const authorizationUrl = safeDiscoveredUrl(
    discovery.openId.authorization_endpoint,
  );
  authorizationUrl.searchParams.set(
    "scope",
    "openid email customer-account-api:full",
  );
  authorizationUrl.searchParams.set("client_id", configuration.clientId!);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("redirect_uri", configuration.callbackUri!);
  authorizationUrl.searchParams.set("state", attempt.state);
  authorizationUrl.searchParams.set("nonce", attempt.nonce);
  authorizationUrl.searchParams.set(
    "code_challenge",
    await createPkceChallenge(attempt.verifier),
  );
  authorizationUrl.searchParams.set("code_challenge_method", "S256");
  authorizationUrl.searchParams.set("locale", "es-ES");
  authorizationUrl.searchParams.set("region_country", "ES");
  return { authorizationUrl, attempt, configuration };
}

export async function exchangeCustomerAuthorizationCode(
  code: string,
  verifier: string,
): Promise<CustomerTokenSet> {
  const configuration = requireConfiguration();
  const discovery = await discover(configuration);
  const response = await timedFetch(discovery.openId.token_endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      origin: configuration.siteOrigin!,
      "user-agent": "FarmaciaPicual/1.0 CustomerAccount",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: configuration.clientId!,
      redirect_uri: configuration.callbackUri!,
      code,
      code_verifier: verifier,
    }),
  });
  const body = (await response.json().catch(() => null)) as {
    access_token?: string;
    id_token?: string;
    refresh_token?: string;
    expires_in?: number;
  } | null;
  if (!response.ok || !body?.access_token || !body.id_token) {
    throw new ShopifyCustomerAccountError(
      response.status === 400 || response.status === 401
        ? "Shopify no pudo validar este inicio de sesión."
        : "Shopify no pudo completar el acceso.",
      "authentication",
    );
  }
  return {
    accessToken: body.access_token,
    idToken: body.id_token,
    refreshToken: body.refresh_token,
    expiresIn: Math.max(60, body.expires_in ?? 3600),
  };
}

export async function getCustomerAccountProfile(
  accessToken: string,
): Promise<CustomerAccountProfile> {
  const configuration = requireConfiguration();
  const discovery = await discover(configuration);
  const response = await timedFetch(discovery.api.graphql_api, {
    method: "POST",
    headers: {
      authorization: accessToken,
      "content-type": "application/json",
      "user-agent": "FarmaciaPicual/1.0 CustomerAccount",
    },
    body: JSON.stringify({
      operationName: "PicualCustomerAccount",
      query: `
        query PicualCustomerAccount {
          customer {
            id
            displayName
            firstName
            lastName
            emailAddress { emailAddress }
            defaultAddress { id name formatted(withName: true) }
            addresses(first: 6) {
              nodes { id name formatted(withName: true) }
            }
            orders(first: 12, sortKey: PROCESSED_AT, reverse: true) {
              nodes {
                id
                name
                processedAt
                financialStatus
                fulfillmentStatus
                statusPageUrl
                totalPrice { amount currencyCode }
                lineItems(first: 100) {
                  nodes { productId variantId }
                }
              }
            }
          }
        }
      `,
    }),
  });
  const envelope = (await response
    .json()
    .catch(() => null)) as GraphqlEnvelope<{
    customer: CustomerAccountProfile;
  }> | null;
  if (response.status === 401) {
    throw new ShopifyCustomerAccountError(
      "La sesión de cliente ha caducado.",
      "authentication",
    );
  }
  if (response.status === 403) {
    throw new ShopifyCustomerAccountError(
      "Shopify todavía no ha autorizado el acceso a estos datos de cliente.",
      "authorization",
    );
  }
  if (!response.ok || !envelope) {
    throw new ShopifyCustomerAccountError(
      "Shopify no ha podido cargar la cuenta en este momento.",
    );
  }
  if (envelope.errors?.length || !envelope.data?.customer) {
    const protectedData = envelope.errors?.some(({ message }) =>
      message?.toLowerCase().includes("protected customer data"),
    );
    throw new ShopifyCustomerAccountError(
      protectedData
        ? "La aplicación todavía necesita la autorización de datos de cliente de Shopify."
        : "Shopify no ha podido leer los datos de esta cuenta.",
      protectedData ? "authorization" : "upstream",
    );
  }
  return envelope.data.customer;
}

export async function createCustomerLogoutUrl(idToken: string) {
  const configuration = requireConfiguration();
  const discovery = await discover(configuration);
  const logoutUrl = safeDiscoveredUrl(discovery.openId.end_session_endpoint);
  logoutUrl.searchParams.set("id_token_hint", idToken);
  logoutUrl.searchParams.set(
    "post_logout_redirect_uri",
    configuration.logoutUri!,
  );
  return logoutUrl;
}

function requireConfiguration() {
  const configuration = getShopifyCustomerAccountConfiguration();
  if (!configuration.configured) {
    throw new ShopifyCustomerAccountError(
      `Las cuentas todavía no están configuradas: ${configuration.missing.join(
        ", ",
      )}.`,
      "configuration",
    );
  }
  return configuration;
}

async function discover(configuration: ShopifyCustomerAccountConfiguration) {
  if (
    discoveryCache &&
    discoveryCache.storeDomain === configuration.storeDomain &&
    discoveryCache.expiresAt > Date.now()
  ) {
    return discoveryCache;
  }
  const [openIdResponse, apiResponse] = await Promise.all([
    timedFetch(
      `https://${configuration.storeDomain}/.well-known/openid-configuration`,
      { headers: { "user-agent": "FarmaciaPicual/1.0 CustomerAccount" } },
    ),
    timedFetch(
      `https://${configuration.storeDomain}/.well-known/customer-account-api`,
      { headers: { "user-agent": "FarmaciaPicual/1.0 CustomerAccount" } },
    ),
  ]);
  const [openId, api] = (await Promise.all([
    openIdResponse.json().catch(() => null),
    apiResponse.json().catch(() => null),
  ])) as [OpenIdConfiguration | null, ApiConfiguration | null];
  if (
    !openIdResponse.ok ||
    !apiResponse.ok ||
    !openId?.authorization_endpoint ||
    !openId.token_endpoint ||
    !openId.end_session_endpoint ||
    !api?.graphql_api
  ) {
    throw new ShopifyCustomerAccountError(
      "Shopify todavía no tiene activadas las cuentas de cliente para esta tienda.",
      "configuration",
    );
  }
  for (const endpoint of [
    openId.authorization_endpoint,
    openId.token_endpoint,
    openId.end_session_endpoint,
    api.graphql_api,
  ]) {
    safeDiscoveredUrl(endpoint);
  }
  discoveryCache = {
    storeDomain: configuration.storeDomain!,
    openId,
    api,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };
  return discoveryCache;
}

function safeDiscoveredUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new ShopifyCustomerAccountError(
      "Shopify devolvió un endpoint de autenticación no seguro.",
      "configuration",
    );
  }
  return url;
}

async function timedFetch(input: string | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ShopifyCustomerAccountError(
        "Shopify ha tardado demasiado en responder.",
      );
    }
    throw new ShopifyCustomerAccountError(
      "No se pudo establecer una conexión segura con Shopify.",
    );
  } finally {
    clearTimeout(timeout);
  }
}
