-- PYidání funkcí a triggero pro aktualizaci timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabulka pro propojení u~ivatelo a zákazníko
CREATE TABLE IF NOT EXISTS user_customer_access (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  access_type VARCHAR(20) DEFAULT 'read', -- read, write, admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, customer_id)
);

-- Tabulka pro propojení u~ivatelo a zakázek
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