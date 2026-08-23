# Decisiones de UX, SEO y rendimiento

## Arquitectura de información

La navegación combina tres formas de encontrar un producto:

1. Categorías comerciales: dermocosmética, solar, higiene, infantil, nutrición,
   bienestar y ortopedia ligera.
2. Necesidades expresadas con lenguaje cotidiano: piel sensible, caída del
   cabello, cuidado del bebé o recuperación muscular.
3. Búsqueda predictiva por producto, marca y necesidad.

La cuenta, los favoritos y el checkout se mantienen separados de las páginas
indexables. El panel interno conserva su propia navegación y permisos.

## Identidad visual

La dirección se define como una “botica contemporánea”: marfil cálido como base,
verde bosque y salvia para continuidad y confianza, azul petróleo para bloques
de autoridad y melocotón como acento. Los titulares usan una serif editorial y
las operaciones una sans de alta legibilidad.

Se evita repetir la misma tarjeta en todas las secciones. La portada alterna
composición fotográfica, accesos compactos, bloques editoriales y cuadrículas de
producto. El recurso del hero es original, sin marcas, texto ni promesas.

## Conversión y confianza

- Buscador visible en móvil y escritorio.
- Navegación por necesidad para personas que no conocen nombres técnicos.
- Precio por unidad, stock, entrega y devoluciones cerca de la acción de compra.
- Barra fija de compra en la ficha móvil.
- Entrega calculada por Shopify y compra como invitado en el carrito.
- Checkout alojado por Shopify para contacto, dirección, envío y pago.
- No se muestran reseñas, descuentos, urgencia o disponibilidad inventados.

## Accesibilidad

Se utilizan landmarks, encabezados jerárquicos, labels visibles u ocultos,
estados de foco de alto contraste, áreas táctiles de al menos 44 píxeles y
mensajes con `role=status` o `role=alert`. Las animaciones se desactivan con
`prefers-reduced-motion`.

## Estrategia SEO

- Canonical en inicio, categorías, productos, marcas y artículos.
- `noindex` para búsqueda, carrito, cuenta y favoritos.
- Los parámetros de filtros y ordenación se bloquean en `robots.txt` cuando se
  activa la indexación.
- Sitemap limitado a páginas comerciales y editoriales con valor propio.
- `WebSite` y `SearchAction` globales; `Article` en las guías y `FAQPage` solo
  donde las preguntas son visibles.
- No se publica `Product`, `Offer`, `Review` ni `LocalBusiness` estructurado
  mientras precio, reseñas y datos empresariales no estén validados.
- La tienda permanece completamente en `noindex` hasta activar explícitamente
  `NEXT_PUBLIC_ALLOW_INDEXING=true` después de validar contenido y negocio.

## Rendimiento

- App Router y Server Components para páginas y datos públicos.
- Componentes cliente limitados a búsqueda, filtros, carrito, favoritos y
  estado local de la cesta y favoritos.
- `next/image` con dimensiones reservadas y prioridad solo en el hero.
- Sin carruseles automáticos ni librerías visuales adicionales.
- Rejillas CSS, contenido estático y recursos bajo el primer viewport cargados
  sin JavaScript específico.

## Pendiente antes de producción

Conectar catálogo, imágenes, stock, pagos y transporte; completar autenticación
de servidor; validar información de fabricante y textos legales; añadir reseñas
solo desde un proveedor con compra verificada; realizar pruebas WCAG y Core Web
Vitals con dispositivos y red reales.
