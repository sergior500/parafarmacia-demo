# Seguridad

## Controles presentes en la demostración

- TypeScript estricto y ausencia de `any` explícito.
- Validación Zod del formulario.
- Límites de longitud y formatos.
- Rechazo de `<` y `>` en campos de texto libres.
- Sin renderizado de HTML arbitrario.
- Sin secretos ni credenciales.
- Sin registro de datos personales en consola.
- Datos monetarios en céntimos.
- Reglas de permisos y estado centralizadas.
- Banner de demostración y robots bloqueados.
- Proveedores de pago y transporte deshabilitados explícitamente.

## Límites de seguridad

`localStorage` no es una fuente de confianza. El usuario puede modificar
carrito, pedidos y roles. Esto es aceptable únicamente porque los datos son
ficticios y no existe backend. Ninguna de estas comprobaciones constituye una
garantía de seguridad para producción.

## Requisitos para una versión real

- Autenticación robusta y sesiones de servidor.
- Autorización por caso de uso y minimización de datos.
- Base de datos transaccional con row-level access cuando corresponda.
- Auditoría inmutable y sellada en servidor.
- Protección CSRF, rate limiting y cabeceras revisadas.
- Gestión de secretos y rotación.
- Validación de webhooks y firmas.
- Idempotencia de pedidos, pagos y notificaciones.
- Cifrado, backups, retención y borrado.
- Revisión de dependencias, SAST/DAST y pruebas de penetración.
- Evaluación DPIA/privacidad por especialistas cuando proceda.
- Procedimiento de incidentes y monitorización sin datos sensibles.
