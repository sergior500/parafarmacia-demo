# Paquete de catálogo para base de datos

Este directorio contiene un esquema compatible con PostgreSQL 15+ y Supabase, además de CSV y JSON para importar las 183 fichas extraídas de los catálogos facilitados.

## Orden de importación

1. Ejecutar `schema.postgresql.sql`.
2. Importar `seed/catalog_sources.csv`.
3. Importar `seed/categories.csv`.
4. Importar `seed/products.csv`.
5. Importar `seed/product_content.csv`.
6. Importar `seed/product_benefits.csv`.
7. Importar `seed/product_needs.csv`.

## Criterios de seguridad de datos

- `price_cents`, `stock_quantity` y `ean` están vacíos porque no aparecen en las fichas técnicas.
- `size_label` y `format_label` permanecen vacíos. `size_extracted` conserva el texto automático únicamente como ayuda de revisión.
- Todos los productos comienzan en `draft`, con `available_online=false` y `review_status=pending_commercial_validation`.
- Las imágenes se referencian por ruta. En producción deben copiarse a almacenamiento de objetos/CDN y actualizar `image_path`.
- Los textos técnicos proceden de extracción automática y deben revisarse contra la página indicada antes de publicar.
- El archivo `catalog_bundle.json` agrupa todo el paquete para importadores que prefieran JSON.

## Flujo de revisión en el panel

La demo presenta tres estados comprensibles para el equipo de catálogo:

- **Pendiente**: equivale a `pending_commercial_validation`; la ficha no puede
  venderse.
- **Revisado**: el contenido se ha comprobado, pero todavía puede requerir
  precio, formato, EAN o stock antes de publicarse.
- **Publicado**: en producción se traducirá a `review_status=ready`,
  `lifecycle_status=published` y `available_online=true`, siempre que se cumplan
  todas las validaciones.

En la demo estas revisiones se guardan solo en el navegador. La base de datos de
producción deberá guardar el usuario revisor, la fecha, el historial de cambios
y la versión de la fuente.
