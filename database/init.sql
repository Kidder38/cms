-- Vytvoření databáze (spusťte tento příkaz samostatně)
-- CREATE DATABASE pujcovna;

-- Přepnutí na nově vytvořenou databázi
-- \c pujcovna

-- Vytvoření tabulek

-- Uživatelé
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Kategorie vybavení
CREATE TABLE IF NOT EXISTS equipment_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vybavení
-- Vybavení - upravená struktura
CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category_id INTEGER REFERENCES equipment_categories(id),
  inventory_number VARCHAR(50) UNIQUE NOT NULL,  -- Stávající inventární číslo
  article_number VARCHAR(50),                    -- Nové: Číslo artiklu
  product_designation VARCHAR(200),              -- Nové: Označení výrobku
  purchase_price DECIMAL(10, 2),                 -- Stávající pořizovací cena
  material_value DECIMAL(10, 2),                 -- Nové: Hodnota materiálu (sleva 15% z nového)
  daily_rate DECIMAL(10, 2) NOT NULL,            -- Stávající denní sazba
  monthly_rate DECIMAL(10, 2),                   -- Nové: Nájem/měsíc/kus
  weight_per_piece DECIMAL(10, 2),               -- Nové: Hmotnost/kus/kg
  square_meters_per_piece DECIMAL(10, 2),        -- Nové: m2/ks
  total_stock INTEGER,                           -- Nové: Sklad celkem
  total_square_meters DECIMAL(10, 2),            -- Nové: m2/celkem
  status VARCHAR(20) DEFAULT 'available',        -- Stávající stav
  location VARCHAR(100),                         -- Stávající umístění
  description TEXT,                              -- Stávající popis
  photo_url VARCHAR(255),                        -- Stávající URL fotografie
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Zákazníci
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL DEFAULT 'individual', -- individual, company
  name VARCHAR(200) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  ico VARCHAR(20),
  dic VARCHAR(20),
  customer_category VARCHAR(20) DEFAULT 'regular', -- regular, vip, wholesale
  credit DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Zakázky
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  creation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'created', -- created, active, completed, cancelled
  estimated_end_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Výpůjčky
CREATE TABLE IF NOT EXISTS rentals (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  equipment_id INTEGER REFERENCES equipment(id),
  issue_date TIMESTAMP WITH TIME ZONE,
  planned_return_date TIMESTAMP WITH TIME ZONE,
  actual_return_date TIMESTAMP WITH TIME ZONE,
  daily_rate DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'created', -- created, issued, returned, damaged
  issue_condition TEXT,
  issue_photo_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vratky
CREATE TABLE IF NOT EXISTS returns (
  id SERIAL PRIMARY KEY,
  rental_id INTEGER REFERENCES rentals(id) ON DELETE CASCADE,
  return_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  condition VARCHAR(20) DEFAULT 'ok', -- ok, damaged, missing
  damage_description TEXT,
  damage_photo_url VARCHAR(255),
  additional_charges DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Faktury
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  order_id INTEGER REFERENCES orders(id),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP WITH TIME ZONE,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'created', -- created, sent, paid, overdue, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fakturační položky
CREATE TABLE IF NOT EXISTS invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
  rental_id INTEGER REFERENCES rentals(id),
  description VARCHAR(200) NOT NULL,
  days INTEGER,
  price_per_day DECIMAL(10, 2),
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vložení základních dat
INSERT INTO equipment_categories (name, description) VALUES
('Ruční nářadí', 'Kladiva, šroubováky, klíče, atd.'),
('Elektrické nářadí', 'Vrtačky, brusky, pily, atd.'),
('Stavební stroje', 'Míchačky, vibrační desky, atd.'),
('Lešení', 'Rámové lešení, mobilní věže, atd.'),
('Zahradní technika', 'Sekačky, křovinořezy, atd.');

-- Vytvoření administrátorského účtu
INSERT INTO users (username, email, password, first_name, last_name, role) VALUES
('admin', 'admin@pujcovna.cz', '$2b$10$k7jzmqb0G8q4Xb1XaAYiAOQUUzGBNWUiY9Nfo08Zky7sK9aVMUJTW', 'Admin', 'Administrátor', 'admin');
-- Heslo: admin123 (uloženo jako hash)