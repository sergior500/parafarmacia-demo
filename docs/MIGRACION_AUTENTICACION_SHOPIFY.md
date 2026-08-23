# Migración de autenticación a Shopify

## Decisión

Shopify será la fuente de identidad del personal en producción. El panel de
Farmacia Picual seguirá siendo la interfaz operativa y conservará sus propios
roles de mínimo privilegio. El acceso actual de Sites/ChatGPT es provisional y
se mantiene únicamente para desarrollo y para impedir un bloqueo durante la
migración.

## Modelo de seguridad

- Cada empleado utiliza una cuenta individual de Shopify con 2FA.
- Shopify autentica a la persona; el panel autoriza cada operación según su rol.
- El identificador de Shopify se obtiene solo de un token validado en servidor.
  Nunca se acepta desde formularios, parámetros o cabeceras del navegador.
- El correo solo sirve para la invitación inicial y solo puede vincular una
  identidad si Shopify confirma que está verificado.
- Los identificadores son únicos. Un usuario ya vinculado no puede sustituirse
  por otro que presente el mismo correo.
- Las acciones sensibles siguen exigiendo sesión válida, permiso, origen
  correcto, protección CSRF, límites de frecuencia y registro de auditoría.
- Los trabajos automáticos usan credenciales de servicio con permisos mínimos;
  no reutilizan la sesión de ningún empleado.

## Migración sin bloqueo

1. Transferir o reinstalar la aplicación en la cuenta real de Farmacia Picual.
2. Configurar dominio, credenciales y URL de retorno del entorno definitivo.
3. Dar de alta cuentas individuales de Shopify y exigir 2FA.
4. Mantener temporalmente los dos métodos de acceso.
5. Vincular el Shopify ID verificado de cada miembro con su registro y rol.
6. Probar propietario, catálogo, operaciones y solo lectura.
7. Probar cierre de sesión, revocación, usuario desactivado y recuperación.
8. Confirmar que existen al menos dos propietarios operativos o una vía de
   recuperación controlada antes del cambio.
9. Cambiar el proveedor principal a Shopify y vigilar los eventos de seguridad.
10. Retirar el acceso provisional y sus secretos solo después de la validación.

## Condiciones que bloquean el cambio final

- La aplicación sigue perteneciendo a la cuenta de desarrollo.
- El propietario real no ha iniciado sesión correctamente.
- Hay usuarios compartiendo credenciales.
- No está habilitado el segundo factor.
- Los roles no han sido probados contra operaciones reales.
- No existe procedimiento de recuperación o revocación.

## Implementación preparada

La tabla de equipo conserva por separado la identidad provisional y el
`shopify_user_id`. La vinculación de Shopify se realiza mediante una función de
servidor que exige correo verificado, cuenta habilitada y ausencia de un vínculo
previo distinto. La interfaz muestra el estado de transición de cada persona.

El callback OAuth definitivo no debe activarse contra la tienda de desarrollo
como si fuera producción. Se completará al disponer de la cuenta real, su URL
definitiva y la instalación transferida.
