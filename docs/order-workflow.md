# Flujo comercial de pedidos

## Fuente de verdad

Shopify es la fuente de verdad de checkout, cobro, pedido, reserva de stock y
fulfillment. El panel de Farmacia Picual presenta y opera esos datos mediante la
Admin API; no mantiene una copia manipulable del pedido en el navegador.

```text
cesta local
   ↓ Shopify acepta variantes y cantidades
checkout de Shopify
   ↓ pago confirmado por el proveedor
pedido pagado y stock comprometido
   ↓ comprobación humana en el panel
fulfillment de Shopify
   ↓ transportista / seguimiento
pedido enviado
```

## Reglas implementadas

- La aplicación rechaza productos sin variante Shopify válida, precio, stock,
  formato, imagen o aprobación necesaria para publicar/vender.
- La cesta se conserva si falla la creación del checkout y solo se borra tras
  recibir una URL de checkout válida.
- El panel considera pendiente de preparación un pedido pagado, no cancelado y
  con unidades pendientes de fulfillment.
- No se permite registrar un envío de un pedido cancelado, impagado o sin
  unidades pendientes.
- Registrar el envío exige confirmación explícita del operador y usa una clave
  idempotente por operación para evitar dobles ejecuciones en reintentos.
- El correo al cliente y los datos de seguimiento son opciones explícitas del
  formulario de preparación.
- Inventario usa comparación optimista con la cantidad leída para detectar
  cambios concurrentes en Shopify.
- La cancelación solo se ofrece antes de cualquier envío total o parcial, exige
  escribir el número del pedido y confirmar que la acción es irreversible.
- Esta operación anula una compra pendiente; no equivale a aceptar una
  devolución de producto abierto después de la entrega.
- Si Shopify ya capturó dinero, la cancelación desde el panel siempre devuelve
  todo el importe al método original; no se permite cancelar conservando el
  cobro.
- El operador decide si reponer las unidades y si Shopify debe notificar al
  cliente. El motivo y una nota interna son obligatorios y la operación queda
  auditada.

## Operaciones todavía delegadas en Shopify

La aplicación implementa cancelación completa con reembolso íntegro cuando
corresponde. Todavía delega en Shopify devoluciones, reembolsos parciales,
etiquetas de transporte y conciliación de pagos. No deben simularse como
completadas.

## Pruebas de desarrollo

La tienda de desarrollo usa una pasarela de prueba. Los pedidos creados allí no
representan dinero real. Activar pagos reales o marcar un pedido como enviado
modifica sistemas externos y requiere una comprobación deliberada del operador.
