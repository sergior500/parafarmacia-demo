# Arquitectura

## Objetivo

La base evita que una decisión todavía desconocida —ERP, plataforma de comercio,
pago, transporte o fuente de catálogo— contamine las reglas comerciales y la
interfaz. La dirección de dependencias es:

```text
app / components
        ↓
features / casos de uso
        ↓
domain ← provider ports
        ↑
mock adapters
```

El dominio no importa React, Next.js, almacenamiento ni SDKs externos.

## Capas

### Dominio

- `product`: estados, disponibilidad, búsqueda y ordenación.
- `cart`: límites, stock, promociones futuras y cálculo monetario.
- `order`: máquina de estados, permisos y auditoría.
- `customer`: esquema Zod limitado a datos de contacto.
- `user`: roles internos.
- `audit`: registro inmutable de acciones.

### Puertos

`src/providers/ports.ts` define:

- `CatalogProvider`
- `InventoryProvider`
- `MedicationInformationProvider`
- `CommerceProvider`
- `PaymentProvider`
- `ShippingProvider`
- `NotificationProvider`
- `OrderRepository`
- `AuditRepository`
- `OrderReviewService`

Las implementaciones mock actuales resuelven datos locales o fallan
explícitamente cuando una capacidad está deshabilitada.

### Interfaz

Las páginas son Server Components salvo filtros, carrito, formulario y panel
interactivo. `DemoProvider` es la frontera cliente que orquesta los adaptadores
mock y persiste únicamente el estado demostrativo.

## Sustitución de adaptadores

1. Crear una clase que implemente el puerto correspondiente.
2. Validar la respuesta externa en la frontera con Zod.
3. Traducir DTOs del proveedor al modelo de dominio.
4. Inyectar la implementación en la composición de la aplicación.
5. Añadir pruebas de contrato compartidas con el mock.
6. Mantener SDKs, webhooks y credenciales fuera de componentes y dominio.

Para pedidos reales, `OrderRepository` y `AuditRepository` deberán ejecutarse en
servidor, con transacciones, control de concurrencia e identidad autenticada.

## Árbol principal

```text
src/
├── app/
│   ├── (storefront)/
│   ├── admin/
│   ├── api/demo/health/
│   ├── layout.tsx
│   ├── globals.css
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── layout/
│   ├── shared/
│   └── ui/
├── domain/
│   ├── audit/
│   ├── cart/
│   ├── customer/
│   ├── order/
│   ├── product/
│   └── user/
├── features/
│   ├── admin/
│   ├── cart/
│   ├── catalog/
│   ├── checkout/
│   └── demo/
├── lib/
├── mocks/
├── providers/
└── test/
```
