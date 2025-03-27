const db = require('../config/db.config');

// Generování dodacího listu pro skupinu výpůjček se stejným batch_id
exports.generateBatchDeliveryNote = async (req, res) => {
  const { batch_id } = req.params;
  
  try {
    // Načtení všech výpůjček ze stejné dávky
    const rentalsResult = await db.query(`
      SELECT r.*, e.name as equipment_name, e.inventory_number, 
             e.article_number, e.product_designation,
             o.order_number, o.customer_id,
             c.name as customer_name, c.address as customer_address, 
             c.ico, c.dic, c.email as customer_email, c.phone as customer_phone
      FROM rentals r
      JOIN equipment e ON r.equipment_id = e.id
      JOIN orders o ON r.order_id = o.id
      JOIN customers c ON o.customer_id = c.id
      WHERE r.batch_id = $1
      ORDER BY r.issue_date ASC
    `, [batch_id]);
    
    if (rentalsResult.rows.length === 0) {
      return res.status(404).json({ message: 'Žádné výpůjčky s tímto ID dávky nebyly nalezeny.' });
    }
    
    // Zjistíme, k jaké zakázce patří výpůjčky (bereme první, všechny by měly být stejné)
    const firstRental = rentalsResult.rows[0];
    const order_id = firstRental.order_id;
    const order_number = firstRental.order_number;
    
    // Vytvoření struktury pro dodací list
    const deliveryNote = {
      batch_id: batch_id,
      rentals: rentalsResult.rows,
      order_id: order_id,
      order_number: order_number,
      customer_name: firstRental.customer_name,
      customer_address: firstRental.customer_address,
      customer_ico: firstRental.ico,
      customer_dic: firstRental.dic,
      customer_email: firstRental.customer_email,
      customer_phone: firstRental.customer_phone,
      created_at: new Date(),
      delivery_note_number: `DL-BATCH-${batch_id}`,
      total_items: rentalsResult.rows.reduce((sum, item) => sum + parseInt(item.quantity || 1), 0)
    };
    
    res.status(200).json({
      message: 'Dodací list pro skupinu výpůjček byl úspěšně vygenerován.',
      deliveryNote
    });
  } catch (error) {
    console.error('Chyba při generování dodacího listu pro skupinu výpůjček:', error);
    res.status(500).json({ message: 'Chyba serveru při generování dodacího listu.' });
  }
};

// Generování dodacího listu pro skupinu vratek se stejným batch_id
exports.generateBatchReturnNote = async (req, res) => {
  const { batch_id } = req.params;
  
  try {
    // Načtení všech vratek ze stejné dávky
    const returnsResult = await db.query(`
      SELECT ret.*, r.equipment_id, r.issue_date, r.order_id, r.quantity as original_quantity,
             e.name as equipment_name, e.inventory_number, 
             e.article_number, e.product_designation,
             o.order_number, o.customer_id,
             c.name as customer_name, c.address as customer_address, 
             c.ico, c.dic, c.email as customer_email, c.phone as customer_phone
      FROM returns ret
      JOIN rentals r ON ret.rental_id = r.id
      JOIN equipment e ON r.equipment_id = e.id
      JOIN orders o ON r.order_id = o.id
      JOIN customers c ON o.customer_id = c.id
      WHERE ret.batch_id = $1
      ORDER BY ret.return_date ASC
    `, [batch_id]);
    
    if (returnsResult.rows.length === 0) {
      return res.status(404).json({ message: 'Žádné vratky s tímto ID dávky nebyly nalezeny.' });
    }
    
    // Zjistíme, k jaké zakázce patří vratky (mohou být různé, bereme z první)
    const firstReturn = returnsResult.rows[0];
    
    // Vytvoření struktury pro dodací list vratek
    const returnNote = {
      batch_id: batch_id,
      returns: returnsResult.rows,
      created_at: new Date(),
      return_note_number: `RTN-BATCH-${batch_id}`,
      customer_name: firstReturn.customer_name,
      customer_address: firstReturn.customer_address,
      customer_ico: firstReturn.ico,
      customer_dic: firstReturn.dic,
      customer_email: firstReturn.customer_email,
      customer_phone: firstReturn.customer_phone,
      total_items: returnsResult.rows.reduce((sum, item) => sum + parseInt(item.quantity || 1), 0)
    };
    
    res.status(200).json({
      message: 'Dodací list pro skupinu vratek byl úspěšně vygenerován.',
      returnNote
    });
  } catch (error) {
    console.error('Chyba při generování dodacího listu pro skupinu vratek:', error);
    res.status(500).json({ message: 'Chyba serveru při generování dodacího listu.' });
  }
};

// Generování podkladu pro fakturaci
exports.generateBillingData = async (req, res) => {
  const { order_id } = req.params;
  const { billing_date, include_returned_only, is_final_billing } = req.body;
  
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
        equipment_id: rental.equipment_id,
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
      is_final_billing || false,
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
        item.equipment_id,
        `${item.equipment_name} (${item.inventory_number})`,
        item.days,
        item.quantity,
        item.daily_rate,
        item.total_price
      ]);
    }
    
    // Označíme výpůjčky jako fakturované
    if (is_final_billing) {
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

// Generování dodacího listu pro celou zakázku
exports.getOrderDeliveryNote = async (req, res) => {
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
    
    // Načtení všech výpůjček v zakázce
    const rentalsResult = await db.query(`
      SELECT r.*, e.name as equipment_name, e.inventory_number, 
             e.article_number, e.product_designation
      FROM rentals r
      JOIN equipment e ON r.equipment_id = e.id
      WHERE r.order_id = $1
      ORDER BY r.issue_date ASC
    `, [order_id]);
    
    // Vytvoření struktury pro dodací list
    const deliveryNote = {
      order: orderResult.rows[0],
      rentals: rentalsResult.rows,
      created_at: new Date(),
      delivery_note_number: `DL-${orderResult.rows[0].order_number}`,
      total_items: rentalsResult.rows.reduce((sum, item) => sum + parseInt(item.quantity || 1), 0)
    };
    
    res.status(200).json({
      deliveryNote
    });
  } catch (error) {
    console.error('Chyba při generování dodacího listu:', error);
    res.status(500).json({ message: 'Chyba serveru při generování dodacího listu.' });
  }
};