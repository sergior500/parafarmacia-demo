import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("navega, filtra, añade y modifica el carrito", async ({ page }) => {
  await page.goto("/parafarmacia");
  await expect(
    page.getByRole("heading", { name: "Tienda de parafarmacia", level: 1 }),
  ).toBeVisible();

  await page
    .getByRole("checkbox", { name: "Mostrar solo disponibles" })
    .check();
  await expect(page).toHaveURL(/disponible=1/);
  await page
    .getByLabel("Ordenar productos")
    .selectOption({ value: "price-asc" });
  await expect(page).toHaveURL(/orden=price-asc/);

  await page.goto("/productos/cerave-crema-hidratante-340-g");
  await page.getByRole("button", { name: "Añadir al carrito" }).click();
  await expect(page.getByRole("status")).toContainText("añadido");

  await page.goto("/carrito");
  await page
    .getByRole("button", { name: "Aumentar CeraVe Crema Hidratante" })
    .click();
  await expect(page.getByLabel("2 unidades", { exact: true })).toBeVisible();
});

test("confirma un pedido y comienza su preparación", async ({ page }) => {
  await page.goto("/productos/isdin-fusion-water-spf50-50-ml");
  await page.getByRole("button", { name: "Añadir al carrito" }).click();
  await page.goto("/solicitud-pedido");

  await page.getByLabel("Nombre").fill("Cliente");
  await page.getByLabel("Apellidos").fill("Ficticio");
  await page.getByLabel("Correo electrónico").fill("cliente@ejemplo.invalid");
  await page.getByLabel("Teléfono").fill("+34 600 000 000");
  await page.getByLabel("Dirección").fill("Calle Ficticia 12");
  await page.getByLabel("Código postal").fill("41001");
  await page.getByLabel("Localidad").fill("Sevilla");
  await page.getByLabel("Provincia").fill("Sevilla");
  await page
    .getByLabel("Acepto las condiciones simuladas de esta demostración.")
    .check();
  await page
    .getByLabel("Confirmo que todos los datos introducidos son ficticios.")
    .check();
  await page.getByRole("button", { name: "Confirmar pedido demo" }).click();

  await expect(
    page.getByRole("heading", { name: "Pedido confirmado" }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Ver en el panel demo/ }).click();
  await expect(
    page.getByRole("heading", { name: "Gestionar pedido" }),
  ).toBeVisible();
  await page.getByTestId("start-preparation").click();
  await expect(page.getByText("En preparación", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Acción registrada en la auditoría."),
  ).toBeVisible();
});

test("respeta permisos y exige motivo al cancelar", async ({ page }) => {
  await page.goto("/admin/pedidos/demo-order-1");
  await page
    .getByTestId("role-selector")
    .selectOption({ value: "customer_support" });
  await expect(page.getByTestId("start-preparation")).toBeDisabled();
  await expect(
    page.getByText(
      "Este perfil puede consultar el pedido, pero no gestionar su preparación o envío.",
    ),
  ).toBeVisible();

  await page
    .getByTestId("role-selector")
    .selectOption({ value: "order_manager" });
  await page.getByTestId("cancel-order").click();
  await expect(
    page.getByText("Indica un motivo para completar esta acción."),
  ).toBeVisible();
  await page
    .getByLabel("Motivo de cancelación")
    .fill("Motivo ficticio obligatorio para la prueba.");
  await page.getByTestId("cancel-order").click();
  await expect(page.getByText("Cancelado", { exact: true })).toBeVisible();
});
