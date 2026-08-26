# Migración a la tienda Shopify definitiva

La tienda `99vh1p-pz.myshopify.com` y la aplicación actuales son recursos de
desarrollo. No deben convertirse por inercia en la instalación comercial: la
farmacia debe ser propietaria de la organización, tienda, aplicación, contratos
de pago y credenciales de producción.

## Preparación

1. Crear o identificar la organización y tienda propiedad de la farmacia.
2. Dar acceso individual al responsable técnico; no compartir contraseñas.
3. Exigir MFA a propietarios, administradores y desarrolladores.
4. Crear la aplicación definitiva y declarar únicamente los scopes utilizados,
   incluidos `read_customers` y `write_discounts` para los módulos internos.
5. Configurar URL de aplicación, redirecciones OAuth y módulo de Customer
   Account para el dominio definitivo.
6. Generar secretos nuevos. No copiar el client secret, secretos CSRF, claves
   de sesión ni tokens de la cuenta de desarrollo.

## Migración de datos

1. Exportar el catálogo D1 y guardar una copia verificable.
2. Revisar duplicados, handles, EAN/SKU, precios, impuestos, formatos, imágenes,
   publicación y stock con la farmacia.
3. Importar primero como borrador y sin publicar.
4. Sincronizar por lotes desde el panel y registrar los nuevos GID de Shopify.
5. Activar inventario en la ubicación correcta y conciliar cantidades.
6. No migrar pedidos, clientes ni eventos de prueba salvo necesidad legal y
   autorización expresa; los datos QA deben eliminarse o anonimizarse.

## Configuración comercial

1. Configurar mercados, moneda e impuestos con revisión profesional.
2. Contratar y activar tarjeta y Bizum; desactivar cualquier gateway de prueba.
3. Definir zonas, tarifas, transportista, plazos y notificaciones de envío.
4. Verificar dominio, DNS, HTTPS y remitentes de correo.
5. Incorporar la identidad y textos legales aprobados.

## Cambio de entorno

1. Crear recursos D1/R2 de producción separados y aplicar migraciones.
2. Configurar variables públicas definitivas y secretos mediante el hosting.
3. Instalar la aplicación y conceder los scopes mínimos.
4. Crear/verificar el token Storefront desde el panel.
5. Registrar webhooks y comprobar recepción, HMAC e idempotencia.
6. Vincular cuentas administrativas individuales y revisar roles.
7. Mantener la indexación desactivada hasta aprobar la apertura.

## Pruebas obligatorias

- Conexión Admin API y Customer Account OAuth.
- Alta, edición, imagen, sincronización, publicación y ocultación de producto.
- Ajuste concurrente de inventario y rechazo de stock insuficiente.
- Checkout correcto, pago rechazado y reintento sin duplicados.
- Pedido visible en el panel, reserva de stock, fulfillment y seguimiento.
- Webhooks duplicados e inválidos rechazados.
- Acceso denegado por rol, CSRF ausente, origen incorrecto y exceso de tasa.
- Copia, restauración, despliegue y reversión ensayados.

## Corte y reversión

La apertura debe tener una ventana acordada, responsables identificados y una
copia previa. Si falla pago, stock, checkout, identidad o webhooks, se vuelve a
desactivar la venta/indexación y se revierte al último despliegue verificado. La
tienda de desarrollo se conserva aislada hasta que producción haya superado el
periodo de estabilización; después se revocan sus credenciales y se limpian los
datos de prueba.
