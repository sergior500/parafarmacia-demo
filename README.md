# Farmacia Picual

Escaparate y panel de gestión para una tienda de parafarmacia conectada con
Shopify. La aplicación mantiene la experiencia de compra y la administración
propias; Shopify aporta checkout, pagos, pedidos y la fuente comercial de
inventario.

La instalación actual es un entorno de desarrollo. Antes de vender debe
migrarse a una organización y tienda propiedad de la farmacia, completar el
catálogo y activar pagos, envíos, dominio y textos legales definitivos.

## Puesta en marcha

Requiere Node.js 24 y pnpm 10.

```bash
pnpm install
copy .env.example .env.local
pnpm dev
```

La aplicación queda disponible en `http://localhost:3000`.

## Componentes

- Escaparate responsive con catálogo, categorías, marcas, búsqueda, favoritos,
  cesta y páginas de producto.
- Checkout seguro creado mediante Shopify Storefront API. La cesta local solo
  se vacía cuando Shopify acepta las líneas y devuelve una URL válida.
- Panel privado con catálogo, imágenes, publicación, inventario, pedidos,
  preparación, equipo, configuración, seguridad y control de apertura.
- Catálogo persistido en Cloudflare D1 e imágenes en R2.
- Sincronización de productos y stock con Shopify Admin API.
- Pedidos y métricas comerciales leídos de Shopify; registro de envíos mediante
  una mutación idempotente.
- Cuentas de cliente mediante Shopify Customer Account API con OAuth 2.0,
  PKCE y tokens cifrados en servidor.
- Webhooks de Shopify con verificación HMAC, límites de tamaño, temas
  permitidos, idempotencia y registro de eventos.
- Autenticación administrativa del hosting y autorización por capacidades en
  servidor. La interfaz no es una frontera de seguridad.

## Comandos de calidad

```bash
pnpm build        # compilación Vinext/Cloudflare
pnpm lint         # ESLint
pnpm typecheck    # TypeScript
pnpm test         # Vitest
pnpm test:e2e     # Playwright
pnpm audit        # avisos conocidos de dependencias
```

## Configuración

`.env.example` documenta las variables locales. En producción las credenciales
de Shopify, los secretos de sesión y los secretos CSRF deben almacenarse como
secretos del hosting, nunca con prefijo `NEXT_PUBLIC_`, en Git o en el
navegador.

Los recursos de hosting están declarados en `.openai/hosting.json`: D1 con el
binding `DB` y R2 con el binding `PRODUCT_IMAGES`. Las migraciones se encuentran
en `drizzle/`.

## Arquitectura

- `src/app`: rutas públicas, panel y endpoints de servidor.
- `src/domain`: reglas puras de catálogo, cesta y pedidos.
- `src/features`: casos de uso e interfaz de cada área.
- `src/providers`: acceso al catálogo persistido y fronteras sustituibles.
- `src/server`: autenticación, seguridad, D1/R2 y contratos con Shopify.
- `worker`: entrada del Worker, recursos estáticos y cabeceras defensivas.

Los datos comerciales autoritativos no dependen de `localStorage`. El navegador
solo conserva preferencias reversibles como la cesta o favoritos; precio,
stock, permisos, publicación y pedidos se validan de nuevo en servidor.

## Documentación operativa

- [Arquitectura](docs/architecture.md)
- [Flujo de pedidos](docs/order-workflow.md)
- [Arquitectura y controles de seguridad](docs/SEGURIDAD.md)
- [Migración a la tienda definitiva](docs/MIGRACION_TIENDA_SHOPIFY.md)
- [Migración de autenticación](docs/MIGRACION_AUTENTICACION_SHOPIFY.md)
- [Preparación para producción](docs/production-readiness.md)
- [Preparación legal](docs/legal-readiness.md)

## Estado de producción

La aplicación puede probarse técnicamente en la tienda de desarrollo y con la
pasarela de pruebas. No debe habilitar ventas reales hasta cerrar los bloqueos
externos enumerados en `docs/production-readiness.md`. Ningún control aislado
garantiza riesgo cero; la apertura requiere operación segura, monitorización y
una revisión independiente de la configuración final.
