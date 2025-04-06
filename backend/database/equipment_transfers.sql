-- Vytvoření tabulky pro sledování přesunů vybavení mezi sklady
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

-- Trigger pro aktualizaci časového razítka
CREATE TRIGGER update_equipment_transfers_modtime
BEFORE UPDATE ON equipment_transfers
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Vytvoření indexů pro rychlejší vyhledávání
CREATE INDEX idx_equipment_transfers_equipment_id ON equipment_transfers(equipment_id);
CREATE INDEX idx_equipment_transfers_source_warehouse_id ON equipment_transfers(source_warehouse_id);
CREATE INDEX idx_equipment_transfers_target_warehouse_id ON equipment_transfers(target_warehouse_id);