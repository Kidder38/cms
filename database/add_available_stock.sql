-- Přidání sloupce available_stock do tabulky equipment
ALTER TABLE IF EXISTS equipment 
ADD COLUMN IF NOT EXISTS available_stock INTEGER;

-- Inicializace sloupce available_stock na základě total_stock a výpůjček
UPDATE equipment e
SET available_stock = COALESCE(e.total_stock, 0) - COALESCE(
  (SELECT SUM(r.quantity) 
   FROM rentals r 
   WHERE r.equipment_id = e.id 
     AND r.status IN ('created', 'issued') 
     AND r.actual_return_date IS NULL), 0
);

-- Nastavení výchozí hodnoty pro nové záznamy
ALTER TABLE equipment 
ALTER COLUMN available_stock SET DEFAULT 0;