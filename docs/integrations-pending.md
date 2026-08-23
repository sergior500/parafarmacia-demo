# Integraciones y decisiones pendientes

## Integrado técnicamente

| Área       | Implementación actual                                                         |
| ---------- | ----------------------------------------------------------------------------- |
| Catálogo   | D1 en la aplicación y sincronización con Shopify Admin API                    |
| Imágenes   | R2, validación de tipo/firma y sincronización con Shopify                     |
| Inventario | Shopify por ubicación, activación y actualización con control de concurrencia |
| Checkout   | Shopify Storefront API y checkout alojado por Shopify                         |
| Pedidos    | Lectura, métricas, detalle y fulfillment desde el panel propio                |
| Clientes   | Shopify Customer Account OAuth 2.0 + PKCE                                     |
| Eventos    | Webhooks Shopify autenticados e idempotentes                                  |
| Panel      | Identidad del hosting, roles y permisos comprobados en servidor               |

## Pendiente de la empresa o de producción

| Área         | Decisión o dato necesario                                                                |
| ------------ | ---------------------------------------------------------------------------------------- |
| Propiedad    | Organización, tienda y aplicación Shopify definitivas de la farmacia                     |
| Catálogo     | Precios, IVA, stock, formatos, imágenes autorizadas y aprobación de cada ficha           |
| Pago         | Contrato y activación de tarjeta y Bizum; retirada de la pasarela de prueba              |
| Transporte   | Zonas, tarifas, transportista, plazos, incidencias y seguimiento                         |
| Fiscalidad   | Configuración fiscal revisada para los territorios de venta                              |
| Legal        | Identidad mercantil, privacidad, cookies, compra, desistimiento y devoluciones validadas |
| Comunicación | Dominio, remitente de correo, plantillas y datos de contacto reales                      |
| Operación    | Responsables, MFA, copias, restauración, alertas, soporte e incidentes                   |
| Analítica    | Herramienta, consentimiento y política de medición                                       |

La migración no debe copiar credenciales de la cuenta de desarrollo. Deben
crearse secretos nuevos, instalarse la aplicación en la tienda definitiva,
concederse solo los scopes necesarios y repetir las pruebas de conexión,
checkout, inventario, webhooks y fulfillment.
