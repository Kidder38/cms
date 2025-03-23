const db = require('../config/db.config');

// Přidání výpůjčky k zakázce s podporou pro množství kusů
exports.addRental = async (req, res) => {
  let { order_id } = req.params;
  let { 
    equipment_id, 
    issue_date, 
    planned_return_date, 
    daily_rate,
    status,
    quantity,
    note
  } = req.body;
  
  if (!equipment_id) {
    return res.status(400).json({ message: 'Vybavení je povinný údaj.' });
  }
  
  if (!quantity || quantity < 1) {
    quantity = 1; // Výchozí množství je 1 kus
  }
  
  // Konverze ID na čísla
  order_id = parseInt(order_id);
  equipment_id = parseInt(equipment_id);
  quantity = parseInt(quantity);
  
  // Ujistíme se, že daily_rate je číslo
  if (daily_rate) {
    daily_rate = parseFloat(daily_rate);
  }
  
  try {
    // Kontrola existence zakázky
    const orderCheck = await db.query('SELECT * FROM orders WHERE id = $1', [order_id]);
    
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Zakázka nenalezena.' });
    }
    
    // Kontrola existence vybavení
    const equipmentCheck = await db.query('SELECT * FROM equipment WHERE id = $1', [equipment_id]);
    
    if (equipmentCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Vybrané vybavení neexistuje.' });
    }
    
    const equipmentData = equipmentCheck.rows[0];
    
    // Kontrola dostupnosti vybavení
    if (equipmentData.status !== 'available') {
      return res.status(400).json({ 
        message: 'Vybrané vybavení není dostupné k vypůjčení.', 
        status: equipmentData.status
      });
    }
    
    // Kontrola dostatečného množství kusů na skladě
    if (equipmentData.total_stock !== null && equipmentData.total_stock !== undefined) {
      const availableStock = parseInt(equipmentData.total_stock);
      if (availableStock < quantity) {
        return res.status(400).json({ 
          message: `Nedostatek kusů na skladě. Požadováno: ${quantity}, dostupno: ${availableStock}.`, 
          availableStock
        });
      }
    }
    
    // Nastavení defaultních hodnot
    if (!daily_rate) {
      daily_rate = parseFloat(equipmentData.daily_rate);
    }
    
    if (!status) {
      status = 'created';
    }
    
    // Vložení nové výpůjčky
    const result = await db.query(`
      INSERT INTO rentals (
        order_id,
        equipment_id,
        issue_date,
        planned_return_date,
        daily_rate,
        status,
        quantity,
        note
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `, [
      order_id,
      equipment_id,
      issue_date || new Date(),
      planned_return_date || null,
      daily_rate,
      status,
      quantity,
      note || null
    ]);
    
    // Aktualizace stavu vybavení na 'borrowed' a snížení dostupného množství, pokud je výpůjčka 'issued'
    if (status === 'issued') {
      // Zjistíme aktuální počet kusů
      let currentStock = equipmentData.total_stock;
      
      // Pokud je celkový počet definován, snížíme ho o vypůjčené množství
      if (currentStock !== null && currentStock !== undefined) {
        currentStock = Math.max(0, parseInt(currentStock) - quantity);
        
        // Aktualizujeme počet kusů na skladě
        await db.query(
          'UPDATE equipment SET total_stock = $1 WHERE id = $2',
          [currentStock, equipment_id]
        );
      }
      
      // Změníme stav vybavení na 'borrowed', pokud je všechno vypůjčeno
      if (currentStock === 0) {
        await db.query(
          'UPDATE equipment SET status = $1 WHERE id = $2',
          ['borrowed', equipment_id]
        );
      }
    }
    
    res.status(201).json({
      message: 'Výpůjčka byla úspěšně přidána.',
      rental: result.rows[0]
    });
  } catch (error) {
    console.error('Chyba při přidání výpůjčky:', error);
    res.status(500).json({ 
      message: 'Chyba serveru při přidání výpůjčky.',
      error: error.message // Přidáno pro lepší diagnostiku
    });
  }
};

// Aktualizace výpůjčky
exports.updateRental = async (req, res) => {
  const { rental_id } = req.params;
  const {
    issue_date,
    planned_return_date,
    daily_rate,
    status,
    quantity,
    note
  } = req.body;
  
  try {
    // Kontrola existence výpůjčky
    const rentalCheck = await db.query('SELECT * FROM rentals WHERE id = $1', [rental_id]);
    
    if (rentalCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Výpůjčka nenalezena.' });
    }
    
    const originalRental = rentalCheck.rows[0];
    const originalStatus = originalRental.status;
    const originalQuantity = parseInt(originalRental.quantity) || 1;
    const newStatus = status || originalStatus;
    const newQuantity = quantity ? parseInt(quantity) : originalQuantity;
    
    // Kontrola dostupnosti kusů, pokud se zvyšuje množství
    if (newQuantity > originalQuantity) {
      // Zjistíme aktuální stav vybavení
      const equipmentCheck = await db.query('SELECT * FROM equipment WHERE id = $1', [originalRental.equipment_id]);
      
      if (equipmentCheck.rows.length > 0) {
        const equipment = equipmentCheck.rows[0];
        const availableStock = parseInt(equipment.total_stock) || 0;
        
        // Kontrola, zda je dostatek kusů na zvýšení množství
        if (availableStock < (newQuantity - originalQuantity)) {
          return res.status(400).json({ 
            message: `Nedostatek kusů na skladě pro zvýšení množství. Požadováno: ${newQuantity - originalQuantity}, dostupno: ${availableStock}.`,
            availableStock
          });
        }
        
        // Aktualizace skladu, pokud se mění množství nebo stav
        if (newQuantity !== originalQuantity || newStatus !== originalStatus) {
          let stockChange = 0;
          
          // Výpočet změny skladu
          if (originalStatus === 'issued' && newStatus === 'issued') {
            // Pokud zůstává status issued, upravíme jen rozdíl v množství
            stockChange = originalQuantity - newQuantity;
          } else if (originalStatus !== 'issued' && newStatus === 'issued') {
            // Pokud se mění na issued, odečteme celé nové množství
            stockChange = -newQuantity;
          } else if (originalStatus === 'issued' && newStatus !== 'issued') {
            // Pokud se mění z issued, přičteme celé původní množství
            stockChange = originalQuantity;
          }
          
          // Aktualizace skladu
          if (stockChange !== 0) {
            const newStock = Math.max(0, availableStock + stockChange);
            
            await db.query(
              'UPDATE equipment SET total_stock = $1 WHERE id = $2',
              [newStock, originalRental.equipment_id]
            );
            
            // Aktualizace stavu vybavení podle množství na skladě
            const equipmentStatus = newStock > 0 ? 'available' : 'borrowed';
            
            await db.query(
              'UPDATE equipment SET status = $1 WHERE id = $2',
              [equipmentStatus, originalRental.equipment_id]
            );
          }
        }
      }
    }
    
    // Aktualizace výpůjčky
    const result = await db.query(`
      UPDATE rentals
      SET 
        issue_date = COALESCE($1, issue_date),
        planned_return_date = COALESCE($2, planned_return_date),
        daily_rate = COALESCE($3, daily_rate),
        status = COALESCE($4, status),
        quantity = COALESCE($5, quantity),
        note = COALESCE($6, note),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [
      issue_date,
      planned_return_date,
      daily_rate ? parseFloat(daily_rate) : null,
      status,
      quantity ? parseInt(quantity) : null,
      note,
      rental_id
    ]);
    
    res.status(200).json({
      message: 'Výpůjčka byla úspěšně aktualizována.',
      rental: result.rows[0]
    });
  } catch (error) {
    console.error('Chyba při aktualizaci výpůjčky:', error);
    res.status(500).json({ 
      message: 'Chyba serveru při aktualizaci výpůjčky.',
      error: error.message
    });
  }
};

// Vrácení výpůjčky
exports.returnRental = async (req, res) => {
  const { rental_id } = req.params;
  const { 
    actual_return_date, 
    condition,
    damage_description,
    additional_charges,
    return_quantity,
    notes
  } = req.body;
  
  try {
    // Kontrola existence výpůjčky
    const rentalCheck = await db.query(
      'SELECT r.*, e.total_stock FROM rentals r LEFT JOIN equipment e ON r.equipment_id = e.id WHERE r.id = $1',
      [rental_id]
    );
    
    if (rentalCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Výpůjčka nenalezena.' });
    }
    
    const rental = rentalCheck.rows[0];
    
    // Kontrola, že výpůjčka není už vrácena
    if (rental.status === 'returned') {
      return res.status(400).json({ message: 'Tato výpůjčka již byla vrácena.' });
    }
    
    // Kontrola, že vracíme platné množství
    const originalQuantity = parseInt(rental.quantity);
    let quantityToReturn = return_quantity ? parseInt(return_quantity) : originalQuantity;
    
    if (quantityToReturn <= 0 || quantityToReturn > originalQuantity) {
      return res.status(400).json({ 
        message: `Neplatné množství k vrácení. Původně vypůjčeno: ${originalQuantity} kusů.`
      });
    }
    
    // Zjistíme, jestli jde o částečné nebo úplné vrácení
    const isPartialReturn = quantityToReturn < originalQuantity;
    
    // Pokud je to částečné vrácení, upravíme původní výpůjčku a vytvoříme záznam o vrácení
    if (isPartialReturn) {
      // Nejprve aktualizujeme počet kusů v původní výpůjčce
      await db.query(
        'UPDATE rentals SET quantity = $1 WHERE id = $2',
        [originalQuantity - quantityToReturn, rental_id]
      );
    } else {
      // Pokud vracíme všechno, změníme stav původní výpůjčky na 'returned'
      await db.query(
        'UPDATE rentals SET status = $1, actual_return_date = $2 WHERE id = $3',
        ['returned', actual_return_date || new Date(), rental_id]
      );
    }
    
    // Vytvoříme záznam o vrácení
    const returnResult = await db.query(`
      INSERT INTO returns (
        rental_id,
        return_date,
        condition,
        damage_description,
        additional_charges,
        quantity,
        notes
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *
    `, [
      rental_id,
      actual_return_date || new Date(),
      condition || 'ok',
      damage_description || null,
      additional_charges || 0,
      quantityToReturn,
      notes || null
    ]);
    
    // Aktualizace stavu vybavení a množství ve skladu
    // Nejprve zjistíme aktuální stav a množství
    const equipmentId = rental.equipment_id;
    const equipmentCheck = await db.query(
      'SELECT * FROM equipment WHERE id = $1',
      [equipmentId]
    );
    
    if (equipmentCheck.rows.length > 0) {
      const equipment = equipmentCheck.rows[0];
      let currentStock = equipment.total_stock === null ? 0 : parseInt(equipment.total_stock);
      
      // Přidáme vrácené kusy zpět do skladu
      currentStock += quantityToReturn;
      
      // Aktualizujeme stav vybavení podle jeho kondice při vrácení
      let newStatus = 'available';
      if (condition === 'damaged') {
        newStatus = 'maintenance';
      }
      
      // Aktualizujeme vybavení
      await db.query(
        'UPDATE equipment SET total_stock = $1, status = $2 WHERE id = $3',
        [currentStock, newStatus, equipmentId]
      );
    }
    
    res.status(200).json({
      message: isPartialReturn ? 'Část výpůjčky byla úspěšně vrácena.' : 'Výpůjčka byla úspěšně vrácena.',
      return: returnResult.rows[0]
    });
  } catch (error) {
    console.error('Chyba při vracení výpůjčky:', error);
    res.status(500).json({ 
      message: 'Chyba serveru při vracení výpůjčky.',
      error: error.message
    });
  }
};

// Získání všech výpůjček pro zakázku
exports.getRentalsByOrder = async (req, res) => {
  const { order_id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT r.*, e.name as equipment_name, e.inventory_number
      FROM rentals r
      LEFT JOIN equipment e ON r.equipment_id = e.id
      WHERE r.order_id = $1
      ORDER BY r.issue_date DESC
    `, [order_id]);
    
    res.status(200).json({
      count: result.rows.length,
      rentals: result.rows
    });
  } catch (error) {
    console.error('Chyba při načítání výpůjček zakázky:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání výpůjček.' });
  }
};

// Generování dodacího listu pro zakázku
exports.generateDeliveryNote = async (req, res) => {
  const { order_id } = req.params;
  
  try {
    // Načtení zakázky včetně informací o zákazníkovi
    const orderResult = await db.query(`
      SELECT o.*, c.name as customer_name, c.address as customer_address, 
             c.ico, c.dic, c.email as customer_email, c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `, [order_id]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Zakázka nenalezena.' });
    }
    
    const order = orderResult.rows[0];
    
    // Načtení výpůjček pro zakázku
    const rentalsResult = await db.query(`
      SELECT r.*, e.name as equipment_name, e.inventory_number, 
             e.article_number, e.product_designation
      FROM rentals r
      LEFT JOIN equipment e ON r.equipment_id = e.id
      WHERE r.order_id = $1
      ORDER BY r.issue_date ASC
    `, [order_id]);
    
    // Vytvoření struktury pro dodací list
    const deliveryNote = {
      order: order,
      rentals: rentalsResult.rows,
      created_at: new Date(),
      total_items: rentalsResult.rows.reduce((sum, item) => sum + parseInt(item.quantity || 1), 0),
      delivery_note_number: `DL-${order.order_number}`,
    };
    
    res.status(200).json({
      message: 'Dodací list byl úspěšně vygenerován.',
      deliveryNote
    });
  } catch (error) {
    console.error('Chyba při generování dodacího listu:', error);
    res.status(500).json({ message: 'Chyba serveru při generování dodacího listu.' });
  }
};

// Uložení dodacího listu
exports.saveDeliveryNote = async (req, res) => {
  const { order_id } = req.params;
  const { delivery_note_number, notes } = req.body;
  
  try {
    // Kontrola existence zakázky
    const orderCheck = await db.query('SELECT * FROM orders WHERE id = $1', [order_id]);
    
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Zakázka nenalezena.' });
    }
    
    // Kontrola, zda již existuje dodací list pro tuto zakázku
    const existingCheck = await db.query(
      'SELECT * FROM delivery_notes WHERE order_id = $1',
      [order_id]
    );
    
    let result;
    if (existingCheck.rows.length > 0) {
      // Aktualizace existujícího dodacího listu
      result = await db.query(`
        UPDATE delivery_notes
        SET 
          delivery_note_number = $1,
          notes = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE order_id = $3
        RETURNING *
      `, [
        delivery_note_number,
        notes,
        order_id
      ]);
    } else {
      // Vytvoření nového dodacího listu
      result = await db.query(`
        INSERT INTO delivery_notes (
          order_id,
          delivery_note_number,
          notes
        )
        VALUES ($1, $2, $3)
        RETURNING *
      `, [
        order_id,
        delivery_note_number || `DL-${orderCheck.rows[0].order_number}`,
        notes
      ]);
    }
    
    res.status(200).json({
      message: 'Dodací list byl úspěšně uložen.',
      deliveryNote: result.rows[0]
    });
  } catch (error) {
    console.error('Chyba při ukládání dodacího listu:', error);
    res.status(500).json({ message: 'Chyba serveru při ukládání dodacího listu.' });
  }
};

// Generování podkladu pro fakturaci
exports.generateBillingData = async (req, res) => {
  const { order_id } = req.params;
  const { billing_date, include_returned_only } = req.body;
  
  try {
    // Načtení zakázky včetně informací o zákazníkovi
    const orderResult = await db.query(`
      SELECT o.*, c.name as customer_name, c.address as customer_address, 
             c.ico, c.dic, c.email as customer_email, c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `, [order_id]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Zakázka nenalezena.' });
    }
    
    const order = orderResult.rows[0];
    
    // Určení data fakturace - buď předané, nebo aktuální datum
    const billingDateObj = billing_date ? new Date(billing_date) : new Date();
    
    // Zformátování data pro SQL
    const formattedBillingDate = billingDateObj.toISOString().split('T')[0];
    
    // Připravíme SQL podmínku pro filtrování vrácených/nevrácených výpůjček
    let returnedCondition = '';
    if (include_returned_only === true) {
      returnedCondition = 'AND (r.status = \'returned\' OR r.actual_return_date IS NOT NULL)';
    }
    
    // Načtení výpůjček pro zakázku
    const rentalsResult = await db.query(`
      SELECT r.*, e.name as equipment_name, e.inventory_number, 
             e.article_number, e.product_designation
      FROM rentals r
      LEFT JOIN equipment e ON r.equipment_id = e.id
      WHERE r.order_id = $1 ${returnedCondition}
      ORDER BY r.issue_date ASC
    `, [order_id]);
    
    // Výpočet fakturačních položek pro každou výpůjčku
    const billingItems = [];
    
    for (const rental of rentalsResult.rows) {
      // Určení počtu dní pro fakturaci
      const issueDate = new Date(rental.issue_date);
      
      // Určení data vrácení - buď skutečné datum vrácení, nebo datum fakturace, nebo plánované datum vrácení
      let returnDate = rental.actual_return_date ? new Date(rental.actual_return_date) : billingDateObj;
      
      // Pokud plánované datum vrácení je dříve než datum fakturace, použijeme plánované datum
      if (rental.planned_return_date) {
        const plannedReturnDate = new Date(rental.planned_return_date);
        if (plannedReturnDate < returnDate && !rental.actual_return_date) {
          returnDate = plannedReturnDate;
        }
      }
      
      // Výpočet počtu dní
      const diffTime = Math.abs(returnDate - issueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Minimálně 1 den
      
      // Výpočet ceny
      const quantity = parseInt(rental.quantity) || 1;
      const dailyRate = parseFloat(rental.daily_rate) || 0;
      const totalPrice = diffDays * quantity * dailyRate;
      
      // Příprava fakturačních dat pro položku
      billingItems.push({
        rental_id: rental.id,
        equipment_name: rental.equipment_name,
        inventory_number: rental.inventory_number,
        product_designation: rental.product_designation,
        issue_date: rental.issue_date,
        return_date: rental.actual_return_date || null,
        planned_return_date: rental.planned_return_date,
        days: diffDays,
        quantity: quantity,
        daily_rate: dailyRate,
        total_price: totalPrice,
        status: rental.status
      });
    }
    
    // Výpočet celkové ceny za všechny položky
    const totalAmount = billingItems.reduce((sum, item) => sum + item.total_price, 0);
    
    // Vytvoření struktury fakturačního podkladu
    const billingData = {
      order: order,
      billing_date: formattedBillingDate,
      items: billingItems,
      total_amount: totalAmount,
      invoice_number: `INV-${order.order_number}-${formattedBillingDate.replace(/-/g, '')}`,
      note: `Fakturační podklad vygenerován ${new Date().toISOString().split('T')[0]}`
    };
    
    // Uložíme fakturační podklad do databáze pro pozdější použití
    const billingResult = await db.query(`
      INSERT INTO billing_data (
        order_id,
        invoice_number,
        billing_date,
        total_amount,
        is_final_billing,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      order_id,
      billingData.invoice_number,
      billingData.billing_date,
      billingData.total_amount,
      req.body.is_final_billing || false,
      billingData.note
    ]);
    
    const billingId = billingResult.rows[0].id;
    
    // Uložíme jednotlivé položky fakturačního podkladu
    for (const item of billingItems) {
      await db.query(`
        INSERT INTO billing_items (
          billing_data_id,
          rental_id,
          equipment_id,
          description,
          days,
          quantity,
          price_per_day,
          total_price
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        billingId,
        item.rental_id,
        rental.equipment_id,
        `${item.equipment_name} (${item.inventory_number})`,
        item.days,
        item.quantity,
        item.daily_rate,
        item.total_price
      ]);
    }
    
    // Označíme výpůjčky jako fakturované
    if (req.body.is_final_billing) {
      await db.query(`
        UPDATE rentals
        SET is_billed = true
        WHERE order_id = $1
      `, [order_id]);
    }
    
    res.status(200).json({
      message: 'Fakturační podklad byl úspěšně vygenerován.',
      billingData
    });
  } catch (error) {
    console.error('Chyba při generování fakturačního podkladu:', error);
    res.status(500).json({ message: 'Chyba serveru při generování fakturačního podkladu.' });
  }
};

// Získání fakturačních podkladů pro zakázku
exports.getBillingDataByOrder = async (req, res) => {
  const { order_id } = req.params;
  
  try {
    // Kontrola existence zakázky
    const orderCheck = await db.query('SELECT * FROM orders WHERE id = $1', [order_id]);
    
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Zakázka nenalezena.' });
    }
    
    // Načtení fakturačních podkladů
    const billingResult = await db.query(`
      SELECT *
      FROM billing_data
      WHERE order_id = $1
      ORDER BY billing_date DESC
    `, [order_id]);
    
    res.status(200).json({
      billingData: billingResult.rows
    });
  } catch (error) {
    console.error('Chyba při načítání fakturačních podkladů:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání fakturačních podkladů.' });
  }
};

// Získání konkrétního fakturačního podkladu
exports.getBillingDataById = async (req, res) => {
  const { billing_id } = req.params;
  
  try {
    // Načtení fakturačního podkladu
    const billingResult = await db.query(`
      SELECT bd.*, o.order_number, c.name as customer_name, c.address as customer_address,
             c.ico, c.dic, c.email as customer_email, c.phone as customer_phone
      FROM billing_data bd
      LEFT JOIN orders o ON bd.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE bd.id = $1
    `, [billing_id]);
    
    if (billingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Fakturační podklad nebyl nalezen.' });
    }
    
    const billingData = billingResult.rows[0];
    
    // Načtení položek fakturačního podkladu
    const itemsResult = await db.query(`
      SELECT *
      FROM billing_items
      WHERE billing_data_id = $1
    `, [billing_id]);
    
    // Sestavení kompletního fakturačního podkladu
    const completeBillingData = {
      ...billingData,
      items: itemsResult.rows
    };
    
    res.status(200).json({
      billingData: completeBillingData
    });
  } catch (error) {
    console.error('Chyba při načítání fakturačního podkladu:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání fakturačního podkladu.' });
  }
};