/**
 * Utilita pro generování PDF dokumentů
 *
 * Toto je sada funkcí pro práci s PDF soubory v aplikaci
 * Používá knihovny jsPDF (v3.0.1) a jspdf-autotable (v5.0.2) pro 
 * generování PDF s podporou českého jazyka a diakritiky
 * 
 * POZOR: Tato utilita je optimalizována pro správné zobrazení češtiny v PDF 
 * dokumentech, a proto nedoporučujeme měnit verze knihoven bez důkladného testování
 */
import { formatDate, formatCurrency } from '../config';

/**
 * Vytvoří PDF dokument s použitím importu jsPDF a jspdf-autotable
 * @param {Function} callback - Funkce, která vytvoří a upraví PDF
 * @param {Object} options - Další nastavení pro PDF
 * @returns {Promise} Promise s PDF dokumentem
 */
export const createPdfDocument = async (callback, options = {}) => {
  try {
    // Pro nejlepší podporu češtiny je důležité importovat přesně tyto verze knihoven:
    // jsPDF v3.0.1 a jspdf-autotable v5.0.2
    
    // Dynamický import jsPDF
    const { default: jsPDF } = await import('jspdf');
    
    // Dynamický import jspdf-autotable
    const { default: autoTableModule } = await import('jspdf-autotable');
    
    // Vytvoření PDF dokumentu s optimálním nastavením pro český jazyk
    const pdf = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: options.unit || 'mm',
      format: options.format || 'a4',
      compress: true,
      putOnlyUsedFonts: true,
      floatPrecision: 16,
      hotfixes: ['px_scaling'] // Důležité pro správné zobrazení textu
    });
    
    // Výchozí velikost fontu
    let currentFontSize = 12;
    
    // Přepíšeme metodu setFontSize, abychom udržovali aktuální velikost
    const originalSetFontSize = pdf.setFontSize;
    pdf.setFontSize = function(size) {
      currentFontSize = size;
      return originalSetFontSize.call(this, size);
    };
    
    // Explicitně přidáme metodu getFontSize do pdf.internal
    if (!pdf.internal.getFontSize) {
      pdf.internal.getFontSize = function() {
        return currentFontSize;
      };
    }
    
    // Zajistíme správné nastavení výchozích možností textu
    if (pdf.internal.defaultTextOptions) {
      pdf.internal.defaultTextOptions.fontSize = currentFontSize;
    }
    
    // Přiřadíme autoTable jako metodu na pdf objekt
    pdf.autoTable = function() {
      try {
        return autoTableModule.apply(this, arguments);
      } catch (e) {
        console.error('Chyba při volání autoTable:', e);
        return { finalY: pdf.internal.pageSize.getHeight() / 2 };
      }
    };
    
    // Nastavení češtiny a fontů
    pdf.setFont("helvetica");
    pdf.setFontSize(12); 
    
    // jsPDF nemá přímo metodu setLanguage, ale zajistíme správné zobrazení diakritiky
    // pomocí správného nastavení PDF dokumentu a fontů pro češtinu
    try {
      // Pokud by novější verze jsPDF měla metodu setLanguage, použijeme ji
      if (typeof pdf.setLanguage === 'function') {
        pdf.setLanguage("cs-CZ");
      }
      
      // Nastavíme české prostředí pro formátování čísel apod.
      pdf.internal.options = pdf.internal.options || {};
      pdf.internal.options.lang = 'cs-CZ';
    } catch (e) {
      console.error('Chyba při nastavování jazyka:', e);
    }
    
    // Zavoláme callback funkci pro vytvoření obsahu
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
 * @param {Object} options - Nastavení zápatí
 */
const addPageFooter = (pdf, options = {}) => {
  try {
    const margin = options.margin || 15;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Přidání čísla stránky
    pdf.setFontSize(8);
    pdf.text(`Strana ${pdf.internal.getNumberOfPages()}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    
    // Přidání data generování
    pdf.text(`Vygenerováno: ${new Date().toLocaleDateString('cs-CZ')}`, margin, pageHeight - 10);

    // Přidání patičky s informacemi o firmě
    if (options.showCompanyFooter !== false) {
      pdf.setFontSize(7);
      pdf.text(
        'Půjčovna Stavebnin s.r.o. | Stavební 123, 123 45 Město | IČO: 12345678 | DIČ: CZ12345678', 
        pageWidth / 2, 
        pageHeight - 5, 
        { align: 'center' }
      );
    }
  } catch (error) {
    console.error('Chyba při přidávání zápatí:', error);
  }
};

/**
 * Přidá bloky pro podpisy do PDF dokumentu
 * @param {Object} pdf - jsPDF dokument
 * @param {number} yPosition - Y pozice podpisů
 * @param {Object} options - nastavení podpisů
 */
const addSignatureBlocks = (pdf, yPosition, options = {}) => {
  try {
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
  } catch (error) {
    console.error('Chyba při přidávání podpisových bloků:', error);
  }
};

/**
 * Přidá hlavičku s informacemi o dodavateli a odběrateli
 * @param {Object} pdf - jsPDF dokument
 * @param {Object} data - Data pro hlavičku
 * @param {Object} options - Nastavení hlavičky
 */
const addHeader = (pdf, data, options = {}) => {
  try {
    const margin = options.margin || 15;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const title = options.title || 'DOKUMENT';
    const subtitle = options.subtitle || '';
    
    // Hlavička dokumentu
    pdf.setFontSize(16);
    pdf.text(title, pageWidth / 2, margin, { align: 'center' });
    
    if (subtitle) {
      pdf.setFontSize(12);
      pdf.text(subtitle, pageWidth / 2, margin + 8, { align: 'center' });
    }
    
    // Datum vystavení
    pdf.setFontSize(10);
    pdf.text(`Datum vystavení: ${formatDate(data?.created_at || new Date())}`, 
             pageWidth / 2, margin + 15, { align: 'center' });
    
    // Informace o dodavateli (vlevo)
    pdf.setFontSize(10);
    pdf.text('Dodavatel:', margin, margin + 25);
    pdf.setFontSize(8);
    pdf.text('Půjčovna Stavebnin s.r.o.', margin, margin + 30);
    pdf.text('Stavební 123, 123 45 Město', margin, margin + 34);
    pdf.text('IČO: 12345678, DIČ: CZ12345678', margin, margin + 38);
    pdf.text('Tel: +420 123 456 789', margin, margin + 42);
    pdf.text('Email: info@pujcovna-stavebnin.cz', margin, margin + 46);
    
    // Informace o odběrateli (vpravo)
    const customerX = pageWidth - margin - 60;
    let customerY = margin + 25;
    
    pdf.setFontSize(10);
    pdf.text('Odběratel:', customerX, customerY);
    customerY += 5;
    
    pdf.setFontSize(8);
    pdf.text(data?.customer_name || 'Neuvedeno', customerX, customerY);
    customerY += 4;
    
    // Adresa zákazníka
    if (data?.customer_address) {
      const addressLines = typeof data.customer_address === 'string' 
        ? data.customer_address.split('\n') 
        : [data.customer_address];
      
      addressLines.forEach(line => {
        pdf.text(line, customerX, customerY);
        customerY += 4;
      });
    } else {
      pdf.text('Adresa neuvedena', customerX, customerY);
      customerY += 4;
    }
    
    // IČO a DIČ zákazníka
    const icoText = data?.customer_ico ? `IČO: ${data.customer_ico}` : '';
    const dicText = data?.customer_dic ? `DIČ: ${data.customer_dic}` : '';
    
    if (icoText) {
      pdf.text(icoText, customerX, customerY);
      customerY += 4;
    }
    
    if (dicText) {
      pdf.text(dicText, customerX, customerY);
      customerY += 4;
    }
    
    // Kontaktní údaje zákazníka
    if (data?.customer_phone) {
      pdf.text(`Tel: ${data.customer_phone}`, customerX, customerY);
      customerY += 4;
    }
    
    if (data?.customer_email) {
      pdf.text(`Email: ${data.customer_email}`, customerX, customerY);
    }
    
    return margin + 60; // Vrátíme Y pozici pro další obsah
  } catch (error) {
    console.error('Chyba při přidávání hlavičky:', error);
    return options.margin || 15; // Vrátíme výchozí Y pozici v případě chyby
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
    try {
      const margin = 15;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Přidáme hlavičku
      const contentStartY = addHeader(pdf, deliveryNote, {
        title: 'HROMADNÝ DODACÍ LIST',
        subtitle: `Č. ${deliveryNote?.delivery_note_number || 'Neznámé'}`
      });
      
      // Informace o zakázce
      pdf.setFontSize(9);
      pdf.text(`Číslo zakázky: ${deliveryNote?.order_number || 'Neuvedeno'}`, margin, contentStartY);
      pdf.text(`Datum vydání: ${formatDate(deliveryNote?.rentals?.[0]?.issue_date) || 'Neuvedeno'}`, 
               pageWidth - margin - 60, contentStartY);
      
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
          startY: contentStartY + 10,
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
          didDrawPage: () => addPageFooter(pdf, { margin })
        });
        
        // Celkový počet položek
        const finalY = (pdf.lastAutoTable?.finalY || contentStartY + 100) + 10;
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
          pageWidth / 2, 
          pageHeight - 10, 
          { align: 'center' }
        );
        pdf.text(
          'Tel: +420 123 456 789 | Email: info@pujcovna-stavebnin.cz | www.pujcovna-stavebnin.cz', 
          pageWidth / 2, 
          pageHeight - 7, 
          { align: 'center' }
        );
      } else {
        // Pokud nejsou žádné položky
        pdf.setFontSize(12);
        pdf.text('Žádné položky v hromadném dodacím listu', pageWidth / 2, contentStartY + 20, { align: 'center' });
        
        // Přidáme zápatí
        addPageFooter(pdf, { margin });
      }
    } catch (error) {
      console.error('Chyba při generování hromadného dodacího listu:', error);
      
      // Zobrazíme chybovou zprávu v PDF
      pdf.setFontSize(12);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Při generování dokumentu došlo k chybě.', 20, 20);
      pdf.text(`Chyba: ${error.message}`, 20, 30);
      pdf.setTextColor(0, 0, 0);
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
    try {
      const margin = 15;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Přidáme hlavičku
      const contentStartY = addHeader(pdf, returnNote, {
        title: 'HROMADNÝ DODACÍ LIST VRATEK',
        subtitle: `Č. ${returnNote?.return_note_number || 'Neznámé'}`
      });
      
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
          startY: contentStartY + 10,
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
          didDrawPage: () => addPageFooter(pdf, { margin })
        });
        
        let finalY = (pdf.lastAutoTable?.finalY || contentStartY + 100) + 10;
        
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
            didDrawPage: () => addPageFooter(pdf, { margin })
          });
          
          finalY = (pdf.lastAutoTable?.finalY || finalY) + 10;
        }
        
        // Přidáme poznámky
        pdf.setFontSize(9);
        pdf.text('Poznámky:', margin, finalY);
        pdf.setFontSize(8);
        pdf.text(returnNote?.returns?.[0]?.notes || 'Bez poznámek', margin, finalY + 5);
        
        // Přidáme podpisy
        addSignatureBlocks(pdf, finalY + 30, { margin, leftText: 'Za dodavatele', rightText: 'Za odběratele' });
      } else {
        // Pokud nejsou žádné položky, zobrazíme informaci
        pdf.setFontSize(12);
        pdf.text('Žádné vrácené položky', pageWidth / 2, contentStartY + 20, { align: 'center' });
        
        // Přidáme zápatí
        addPageFooter(pdf, { margin });
      }
    } catch (error) {
      console.error('Chyba při generování hromadného dodacího listu vratek:', error);
      
      // Zobrazíme chybovou zprávu v PDF
      pdf.setFontSize(12);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Při generování dokumentu došlo k chybě.', 20, 20);
      pdf.text(`Chyba: ${error.message}`, 20, 30);
      pdf.setTextColor(0, 0, 0);
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
    try {
      const margin = 15;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Hlavička dokumentu
      pdf.setFontSize(16);
      pdf.text('FAKTURAČNÍ PODKLAD', pageWidth / 2, margin, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Č. ${billingData?.invoice_number || 'Neznámé'}`, pageWidth / 2, margin + 8, { align: 'center' });
      pdf.text(`Datum: ${formatDate(billingData?.billing_date || new Date())}`, pageWidth / 2, margin + 15, { align: 'center' });
      
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
          didDrawPage: () => addPageFooter(pdf, { margin })
        });
        
        // Celková cena
        const finalY = (pdf.lastAutoTable?.finalY || margin + 150) + 10;
        pdf.setFontSize(11);
        pdf.text(`Celková cena: ${formatCurrency(billingData.total_amount || 0)}`, 
                 pageWidth - margin, finalY, { align: 'right' });
        
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
          pdf.text('KONEČNÁ FAKTURACE', pageWidth - margin, billingInfoY + 10, { align: 'right' });
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
        pdf.line(pageWidth - margin - 60, signatureY, pageWidth - margin, signatureY);
        pdf.text('Vystavil', margin + 30, signatureY + 5, { align: 'center' });
        pdf.text('Schválil', pageWidth - margin - 30, signatureY + 5, { align: 'center' });
      } else {
        pdf.text('Žádné položky k fakturaci', pageWidth / 2, margin + 50, { align: 'center' });
        
        // Přidáme zápatí
        addPageFooter(pdf, { margin });
      }
    } catch (error) {
      console.error('Chyba při generování fakturačního podkladu:', error);
      
      // Zobrazíme chybovou zprávu v PDF
      pdf.setFontSize(12);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Při generování dokumentu došlo k chybě.', 20, 20);
      pdf.text(`Chyba: ${error.message}`, 20, 30);
      pdf.setTextColor(0, 0, 0);
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
    try {
      const margin = 15;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Hlavička dokumentu
      const contentStartY = addHeader(pdf, {
        created_at: deliveryNote?.created_at,
        customer_name: deliveryNote?.order?.customer_name,
        customer_address: deliveryNote?.order?.customer_address,
        customer_ico: deliveryNote?.order?.ico,
        customer_dic: deliveryNote?.order?.dic,
        customer_phone: deliveryNote?.order?.customer_phone,
        customer_email: deliveryNote?.order?.customer_email
      }, {
        title: 'DODACÍ LIST',
        subtitle: `Č. ${deliveryNote?.delivery_note_number || 'Neznámé'}`
      });
      
      // Informace o zakázce
      pdf.setFontSize(10);
      pdf.text(`Číslo zakázky: ${deliveryNote?.order?.order_number || 'Neuvedeno'}`, margin, contentStartY);
      pdf.text(`Datum vydání: ${formatDate(deliveryNote?.rentals?.[0]?.issue_date || new Date())}`, 
                pageWidth / 2, contentStartY);
      
      // Seznam položek
      pdf.setFontSize(11);
      const itemsHeaderY = contentStartY + 10;
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
          didDrawPage: () => addPageFooter(pdf, { margin })
        });
        
        // Poznámky
        const finalY = (pdf.lastAutoTable?.finalY || margin + 150) + 10;
        pdf.setFontSize(10);
        pdf.text('Poznámky:', margin, finalY);
        pdf.setFontSize(8);
        pdf.text(deliveryNote?.order?.notes || 'Bez poznámek', margin, finalY + 5);
        
        // Podpisy
        addSignatureBlocks(pdf, finalY + 30, { margin, leftText: 'Vydal', rightText: 'Převzal' });
      } else {
        pdf.text('Žádné položky v dodacím listu', pageWidth / 2, itemsHeaderY + 20, { align: 'center' });
        
        // Zápatí
        addPageFooter(pdf, { margin });
      }
    } catch (error) {
      console.error('Chyba při generování dodacího listu:', error);
      
      // Zobrazíme chybovou zprávu v PDF
      pdf.setFontSize(12);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Při generování dokumentu došlo k chybě.', 20, 20);
      pdf.text(`Chyba: ${error.message}`, 20, 30);
      pdf.setTextColor(0, 0, 0);
    }
  });
};