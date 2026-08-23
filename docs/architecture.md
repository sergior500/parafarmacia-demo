# Arquitectura

## Vista general

```text
navegador
  ├─ escaparate / cesta / cuenta
  └─ panel administrativo
          ↓ HTTPS
Worker Vinext + rutas de servidor
  ├─ identidad, roles, CSRF, rate limit y auditoría
  ├─ D1: catálogo, equipo, seguridad e idempotencia
  ├─ R2: imágenes validadas
  └─ Shopify APIs
       ├─ Storefront: carrito y checkout
       ├─ Admin: productos, publicación, stock, pedidos y fulfillment
       └─ Customer Account: identidad e historial del cliente
```

La aplicación controla la presentación y la operativa interna. Shopify es la
fuente comercial de checkout, pagos, pedidos, fulfillment y stock publicado.
D1 conserva el catálogo de trabajo y el estado necesario para sincronización,
seguridad y administración; R2 conserva las imágenes de origen.

## Capas

### Aplicación e interfaz

`src/app` contiene rutas públicas, panel y endpoints. Las páginas son Server
Components salvo las interacciones que necesitan estado de navegador. La cesta
y favoritos pueden persistirse localmente porque son preferencias reversibles;
ningún permiso, precio, stock o estado de pedido confía en esos valores.

### Dominio y casos de uso

`src/domain` mantiene reglas puras y `src/features` compone los casos de uso y
su interfaz. Los contratos externos se traducen a modelos internos para evitar
que detalles de GraphQL o del hosting se propaguen a los componentes.

### Persistencia

- D1 (`DB`): productos importados, metadatos Shopify, usuarios del panel,
  eventos de seguridad, límites distribuidos e idempotencia de webhooks.
- R2 (`PRODUCT_IMAGES`): originales de producto tras validar tamaño, tipo y
  firma binaria. Las descargas usan claves generadas por el servidor.
- Shopify: productos comerciales sincronizados, inventario por ubicación,
  checkout, pagos, clientes y pedidos.

Las migraciones de D1 se versionan en `drizzle/`. Los cambios de esquema deben
aplicarse primero en un entorno no productivo y tener procedimiento de
reversión/restauración.

## Fronteras de seguridad

- El Worker obtiene la identidad administrativa del hosting y aplica una
  allowlist más roles/capacidades en servidor.
- Las mutaciones del panel exigen mismo origen y token CSRF ligado al usuario.
- Los cuerpos tienen límites de tamaño y esquemas de validación; imágenes y
  GID de Shopify reciben validaciones específicas.
- Los secretos solo se leen en servidor. Las respuestas y registros no deben
  incluir credenciales ni datos de pago.
- Shopify se llama contra un dominio configurado, con timeout y scopes mínimos.
- Los webhooks se autentican con HMAC sobre el cuerpo original y se deduplican.
- Inventario usa comparación optimista; fulfillment usa idempotencia.

El documento normativo completo es [SEGURIDAD.md](./SEGURIDAD.md).

## Flujo de catálogo

1. El catálogo real se importa a D1 y se completa desde el panel.
2. La aplicación impide publicar una ficha incompleta o no aprobada.
3. La sincronización crea/actualiza el producto y variante en Shopify.
4. La imagen se envía desde R2 y la publicación se controla desde el panel.
5. El inventario se activa en una ubicación y se ajusta con control de
   concurrencia.
6. El escaparate solo ofrece productos aptos para checkout.

## Flujo de pedido

1. El servidor vuelve a resolver variantes y cantidades y crea el carrito
   Storefront.
2. Shopify aloja el checkout y procesa el pago con el proveedor configurado.
3. El panel lee pedidos y fulfillment orders mediante Admin API.
4. Un operador autorizado confirma la preparación y registra el fulfillment.
5. Webhooks y lecturas posteriores mantienen el estado observable.

## Despliegue

Vinext compila la aplicación para Cloudflare Workers. `vite.config.ts` conecta
el Worker con D1 y el plugin de hosting; `.openai/hosting.json` identifica los
recursos administrados por el proyecto. Código, migraciones y configuración se
versionan en Git, mientras que secretos y datos se gestionan fuera del
repositorio.

La tienda definitiva debe seguir [MIGRACION_TIENDA_SHOPIFY.md](./MIGRACION_TIENDA_SHOPIFY.md)
y mantener desarrollo y producción separados.
