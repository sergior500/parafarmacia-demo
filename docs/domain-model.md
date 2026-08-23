# Modelo de dominio

## Producto

El catálogo contiene exclusivamente parafarmacia. Cada producto tiene estado,
marca, precio en céntimos, IVA, categoría, stock y disponibilidad online. Los
estados son `active`, `inactive`, `temporarily_unavailable` y `withdrawn`.

La ficha retirada nunca aparece en el catálogo. La ficha inactiva puede
conservarse para gestión interna, pero no se puede comprar. Las promociones
solo se calculan para productos activos.

## Carrito

Las líneas guardan el producto y una cantidad entera positiva. Las reglas
comprueban disponibilidad, stock y límite por pedido. Los importes se calculan
siempre en céntimos enteros.

## Pedido

La cesta se valida en servidor y se transfiere al checkout de Shopify. Shopify
es la fuente de verdad para cobro, pedido, cliente e inventario comercial. El
panel lee esos pedidos y permite registrar preparación, seguimiento y
cancelación completa cuando corresponde. Cada mutación sensible queda auditada.

## Roles

- `owner`: visión global y gestión del negocio.
- `operations_manager`: pedidos, inventario, preparación y cancelación.
- `catalog_manager`: catálogo, stock y publicación; no puede cancelar pedidos.
- `auditor`: acceso de solo lectura a métricas y seguridad.

Los permisos se comprueban en servidor para cada lectura y mutación protegida.
