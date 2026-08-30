# Auditoría de elementos pendientes — 31 de agosto de 2026

Esta revisión distingue entre trabajo técnico terminable y datos que no deben
inventarse. Un campo marcado como pendiente no significa necesariamente que
falte programación: en muchos casos protege la tienda para que no venda con
información comercial o legal sin confirmar.

## Cerrado técnicamente

- Catálogo persistente con 183 productos reales y edición desde el panel.
- Sincronización, publicación, inventario, pedidos, preparación, cancelaciones,
  reembolsos y promociones mediante Shopify.
- Cuentas de cliente y consulta de pedidos mediante Shopify Customer Accounts.
- Carrito, checkout, códigos promocionales, favoritos y límites de unidades.
- Reseñas por producto, limitadas a compras pagadas y moderadas desde el panel.
- Usuarios del panel, roles, permisos, CSRF, límites de uso y auditoría.
- Imágenes en R2, descarga de la imagen actual y sustitución desde el panel.
- Guías públicas enlazadas a fuentes sanitarias identificadas.
- Página de ofertas sin publicar descuentos no confirmados.
- Ocultación del contacto mientras no exista un canal oficial verificado.
- Páginas legales incompletas excluidas temporalmente de la indexación.

## Requiere datos o una decisión de Farmacia Picual

1. Razón social, NIF/CIF, domicilio, datos registrales y autorización
   profesional para el aviso legal.
2. Dirección, teléfono y correo oficiales que se publicarán en la web.
3. Zonas de envío, transportista, plazos, tarifas y umbral de envío gratuito.
4. Activación definitiva de tarjeta y Bizum en la cuenta real de Shopify.
5. Procedimiento, dirección y canal para incidencias, desistimiento y garantía.
6. Precio, stock, formato, imagen, EAN y composición que todavía falten en cada
   producto. El panel permite completarlos sin intervención técnica.
7. Revisión jurídica final de privacidad, cookies, condiciones, envíos y
   devoluciones.
8. Personalización de las plantillas de correo transaccional de Shopify.
9. Transferencia de la aplicación y de la tienda a la cuenta definitiva de la
   farmacia.
10. Alta de cada empleado, validación de roles, 2FA y vía de recuperación antes
    de retirar el acceso de desarrollo.

## Decisiones de seguridad y calidad

- No se muestran datos de contacto ficticios.
- No se anuncian precios, existencias, plazos ni descuentos inexistentes.
- Los productos incompletos permanecen sin posibilidad de compra.
- Los borradores legales se identifican como tales y no se indexan.
- Las reseñas no se simulan: requieren una compra pagada del mismo producto.

Cuando la farmacia entregue los diez bloques anteriores, la mayor parte se
resolverá desde el panel o Shopify; solo la transferencia de cuenta y la
validación final requieren una intervención técnica controlada.
