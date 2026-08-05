# Modelo de dominio

## Producto

El catálogo contiene exclusivamente parafarmacia. Cada producto tiene estado,
marca, precio en céntimos, IVA, categoría, stock, disponibilidad online y un
EAN de demostración. Los estados son `active`, `inactive`,
`temporarily_unavailable` y `withdrawn`.

La ficha retirada nunca aparece en el catálogo. La ficha inactiva puede
conservarse para gestión interna, pero no se puede comprar. Las promociones
solo se calculan para productos activos.

## Carrito

Las líneas guardan el producto y una cantidad entera positiva. Las reglas
comprueban disponibilidad, stock y límite por pedido. Los importes se calculan
siempre en céntimos enteros.

## Pedido

La compra demo crea directamente un pedido `confirmed`. El equipo puede
avanzarlo a preparación, envío y entrega, o registrar cancelación y reembolso
cuando corresponde. Cada acción genera una entrada de auditoría.

## Roles

- `owner`: visión global y gestión del negocio.
- `order_manager`: preparación, envío, entrega y cancelación.
- `catalog_manager`: catálogo, stock y métricas agregadas; no ve clientes.
- `customer_support`: consulta pedidos y puede registrar reembolsos.
- `technical_admin`: configuración técnica; no ve datos de clientes.

Los permisos de la demo viven en el dominio y deberán repetirse en el servidor
cuando exista autenticación real.
