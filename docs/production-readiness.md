# Preparación para producción

El panel `/admin/preparacion` calcula el estado técnico y comercial actual. Este
documento recoge el criterio de apertura: una compilación correcta no convierte
por sí sola el entorno de desarrollo en una tienda preparada para vender.

## Completado técnicamente

- D1 para catálogo y estado administrativo; R2 para imágenes.
- Shopify Admin y Storefront API para productos, publicación, inventario,
  checkout, pedidos y fulfillment.
- Panel autenticado con roles de mínimo privilegio y comprobación de permisos
  en cada operación sensible.
- CSRF, límites de frecuencia y tamaño, validación estructural, cabeceras
  defensivas y errores controlados.
- Webhooks con HMAC, allowlist de temas e idempotencia.
- Cuentas de cliente con OAuth 2.0 + PKCE y secretos cifrados.
- Consulta administrativa minimizada de clientes, códigos promocionales y
  reembolsos parciales idempotentes con permisos y auditoría independientes.
- Pruebas unitarias/de contrato, lint, tipado, compilación y auditoría de
  dependencias en el flujo de validación.

## Bloqueos externos antes de ventas reales

### Propiedad y secretos

- Migrar a una organización, tienda y aplicación propiedad de la farmacia.
- Crear credenciales nuevas, rotar cualquier secreto compartido durante el
  desarrollo y almacenarlo únicamente en el gestor de secretos.
- Dar cuentas individuales al personal, exigir MFA y asignar roles mínimos.

### Catálogo y operación

- Completar y aprobar precio, IVA, stock, formato e imagen de cada producto.
- Verificar ubicación de inventario, política de agotados y conciliación.
- Acordar quién prepara, envía, cancela, reembolsa y atiende incidencias.
- Probar restauración de datos y documentar recuperación y continuidad.

### Comercio

- Activar tarjeta y Bizum con la entidad/proveedor definitivo y retirar la
  pasarela de prueba.
- Configurar impuestos, mercados, moneda, tarifas y zonas de envío.
- Realizar compras de extremo a extremo en modo de prueba: éxito, rechazo,
  reintento, stock insuficiente, cancelación y reembolso.
- Configurar dominio y correos transaccionales definitivos.

### Legal y confianza

- Incorporar razón social, NIF/CIF, domicilio, contacto y responsables reales.
- Validar aviso legal, privacidad, cookies, condiciones de compra, envíos,
  desistimiento y excepciones de devolución con asesoría competente.
- No publicar reseñas ficticias ni afirmaciones sanitarias no autorizadas.
- Cerrar la lista de [preparación legal](./legal-readiness.md).

### Seguridad y calidad final

- Ejecutar pruebas E2E en el dominio y la tienda definitivos.
- Verificar CSP/cabeceras, cookies, callbacks OAuth y webhooks desde producción.
- Configurar monitorización y alertas externas, retención y respuesta ante
  incidentes.
- Hacer una revisión de accesibilidad y una prueba de penetración independiente.
- Documentar despliegue, migraciones, reversión y responsables de guardia.

## Evidencia mínima para autorizar apertura

1. Informe del panel de preparación sin bloqueos críticos.
2. Catálogo publicado revisado por la farmacia.
3. Compra de prueba completa con stock, pedido, correo y fulfillment correctos.
4. Pago de prueba rechazado sin pedido/cobro incorrecto.
5. Restauración comprobada y procedimiento de reversión ensayado.
6. Aprobación escrita de negocio, legal, operaciones y responsable técnico.
