/**
 * Utilita pro generování PDF dokumentů
 *
 * Toto je sada funkcí pro práci s PDF soubory v aplikaci
 * Používá knihovny jsPDF a jspdf-autotable pro generování PDF
 */
import { formatDate, formatCurrency } from '../config';

/**
 * Vytvoří PDF dokument s použitím importu jsPDF a jspdf-autotable
 * @param {Function} callback - Funkce, která vytvoří a upraví PDF
 * @returns {Promise} Promise s PDF dokumentem
 */
export const createPdfDocument = async (callback) => {
  try {
    // Dynamický import jsPDF
    const { default: jsPDF } = await import('jspdf');
    
    // Dynamický import jspdf-autotable a aplikace jako plugin
    // Import jspdf-autotable aplikuje plugin přímo na jsPDF
    const autoTable = (await import('jspdf-autotable')).default;
    
    // Vytvoření PDF dokumentu
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Aplikace autoTable jako metody na pdf objekt (pro jistotu)
    pdf.autoTable = autoTable;
    
    // Nastavení češtiny
    pdf.setFont("helvetica");
    
    // Zkontrolujeme, zda existuje metoda setLanguage
    if (typeof pdf.setLanguage === 'function') {
      pdf.setLanguage("cs-CZ");
    }
    
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
 * Přidá zápatí na aktuální stránku PDF
 * @param {Object} pdf - jsPDF dokument
 * @param {number} margin - okraje v mm
 */
const addPageFooter = (pdf, margin = 15) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Přidání čísla stránky
  pdf.setFontSize(8);
  pdf.text(`Strana ${pdf.internal.getNumberOfPages()}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  
  // Přidání data generování
  pdf.text(`Vygenerováno: ${new Date().toLocaleDateString('cs-CZ')}`, margin, pageHeight - 10);
};

/**
 * Přidá bloky pro podpisy do PDF dokumentu
 * @param {Object} pdf - jsPDF dokument
 * @param {number} yPosition - Y pozice podpisů
 * @param {Object} options - nastavení podpisů
 */
const addSignatureBlocks = (pdf, yPosition, options = {}) => {
  const margin = options.margin || 15;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const leftText = options.leftText || 'Podpis';
  const rightText = options.rightText || 'Podpis';
  
  // Přidání čar pro podpisy
  pdf.line(margin, yPosition, margin + 60, yPosition);
  pdf.line(pageWidth - margin - 60, yPosition, pageWidth - margin, yPosition);
  
  // Přidání textu pod čarami
  pdf.setFontSize(10);
  pdf.text(leftText, margin + 30, yPosition + 5, { align: 'center' });
  pdf.text(rightText, pageWidth - margin - 30, yPosition + 5, { align: 'center' });
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
    pdf.text(`Datum vystavení: ${formatDate(deliveryNote?.created_at || new Date())}`, pdfWidth / 2, margin + 15, { align: 'center' });
    
    // Informace o dodavateli a odběrateli
    pdf.setFontSize(10);
    pdf.text('Dodavatel:', margin, margin + 25);
    pdf.setFontSize(8);
    pdf.text('Půjčovna Stavebnin s.r.o.', margin, margin + 30);
    pdf.text('Stavební 123, 123 45 Město', margin, margin + 34);
    pdf.text('IČO: 12345678, DIČ: CZ12345678', margin, margin + 38);
    pdf.text('Tel: +420 123 456 789', margin, margin + 42);
    pdf.text('Email: info@pujcovna-stavebnin.cz', margin, margin + 46);
    
    // Informace o odběrateli
    pdf.setFontSize(10);
    pdf.text('Odběratel:', pdfWidth - margin - 60, margin + 25);
    pdf.setFontSize(8);
    pdf.text(deliveryNote?.customer_name || 'Neuvedeno', pdfWidth - margin - 60, margin + 30);
    pdf.text(deliveryNote?.customer_address || 'Adresa neuvedena', pdfWidth - margin - 60, margin + 34);
    
    const icoText = deliveryNote?.customer_ico ? `IČO: ${deliveryNote.customer_ico}` : '';
    const dicText = deliveryNote?.customer_dic ? `DIČ: ${deliveryNote.customer_dic}` : '';
    const icodicText = icoText && dicText ? `${icoText}, ${dicText}` : (icoText || dicText);
    
    if (icodicText) {
      pdf.text(icodicText, pdfWidth - margin - 60, margin + 38);
    }
    
    if (deliveryNote?.customer_phone) {
      pdf.text(`Tel: ${deliveryNote.customer_phone}`, pdfWidth - margin - 60, margin + 42);
    }
    
    if (deliveryNote?.customer_email) {
      pdf.text(`Email: ${deliveryNote.customer_email}`, pdfWidth - margin - 60, margin + 46);
    }
    
    // Informace o zakázce
    pdf.setFontSize(9);
    pdf.text(`Číslo zakázky: ${deliveryNote?.order_number || 'Neuvedeno'}`, margin, margin + 55);
    pdf.text(`Datum vydání: ${formatDate(deliveryNote?.rentals?.[0]?.issue_date) || 'Neuvedeno'}`, 
             pdfWidth - margin - 60, margin + 55);
    
    // Seznam položek
    if (deliveryNote?.rentals && deliveryNote.rentals.length > 0) {
      // Tabulka položek
      const tableColumn = ['Pořadí', 'Název', 'Inventární č.', 'Množství', 'Plánované vrácení', 'Denní sazba'];
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
        startY: margin + 60,
        margin: { top: margin, right: margin, bottom: margin, left: margin },
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
      
      // Celkový počet položek
      const finalY = pdf.lastAutoTable.finalY + 10;
      pdf.setFontSize(9);
      pdf.text(`Celkový počet položek: ${deliveryNote?.total_items || 0} ks`, margin, finalY);
      
      // Přidáme poznámky
      const notesY = finalY + 10;
      pdf.setFontSize(9);
      pdf.text('Poznámky:', margin, notesY);
      pdf.setFontSize(8);
      pdf.text(deliveryNote?.rentals?.[0]?.note || 'Bez poznámek', margin, notesY + 5);
      
      // Podpisy
      addSignatureBlocks(pdf, notesY + 30, { margin, leftText: 'Za dodavatele', rightText: 'Za odběratele' });
      
      // Patička
      pdf.setFontSize(7);
      pdf.text(
        'Půjčovna Stavebnin s.r.o. | Stavební 123, 123 45 Město | IČO: 12345678 | DIČ: CZ12345678', 
        pdfWidth / 2, 
        pageHeight - 10, 
        { align: 'center' }
      );
      pdf.text(
        'Tel: +420 123 456 789 | Email: info@pujcovna-stavebnin.cz | www.pujcovna-stavebnin.cz', 
        pdfWidth / 2, 
        pageHeight - 7, 
        { align: 'center' }
      );
    } else {
      // Pokud nejsou žádné položky
      pdf.setFontSize(12);
      pdf.text('Žádné položky v hromadném dodacím listu', pdfWidth / 2, margin + 65, { align: 'center' });
      
      // Přidáme zápatí
      addPageFooter(pdf, margin);
    }
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
      
      let finalY = (pdf.lastAutoTable.finalY || 0) + 10;
      
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
        
        finalY = (pdf.lastAutoTable.finalY || finalY) + 10;
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
        pageHeight - 10, 
        { align: 'center' }
      );
      pdf.text(
        'Tel: +420 123 456 789 | Email: info@pujcovna-stavebnin.cz | www.pujcovna-stavebnin.cz', 
        pdfWidth / 2, 
        pageHeight - 7, 
        { align: 'center' }
      );
    } else {
      // Pokud nejsou žádné položky, zobrazíme informaci
      pdf.setFontSize(12);
      pdf.text('Žádné vrácené položky', pdfWidth / 2, margin + 65, { align: 'center' });
      
      // Přidáme zápatí
      addPageFooter(pdf, margin);
    }
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
    pdf.text(`Období: ${formatDate(billingData?.billing_period_from || billingData?.period_from)} - ${formatDate(billingData?.billing_period_to || billingData?.period_to)}`, margin, margin + 35);
    
    // Seznam položek
    if (billingData?.items && billingData.items.length > 0) {
      // Tabulka položek
      const tableColumn = ['Název', 'Inv. č.', 'Od', 'Do', 'Dny', 'Ks', 'Sazba/den', 'Celkem'];
      const tableRows = billingData.items.map(item => [
        item.equipment_name || item.description || 'Neuvedeno',
        item.inventory_number || '-',
        formatDate(item.issue_date) || '-',
        formatDate(item.return_date || item.effective_return_date || billingData.billing_date) || '-',
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
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
        didDrawPage: () => addPageFooter(pdf, margin)
      });
      
      // Celková cena
      const finalY = pdf.lastAutoTable.finalY + 10;
      pdf.setFontSize(11);
      pdf.text(`Celková cena: ${formatCurrency(billingData.total_amount || 0)}`, 
               pdfWidth - margin, finalY, { align: 'right' });
      
      // Informace o fakturačním období
      const billingInfoY = finalY + 15;
      pdf.setFontSize(10);
      pdf.text('Fakturační údaje:', margin, billingInfoY);
      pdf.setFontSize(9);
      
      const dueDate = billingData?.billing_date ? 
        new Date(new Date(billingData.billing_date).getTime() + 14 * 24 * 60 * 60 * 1000) : new Date();
      
      pdf.text(`Datum vystavení: ${formatDate(billingData?.billing_date || new Date())}`, margin, billingInfoY + 5);
      pdf.text(`Datum splatnosti: ${formatDate(dueDate)}`, margin, billingInfoY + 10);
      
      if (billingData?.is_final_billing) {
        pdf.setFontSize(10);
        pdf.setTextColor(255, 0, 0);
        pdf.text('KONEČNÁ FAKTURACE', pdfWidth - margin, billingInfoY + 10, { align: 'right' });
        pdf.setTextColor(0, 0, 0);
      }
      
      // Poznámky
      const notesY = billingInfoY + 25;
      pdf.setFontSize(10);
      pdf.text('Poznámky:', margin, notesY);
      pdf.setFontSize(9);
      pdf.text(billingData?.note || billingData?.order?.notes || 'Bez poznámek', margin, notesY + 5);
      
      // Podpisy
      const signatureY = notesY + 30;
      pdf.line(margin, signatureY, margin + 60, signatureY);
      pdf.line(pdfWidth - margin - 60, signatureY, pdfWidth - margin, signatureY);
      pdf.text('Vystavil', margin + 30, signatureY + 5, { align: 'center' });
      pdf.text('Schválil', pdfWidth - margin - 30, signatureY + 5, { align: 'center' });
      
      // Patička
      pdf.setFontSize(7);
      pdf.text(
        'Půjčovna Stavebnin s.r.o. | Stavební 123, 123 45 Město | IČO: 12345678 | DIČ: CZ12345678', 
        pdfWidth / 2, 
        pageHeight - 10, 
        { align: 'center' }
      );
      pdf.text(
        'Tel: +420 123 456 789 | Email: info@pujcovna-stavebnin.cz | www.pujcovna-stavebnin.cz', 
        pdfWidth / 2, 
        pageHeight - 7, 
        { align: 'center' }
      );
    } else {
      pdf.text('Žádné položky k fakturaci', pdfWidth / 2, margin + 50, { align: 'center' });
      
      // Přidáme zápatí
      addPageFooter(pdf, margin);
    }
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
    
    // Dodavatel (vlevo)
    pdf.text('Dodavatel:', margin, margin + 25);
    pdf.setFontSize(8);
    pdf.text('Půjčovna Stavebnin s.r.o.', margin, margin + 30);
    pdf.text('Stavební 123', margin, margin + 34);
    pdf.text('123 45 Město', margin, margin + 38);
    pdf.text('IČO: 12345678', margin, margin + 42);
    pdf.text('DIČ: CZ12345678', margin, margin + 46);
    pdf.text('Tel: +420 123 456 789', margin, margin + 50);
    pdf.text('Email: info@pujcovna-stavebnin.cz', margin, margin + 54);
    
    // Odběratel (vpravo)
    pdf.setFontSize(10);
    pdf.text('Odběratel:', pdfWidth - margin - 60, margin + 25);
    pdf.setFontSize(8);
    
    if (deliveryNote?.order?.customer_name) {
      pdf.text(deliveryNote.order.customer_name, pdfWidth - margin - 60, margin + 30);
    } else {
      pdf.text('Neuvedeno', pdfWidth - margin - 60, margin + 30);
    }
    
    let customerAddress = deliveryNote?.order?.customer_address;
    let offsetY = margin + 34;
    if (customerAddress) {
      const addressLines = customerAddress.split('\n');
      addressLines.forEach((line, index) => {
        pdf.text(line, pdfWidth - margin - 60, offsetY);
        offsetY += 4;
      });
    } else {
      pdf.text('Adresa neuvedena', pdfWidth - margin - 60, offsetY);
      offsetY += 4;
    }
    
    // Další údaje odběratele (IČO, DIČ, kontakt)
    if (deliveryNote?.order?.ico) {
      pdf.text(`IČO: ${deliveryNote.order.ico}`, pdfWidth - margin - 60, offsetY);
      offsetY += 4;
    }
    
    if (deliveryNote?.order?.dic) {
      pdf.text(`DIČ: ${deliveryNote.order.dic}`, pdfWidth - margin - 60, offsetY);
      offsetY += 4;
    }
    
    if (deliveryNote?.order?.customer_phone) {
      pdf.text(`Tel: ${deliveryNote.order.customer_phone}`, pdfWidth - margin - 60, offsetY);
      offsetY += 4;
    }
    
    if (deliveryNote?.order?.customer_email) {
      pdf.text(`Email: ${deliveryNote.order.customer_email}`, pdfWidth - margin - 60, offsetY);
    }
    
    // Informace o zakázce
    pdf.setFontSize(10);
    const orderDetailsY = margin + 65;
    pdf.text(`Číslo zakázky: ${deliveryNote?.order?.order_number || 'Neuvedeno'}`, margin, orderDetailsY);
    pdf.text(`Datum vydání: ${formatDate(deliveryNote?.rentals?.[0]?.issue_date || new Date())}`, pdfWidth / 2, orderDetailsY);
    
    // Seznam položek
    pdf.setFontSize(11);
    const itemsHeaderY = orderDetailsY + 10;
    pdf.text('Seznam položek', margin, itemsHeaderY);
    
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
        startY: itemsHeaderY + 5,
        margin: { top: margin, right: margin, bottom: margin, left: margin },
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
          { content: `${deliveryNote?.total_items || 0} ks`, styles: { fontStyle: 'bold' } },
          { content: '' }
        ]],
        didDrawPage: () => addPageFooter(pdf, margin)
      });
      
      // Poznámky
      const finalY = pdf.lastAutoTable.finalY + 10;
      pdf.setFontSize(10);
      pdf.text('Poznámky:', margin, finalY);
      pdf.setFontSize(8);
      pdf.text(deliveryNote?.order?.notes || 'Bez poznámek', margin, finalY + 5);
      
      // Podpisy
      addSignatureBlocks(pdf, finalY + 30, { margin, leftText: 'Vydal', rightText: 'Převzal' });
      
      // Patička
      pdf.setFontSize(7);
      pdf.text(
        'Půjčovna Stavebnin s.r.o. | Stavební 123, 123 45 Město | IČO: 12345678 | DIČ: CZ12345678', 
        pdfWidth / 2, 
        pageHeight - 10, 
        { align: 'center' }
      );
      pdf.text(
        'Tel: +420 123 456 789 | Email: info@pujcovna-stavebnin.cz | www.pujcovna-stavebnin.cz', 
        pdfWidth / 2, 
        pageHeight - 7, 
        { align: 'center' }
      );
    } else {
      pdf.text('Žádné položky v dodacím listu', pdfWidth / 2, itemsHeaderY + 20, { align: 'center' });
      
      // Zápatí
      addPageFooter(pdf, margin);
    }
  });
};

/**
 * Generátor PDF pro hromadný dodací list - zastaralá verze
 * 
 * @param {Object} batchDeliveryNote - Data hromadného dodacího listu
 * @returns {Object} Vygenerované PDF
 * @deprecated Používejte funkci generateBatchDeliveryNotePdf místo této
 */
export const generateBatchDeliveryNotePdfOld = (batchDeliveryNote) => {
  try {
    throw new Error('Tato funkce je zastaralá. Použijte generateBatchDeliveryNotePdf.');
  } catch (error) {
    console.error('Chyba při generování PDF:', error);
    throw error;
  }
};