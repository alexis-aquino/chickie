-- Local MySQL schema for Chickie. Safe to re-run (CREATE TABLE IF NOT EXISTS):
--   mysql -u root -p chickie < server/schema.sql

CREATE TABLE IF NOT EXISTS organizations (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    organization_id CHAR(36) NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    phone VARCHAR(64),
    theme VARCHAR(32) NOT NULL DEFAULT 'default',
    accent_color VARCHAR(16) NOT NULL DEFAULT '#dc2626',
    provider VARCHAR(16) NOT NULL DEFAULT 'email',
    created_at DATETIME NOT NULL,
    INDEX idx_users_organization_id (organization_id)
);

CREATE TABLE IF NOT EXISTS suppliers (
    id CHAR(36) PRIMARY KEY,
    organization_id CHAR(36) NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    phone VARCHAR(64),
    categories JSON,
    rating DECIMAL(4, 2),
    on_time_rate DECIMAL(5, 2),
    status VARCHAR(32),
    last_delivery VARCHAR(32),
    INDEX idx_suppliers_organization_id (organization_id)
);

CREATE TABLE IF NOT EXISTS inventory_items (
    id CHAR(36) PRIMARY KEY,
    organization_id CHAR(36) NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    supplier_id CHAR(36) REFERENCES suppliers(id),
    unit VARCHAR(32) NOT NULL,
    quantity DECIMAL(12, 2),
    par DECIMAL(12, 2),
    reorder_point DECIMAL(12, 2),
    unit_cost DECIMAL(12, 2),
    created_at DATETIME NOT NULL,
    INDEX idx_inventory_items_organization_id (organization_id)
);

CREATE TABLE IF NOT EXISTS purchase_records (
    id CHAR(36) PRIMARY KEY,
    organization_id CHAR(36) NOT NULL REFERENCES organizations(id),
    item_id CHAR(36) NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    supplier_id CHAR(36) REFERENCES suppliers(id),
    date VARCHAR(32) NOT NULL,
    expected_delivery VARCHAR(32) NOT NULL,
    quantity DECIMAL(12, 2),
    unit_price DECIMAL(12, 2),
    delivered BOOLEAN NOT NULL DEFAULT FALSE,
    INDEX idx_purchase_records_organization_id (organization_id)
);

CREATE TABLE IF NOT EXISTS customers (
    id CHAR(36) PRIMARY KEY,
    organization_id CHAR(36) NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(64),
    join_date VARCHAR(32),
    loyalty_points INT,
    tier VARCHAR(32),
    favorite_items JSON,
    tags JSON,
    INDEX idx_customers_organization_id (organization_id)
);

CREATE TABLE IF NOT EXISTS customer_orders (
    id CHAR(36) PRIMARY KEY,
    organization_id CHAR(36) NOT NULL REFERENCES organizations(id),
    customer_id CHAR(36) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    date VARCHAR(32) NOT NULL,
    items JSON,
    total DECIMAL(12, 2),
    status VARCHAR(32),
    INDEX idx_customer_orders_organization_id (organization_id)
);

CREATE TABLE IF NOT EXISTS feedback_records (
    id CHAR(36) PRIMARY KEY,
    organization_id CHAR(36) NOT NULL REFERENCES organizations(id),
    customer_id CHAR(36) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_id CHAR(36) REFERENCES customer_orders(id),
    date VARCHAR(32) NOT NULL,
    rating INT,
    comment TEXT,
    INDEX idx_feedback_records_organization_id (organization_id)
);

CREATE TABLE IF NOT EXISTS promotions (
    id CHAR(36) PRIMARY KEY,
    organization_id CHAR(36) NOT NULL REFERENCES organizations(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount VARCHAR(64),
    linked_inventory_item_id CHAR(36) REFERENCES inventory_items(id),
    linked_menu_items JSON,
    target_tiers JSON,
    target_customer_ids JSON,
    expires_on VARCHAR(32),
    status VARCHAR(32),
    reason TEXT,
    INDEX idx_promotions_organization_id (organization_id)
);
