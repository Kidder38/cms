-- Přidání funkcí a triggerů pro aktualizaci timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabulka pro propojení uživatelů a zákazníků
CREATE TABLE IF NOT EXISTS user_customer_access (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  access_type VARCHAR(20) DEFAULT 'read', -- read, write, admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, customer_id)
);

-- Tabulka pro propojení uživatelů a zakázek
CREATE TABLE IF NOT EXISTS user_order_access (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  access_type VARCHAR(20) DEFAULT 'read', -- read, write, admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, order_id)
);

-- Triggery pro aktualizaci timestamps
CREATE TRIGGER update_user_customer_access_modtime
BEFORE UPDATE ON user_customer_access
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_user_order_access_modtime
BEFORE UPDATE ON user_order_access
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Indexy pro zrychlení vyhledávání
CREATE INDEX idx_user_customer_access_user_id ON user_customer_access(user_id);
CREATE INDEX idx_user_customer_access_customer_id ON user_customer_access(customer_id);
CREATE INDEX idx_user_order_access_user_id ON user_order_access(user_id);
CREATE INDEX idx_user_order_access_order_id ON user_order_access(order_id);

-- Přidání tabulky pro inventuru
CREATE TABLE IF NOT EXISTS inventory_checks (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  check_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- in_progress, completed, canceled
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Přidání tabulky pro položky inventury
CREATE TABLE IF NOT EXISTS inventory_check_items (
  id SERIAL PRIMARY KEY,
  inventory_check_id INTEGER NOT NULL REFERENCES inventory_checks(id) ON DELETE CASCADE,
  equipment_id INTEGER NOT NULL REFERENCES equipment(id),
  expected_quantity INTEGER NOT NULL,
  actual_quantity INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Přidání tabulky pro prodej zboží ze skladu
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  invoice_number VARCHAR(50),
  sale_date DATE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Přidání tabulky pro položky prodeje
CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  equipment_id INTEGER NOT NULL REFERENCES equipment(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Přidání tabulky pro odepsání zboží (zničené, ztracené)
CREATE TABLE IF NOT EXISTS write_offs (
  id SERIAL PRIMARY KEY,
  write_off_date DATE NOT NULL,
  reason VARCHAR(50) NOT NULL, -- damaged, lost, expired, other
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Přidání tabulky pro položky odepsání
CREATE TABLE IF NOT EXISTS write_off_items (
  id SERIAL PRIMARY KEY,
  write_off_id INTEGER NOT NULL REFERENCES write_offs(id) ON DELETE CASCADE,
  equipment_id INTEGER NOT NULL REFERENCES equipment(id),
  quantity INTEGER NOT NULL,
  value_per_unit DECIMAL(10, 2),
  total_value DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vytvoření indexů pro rychlejší vyhledávání
CREATE INDEX idx_inventory_checks_warehouse_id ON inventory_checks(warehouse_id);
CREATE INDEX idx_inventory_check_items_inventory_check_id ON inventory_check_items(inventory_check_id);
CREATE INDEX idx_inventory_check_items_equipment_id ON inventory_check_items(equipment_id);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_equipment_id ON sale_items(equipment_id);
CREATE INDEX idx_write_offs_created_by ON write_offs(created_by);
CREATE INDEX idx_write_off_items_write_off_id ON write_off_items(write_off_id);
CREATE INDEX idx_write_off_items_equipment_id ON write_off_items(equipment_id);

-- Tabulka pro sledování přesunů vybavení mezi sklady
CREATE TABLE IF NOT EXISTS equipment_transfers (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER NOT NULL REFERENCES equipment(id),
  quantity INTEGER NOT NULL,
  source_warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  target_warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  target_equipment_id INTEGER REFERENCES equipment(id),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Triggery pro aktualizaci timestamps pro nové tabulky
CREATE TRIGGER update_inventory_checks_modtime
BEFORE UPDATE ON inventory_checks
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_inventory_check_items_modtime
BEFORE UPDATE ON inventory_check_items
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_sales_modtime
BEFORE UPDATE ON sales
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_sale_items_modtime
BEFORE UPDATE ON sale_items
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_write_offs_modtime
BEFORE UPDATE ON write_offs
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_write_off_items_modtime
BEFORE UPDATE ON write_off_items
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_equipment_transfers_modtime
BEFORE UPDATE ON equipment_transfers
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Vytvoření indexů pro rychlejší vyhledávání přesunů
CREATE INDEX idx_equipment_transfers_equipment_id ON equipment_transfers(equipment_id);
CREATE INDEX idx_equipment_transfers_source_warehouse_id ON equipment_transfers(source_warehouse_id);
CREATE INDEX idx_equipment_transfers_target_warehouse_id ON equipment_transfers(target_warehouse_id);