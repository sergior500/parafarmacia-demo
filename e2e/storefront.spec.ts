import { expect, test } from "@playwright/test";

const PRODUCT_NAME = "Aceite Corporal Reafirmante Nutritivo";
const PRODUCT_PATH = "/productos/aceite-corporal-reafirmante-nutritivo";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("navega y filtra el catálogo real", async ({ page }) => {
  await page.goto("/parafarmacia");
  await expect(
    page.getByRole("heading", { name: "Parafarmacia online", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText(/183 productos/)).toBeVisible();

  await page
    .getByRole("checkbox", { name: "Mostrar solo disponibles" })
    .click();
  await expect(page).toHaveURL(/disponible=1/);

  await page
    .getByRole("combobox", { name: "Ordenar productos" })
    .selectOption("price-asc");
  await expect(page).toHaveURL(/orden=price-asc/);

  await page.goto("/parafarmacia?pagina=2");
  await expect(page).toHaveURL(/pagina=2/);
  await expect(
    page.getByRole("button", { name: "Ir a la página 1", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ir a la página 16", exact: true }),
  ).toBeVisible();
});

test("presenta ofertas sin anunciar descuentos sin confirmar", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Ofertas", exact: true }).click();
  await expect(page).toHaveURL(/\/ofertas$/);
  await expect(
    page.getByRole("heading", {
      name: "Cuidarte bien también puede salir mejor de precio.",
      level: 1,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Sin precios tachados ni descuentos que no estén confirmados.",
    ),
  ).toBeVisible();
});

test("abre una ficha real y conserva favoritos", async ({ page }) => {
  await page.goto(PRODUCT_PATH);
  await expect(
    page.getByRole("heading", { name: PRODUCT_NAME, level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Precio pendiente").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Comprar ahora" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "Experiencias de compra reales." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Entrar para valorar una compra" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Guardar en favoritos" }).click();
  await page.goto("/favoritos");
  await expect(
    page.getByRole("heading", { name: "Favoritos", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: PRODUCT_NAME, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Quitar de favoritos" }),
  ).toBeVisible();
});

test("presenta inicio y catálogo sin desbordamiento en móvil", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Farmacia Picual, inicio" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Cuidarte debería ser sencillo.",
      level: 1,
    }),
  ).toBeVisible();

  await page.goto("/parafarmacia");
  await expect(
    page.getByRole("heading", { name: "Parafarmacia online", level: 1 }),
  ).toBeVisible();
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
});

test("carga el panel actual y bloquea mutaciones sin CSRF", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Control del negocio", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText("Administración local · Propietario"),
  ).toBeVisible();

  await page.getByRole("link", { name: "Productos", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Productos", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Añadir producto" }),
  ).toBeVisible();

  await page.goto("/admin");
  await expect(
    page.getByRole("link", { name: "Clientes", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Promociones", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Reseñas", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Reseñas", level: 1 }),
  ).toBeVisible();

  const unauthenticatedReview = await page.request.post("/api/reviews", {
    headers: { origin: "http://localhost:3000" },
    data: {
      productId: "product-001",
      rating: 5,
      title: "Compra verificada",
      body: "Este intento debe rechazarse porque no existe sesión de cliente.",
    },
  });
  expect(unauthenticatedReview.status()).toBe(401);

  const favicon = await page.request.get("/favicon.ico");
  expect(favicon.status()).toBe(200);

  const response = await page.request.post("/api/admin/products", {
    headers: { origin: "http://localhost:3000" },
    data: {},
  });
  expect(response.status()).toBe(419);
  await expect(response.json()).resolves.toMatchObject({
    error: expect.stringContaining("seguridad"),
  });

  const cancellation = await page.request.post(
    "/api/admin/orders/1001/cancel",
    {
      headers: { origin: "http://localhost:3000" },
      data: {},
    },
  );
  expect(cancellation.status()).toBe(419);

  const refundPreview = await page.request.post(
    "/api/admin/orders/1001/refund/preview",
    {
      headers: { origin: "http://localhost:3000" },
      data: {},
    },
  );
  expect(refundPreview.status()).toBe(419);

  const refund = await page.request.post("/api/admin/orders/1001/refund", {
    headers: { origin: "http://localhost:3000" },
    data: {},
  });
  expect(refund.status()).toBe(419);

  const discount = await page.request.post("/api/admin/discounts", {
    headers: { origin: "http://localhost:3000" },
    data: {},
  });
  expect(discount.status()).toBe(419);
});
