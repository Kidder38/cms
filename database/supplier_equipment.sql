-- Vytvoření tabulky pro dodavatele
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  ico VARCHAR(20),
  dic VARCHAR(20),
  bank_account VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Přidání sloupců pro externí vybavení do tabulky equipment
ALTER TABLE equipment 
ADD COLUMN is_external BOOLEAN DEFAULT FALSE,
ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id),
ADD COLUMN external_rental_cost DECIMAL(10, 2),
ADD COLUMN rental_start_date DATE,
ADD COLUMN rental_end_date DATE,
ADD COLUMN external_reference VARCHAR(100),
ADD COLUMN return_date DATE,
ADD COLUMN rental_status VARCHAR(20) DEFAULT 'active';

-- Vytvoření indexů pro rychlejší vyhledávání
CREATE INDEX idx_equipment_is_external ON equipment(is_external);
CREATE INDEX idx_equipment_supplier_id ON equipment(supplier_id);