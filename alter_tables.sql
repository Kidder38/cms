-- Přidání sloupce 'quantity' do tabulky rentals
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Přidání sloupce 'note' do tabulky rentals
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS note TEXT;

-- Úprava tabulky 'returns' - přidání sloupce 'quantity'
ALTER TABLE returns ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Vytvoření nové tabulky pro dodací listy
CREATE TABLE IF NOT EXISTS delivery_notes (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  delivery_note_number VARCHAR(50) NOT NULL,
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vytvoření nové tabulky pro fakturační podklady
CREATE TABLE IF NOT EXISTS billing_data (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL,
  billing_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10, 2) NOT NULL,
  is_final_billing BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'created', -- created, sent, paid, cancelled
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vytvoření tabulky pro fakturační položky
CREATE TABLE IF NOT EXISTS billing_items (
  id SERIAL PRIMARY KEY,
  billing_data_id INTEGER REFERENCES billing_data(id) ON DELETE CASCADE,
  rental_id INTEGER REFERENCES rentals(id),
  equipment_id INTEGER REFERENCES equipment(id),
  description VARCHAR(200) NOT NULL,
  days INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_per_day DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Přidání sloupce 'is_billed' do tabulky rentals pro sledování, zda byla výpůjčka již fakturována
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS is_billed BOOLEAN DEFAULT FALSE;

-- Přidání triggerů pro automatickou aktualizaci sloupce updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger pro tabulku delivery_notes
DROP TRIGGER IF EXISTS update_delivery_notes_modified ON delivery_notes;
CREATE TRIGGER update_delivery_notes_modified
BEFORE UPDATE ON delivery_notes
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

-- Trigger pro tabulku billing_data
DROP TRIGGER IF EXISTS update_billing_data_modified ON billing_data;
CREATE TRIGGER update_billing_data_modified
BEFORE UPDATE ON billing_data
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

-- Trigger pro tabulku billing_items
DROP TRIGGER IF EXISTS update_billing_items_modified ON billing_items;
CREATE TRIGGER update_billing_items_modified
BEFORE UPDATE ON billing_items
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

-- Přidání indexů pro optimalizaci výkonu
CREATE INDEX IF NOT EXISTS idx_rentals_order_id ON rentals(order_id);
CREATE INDEX IF NOT EXISTS idx_rentals_equipment_id ON rentals(equipment_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_order_id ON delivery_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_billing_data_order_id ON billing_data(order_id);
CREATE INDEX IF NOT EXISTS idx_billing_items_billing_data_id ON billing_items(billing_data_id);
CREATE INDEX IF NOT EXISTS idx_billing_items_rental_id ON billing_items(rental_id);