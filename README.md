# Tienda de parafarmacia — demo

Prototipo funcional de comercio electrónico de parafarmacia. Permite demostrar
catálogo, búsqueda, carrito, confirmación de un pedido y control administrativo
de ventas, stock y estados del pedido sin conectar servicios reales.

> **Solo demostración.** Las marcas son referencias reconocibles, pero precios,
> stock, EAN, imágenes, clientes y pedidos son ficticios. No se procesan pagos,
> no se reservan existencias y no se envían notificaciones.

## Puesta en marcha

Requiere Node.js 24 (o una versión compatible con Next.js 16) y pnpm 10.

```bash
pnpm install
copy .env.example .env.local
pnpm dev
```

La aplicación queda disponible en `http://localhost:3000`.

## Variables de entorno

| Variable                          | Uso                   |
| --------------------------------- | --------------------- |
| `NEXT_PUBLIC_PHARMACY_NAME`       | Nombre visible        |
| `NEXT_PUBLIC_PHARMACY_LEGAL_NAME` | Razón social futura   |
| `NEXT_PUBLIC_PHARMACY_ADDRESS`    | Dirección provisional |
| `NEXT_PUBLIC_PHARMACY_PHONE`      | Teléfono provisional  |
| `NEXT_PUBLIC_PHARMACY_EMAIL`      | Correo provisional    |
| `NEXT_PUBLIC_SITE_URL`            | URL base del sitio    |

Las credenciales de futuros proveedores deberán ser variables de servidor y no
enviarse al navegador.

## Comandos

```bash
pnpm dev          # desarrollo
pnpm build        # compilación de producción
pnpm start        # servir la compilación
pnpm lint         # ESLint
pnpm typecheck    # TypeScript
pnpm test         # Vitest
pnpm test:e2e     # Playwright
pnpm format       # Prettier
```

## Alcance actual

- Catálogo de 15 referencias de parafarmacia en nueve categorías.
- Búsqueda, filtros por categoría y disponibilidad y ordenación por precio.
- Carrito persistido en el navegador y formulario de compra ficticio.
- Pedidos con estados confirmado, en preparación, enviado, entregado,
  cancelado y reembolsado.
- Panel con ventas semanales y mensuales, ticket medio, ventas por día,
  productos más vendidos y alertas de stock.
- Roles de administración, pedidos, catálogo, atención al cliente y sistemas.
- Auditoría de cambios de estado y notas internas.
- Búsqueda predictiva, favoritos y área de cuenta simulada.
- Páginas de marcas y centro editorial con artículos individuales.
- Base SEO con canonical, noindex selectivo, sitemap y datos estructurados prudentes.

## Arquitectura de la demo

- `src/domain`: reglas puras de productos, carrito, pedidos, usuarios y
  auditoría.
- `src/providers`: adaptadores locales sustituibles por ERP, pago o transporte.
- `src/features`: catálogo, carrito, compra, estado demo y panel.
- `src/app`: rutas de Next.js y metadatos.
- `src/mocks`: productos y pedidos ficticios.

El carrito, los pedidos y el rol elegido se guardan en `localStorage`. Es útil
para una presentación, pero no aporta persistencia multiusuario ni seguridad de
servidor.

## Limitaciones

- Sin autenticación ni permisos comprobados en servidor.
- Sin base de datos, ERP, pago, transporte, correo o reserva de stock.
- Sin condiciones comerciales y textos legales definitivos.
- Los datos locales pueden manipularse y no deben usarse en producción.

## Documentación útil

- [Guion de demostración](docs/guion-demo-comercial.md)
- [Preguntas para continuar el desarrollo](docs/preguntas-continuidad.md)
- [Flujo de pedidos](docs/order-workflow.md)
- [Integraciones pendientes](docs/integrations-pending.md)
- [Preparación para producción](docs/production-readiness.md)
- [Decisiones de UX, SEO y rendimiento](docs/frontend-strategy.md)
