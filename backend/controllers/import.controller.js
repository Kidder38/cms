const xlsx = require('xlsx');
const db = require('../config/db.config');

// Funkce pro zpracování importu Excel souboru s vybavením
exports.importEquipment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nebyl nahrán žádný soubor.' });
    }

    // Načtení Excel souboru
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Převod na JSON
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    if (data.length === 0) {
      return res.status(400).json({ message: 'Excel soubor neobsahuje žádná data.' });
    }

    // Výsledky importu
    const results = {
      success: 0,
      errors: [],
      totalItems: data.length
    };

    // Zpracování položek
    for (const item of data) {
      try {
        // Kontrola povinných polí
        if (!item.name || !item.inventory_number || !item.daily_rate) {
          results.errors.push({
            row: results.success + results.errors.length + 1,
            message: 'Chybí povinné pole (název, inventární číslo nebo denní sazba)',
            data: item
          });
          continue;
        }

        // Vyhledání kategorie, pokud byla zadána
        let categoryId = null;
        if (item.category_name) {
          const categoryResult = await db.query(
            'SELECT id FROM equipment_categories WHERE name = $1',
            [item.category_name]
          );
          
          if (categoryResult.rows.length > 0) {
            categoryId = categoryResult.rows[0].id;
          } else {
            // Vytvoření nové kategorie, pokud neexistuje
            const newCategory = await db.query(
              'INSERT INTO equipment_categories (name) VALUES ($1) RETURNING id',
              [item.category_name]
            );
            categoryId = newCategory.rows[0].id;
          }
        }

        // Kontrola, zda inventární číslo již neexistuje
        const existingCheck = await db.query(
          'SELECT id FROM equipment WHERE inventory_number = $1',
          [item.inventory_number]
        );

        if (existingCheck.rows.length > 0) {
          results.errors.push({
            row: results.success + results.errors.length + 1,
            message: `Inventární číslo ${item.inventory_number} již existuje`,
            data: item
          });
          continue;
        }

        // Vložení nové položky do databáze s rozšířenými parametry
        await db.query(`
          INSERT INTO equipment (
            name, 
            category_id, 
            inventory_number, 
            article_number,
            product_designation,
            purchase_price, 
            material_value,
            daily_rate, 
            monthly_rate,
            weight_per_piece,
            square_meters_per_piece,
            total_stock,
            total_square_meters,
            status, 
            location, 
            description
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `, [
          item.name,
          categoryId,
          item.inventory_number,
          item.article_number || null,
          item.product_designation || null,
          item.purchase_price || null,
          item.material_value || null,
          item.daily_rate,
          item.monthly_rate || null,
          item.weight_per_piece || null,
          item.square_meters_per_piece || null,
          item.total_stock || null,
          item.total_square_meters || null,
          item.status || 'available',
          item.location || null,
          item.description || null
        ]);

        results.success++;
      } catch (itemError) {
        console.error('Chyba při zpracování položky:', itemError);
        results.errors.push({
          row: results.success + results.errors.length + 1,
          message: `Chyba při zpracování: ${itemError.message}`,
          data: item
        });
      }
    }

    res.status(200).json({
      message: `Import dokončen. Úspěšně importováno: ${results.success} položek. Chyby: ${results.errors.length}`,
      results
    });
  } catch (error) {
    console.error('Chyba při importu Excel souboru:', error);
    res.status(500).json({ message: 'Chyba serveru při importu souboru.' });
  }
};

// Funkce pro vytvoření vzorového Excel souboru - rozšířená o všechny parametry
exports.getSampleExcelTemplate = (req, res) => {
  try {
    // Vytvoření nového workbooku
    const workbook = xlsx.utils.book_new();
    
    // Definice dat s více sloupci podle modelu
    const sampleData = [
      {
        name: 'Příklad vrtačky',
        inventory_number: 'INV001',
        category_name: 'Elektrické nářadí',
        article_number: 'ART123',
        product_designation: 'Vrtačka s příklepem',
        purchase_price: 5000,
        material_value: 4250, // 85% z pořizovací ceny
        daily_rate: 200,
        monthly_rate: 4000,
        weight_per_piece: 2.5,
        square_meters_per_piece: 0,
        total_stock: 5,
        total_square_meters: 0,
        status: 'available',
        location: 'Sklad A',
        description: 'Profesionální vrtačka s příklepem'
      },
      {
        name: 'Příklad pily',
        inventory_number: 'INV002',
        category_name: 'Elektrické nářadí',
        article_number: 'ART456',
        product_designation: 'Okružní pila',
        purchase_price: 3500,
        material_value: 2975, // 85% z pořizovací ceny
        daily_rate: 150,
        monthly_rate: 3000,
        weight_per_piece: 3.2,
        square_meters_per_piece: 0,
        total_stock: 3,
        total_square_meters: 0,
        status: 'available',
        location: 'Sklad B',
        description: 'Okružní pila se třemi náhradními kotouči'
      },
      {
        name: 'Lešení rámové',
        inventory_number: 'INV003',
        category_name: 'Lešení',
        article_number: 'LS789',
        product_designation: 'Rámové lešení standard',
        purchase_price: 15000,
        material_value: 12750,
        daily_rate: 350,
        monthly_rate: 7000,
        weight_per_piece: 25,
        square_meters_per_piece: 4.5,
        total_stock: 10,
        total_square_meters: 45, // vypočítáno jako square_meters_per_piece * total_stock
        status: 'available',
        location: 'Sklad C',
        description: 'Standardní rámové lešení pro stavební práce'
      }
    ];
    
    // Vytvoření listu
    const worksheet = xlsx.utils.json_to_sheet(sampleData);
    
    // Přidání listu do workbooku
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Vybavení');
    
    // Generování souboru
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Nastavení hlaviček pro stažení
    res.setHeader('Content-Disposition', 'attachment; filename=vzorovy_import_vybaveni.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    res.send(buffer);
  } catch (error) {
    console.error('Chyba při generování vzorového souboru:', error);
    res.status(500).json({ message: 'Chyba serveru při generování vzorového souboru.' });
  }
};