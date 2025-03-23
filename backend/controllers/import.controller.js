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

        // Vložení nové položky do databáze
        await db.query(`
          INSERT INTO equipment (
            name, 
            category_id, 
            inventory_number, 
            purchase_price, 
            daily_rate, 
            status, 
            location, 
            description
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          item.name,
          categoryId,
          item.inventory_number,
          item.purchase_price || null,
          item.daily_rate,
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

// Funkce pro vytvoření vzorového Excel souboru
exports.getSampleExcelTemplate = (req, res) => {
  try {
    // Vytvoření nového workbooku
    const workbook = xlsx.utils.book_new();
    
    // Definice dat
    const sampleData = [
      {
        name: 'Příklad vrtačky',
        inventory_number: 'INV001',
        category_name: 'Elektrické nářadí',
        purchase_price: 5000,
        daily_rate: 200,
        status: 'available',
        location: 'Sklad A',
        description: 'Popis vybavení'
      },
      {
        name: 'Příklad pily',
        inventory_number: 'INV002',
        category_name: 'Elektrické nářadí',
        purchase_price: 3500,
        daily_rate: 150,
        status: 'available',
        location: 'Sklad B',
        description: 'Popis dalšího vybavení'
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