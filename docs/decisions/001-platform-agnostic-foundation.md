# ADR 001: Base independiente de plataforma

- Estado: aceptada
- Fecha: 2026-07-25

## Contexto

No se conocen todavía ERP, plataforma de comercio, pasarela, transportista,
fuente de catálogo ni persistencia. Acoplar la primera fase a una marca
concreta convertiría supuestos en dependencias costosas.

## Decisión

Mantener modelos y reglas en un dominio puro. Representar cada servicio externo
como un puerto TypeScript e implementar adaptadores mock locales. La interfaz
consume casos de uso y modelos internos, nunca DTOs o SDKs de proveedores.

## Consecuencias positivas

- El flujo se demuestra sin credenciales ni datos reales.
- Los proveedores pueden evaluarse y cambiarse de forma aislada.
- Las reglas comerciales y de permisos son testeables.
- Los errores externos se traducirán en una frontera explícita.

## Costes y límites

- Existe una capa de mapeo adicional.
- Los mocks no reproducen latencia, fallos ni concurrencia reales.
- La composición de dependencias deberá evolucionar al introducir servidor y
  persistencia.

## Alternativas descartadas

- Integración directa con Shopify o un ERP desconocido.
- Componentes que llaman SDKs externos.
- Base de datos prematura sin requisitos de operación y privacidad.
