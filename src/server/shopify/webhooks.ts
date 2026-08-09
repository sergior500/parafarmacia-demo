export async function verifyShopifyWebhook(
  body: string,
  receivedHmac: string | null,
  secret: string,
): Promise<boolean> {
  if (!receivedHmac || !secret) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  );
  const expected = btoa(
    String.fromCharCode(...new Uint8Array(signature)),
  );
  if (expected.length !== receivedHmac.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ receivedHmac.charCodeAt(index);
  }
  return difference === 0;
}
