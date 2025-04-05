-- Vytvoření tabulky pro sklady
CREATE TABLE IF NOT EXISTS warehouses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  is_external BOOLEAN DEFAULT FALSE,
  supplier_id INTEGER REFERENCES suppliers(id),
  location VARCHAR(200),
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Přidání sloupce warehouse_id do tabulky equipment
ALTER TABLE equipment 
ADD COLUMN warehouse_id INTEGER REFERENCES warehouses(id);

-- Vytvoření defaultního interního skladu, pokud ještě neexistuje
INSERT INTO warehouses (name, description, is_external)
SELECT 'Hlavní sklad', 'Náš hlavní interní sklad vybavení', FALSE
WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE name = 'Hlavní sklad');

-- Přesun existujícího vybavení do hlavního skladu
UPDATE equipment
SET warehouse_id = (SELECT id FROM warehouses WHERE name = 'Hlavní sklad')
WHERE warehouse_id IS NULL;

-- Vytvoření indexu pro rychlejší vyhledávání
CREATE INDEX idx_equipment_warehouse_id ON equipment(warehouse_id);

-- Přidání omezení na warehouse_id (nebude to NULL po inicializaci)
ALTER TABLE equipment
ALTER COLUMN warehouse_id SET NOT NULL;