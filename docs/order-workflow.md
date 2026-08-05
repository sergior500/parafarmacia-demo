# Flujo comercial de pedidos

```text
borrador → confirmado → en preparación → enviado → entregado
                 ↘ cancelado             ↘ reembolsado
                        ↘ cancelado              ↘ reembolsado
```

La confirmación sucede al terminar el formulario demo. No hay cobro ni reserva
real de stock.

## Acciones

| Desde          | Acción                | Resultado      | Roles                               |
| -------------- | --------------------- | -------------- | ----------------------------------- |
| Confirmado     | Iniciar preparación   | En preparación | Administración, gestión de pedidos  |
| Confirmado     | Cancelar con motivo   | Cancelado      | Administración, gestión de pedidos  |
| En preparación | Marcar como enviado   | Enviado        | Administración, gestión de pedidos  |
| En preparación | Cancelar con motivo   | Cancelado      | Administración, gestión de pedidos  |
| Enviado        | Marcar como entregado | Entregado      | Administración, gestión de pedidos  |
| Enviado        | Registrar reembolso   | Reembolsado    | Administración, atención al cliente |
| Entregado      | Registrar reembolso   | Reembolsado    | Administración, atención al cliente |

Cancelar y reembolsar exigen motivo. Todas las transiciones y notas internas se
añaden al historial del pedido.
