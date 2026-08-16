# Arquitectura y controles de seguridad

**Proyecto:** Farmacia Picual - comercio electrónico de parafarmacia
**Versión del documento:** 1.0
**Fecha de revisión:** 17 de agosto de 2026
**Ámbito:** escaparate público, panel administrativo, base de datos D1, almacenamiento R2 e integración con Shopify.

## 1. Objetivo y límite de la garantía

El objetivo es reducir la probabilidad y el impacto de accesos no autorizados, fraude administrativo, manipulación del catálogo, abuso de endpoints, robo de credenciales, inyección de código y falsificación de eventos de Shopify.

La seguridad no depende de que las URL de los endpoints sean desconocidas. Se asume que un atacante puede descubrir todas las rutas, leer el JavaScript público y repetir peticiones. Cada operación sensible debe demostrar identidad, permiso, origen legítimo y una prueba CSRF válida antes de ejecutar lógica de negocio.

Ningún sistema conectado a Internet puede garantizar riesgo cero ni protección absoluta frente a cualquier ataque. Este proyecto aplica defensa en profundidad, mínimo privilegio, bloqueo seguro ante fallos y trazabilidad. La puesta en producción debe completarse con operación segura, actualizaciones, copias de seguridad, monitorización y una prueba de penetración independiente.

## 2. Fronteras de confianza

Flujo de una operación administrativa:

1. El navegador inicia sesión mediante la identidad gestionada por Sites/ChatGPT.
2. La plataforma incorpora cabeceras de identidad autenticada al enviar la petición a la aplicación.
3. El Worker genera un identificador de petición no controlable por el cliente y, para el panel, un nonce CSP distinto en cada respuesta.
4. La puerta administrativa verifica la lista permitida, el rol, la capacidad solicitada, el origen, el token CSRF y el límite de uso.
5. La ruta valida tipo, tamaño y estructura de los datos.
6. La lógica de dominio verifica el estado del recurso y ejecuta la operación.
7. Solo el servidor accede a D1, R2 y Shopify utilizando credenciales que nunca se entregan al navegador.
8. La operación o su rechazo queda correlacionado mediante registros de auditoría.

La plataforma de hosting es una frontera de confianza: la aplicación confía en que Sites elimina o sustituye las cabeceras de identidad enviadas por visitantes y solo reenvía una identidad autenticada. Para el alojamiento definitivo debe mantenerse esta garantía o sustituirse por un proveedor de identidad con tokens firmados verificables en el servidor.

## 3. Autenticación y autorización

### 3.1 Autenticación

- Las páginas y APIs del panel requieren una identidad autenticada suministrada por Sites.
- Una identidad autenticada no obtiene acceso automáticamente: también debe aparecer en una lista administrativa configurada en el servidor.
- Una configuración vacía bloquea el acceso. No existe un administrador predeterminado en producción.
- Las rutas de navegador redirigen a inicio de sesión; las APIs responden con `401` sin ejecutar la operación.
- En desarrollo local se utiliza un propietario de pruebas. Esta excepción no se activa con `NODE_ENV=production`.

### 3.2 Roles de mínimo privilegio

| Rol                   |          Catálogo | Publicar |        Inventario |               Pedidos | Shopify/configuración | Seguridad |
| --------------------- | ----------------: | -------: | ----------------: | --------------------: | --------------------: | --------: |
| Propietario           | Lectura/escritura |       Sí | Lectura/escritura | Lectura y preparación |                    Sí |        Sí |
| Gestor de catálogo    | Lectura/escritura |       Sí | Lectura/escritura |                    No |                    No |        No |
| Gestor de operaciones |                No |       No | Lectura/escritura | Lectura y preparación |                    No |        No |
| Auditor               |      Solo lectura |       No |      Solo lectura |          Solo lectura |                    No |   Lectura |

Las listas antiguas `ADMIN_ALLOWED_*` se interpretan como propietario para conservar compatibilidad. En producción deben utilizarse las listas específicas por rol y conceder a cada persona únicamente lo necesario.

La interfaz oculta secciones no permitidas, pero la seguridad real se aplica de nuevo en el servidor. Manipular el HTML o llamar manualmente a una API no evita la comprobación.

### 3.3 MFA y protección de cuentas

La aplicación no gestiona contraseñas. Cada cuenta administrativa debe activar autenticación multifactor en su proveedor de identidad, usar un dispositivo individual y no compartir sesiones. La baja de un empleado exige retirarlo inmediatamente de las listas de acceso y revocar sus sesiones.

## 4. Protección de operaciones administrativas

### 4.1 Origen y CSRF

Las mutaciones requieren simultáneamente:

- `Origin` exactamente igual al origen de la aplicación.
- `Sec-Fetch-Site` ausente o `same-origin`.
- Token CSRF firmado con HMAC-SHA256.
- Token ligado al identificador del administrador y al origen.
- Caducidad de diez minutos y margen de reloj limitado.

El navegador obtiene el token desde una API autenticada que no admite caché y lo envía en una cabecera personalizada. Si caduca, el cliente solicita uno nuevo una sola vez. Un sitio externo puede intentar enviar un formulario, pero no puede leer el token debido a la política de mismo origen. Un token modificado, caducado, emitido para otro usuario u otro dominio se rechaza con estado `419`.

El token CSRF no protege frente a una vulnerabilidad XSS ejecutada dentro del propio origen. Por eso se combina con CSP, validación de contenido y ausencia de renderizado HTML arbitrario.

### 4.2 Límites de abuso persistentes

En producción los límites se almacenan en D1 y se actualizan atómicamente. La clave es una huella HMAC de administrador, red y familia de operación; no se guarda la IP en texto claro.

Se aplican políticas más estrictas a importaciones, imágenes, sincronización, publicación, inventario, preparación de pedidos y configuración de Shopify. Los lotes de catálogo están limitados a diez productos.

Si D1 o el secreto de seguridad no están disponibles, la operación se bloquea con `503`: el sistema falla de forma cerrada. En desarrollo local se conserva un limitador en memoria para facilitar pruebas.

### 4.3 Validación, tamaño y tipos de contenido

- Los cuerpos JSON exigen `application/json`, un tamaño máximo y JSON válido.
- Los contratos se validan con esquemas Zod y enumeraciones cerradas.
- Identificadores de Shopify deben cumplir el formato GID esperado.
- Cantidades y existencias tienen límites enteros explícitos.
- Las importaciones CSV están limitadas a 1 MB y se previsualizan antes de aplicarse.
- Las imágenes están limitadas a 5 MB.
- JPEG, PNG y WebP se validan por bytes mágicos, no solo por nombre o MIME declarado.
- Las claves de R2 las genera el servidor y no utilizan el nombre enviado por el usuario.

### 4.4 Estado e idempotencia

Antes de publicar un producto, el servidor comprueba que está sincronizado, aprobado y que dispone de precio, stock, formato e imagen. Ocultar o publicar establece un estado deseado en Shopify, reduciendo el efecto de repeticiones.

Las operaciones de inventario y preparación de pedidos utilizan claves de idempotencia de Shopify. La preparación de un pedido conserva el mismo identificador durante un reintento para evitar dobles ejecuciones.

## 5. Protección del navegador

Todas las respuestas incluyen, entre otras, las siguientes defensas:

- Content Security Policy.
- `frame-ancestors 'none'` y `X-Frame-Options: DENY` contra clickjacking.
- `object-src 'none'`, `base-uri 'self'` y `form-action 'self'`.
- `script-src-attr 'none'` para bloquear manejadores JavaScript en atributos HTML.
- Nonce criptográfico y `strict-dynamic` en el panel de producción, eliminando `unsafe-inline` de scripts administrativos.
- HSTS sobre HTTPS.
- `X-Content-Type-Options: nosniff`.
- políticas de referente, permisos, apertura y recursos entre orígenes.
- `no-store` y `noindex` en el panel y en las APIs.
- identificador de petición generado por el Worker.

El escaparate público conserva temporalmente una política de scripts compatible con la generación estática del framework. No maneja credenciales administrativas y no renderiza HTML aportado por usuarios, pero la eliminación total de `unsafe-inline` en el escaparate queda como mejora futura que debe desplegarse primero en modo `Content-Security-Policy-Report-Only`.

## 6. Shopify y secretos

### 6.1 Credenciales

- El dominio, identificador, secreto, tokens y secreto de webhooks son variables exclusivas del servidor.
- Ninguna credencial utiliza el prefijo `NEXT_PUBLIC_`.
- El navegador nunca recibe el token de Admin API.
- El token obtenido mediante client credentials es temporal, se mantiene en memoria y se renueva antes de caducar.
- Las llamadas a Shopify tienen un tiempo máximo y devuelven mensajes controlados.

Todos los secretos utilizados durante el desarrollo deben rotarse antes de la puesta en producción. La tienda y aplicación definitivas deben pertenecer a la empresa, usar credenciales distintas de desarrollo y producción y permitir revocación inmediata.

### 6.2 Mínimo privilegio

La aplicación solicita únicamente alcances ligados a funciones implementadas. La publicación requiere lectura/escritura de publicaciones y escritura de productos; pedidos, inventario y Storefront se separan por alcance. Añadir un alcance nuevo exige revisión, documentación y aprobación del propietario de la tienda.

Conocer un endpoint interno no permite llamar directamente a Shopify. Para ello sería necesario superar la autenticación y autorización de la aplicación o robar una credencial de servidor. Incluso en ese caso, Shopify limita el impacto a los alcances concedidos.

### 6.3 Webhooks

Los webhooks públicos no confían en la dirección de origen. Se verifica HMAC-SHA256 sobre el cuerpo original, el dominio esperado, tema e identificador. Cada `X-Shopify-Webhook-Id` se registra para ignorar entregas duplicadas y evitar reproducción. El tamaño del cuerpo está limitado y solo se procesan temas conocidos.

## 7. Auditoría, privacidad y monitorización

Hay dos niveles de registro:

1. Auditoría funcional de cambios de catálogo, inventario, pedidos y publicación, asociada al administrador.
2. Eventos de seguridad bloqueados por falta de autenticación, permiso, origen, CSRF o exceso de frecuencia.

El Worker genera un identificador de petición para correlacionar aplicación y hosting. La IP y el agente de usuario se convierten en huellas HMAC truncadas; permiten detectar repeticiones sin conservar los valores originales. Los eventos de seguridad tienen una retención automática de noventa días.

La sección `/admin/seguridad` permite al propietario y al auditor revisar los últimos eventos bloqueados. En producción se recomienda añadir alertas externas para picos de `401`, `403`, `419`, `429`, cambios masivos y fallos de Shopify.

Los registros no deben contener tokens, secretos, cuerpos completos, números de tarjeta ni datos sanitarios. La aplicación no procesa ni almacena datos de pago: el checkout y la captura quedan bajo Shopify y su proveedor de pagos.

## 8. Ataques contemplados

| Amenaza                                      | Control principal                                  | Control adicional                               |
| -------------------------------------------- | -------------------------------------------------- | ----------------------------------------------- |
| Descubrimiento o llamada manual de endpoints | Autenticación y RBAC en servidor                   | CSRF, origen y rate limit                       |
| CSRF                                         | Token HMAC ligado a usuario/origen                 | `Origin` y `Sec-Fetch-Site`                     |
| Fuerza bruta y automatización                | Límite persistente por usuario/red/operación       | Registro y alerta                               |
| Escalada horizontal o vertical               | Capacidades verificadas en cada ruta               | Navegación filtrada y auditoría                 |
| XSS                                          | CSP estricta con nonce en el panel                 | Validación, React escapado, sin HTML arbitrario |
| Clickjacking                                 | `frame-ancestors 'none'`                           | `X-Frame-Options: DENY`                         |
| Carga maliciosa                              | Límites, MIME y firmas de archivo                  | R2 con claves generadas por servidor            |
| Inyección SQL                                | ORM y consultas preparadas                         | Esquemas cerrados y límites de entrada          |
| SSRF hacia Shopify                           | Dominio Shopify validado y configurado en servidor | El cliente no elige destino                     |
| Webhook falso o repetido                     | HMAC y dominio esperado                            | Identificador único persistente                 |
| Repetición de pedido/inventario              | Idempotencia Shopify                               | Confirmación explícita y auditoría              |
| Fuga de secretos al frontend                 | Variables solo servidor                            | Escaneo del repositorio y rotación              |
| Caída de controles                           | Bloqueo `503` en producción                        | Monitorización y procedimiento de incidente     |

## 9. Verificación realizada

La fase incluye:

- Comprobación de tipos TypeScript.
- Análisis estático ESLint.
- Compilación completa de producción.
- Pruebas unitarias y de regresión del proyecto.
- Pruebas de token CSRF válido, manipulado, caducado, de otro usuario y de otro origen.
- Pruebas de roles y capacidades.
- Pruebas de origen exacto.
- Pruebas de límites de uso.
- Pruebas de cabeceras y CSP con nonce.
- Escaneo del repositorio para detectar patrones de credenciales y archivos `.env` versionados.

Estas verificaciones no sustituyen una prueba de penetración ejecutada desde fuera de la infraestructura ni una auditoría de la configuración final de Shopify y del dominio.

## 10. Requisitos antes de producción

1. Crear tienda, organización y aplicación Shopify propiedad de la farmacia.
2. Rotar todos los secretos de desarrollo y crear secretos exclusivos de producción.
3. Configurar `ADMIN_SECURITY_SECRET` aleatorio de al menos 32 caracteres.
4. Sustituir la lista heredada de propietarios por roles individuales.
5. Activar MFA en cada cuenta con acceso administrativo y Shopify.
6. Conceder solo los alcances Shopify necesarios y verificar la conexión.
7. Definir dominio, HTTPS, políticas legales, correo y datos fiscales definitivos.
8. Configurar pagos, Bizum, impuestos, stock, envíos y notificaciones en Shopify.
9. Configurar copias de seguridad y comprobar una restauración.
10. Activar alertas y designar una persona responsable de revisarlas.
11. Ejecutar pruebas funcionales con productos y pedidos de prueba.
12. Contratar una prueba de penetración independiente antes de abrir al público o después de cambios relevantes.

## 11. Respuesta ante incidentes

Ante indicios de acceso no autorizado:

1. Bloquear temporalmente las mutaciones administrativas.
2. Retirar la identidad sospechosa de las listas de acceso.
3. Revocar sesiones y rotar el secreto de seguridad.
4. Revocar/rotar credenciales Shopify y tokens Storefront cuando proceda.
5. Conservar registros, referencias de petición y cronología sin alterarlos.
6. Comparar cambios de catálogo, inventario, publicación y pedidos.
7. Restaurar datos cuando sea necesario y verificar integridad.
8. Corregir la causa, probar la corrección y documentar el incidente.
9. Evaluar obligaciones de comunicación a afectados y autoridades conforme a RGPD.

## 12. Mantenimiento continuo

- Revisar dependencias y avisos de seguridad al menos mensualmente.
- Aplicar actualizaciones críticas con prioridad y repetir la batería de pruebas.
- Revisar accesos y roles trimestralmente y al cambiar personal.
- Rotar credenciales de forma periódica y siempre tras una exposición.
- Revisar eventos de seguridad semanalmente y alertas de forma inmediata.
- Repetir la prueba de penetración tras cambios de autenticación, pagos, Shopify o infraestructura.
- Mantener este documento sincronizado con el código y registrar cada excepción aceptada.

## 13. Referencias técnicas

- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP CSRF Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- OWASP API Security Top 10: https://owasp.org/www-project-api-security/
- Next.js Content Security Policy: https://nextjs.org/docs/app/guides/content-security-policy
- MDN Content Security Policy: https://developer.mozilla.org/docs/Web/HTTP/Guides/CSP
- Shopify authentication and authorization: https://shopify.dev/docs/apps/build/authentication-authorization
- Shopify access scopes: https://shopify.dev/docs/api/usage/access-scopes
- Shopify client credentials: https://shopify.dev/docs/apps/build/authentication-authorization/client-secrets
- Shopify webhooks: https://shopify.dev/docs/apps/build/webhooks
