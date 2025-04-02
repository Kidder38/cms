/**
 * Utilita pro generování PDF dokumentů
 *
 * Toto je sada funkcí pro práci s PDF soubory v aplikaci
 * Používá knihovny jsPDF a jspdf-autotable pro generování PDF
 */
// Jednotná implementace PDF generování
import { formatDate, formatCurrency } from '../config';

/**
 * Vytvoří nové PDF A4 s podporou češtiny
 * @returns {Object} Nově vytvořený PDF objekt
 */
/**
 * Vytvoří PDF dokument s použitím dynamického importu jsPDF
 * @param {Function} callback - Funkce, která vytvoří a upraví PDF
 * @returns {Promise} Promise s PDF dokumentem
 */
export const createPdfDocument = async (callback) => {
  try {
    // Dynamický import jsPDF
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default;
    
    // Dynamický import autotable
    await import('jspdf-autotable');
    
    // Vytvoření PDF dokumentu
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Nastavení češtiny
    pdf.setFont("helvetica");
    
    // Zavolání callback funkce pro vytvoření obsahu
    if (callback && typeof callback === 'function') {
      await callback(pdf);
    }
    
    return pdf;
  } catch (error) {
    console.error('Chyba při vytváření PDF:', error);
    throw error;
  }
};

/**
 * Generátor pro hromadný dodací list
 * 
 * @param {Object} deliveryNote - Data dodacího listu
 * @returns {Promise<Object>} PDF dokument
 */
export const generateBatchDeliveryNotePdf = async (deliveryNote) => {
  return createPdfDocument(async (pdf) => {
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Hlavička dokumentu
    pdf.setFontSize(16);
    pdf.text('HROMADNÝ DODACÍ LIST', pdfWidth / 2, margin, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(`Č. ${deliveryNote?.delivery_note_number || 'Neznámé'}`, pdfWidth / 2, margin + 8, { align: 'center' });
    pdf.text(`Datum: ${formatDate(deliveryNote?.created_at || new Date())}`, pdfWidth / 2, margin + 15, { align: 'center' });
    
    // Informace o dodavateli a odběrateli
    pdf.setFontSize(10);
    pdf.text('Dodavatel: Půjčovna Stavebnin s.r.o.', margin, margin + 25);
    pdf.text('Odběratel: ' + (deliveryNote?.customer_name || 'Neuvedeno'), pdfWidth - margin - 80, margin + 25, { align: 'left' });
    
    // Seznam položek
    pdf.setFontSize(12);
    pdf.text('Seznam položek:', margin, margin + 40);
    
    if (deliveryNote?.rentals && deliveryNote.rentals.length > 0) {
      // Tabulka položek
      const tableColumn = ['Pořadí', 'Název', 'Inv. č.', 'Množství', 'Plánované vrácení', 'Denní sazba'];
      const tableRows = deliveryNote.rentals.map((item, index) => [
        index + 1,
        item.equipment_name || 'Neuvedeno',
        item.inventory_number || '-',
        `${item.quantity || 1} ks`,
        formatDate(item.planned_return_date) || 'Neurčeno',
        `${formatCurrency(item.daily_rate || 0)}/den`
      ]);
      
      pdf.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: margin + 45,
        margin: { top: margin, right: margin, bottom: margin, left: margin },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] }
      });
      
      // Celkový počet položek
      const finalY = pdf.lastAutoTable.finalY + 10;
      pdf.text(`Celkový počet položek: ${deliveryNote?.total_items || 0} ks`, margin, finalY);
      
      // Podpisy
      const signatureY = finalY + 30;
      pdf.line(margin, signatureY, margin + 60, signatureY);
      pdf.line(pdfWidth - margin - 60, signatureY, pdfWidth - margin, signatureY);
      pdf.text('Za dodavatele', margin + 30, signatureY + 5, { align: 'center' });
      pdf.text('Za odběratele', pdfWidth - margin - 30, signatureY + 5, { align: 'center' });
    } else {
      pdf.text('Žádné položky v dodacím listu', pdfWidth / 2, margin + 50, { align: 'center' });
    }
    
    // Zápatí
    pdf.setFontSize(8);
    pdf.text(`Strana 1`, pdfWidth - margin, pageHeight - 10, { align: 'right' });
    pdf.text(`Vygenerováno: ${new Date().toLocaleDateString('cs-CZ')}`, margin, pageHeight - 10);
  });
};

/**
 * Generátor pro hromadný dodací list vratek
 * 
 * @param {Object} returnNote - Data dodacího listu vratek
 * @returns {Promise<Object>} PDF dokument
 */
export const generateBatchReturnNotePdf = async (returnNote) => {
  return createPdfDocument(async (pdf) => {
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Hlavička dokumentu
    pdf.setFontSize(16);
    pdf.text('HROMADNÝ DODACÍ LIST VRATEK', pdfWidth / 2, margin, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(`Č. ${returnNote?.return_note_number || 'Neznámé'}`, pdfWidth / 2, margin + 8, { align: 'center' });
    pdf.text(`Datum: ${formatDate(returnNote?.created_at || new Date())}`, pdfWidth / 2, margin + 15, { align: 'center' });
    
    // Informace o dodavateli a odběrateli
    pdf.setFontSize(10);
    pdf.text('Dodavatel: Půjčovna Stavebnin s.r.o.', margin, margin + 25);
    pdf.text('Odběratel: ' + (returnNote?.customer_name || 'Neuvedeno'), pdfWidth - margin - 80, margin + 25, { align: 'left' });
    
    // Seznam položek
    pdf.setFontSize(12);
    pdf.text('Seznam vrácených položek:', margin, margin + 40);
    
    if (returnNote?.returns && returnNote.returns.length > 0) {
      // Tabulka položek
      const tableColumn = ['Pořadí', 'Název', 'Inv. č.', 'Množství', 'Datum vrácení', 'Stav', 'Dodatečné poplatky'];
      const tableRows = returnNote.returns.map((item, index) => {
        let stav = 'Neuvedeno';
        if (item.condition === 'ok') stav = 'V pořádku';
        else if (item.condition === 'damaged') stav = 'Poškozeno';
        else if (item.condition === 'missing') stav = 'Chybí';
        
        return [
          index + 1,
          item.equipment_name || 'Neuvedeno',
          item.inventory_number || '-',
          `${item.quantity || 1} ks`,
          formatDate(item.return_date) || '-',
          stav,
          formatCurrency(item.additional_charges || 0)
        ];
      });
      
      pdf.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: margin + 45,
        margin: { top: margin, right: margin, bottom: margin, left: margin },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] }
      });
      
      // Celkové hodnoty
      const finalY = pdf.lastAutoTable.finalY + 10;
      const totalAdditionalCharges = returnNote.returns.reduce(
        (sum, item) => sum + (parseFloat(item.additional_charges) || 0), 0
      );
      
      pdf.text(`Celkový počet položek: ${returnNote?.total_items || 0} ks`, margin, finalY);
      pdf.text(`Celkem dodatečné poplatky: ${formatCurrency(totalAdditionalCharges)}`, 
               pdfWidth - margin, finalY, { align: 'right' });
      
      // Poškozené položky
      const damagedItems = returnNote.returns.filter(item => item.condition !== 'ok' && item.damage_description);
      if (damagedItems.length > 0) {
        pdf.text('Popis poškození:', margin, finalY + 15);
        
        const damageTableColumn = ['Položka', 'Popis poškození'];
        const damageTableRows = damagedItems.map(item => [
          `${item.equipment_name} (${item.inventory_number})`,
          item.damage_description || '-'
        ]);
        
        pdf.autoTable({
          head: [damageTableColumn],
          body: damageTableRows,
          startY: finalY + 20,
          margin: { top: margin, right: margin, bottom: margin, left: margin },
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] }
        });
      }
      
      // Podpisy
      const signatureY = (pdf.lastAutoTable ? pdf.lastAutoTable.finalY : finalY) + 30;
      pdf.line(margin, signatureY, margin + 60, signatureY);
      pdf.line(pdfWidth - margin - 60, signatureY, pdfWidth - margin, signatureY);
      pdf.text('Za dodavatele', margin + 30, signatureY + 5, { align: 'center' });
      pdf.text('Za odběratele', pdfWidth - margin - 30, signatureY + 5, { align: 'center' });
    } else {
      pdf.text('Žádné vrácené položky', pdfWidth / 2, margin + 50, { align: 'center' });
    }
    
    // Zápatí
    pdf.setFontSize(8);
    pdf.text(`Strana 1`, pdfWidth - margin, pageHeight - 10, { align: 'right' });
    pdf.text(`Vygenerováno: ${new Date().toLocaleDateString('cs-CZ')}`, margin, pageHeight - 10);
  });
};

/**
 * Generátor pro fakturační podklad
 * 
 * @param {Object} billingData - Data fakturačního podkladu
 * @returns {Promise<Object>} PDF dokument
 */
export const generateBillingPdf = async (billingData) => {
  return createPdfDocument(async (pdf) => {
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Hlavička dokumentu
    pdf.setFontSize(16);
    pdf.text('FAKTURAČNÍ PODKLAD', pdfWidth / 2, margin, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(`Č. ${billingData?.invoice_number || 'Neznámé'}`, pdfWidth / 2, margin + 8, { align: 'center' });
    pdf.text(`Datum: ${formatDate(billingData?.billing_date || new Date())}`, pdfWidth / 2, margin + 15, { align: 'center' });
    
    // Základní informace
    pdf.setFontSize(10);
    pdf.text(`Zákazník: ${billingData?.order?.customer_name || 'Neuvedeno'}`, margin, margin + 25);
    pdf.text(`Zakázka č.: ${billingData?.order?.order_number || 'Neuvedeno'}`, margin, margin + 30);
    pdf.text(`Období: ${formatDate(billingData?.period_from)} - ${formatDate(billingData?.period_to)}`, margin, margin + 35);
    
    // Seznam položek
    if (billingData?.items && billingData.items.length > 0) {
      // Tabulka položek
      const tableColumn = ['Název', 'Inv. č.', 'Od', 'Do', 'Dny', 'Ks', 'Sazba/den', 'Celkem'];
      const tableRows = billingData.items.map(item => [
        item.equipment_name || item.description || 'Neuvedeno',
        item.inventory_number || '-',
        formatDate(item.issue_date) || '-',
        formatDate(item.return_date || billingData.billing_date) || '-',
        item.days || '0',
        item.quantity || '1',
        formatCurrency(item.daily_rate || item.price_per_day || 0),
        formatCurrency(item.total_price || 0)
      ]);
      
      pdf.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: margin + 40,
        margin: { top: margin, right: margin, bottom: margin, left: margin },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] }
      });
      
      // Celková cena
      const finalY = pdf.lastAutoTable.finalY + 10;
      pdf.setFontSize(11);
      pdf.text(`Celková cena: ${formatCurrency(billingData.total_amount || 0)}`, 
               pdfWidth - margin, finalY, { align: 'right' });
      
      // Podpisy
      const signatureY = finalY + 30;
      pdf.line(margin, signatureY, margin + 60, signatureY);
      pdf.line(pdfWidth - margin - 60, signatureY, pdfWidth - margin, signatureY);
      pdf.text('Vystavil', margin + 30, signatureY + 5, { align: 'center' });
      pdf.text('Schválil', pdfWidth - margin - 30, signatureY + 5, { align: 'center' });
    } else {
      pdf.text('Žádné položky k fakturaci', pdfWidth / 2, margin + 50, { align: 'center' });
    }
    
    // Zápatí
    pdf.setFontSize(8);
    pdf.text(`Strana 1`, pdfWidth - margin, pageHeight - 10, { align: 'right' });
    pdf.text(`Vygenerováno: ${new Date().toLocaleDateString('cs-CZ')}`, margin, pageHeight - 10);
  });
};

/**
 * Generátor pro dodací list
 * 
 * @param {Object} deliveryNote - Data dodacího listu
 * @returns {Promise<Object>} PDF dokument
 */
export const generateDeliveryNotePdf = async (deliveryNote) => {
  return createPdfDocument(async (pdf) => {
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Hlavička dokumentu
    pdf.setFontSize(16);
    pdf.text('DODACÍ LIST', pdfWidth / 2, margin, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(`Č. ${deliveryNote?.delivery_note_number || 'Neznámé'}`, pdfWidth / 2, margin + 8, { align: 'center' });
    pdf.text(`Datum: ${formatDate(deliveryNote?.created_at || new Date())}`, pdfWidth / 2, margin + 15, { align: 'center' });
    
    // Informace o dodavateli a odběrateli
    pdf.setFontSize(10);
    pdf.text('Dodavatel: Půjčovna Stavebnin s.r.o.', margin, margin + 25);
    pdf.text('Odběratel: ' + (deliveryNote?.customer_name || 'Neuvedeno'), pdfWidth - margin - 80, margin + 25, { align: 'left' });
    pdf.text(`Zakázka č.: ${deliveryNote?.order_number || 'Neuvedeno'}`, margin, margin + 35);
    
    // Seznam položek
    pdf.setFontSize(12);
    pdf.text('Seznam položek:', margin, margin + 45);
    
    if (deliveryNote?.rentals && deliveryNote.rentals.length > 0) {
      // Tabulka položek
      const tableColumn = ['Název', 'Inv. č.', 'Datum vydání', 'Množství', 'Denní sazba'];
      const tableRows = deliveryNote.rentals.map(rental => [
        rental.equipment_name || 'Neuvedeno',
        rental.inventory_number || '-',
        formatDate(rental.issue_date) || '-',
        rental.quantity || '1',
        formatCurrency(rental.daily_rate || 0)
      ]);
      
      pdf.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: margin + 50,
        margin: { top: margin, right: margin, bottom: margin, left: margin },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] }
      });
      
      // Celkový počet položek
      const finalY = pdf.lastAutoTable.finalY + 10;
      pdf.text(`Celkový počet položek: ${deliveryNote?.total_items || 0} ks`, margin, finalY);
      
      // Podpisy
      const signatureY = finalY + 30;
      pdf.line(margin, signatureY, margin + 60, signatureY);
      pdf.line(pdfWidth - margin - 60, signatureY, pdfWidth - margin, signatureY);
      pdf.text('Vydal', margin + 30, signatureY + 5, { align: 'center' });
      pdf.text('Převzal', pdfWidth - margin - 30, signatureY + 5, { align: 'center' });
    } else {
      pdf.text('Žádné položky v dodacím listu', pdfWidth / 2, margin + 60, { align: 'center' });
    }
    
    // Zápatí
    pdf.setFontSize(8);
    pdf.text(`Strana 1`, pdfWidth - margin, pageHeight - 10, { align: 'right' });
    pdf.text(`Vygenerováno: ${new Date().toLocaleDateString('cs-CZ')}`, margin, pageHeight - 10);
  });
};

/**
 * Generuje PDF pro hromadný dodací list
 * 
 * @param {Object} batchDeliveryNote - Data hromadného dodacího listu
 * @returns {Object} Vygenerované PDF
 */
export const generateBatchDeliveryNotePdfOld = (batchDeliveryNote) => {
  try {
    const pdf = createPdf();
    
    // Základní údaje
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 15; // okraje v mm
    
    // Přidáme hlavičku dokumentu
    pdf.setFontSize(16);
    pdf.text('HROMADNÝ DODACÍ LIST', pdfWidth / 2, margin, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(`Č. ${batchDeliveryNote?.delivery_note_number || 'Neznámé'}`, pdfWidth / 2, margin + 8, { align: 'center' });
    pdf.text(`Datum vystavení: ${formatDate(batchDeliveryNote?.created_at || new Date())}`, pdfWidth / 2, margin + 15, { align: 'center' });
    
    // Informace o dodavateli
    pdf.setFontSize(9);
    pdf.text('Dodavatel:', margin, margin + 25);
    pdf.setFontSize(8);
    pdf.text('Půjčovna Stavebnin s.r.o.', margin, margin + 30);
    pdf.text('Stavební 123, 123 45 Město', margin, margin + 34);
    pdf.text('IČO: 12345678, DIČ: CZ12345678', margin, margin + 38);
    pdf.text('Tel: +420 123 456 789', margin, margin + 42);
    pdf.text('Email: info@pujcovna-stavebnin.cz', margin, margin + 46);
    
    // Informace o odběrateli
    pdf.setFontSize(9);
    pdf.text('Odběratel:', pdfWidth - margin - 60, margin + 25);
    pdf.setFontSize(8);
    pdf.text(batchDeliveryNote?.customer_name || 'Neuvedeno', pdfWidth - margin - 60, margin + 30);
    pdf.text(batchDeliveryNote?.customer_address || 'Adresa neuvedena', pdfWidth - margin - 60, margin + 34);
    
    const icoText = batchDeliveryNote?.customer_ico ? `IČO: ${batchDeliveryNote.customer_ico}` : '';
    const dicText = batchDeliveryNote?.customer_dic ? `DIČ: ${batchDeliveryNote.customer_dic}` : '';
    const icodicText = icoText && dicText ? `${icoText}, ${dicText}` : (icoText || dicText);
    
    if (icodicText) {
      pdf.text(icodicText, pdfWidth - margin - 60, margin + 38);
    }
    
    if (batchDeliveryNote?.customer_phone) {
      pdf.text(`Tel: ${batchDeliveryNote.customer_phone}`, pdfWidth - margin - 60, margin + 42);
    }
    
    if (batchDeliveryNote?.customer_email) {
      pdf.text(`Email: ${batchDeliveryNote.customer_email}`, pdfWidth - margin - 60, margin + 46);
    }
    
    // Informace o zakázce
    pdf.setFontSize(9);
    pdf.text(`Číslo zakázky: ${batchDeliveryNote?.order_number || 'Neuvedeno'}`, margin, margin + 55);
    pdf.text(`Datum vydání: ${formatDate(batchDeliveryNote?.rentals?.[0]?.issue_date) || 'Neuvedeno'}`, 
             pdfWidth - margin - 60, margin + 55);
    
    // Vytvoření tabulky
    if (batchDeliveryNote?.rentals && batchDeliveryNote.rentals.length > 0) {
      // Připravíme data pro tabulku
      const tableColumn = ['Pořadí', 'Název', 'Inventární č.', 'Množství', 'Plánované vrácení', 'Denní sazba'];
      const tableRows = [];
      
      // Naplnění daty
      batchDeliveryNote.rentals.forEach((item, index) => {
        const rowData = [
          index + 1,
          item.equipment_name || 'Neuvedeno',
          item.inventory_number || '-',
          `${item.quantity || 1} ks`,
          formatDate(item.planned_return_date) || 'Neurčeno',
          `${formatCurrency(item.daily_rate || 0)}/den`
        ];
        tableRows.push(rowData);
      });
      
      // Přidáme tabulku do PDF
      pdf.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: margin + 60,
        margin: { top: margin, bottom: margin, left: margin, right: margin },
        styles: { 
          font: 'helvetica',
          fontSize: 8,
          overflow: 'linebreak',
          cellPadding: 2
        },
        headerStyles: { 
          fillColor: [220, 220, 220],
          textColor: [0, 0, 0],
          fontStyle: 'normal',
          lineWidth: 0.1,
          lineColor: [0, 0, 0]
        },
        bodyStyles: {
          lineWidth: 0.1,
          lineColor: [0, 0, 0]
        },
        didDrawPage: () => addPageFooter(pdf, margin)
      });
      
      // Přidáme poznámky
      const finalY = (pdf.autoTable.previous.finalY || 0) + 10;
      pdf.setFontSize(9);
      pdf.text('Poznámky:', margin, finalY);
      pdf.setFontSize(8);
      pdf.text(batchDeliveryNote?.rentals?.[0]?.note || 'Bez poznámek', margin, finalY + 5);
      
      // Přidáme celkový počet položek
      pdf.setFontSize(9);
      pdf.text(`Celkový počet položek: ${batchDeliveryNote?.total_items || 0} ks`, 
               pdfWidth - margin, finalY + 5, { align: 'right' });
      
      // Přidáme podpisy
      addSignatureBlocks(pdf, finalY + 30, { margin, leftText: 'Za dodavatele', rightText: 'Za odběratele' });
      
      // Přidáme patičku
      pdf.setFontSize(7);
      pdf.text(
        'Půjčovna Stavebnin s.r.o. | Stavební 123, 123 45 Město | IČO: 12345678 | DIČ: CZ12345678', 
        pdfWidth / 2, 
        pdfHeight - 10, 
        { align: 'center' }
      );
      pdf.text(
        'Tel: +420 123 456 789 | Email: info@pujcovna-stavebnin.cz | www.pujcovna-stavebnin.cz', 
        pdfWidth / 2, 
        pdfHeight - 7, 
        { align: 'center' }
      );
    } else {
      // Pokud nejsou žádné položky, zobrazíme informaci
      pdf.setFontSize(12);
      pdf.text('Žádné položky v hromadném dodacím listu', pdfWidth / 2, margin + 65, { align: 'center' });
      
      // Přidáme zápatí
      addPageFooter(pdf, margin);
    }
    
    return pdf;
  } catch (error) {
    console.error('Chyba při generování PDF:', error);
    throw error;
  }
};

/**
 * Generuje PDF pro hromadný dodací list vratek
 * 
 * @param {Object} returnNote - Data dodacího listu vratek
 * @returns {Object} Vygenerované PDF
 */
export const generateBatchReturnNotePdf = (returnNote) => {
  try {
    const pdf = createPdf();
    
    // Základní údaje
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 15; // okraje v mm
    
    // Přidáme hlavičku dokumentu
    pdf.setFontSize(16);
    pdf.text('HROMADNÝ DODACÍ LIST VRATEK', pdfWidth / 2, margin, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(`Č. ${returnNote?.return_note_number || 'Neznámé'}`, pdfWidth / 2, margin + 8, { align: 'center' });
    pdf.text(`Datum vystavení: ${formatDate(returnNote?.created_at || new Date())}`, pdfWidth / 2, margin + 15, { align: 'center' });
    
    // Informace o dodavateli
    pdf.setFontSize(9);
    pdf.text('Dodavatel:', margin, margin + 25);
    pdf.setFontSize(8);
    pdf.text('Půjčovna Stavebnin s.r.o.', margin, margin + 30);
    pdf.text('Stavební 123, 123 45 Město', margin, margin + 34);
    pdf.text('IČO: 12345678, DIČ: CZ12345678', margin, margin + 38);
    pdf.text('Tel: +420 123 456 789', margin, margin + 42);
    pdf.text('Email: info@pujcovna-stavebnin.cz', margin, margin + 46);
    
    // Informace o odběrateli
    pdf.setFontSize(9);
    pdf.text('Odběratel:', pdfWidth - margin - 60, margin + 25);
    pdf.setFontSize(8);
    pdf.text(returnNote?.customer_name || 'Neuvedeno', pdfWidth - margin - 60, margin + 30);
    pdf.text(returnNote?.customer_address || 'Adresa neuvedena', pdfWidth - margin - 60, margin + 34);
    
    const icoText = returnNote?.customer_ico ? `IČO: ${returnNote.customer_ico}` : '';
    const dicText = returnNote?.customer_dic ? `DIČ: ${returnNote.customer_dic}` : '';
    const icodicText = icoText && dicText ? `${icoText}, ${dicText}` : (icoText || dicText);
    
    if (icodicText) {
      pdf.text(icodicText, pdfWidth - margin - 60, margin + 38);
    }
    
    if (returnNote?.customer_phone) {
      pdf.text(`Tel: ${returnNote.customer_phone}`, pdfWidth - margin - 60, margin + 42);
    }
    
    if (returnNote?.customer_email) {
      pdf.text(`Email: ${returnNote.customer_email}`, pdfWidth - margin - 60, margin + 46);
    }
    
    // Vytvoření tabulky vrácených položek
    if (returnNote?.returns && returnNote.returns.length > 0) {
      // Připravíme data pro tabulku
      const tableColumn = ['Pořadí', 'Název', 'Inv. č.', 'Množství', 'Datum vrácení', 'Stav', 'Dodatečné poplatky'];
      const tableRows = [];
      
      // Naplnění daty
      let totalAdditionalCharges = 0;
      
      returnNote.returns.forEach((item, index) => {
        const additionalCharges = parseFloat(item.additional_charges) || 0;
        totalAdditionalCharges += additionalCharges;
        
        let conditionText = 'Neuvedeno';
        if (item.condition === 'ok') conditionText = 'V pořádku';
        else if (item.condition === 'damaged') conditionText = 'Poškozeno';
        else if (item.condition === 'missing') conditionText = 'Chybí';
        else conditionText = item.condition;
        
        const rowData = [
          index + 1,
          item.equipment_name || 'Neuvedeno',
          item.inventory_number || '-',
          `${item.quantity || 1} ks`,
          formatDate(item.return_date) || '-',
          conditionText,
          formatCurrency(additionalCharges)
        ];
        tableRows.push(rowData);
      });
      
      // Přidáme tabulku do PDF
      pdf.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: margin + 60,
        margin: { top: margin, bottom: margin, left: margin, right: margin },
        styles: { 
          font: 'helvetica',
          fontSize: 8,
          overflow: 'linebreak',
          cellPadding: 2
        },
        headerStyles: { 
          fillColor: [220, 220, 220],
          textColor: [0, 0, 0],
          fontStyle: 'normal',
          lineWidth: 0.1,
          lineColor: [0, 0, 0]
        },
        bodyStyles: {
          lineWidth: 0.1,
          lineColor: [0, 0, 0]
        },
        foot: [[
          { content: 'Celkem položek:', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: `${returnNote?.total_items || 0} ks`, styles: { fontStyle: 'bold' } },
          { content: 'Celkem dodatečné poplatky:', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: formatCurrency(totalAdditionalCharges), styles: { fontStyle: 'bold' } }
        ]],
        didDrawPage: () => addPageFooter(pdf, margin)
      });
      
      let finalY = (pdf.autoTable.previous.finalY || 0) + 10;
      
      // Přidáme sekci pro poškozené položky a poznámky, pokud existují
      const damagedItems = returnNote.returns.filter(item => item.condition !== 'ok' && item.damage_description);
      
      if (damagedItems.length > 0) {
        pdf.setFontSize(9);
        pdf.text('Popis poškození:', margin, finalY);
        finalY += 5;
        
        // Vytvoříme tabulku s popisem poškození
        const damageTableColumn = ['Položka', 'Popis poškození'];
        const damageTableRows = damagedItems.map(item => [
          `${item.equipment_name} (${item.inventory_number})`,
          item.damage_description || '-'
        ]);
        
        pdf.autoTable({
          head: [damageTableColumn],
          body: damageTableRows,
          startY: finalY,
          margin: { top: margin, bottom: margin, left: margin, right: margin },
          styles: { 
            font: 'helvetica',
            fontSize: 8,
            overflow: 'linebreak',
            cellPadding: 2
          },
          headerStyles: { 
            fillColor: [220, 220, 220],
            textColor: [0, 0, 0],
            fontStyle: 'normal',
            lineWidth: 0.1,
            lineColor: [0, 0, 0]
          },
          bodyStyles: {
            lineWidth: 0.1,
            lineColor: [0, 0, 0]
          },
          didDrawPage: () => addPageFooter(pdf, margin)
        });
        
        finalY = (pdf.autoTable.previous.finalY || 0) + 10;
      }
      
      // Přidáme poznámky
      pdf.setFontSize(9);
      pdf.text('Poznámky:', margin, finalY);
      pdf.setFontSize(8);
      pdf.text(returnNote?.returns?.[0]?.notes || 'Bez poznámek', margin, finalY + 5);
      
      // Přidáme podpisy
      addSignatureBlocks(pdf, finalY + 30, { margin, leftText: 'Za dodavatele', rightText: 'Za odběratele' });
      
      // Přidáme patičku
      pdf.setFontSize(7);
      pdf.text(
        'Půjčovna Stavebnin s.r.o. | Stavební 123, 123 45 Město | IČO: 12345678 | DIČ: CZ12345678', 
        pdfWidth / 2, 
        pdfHeight - 10, 
        { align: 'center' }
      );
      pdf.text(
        'Tel: +420 123 456 789 | Email: info@pujcovna-stavebnin.cz | www.pujcovna-stavebnin.cz', 
        pdfWidth / 2, 
        pdfHeight - 7, 
        { align: 'center' }
      );
    } else {
      // Pokud nejsou žádné položky, zobrazíme informaci
      pdf.setFontSize(12);
      pdf.text('Žádné vrácené položky', pdfWidth / 2, margin + 65, { align: 'center' });
      
      // Přidáme zápatí
      addPageFooter(pdf, margin);
    }
    
    return pdf;
  } catch (error) {
    console.error('Chyba při generování PDF:', error);
    throw error;
  }
};