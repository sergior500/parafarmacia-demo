-- PostgreSQL 15+ / Supabase compatible
-- Los precios, el stock y los EAN se mantienen NULL hasta validación comercial.

CREATE TABLE catalog_sources (
  source_id text PRIMARY KEY,
  file_name text NOT NULL,
  catalog_family text NOT NULL,
  description text,
  page_count integer CHECK (page_count > 0)
);

CREATE TABLE categories (
  category_id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text
);

CREATE TABLE products (
  product_id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  lifecycle_status text NOT NULL DEFAULT 'draft'
    CHECK (lifecycle_status IN ('draft', 'published', 'inactive', 'archived')),
  review_status text NOT NULL DEFAULT 'pending_commercial_validation'
    CHECK (review_status IN ('pending_commercial_validation', 'pending_legal_validation', 'ready')),
  name text NOT NULL,
  brand text NOT NULL,
  category_id text NOT NULL REFERENCES categories(category_id),
  size_label text,
  size_extracted text,
  format_label text,
  price_cents integer CHECK (price_cents >= 0),
  tax_rate numeric(5,2) NOT NULL CHECK (tax_rate >= 0),
  currency char(3) NOT NULL DEFAULT 'EUR',
  stock_quantity integer CHECK (stock_quantity >= 0),
  maximum_units_per_order integer NOT NULL DEFAULT 6 CHECK (maximum_units_per_order > 0),
  available_online boolean NOT NULL DEFAULT false,
  requires_special_transport boolean NOT NULL DEFAULT false,
  image_path text,
  ean text UNIQUE,
  source_id text REFERENCES catalog_sources(source_id),
  source_page integer CHECK (source_page > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (available_online = false OR (lifecycle_status = 'published' AND review_status = 'ready' AND price_cents IS NOT NULL AND stock_quantity IS NOT NULL))
);

CREATE TABLE product_content (
  product_id text PRIMARY KEY REFERENCES products(product_id) ON DELETE CASCADE,
  short_description text NOT NULL,
  description text NOT NULL,
  usage_instructions text,
  ingredients text,
  warnings text
);

CREATE TABLE product_benefits (
  product_id text NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  position smallint NOT NULL CHECK (position > 0),
  benefit text NOT NULL,
  PRIMARY KEY (product_id, position)
);

CREATE TABLE product_needs (
  product_id text NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  need_slug text NOT NULL,
  PRIMARY KEY (product_id, need_slug)
);

CREATE INDEX products_category_idx ON products(category_id);
CREATE INDEX products_review_status_idx ON products(review_status);
CREATE INDEX products_source_idx ON products(source_id);
CREATE INDEX product_needs_slug_idx ON product_needs(need_slug);
