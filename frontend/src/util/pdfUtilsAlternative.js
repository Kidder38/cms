/**
 * Alternativní utilita pro generování PDF dokumentů
 *
 * Tato implementace používá pdfmake a html-to-pdfmake pro lepší podporu
 * českého jazyka a diakritiky v PDF dokumentech
 */
import { formatDate, formatCurrency } from '../config';

/**
 * Vytvoří a spustí download PDF dokumentu
 * @param {Function} contentCallback - Funkce, která definuje obsah dokumentu
 * @param {string} filename - Název souboru pro stažení
 * @param {Object} options - Další nastavení pro PDF
 * @returns {Promise<void>} Promise
 * 
 * Nastavení velikosti stránek a okrajů:
 * 
 * Vlastnost 'pageSize' může být nastavena na tyto hodnoty:
 * - 'A4' (výchozí, 210×297 mm)
 * - 'A5' (148×210 mm)
 * - 'A3' (297×420 mm)
 * - Nebo vlastní rozměry: {width: 210, height: 297}
 * 
 * Vlastnost 'margins' může být nastavena jako pole [levý, horní, pravý, dolní] v pixelech:
 * - Výchozí hodnota je [40, 40, 40, 60]
 * - Pro užší okraje: [20, 20, 20, 40]
 * - Pro širší okraje: [60, 60, 60, 80]
 * 
 * Nastavení fontu:
 * 
 * defaultStyle.font může být nastaven na:
 * - 'Roboto' (výchozí)
 * - 'Helvetica'
 * - 'Times'
 * - 'Courier'
 */
// Načtení knihoven pro pdfmake s podporou pro českou diakritiku
// S require místo import, protože to funguje lépe s webpack
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import htmlToPdfmake from 'html-to-pdfmake';

// Nastavení fontů pro pdfMake
pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : {};

export const createAndDownloadPdf = async (contentCallback, filename, options = {}) => {
  try {
    
    // Nastavíme výchozí styly dokumentu
    const defaultStyles = {
      header: {
        fontSize: 16,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: 'black',
        fillColor: '#eeeeee'
      },
      tableCell: {
        fontSize: 9
      },
      quote: {
        italics: true
      },
      small: {
        fontSize: 8
      }
    };
    
    // Připravíme definici dokumentu
    const docDefinition = {
      info: {
        title: filename || 'Dokument',
        author: 'Půjčovna Stavebnin s.r.o.',
        subject: 'PDF dokument',
        keywords: 'pdf, dokument, půjčovna',
        creator: 'Půjčovna Stavebnin CRM'
      },
      pageSize: options.pageSize || 'A4',
      pageOrientation: options.orientation || 'portrait',
      pageMargins: options.margins || [40, 40, 40, 60],
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10
      },
      styles: { ...defaultStyles, ...(options.styles || {}) },
      footer: function(currentPage, pageCount) {
        return {
          columns: [
            { 
              text: `Vygenerováno: ${new Date().toLocaleDateString('cs-CZ')}`,
              alignment: 'left',
              margin: [40, 0, 0, 0],
              fontSize: 8
            },
            { 
              text: `Strana ${currentPage} z ${pageCount}`,
              alignment: 'right',
              margin: [0, 0, 40, 0],
              fontSize: 8
            }
          ],
          margin: [40, 20]
        };
      }
    };
    
    // Zavoláme callback funkci pro vytvoření obsahu
    if (contentCallback && typeof contentCallback === 'function') {
      const content = await contentCallback(pdfMake, htmlToPdfmake);
      docDefinition.content = content;
    }
    
    // Vytvoříme a stáhneme PDF dokument
    const pdfDoc = pdfMake.createPdf(docDefinition);
    
    // Otevřeme PDF pro stažení - použijeme promise pro vykreslení
    pdfDoc.download(filename || 'dokument.pdf');
  } catch (error) {
    console.error('Chyba při vytváření PDF:', error);
    throw error;
  }
};

/**
 * Vytvoření hlavičky dokumentu s informacemi o dodavateli a odběrateli
 * @param {Object} data - Data pro hlavičku
 * @param {Object} options - Nastavení hlavičky
 * @returns {Array} Pole obsahů pro pdfmake
 */
const createHeader = (data, options = {}) => {
  const header = [];
  
  // Hlavní nadpis
  header.push({
    text: options.title || 'DOKUMENT',
    style: 'header',
    alignment: 'center'
  });
  
  // Podnadpis (např. číslo dokumentu)
  if (options.subtitle) {
    header.push({
      text: options.subtitle,
      style: 'subheader',
      alignment: 'center',
      margin: [0, 0, 0, 10]
    });
  }
  
  // Datum vystavení
  header.push({
    text: `Datum vystavení: ${formatDate(data?.created_at || new Date())}`,
    alignment: 'center',
    margin: [0, 0, 0, 15]
  });
  
  // Informace o dodavateli a odběrateli
  const supplierInfo = [
    { text: 'Dodavatel:', bold: true },
    'Půjčovna Stavebnin s.r.o.',
    'Stavební 123, 123 45 Město',
    'IČO: 12345678, DIČ: CZ12345678',
    'Tel: +420 123 456 789',
    'Email: info@pujcovna-stavebnin.cz'
  ];
  
  const customerInfo = [
    { text: 'Odběratel:', bold: true },
    data?.customer_name || 'Neuvedeno'
  ];
  
  // Přidáme adresu zákazníka
  if (data?.customer_address) {
    if (typeof data.customer_address === 'string') {
      const addressLines = data.customer_address.split('\n');
      addressLines.forEach(line => customerInfo.push(line));
    } else {
      customerInfo.push(data.customer_address);
    }
  } else {
    customerInfo.push('Adresa neuvedena');
  }
  
  // Přidáme IČO a DIČ zákazníka
  if (data?.customer_ico) {
    customerInfo.push(`IČO: ${data.customer_ico}`);
  }
  
  if (data?.customer_dic) {
    customerInfo.push(`DIČ: ${data.customer_dic}`);
  }
  
  // Přidáme kontaktní údaje zákazníka
  if (data?.customer_phone) {
    customerInfo.push(`Tel: ${data.customer_phone}`);
  }
  
  if (data?.customer_email) {
    customerInfo.push(`Email: ${data.customer_email}`);
  }
  
  // Vytvoříme dvousloupcový layout
  header.push({
    columns: [
      {
        width: '*',
        text: supplierInfo,
        margin: [0, 0, 10, 0]
      },
      {
        width: '*',
        text: customerInfo,
        margin: [10, 0, 0, 0]
      }
    ],
    margin: [0, 0, 0, 20]
  });
  
  return header;
};

/**
 * Generátor pro hromadný dodací list
 * 
 * @param {Object} deliveryNote - Data dodacího listu
 * @returns {Promise<void>} Promise
 */
export const generateBatchDeliveryNotePdf = async (deliveryNote) => {
  return createAndDownloadPdf(async (pdfMake, htmlToPdf) => {
    try {
      const content = [];
      
      // Logo a nadpis na jeden řádek
      content.push({
        columns: [
          {
            width: 60,
            text: '',  // Zde by mohlo být logo
            margin: [0, 0, 10, 0]
          },
          {
            width: '*',
            stack: [
              { 
                text: 'HROMADNÝ DODACÍ LIST', 
                style: 'header',
                alignment: 'center',
                fontSize: 18,
                bold: true,
                margin: [0, 0, 0, 5]
              },
              { 
                text: `Č. ${deliveryNote?.delivery_note_number || 'Neznámé'}`, 
                style: 'subheader',
                alignment: 'center',
                margin: [0, 0, 0, 5]
              },
              {
                text: `Datum vystavení: ${formatDate(deliveryNote?.created_at || new Date())}`, 
                alignment: 'center',
                fontSize: 10,
                margin: [0, 0, 0, 0]
              }
            ]
          },
          {
            width: 60,
            text: '',  // Placeholder pro případné další logo
            margin: [10, 0, 0, 0]
          }
        ],
        margin: [0, 0, 0, 20]
      });
      
      // Informace o dodavateli a odběrateli
      content.push({
        columns: [
          {
            width: '*',
            stack: [
              { text: 'Dodavatel:', bold: true, fontSize: 11, margin: [0, 0, 0, 5] },
              { 
                text: [
                  { text: 'Půjčovna Stavebnin s.r.o.\n', bold: true, fontSize: 10 },
                  { text: 'Stavební 123\n123 45 Město\n', fontSize: 9 },
                  { text: 'IČO: 12345678, DIČ: CZ12345678\n', fontSize: 9 },
                  { text: 'Tel: +420 123 456 789\n', fontSize: 9 },
                  { text: 'Email: info@pujcovna-stavebnin.cz', fontSize: 9 }
                ]
              }
            ],
            margin: [0, 0, 10, 0]
          },
          {
            width: '*',
            stack: [
              { text: 'Odběratel:', bold: true, fontSize: 11, margin: [0, 0, 0, 5] },
              { 
                text: [
                  { text: `${deliveryNote?.customer_name || 'Neuvedeno'}\n`, bold: true, fontSize: 10 }
                ]
              }
            ]
          }
        ],
        columnGap: 20,
        margin: [0, 0, 0, 20]
      });
      
      // Pokud má odběratel adresu, přidáme ji
      if (deliveryNote?.customer_address) {
        const addressLines = typeof deliveryNote.customer_address === 'string' 
          ? deliveryNote.customer_address.split('\n') 
          : [deliveryNote.customer_address];
        
        // Získáme poslední stack odběratele
        const lastStack = content[content.length - 1].columns[1].stack;
        
        // Přidáme adresu do posledního textu
        const lastText = lastStack[lastStack.length - 1].text;
        addressLines.forEach(line => {
          lastText.push({ text: `${line}\n`, fontSize: 9 });
        });
      } else {
        // Pokud není adresa, přidáme placeholder
        const lastStack = content[content.length - 1].columns[1].stack;
        const lastText = lastStack[lastStack.length - 1].text;
        lastText.push({ text: 'Adresa neuvedena\n', fontSize: 9, italics: true });
      }
      
      // Přidáme IČO, DIČ a kontaktní údaje odběratele
      const lastStack = content[content.length - 1].columns[1].stack;
      const lastText = lastStack[lastStack.length - 1].text;
      
      if (deliveryNote?.customer_ico) {
        lastText.push({ text: `IČO: ${deliveryNote.customer_ico}\n`, fontSize: 9 });
      }
      
      if (deliveryNote?.customer_dic) {
        lastText.push({ text: `DIČ: ${deliveryNote.customer_dic}\n`, fontSize: 9 });
      }
      
      if (deliveryNote?.customer_phone) {
        lastText.push({ text: `Tel: ${deliveryNote.customer_phone}\n`, fontSize: 9 });
      }
      
      if (deliveryNote?.customer_email) {
        lastText.push({ text: `Email: ${deliveryNote.customer_email}`, fontSize: 9 });
      }
      
      // Informace o zakázce
      content.push({
        columns: [
          {
            width: '*',
            text: [
              { text: 'Číslo zakázky: ', bold: true, fontSize: 10 },
              { text: deliveryNote?.order_number || 'Neuvedeno', fontSize: 10 }
            ]
          },
          {
            width: '*',
            text: [
              { text: 'Datum vydání: ', bold: true, fontSize: 10 },
              { text: formatDate(deliveryNote?.rentals?.[0]?.issue_date) || 'Neuvedeno', fontSize: 10 }
            ],
            alignment: 'right'
          }
        ],
        margin: [0, 0, 0, 15]
      });
      
      // Seznam položek s vylepšeným vzhledem
      if (deliveryNote?.rentals && deliveryNote.rentals.length > 0) {
        // Nadpis tabulky
        content.push({
          text: 'Seznam položek',
          style: 'subheader',
          margin: [0, 0, 0, 10],
          fontSize: 12,
          bold: true
        });
        
        // Vytvoříme tabulku položek
        const tableBody = [
          [
            { text: 'Pořadí', style: 'tableHeader', alignment: 'center' },
            { text: 'Název', style: 'tableHeader' },
            { text: 'Inv. č.', style: 'tableHeader', alignment: 'center' },
            { text: 'Množství', style: 'tableHeader', alignment: 'center' },
            { text: 'Plánované vrácení', style: 'tableHeader', alignment: 'center' },
            { text: 'Denní sazba', style: 'tableHeader', alignment: 'right' }
          ]
        ];
        
        // Naplníme tabulku daty
        deliveryNote.rentals.forEach((item, index) => {
          tableBody.push([
            { text: (index + 1).toString(), alignment: 'center' },
            { text: item.equipment_name || 'Neuvedeno' },
            { text: item.inventory_number || '-', alignment: 'center' },
            { text: `${item.quantity || 1} ks`, alignment: 'center' },
            { text: formatDate(item.planned_return_date) || 'Neurčeno', alignment: 'center' },
            { text: `${formatCurrency(item.daily_rate || 0)}/den`, alignment: 'right' }
          ]);
        });
        
        // Přidáme zápatí tabulky s celkovým počtem
        tableBody.push([
          { text: 'Celkem položek:', colSpan: 3, alignment: 'right', bold: true },
          {}, {},
          { text: `${deliveryNote?.total_items || 0} ks`, alignment: 'center', bold: true },
          {},
          {}
        ]);
        
        // Přidáme tabulku do dokumentu s vylepšeným stylem
        content.push({
          table: {
            headerRows: 1,
            widths: [40, '*', 60, 60, 90, 80],
            body: tableBody
          },
          layout: {
            hLineWidth: function(i, node) { 
              return (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5; 
            },
            vLineWidth: function(i, node) { 
              return (i === 0 || i === node.table.widths.length) ? 1 : 0.5; 
            },
            hLineColor: function(i, node) { 
              return (i === 0 || i === 1) ? '#666666' : '#999999'; 
            },
            vLineColor: function(i, node) { 
              return (i === 0 || i === node.table.widths.length) ? '#666666' : '#999999'; 
            },
            fillColor: function(rowIndex, node, columnIndex) {
              return (rowIndex === 0) ? '#e8e8e8' : null;
            },
            paddingLeft: function(i, node) { return 4; },
            paddingRight: function(i, node) { return 4; },
            paddingTop: function(i, node) { return 3; },
            paddingBottom: function(i, node) { return 3; }
          },
          margin: [0, 0, 0, 20]
        });
        
        // Poznámky
        content.push({
          text: 'Poznámky:',
          bold: true,
          fontSize: 11,
          margin: [0, 0, 0, 5]
        });
        
        content.push({
          text: deliveryNote?.rentals?.[0]?.note || 'Bez poznámek',
          fontSize: 10,
          margin: [0, 0, 0, 30]
        });
        
        // Podpisy
        content.push({
          columns: [
            {
              width: '*',
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 1 }] },
                { text: 'Za dodavatele', alignment: 'center', margin: [0, 5, 0, 0], fontSize: 10 }
              ]
            },
            { width: '*', text: '' },
            {
              width: '*',
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 1 }] },
                { text: 'Za odběratele', alignment: 'center', margin: [0, 5, 0, 0], fontSize: 10 }
              ]
            }
          ],
          margin: [0, 0, 0, 0]
        });
      } else {
        // Pokud nejsou žádné položky
        content.push({
          text: 'Žádné položky v hromadném dodacím listu',
          alignment: 'center',
          margin: [0, 20, 0, 0],
          italic: true
        });
      }
      
      return content;
    } catch (error) {
      console.error('Chyba při generování hromadného dodacího listu:', error);
      return [
        { text: 'Při generování dokumentu došlo k chybě', style: 'header', color: 'red' },
        { text: `Chyba: ${error.message}`, color: 'red' }
      ];
    }
  }, `dodaci-list-${deliveryNote?.delivery_note_number || new Date().getTime()}.pdf`);
};

/**
 * Generátor pro hromadný dodací list vratek
 * 
 * @param {Object} returnNote - Data dodacího listu vratek
 * @returns {Promise<void>} Promise
 */
export const generateBatchReturnNotePdf = async (returnNote) => {
  return createAndDownloadPdf(async (pdfMake, htmlToPdf) => {
    try {
      const content = [];
      
      // Přidáme hlavičku dokumentu
      content.push(...createHeader(returnNote, {
        title: 'HROMADNÝ DODACÍ LIST VRATEK',
        subtitle: `Č. ${returnNote?.return_note_number || 'Neznámé'}`
      }));
      
      // Vytvoření tabulky vrácených položek
      if (returnNote?.returns && returnNote.returns.length > 0) {
        // Vytvoříme tabulku položek
        const tableBody = [
          [
            { text: 'Pořadí', style: 'tableHeader' },
            { text: 'Název', style: 'tableHeader' },
            { text: 'Inv. č.', style: 'tableHeader' },
            { text: 'Množství', style: 'tableHeader' },
            { text: 'Datum vrácení', style: 'tableHeader' },
            { text: 'Stav', style: 'tableHeader' },
            { text: 'Dodatečné poplatky', style: 'tableHeader' }
          ]
        ];
        
        // Naplníme tabulku daty
        let totalAdditionalCharges = 0;
        
        returnNote.returns.forEach((item, index) => {
          const additionalCharges = parseFloat(item.additional_charges) || 0;
          totalAdditionalCharges += additionalCharges;
          
          let conditionText = 'Neuvedeno';
          if (item.condition === 'ok') conditionText = 'V pořádku';
          else if (item.condition === 'damaged') conditionText = 'Poškozeno';
          else if (item.condition === 'missing') conditionText = 'Chybí';
          else conditionText = item.condition;
          
          tableBody.push([
            (index + 1).toString(),
            item.equipment_name || 'Neuvedeno',
            item.inventory_number || '-',
            `${item.quantity || 1} ks`,
            formatDate(item.return_date) || '-',
            conditionText,
            formatCurrency(additionalCharges)
          ]);
        });
        
        // Přidáme tabulku do dokumentu
        content.push({
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: tableBody
          },
          layout: {
            hLineWidth: function(i, node) { return 0.5; },
            vLineWidth: function(i, node) { return 0.5; },
            hLineColor: function(i, node) { return '#aaaaaa'; },
            vLineColor: function(i, node) { return '#aaaaaa'; },
            paddingLeft: function(i, node) { return 4; },
            paddingRight: function(i, node) { return 4; },
            paddingTop: function(i, node) { return 2; },
            paddingBottom: function(i, node) { return 2; }
          },
          margin: [0, 0, 0, 10]
        });
        
        // Součty
        content.push({
          columns: [
            { width: '*', text: '' },
            {
              width: 'auto',
              table: {
                body: [
                  ['Celkem položek:', `${returnNote?.total_items || 0} ks`],
                  ['Celkem dodatečné poplatky:', formatCurrency(totalAdditionalCharges)]
                ]
              },
              layout: 'noBorders'
            }
          ],
          margin: [0, 5, 0, 15]
        });
        
        // Přidáme sekci pro poškozené položky a poznámky, pokud existují
        const damagedItems = returnNote.returns.filter(item => item.condition !== 'ok' && item.damage_description);
        
        if (damagedItems.length > 0) {
          content.push({
            text: 'Popis poškození:',
            bold: true,
            margin: [0, 10, 0, 5]
          });
          
          // Vytvoříme tabulku s popisem poškození
          const damageTableBody = [
            [
              { text: 'Položka', style: 'tableHeader' },
              { text: 'Popis poškození', style: 'tableHeader' }
            ]
          ];
          
          damagedItems.forEach(item => {
            damageTableBody.push([
              `${item.equipment_name} (${item.inventory_number})`,
              item.damage_description || '-'
            ]);
          });
          
          // Přidáme tabulku do dokumentu
          content.push({
            table: {
              headerRows: 1,
              widths: ['*', '*'],
              body: damageTableBody
            },
            layout: {
              hLineWidth: function(i, node) { return 0.5; },
              vLineWidth: function(i, node) { return 0.5; },
              hLineColor: function(i, node) { return '#aaaaaa'; },
              vLineColor: function(i, node) { return '#aaaaaa'; }
            },
            margin: [0, 0, 0, 10]
          });
        }
        
        // Poznámky
        content.push({
          text: 'Poznámky:',
          bold: true,
          margin: [0, 10, 0, 5]
        });
        
        content.push({
          text: returnNote?.returns?.[0]?.notes || 'Bez poznámek',
          margin: [0, 0, 0, 20]
        });
        
        // Podpisy
        content.push({
          columns: [
            {
              width: '*',
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 100, y2: 0, lineWidth: 1 }] },
                { text: 'Za dodavatele', alignment: 'center', margin: [0, 5, 0, 0] }
              ]
            },
            { width: '*', text: '' },
            {
              width: '*',
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 100, y2: 0, lineWidth: 1 }] },
                { text: 'Za odběratele', alignment: 'center', margin: [0, 5, 0, 0] }
              ]
            }
          ],
          margin: [0, 20, 0, 0]
        });
      } else {
        // Pokud nejsou žádné položky, zobrazíme informaci
        content.push({
          text: 'Žádné vrácené položky',
          alignment: 'center',
          margin: [0, 20, 0, 0]
        });
      }
      
      return content;
    } catch (error) {
      console.error('Chyba při generování hromadného dodacího listu vratek:', error);
      return [
        { text: 'Při generování dokumentu došlo k chybě', style: 'header', color: 'red' },
        { text: `Chyba: ${error.message}`, color: 'red' }
      ];
    }
  }, `dodaci-list-vratek-${returnNote?.return_note_number || new Date().getTime()}.pdf`);
};

/**
 * Generátor pro dodací list vratky
 * 
 * @param {Object} returnData - Data vratky
 * @returns {Promise<void>} Promise
 */
export const generateReturnDeliveryNotePdf = async (deliveryNote) => {
  return createAndDownloadPdf(async (pdfMake, htmlToPdf) => {
    try {
      const content = [];
      const returnData = deliveryNote.return;
      
      // Přidáme hlavičku dokumentu
      content.push(...createHeader({
        created_at: deliveryNote?.created_at,
        customer_name: deliveryNote?.customer_name,
        customer_address: deliveryNote?.customer_address,
        customer_ico: deliveryNote?.customer_ico,
        customer_dic: deliveryNote?.customer_dic,
        customer_phone: deliveryNote?.customer_phone,
        customer_email: deliveryNote?.customer_email
      }, {
        title: 'DODACÍ LIST VRATKY',
        subtitle: `Č. ${deliveryNote?.delivery_note_number || 'Neznámé'}`
      }));
      
      // Informace o zakázce
      content.push({
        columns: [
          {
            width: '*',
            text: `Číslo zakázky: ${deliveryNote?.order_number || 'Neuvedeno'}`
          },
          {
            width: '*',
            text: `Datum vrácení: ${formatDate(returnData?.return_date) || 'Neuvedeno'}`,
            alignment: 'right'
          }
        ],
        margin: [0, 0, 0, 10]
      });
      
      // Seznam vrácených položek
      content.push({
        text: 'Vrácené položky',
        style: 'subheader',
        margin: [0, 10, 0, 5]
      });
      
      // Tabulka vrácených položek
      const tableBody = [
        [
          { text: 'Název', style: 'tableHeader' },
          { text: 'Inv. č.', style: 'tableHeader' },
          { text: 'Množství', style: 'tableHeader' },
          { text: 'Stav', style: 'tableHeader' },
          { text: 'Dodatečné poplatky', style: 'tableHeader' }
        ]
      ];
      
      let conditionText = 'Neuvedeno';
      if (returnData.condition === 'ok') conditionText = 'V pořádku';
      else if (returnData.condition === 'damaged') conditionText = 'Poškozeno';
      else if (returnData.condition === 'missing') conditionText = 'Chybí';
      else conditionText = returnData.condition;
      
      tableBody.push([
        returnData.equipment_name || 'Neuvedeno',
        returnData.inventory_number || '-',
        `${returnData.quantity || 1} ks`,
        conditionText,
        formatCurrency(returnData.additional_charges || 0)
      ]);
      
      content.push({
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
          body: tableBody
        },
        layout: {
          hLineWidth: function(i, node) { return 0.5; },
          vLineWidth: function(i, node) { return 0.5; },
          hLineColor: function(i, node) { return '#aaaaaa'; },
          vLineColor: function(i, node) { return '#aaaaaa'; },
          paddingLeft: function(i, node) { return 4; },
          paddingRight: function(i, node) { return 4; },
          paddingTop: function(i, node) { return 2; },
          paddingBottom: function(i, node) { return 2; }
        },
        margin: [0, 0, 0, 10]
      });
      
      // Poznámky a popis poškození
      content.push({
        text: 'Poznámky a popis poškození',
        style: 'subheader',
        margin: [0, 15, 0, 5]
      });
      
      if (returnData.condition === 'damaged' && returnData.damage_description) {
        content.push({
          text: [
            { text: 'Popis poškození: ', bold: true },
            returnData.damage_description
          ],
          margin: [0, 0, 0, 10]
        });
      }
      
      content.push({
        text: returnData.notes || 'Bez poznámek',
        margin: [0, 0, 0, 20]
      });
      
      // Podpisy
      content.push({
        columns: [
          {
            width: '*',
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 100, y2: 0, lineWidth: 1 }] },
              { text: 'Za dodavatele', alignment: 'center', margin: [0, 5, 0, 0] }
            ]
          },
          { width: '*', text: '' },
          {
            width: '*',
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 100, y2: 0, lineWidth: 1 }] },
              { text: 'Za odběratele', alignment: 'center', margin: [0, 5, 0, 0] }
            ]
          }
        ],
        margin: [0, 20, 0, 0]
      });
      
      return content;
    } catch (error) {
      console.error('Chyba při generování dodacího listu vratky:', error);
      return [
        { text: 'Při generování dokumentu došlo k chybě', style: 'header', color: 'red' },
        { text: `Chyba: ${error.message}`, color: 'red' }
      ];
    }
  }, `dodaci-list-vratky-${deliveryNote?.delivery_note_number || new Date().getTime()}.pdf`);
};

/**
 * Generátor pro fakturační podklad
 * 
 * @param {Object} billingData - Data fakturačního podkladu
 * @returns {Promise<void>} Promise
 */
export const generateBillingPdf = async (billingData) => {
  return createAndDownloadPdf(async (pdfMake, htmlToPdf) => {
    try {
      const content = [];
      
      // Hlavička dokumentu
      content.push({
        text: 'FAKTURAČNÍ PODKLAD',
        style: 'header',
        alignment: 'center'
      });
      
      content.push({
        text: `Č. ${billingData?.invoice_number || 'Neznámé'}`,
        style: 'subheader',
        alignment: 'center',
        margin: [0, 0, 0, 5]
      });
      
      content.push({
        text: `Datum: ${formatDate(billingData?.billing_date || new Date())}`,
        alignment: 'center',
        margin: [0, 0, 0, 15]
      });
      
      // Základní informace
      content.push({
        text: [
          { text: `Zákazník: `, bold: true },
          billingData?.order?.customer_name || 'Neuvedeno'
        ],
        margin: [0, 0, 0, 5]
      });
      
      content.push({
        text: [
          { text: `Zakázka č.: `, bold: true },
          billingData?.order?.order_number || 'Neuvedeno'
        ],
        margin: [0, 0, 0, 5]
      });
      
      content.push({
        text: [
          { text: `Období: `, bold: true },
          `${formatDate(billingData?.billing_period_from || billingData?.period_from)} - ${formatDate(billingData?.billing_period_to || billingData?.period_to)}`
        ],
        margin: [0, 0, 0, 15]
      });
      
      // Seznam položek
      if (billingData?.items && billingData.items.length > 0) {
        // Vytvoříme tabulku položek
        const tableBody = [
          [
            { text: 'Název', style: 'tableHeader' },
            { text: 'Inv. č.', style: 'tableHeader' },
            { text: 'Od', style: 'tableHeader' },
            { text: 'Do', style: 'tableHeader' },
            { text: 'Dny', style: 'tableHeader' },
            { text: 'Ks', style: 'tableHeader' },
            { text: 'Sazba/den', style: 'tableHeader' },
            { text: 'Celkem', style: 'tableHeader' }
          ]
        ];
        
        // Naplníme tabulku daty
        billingData.items.forEach(item => {
          tableBody.push([
            item.equipment_name || item.description || 'Neuvedeno',
            item.inventory_number || '-',
            formatDate(item.issue_date) || '-',
            formatDate(item.return_date || item.effective_return_date || billingData.billing_date) || '-',
            item.days || '0',
            item.quantity || '1',
            formatCurrency(item.daily_rate || item.price_per_day || 0),
            formatCurrency(item.total_price || 0)
          ]);
        });
        
        // Přidáme tabulku do dokumentu
        content.push({
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: tableBody
          },
          layout: {
            hLineWidth: function(i, node) { return 0.5; },
            vLineWidth: function(i, node) { return 0.5; },
            hLineColor: function(i, node) { return '#aaaaaa'; },
            vLineColor: function(i, node) { return '#aaaaaa'; },
            paddingLeft: function(i, node) { return 4; },
            paddingRight: function(i, node) { return 4; },
            paddingTop: function(i, node) { return 2; },
            paddingBottom: function(i, node) { return 2; }
          },
          margin: [0, 0, 0, 10]
        });
        
        // Celková cena
        content.push({
          text: `Celková cena: ${formatCurrency(billingData.total_amount || 0)}`,
          bold: true,
          alignment: 'right',
          margin: [0, 10, 0, 15]
        });
        
        // Informace o fakturačním období
        content.push({
          text: 'Fakturační údaje:',
          bold: true,
          margin: [0, 10, 0, 5]
        });
        
        const dueDate = billingData?.billing_date ? 
          new Date(new Date(billingData.billing_date).getTime() + 14 * 24 * 60 * 60 * 1000) : new Date();
        
        content.push({
          text: [
            { text: `Datum vystavení: `, bold: true },
            formatDate(billingData?.billing_date || new Date())
          ],
          margin: [0, 0, 0, 5]
        });
        
        content.push({
          text: [
            { text: `Datum splatnosti: `, bold: true },
            formatDate(dueDate)
          ],
          margin: [0, 0, 0, 5]
        });
        
        if (billingData?.is_final_billing) {
          content.push({
            text: 'KONEČNÁ FAKTURACE',
            bold: true,
            color: 'red',
            alignment: 'right',
            margin: [0, 5, 0, 15]
          });
        }
        
        // Poznámky
        content.push({
          text: 'Poznámky:',
          bold: true,
          margin: [0, 10, 0, 5]
        });
        
        content.push({
          text: billingData?.note || billingData?.order?.notes || 'Bez poznámek',
          margin: [0, 0, 0, 20]
        });
        
        // Podpisy
        content.push({
          columns: [
            {
              width: '*',
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 100, y2: 0, lineWidth: 1 }] },
                { text: 'Vystavil', alignment: 'center', margin: [0, 5, 0, 0] }
              ]
            },
            { width: '*', text: '' },
            {
              width: '*',
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 100, y2: 0, lineWidth: 1 }] },
                { text: 'Schválil', alignment: 'center', margin: [0, 5, 0, 0] }
              ]
            }
          ],
          margin: [0, 20, 0, 0]
        });
      } else {
        content.push({
          text: 'Žádné položky k fakturaci',
          alignment: 'center',
          margin: [0, 20, 0, 0]
        });
      }
      
      return content;
    } catch (error) {
      console.error('Chyba při generování fakturačního podkladu:', error);
      return [
        { text: 'Při generování dokumentu došlo k chybě', style: 'header', color: 'red' },
        { text: `Chyba: ${error.message}`, color: 'red' }
      ];
    }
  }, `fakturacni-podklad-${billingData?.invoice_number || new Date().getTime()}.pdf`);
};

/**
 * Generátor pro dodací list
 * 
 * @param {Object} deliveryNote - Data dodacího listu
 * @returns {Promise<void>} Promise
 */
export const generateDeliveryNotePdf = async (deliveryNote) => {
  return createAndDownloadPdf(async (pdfMake, htmlToPdf) => {
    try {
      const content = [];
      
      // Přidáme hlavičku dokumentu
      content.push(...createHeader({
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
      }));
      
      // Informace o zakázce
      content.push({
        columns: [
          {
            width: '*',
            text: `Číslo zakázky: ${deliveryNote?.order?.order_number || 'Neuvedeno'}`
          },
          {
            width: '*',
            text: `Datum vydání: ${formatDate(deliveryNote?.rentals?.[0]?.issue_date || new Date())}`,
            alignment: 'right'
          }
        ],
        margin: [0, 0, 0, 10]
      });
      
      // Nadpis pro seznam položek
      content.push({
        text: 'Seznam položek',
        style: 'subheader',
        margin: [0, 10, 0, 5]
      });
      
      // Seznam položek
      if (deliveryNote?.rentals && deliveryNote.rentals.length > 0) {
        // Vytvoříme tabulku položek
        const tableBody = [
          [
            { text: 'Název', style: 'tableHeader' },
            { text: 'Inv. č.', style: 'tableHeader' },
            { text: 'Datum vydání', style: 'tableHeader' },
            { text: 'Množství', style: 'tableHeader' },
            { text: 'Denní sazba', style: 'tableHeader' }
          ]
        ];
        
        // Naplníme tabulku daty
        deliveryNote.rentals.forEach(rental => {
          tableBody.push([
            rental.equipment_name || 'Neuvedeno',
            rental.inventory_number || '-',
            formatDate(rental.issue_date) || '-',
            rental.quantity || '1',
            formatCurrency(rental.daily_rate || 0)
          ]);
        });
        
        // Přidáme tabulku do dokumentu
        content.push({
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
            body: tableBody
          },
          layout: {
            hLineWidth: function(i, node) { return 0.5; },
            vLineWidth: function(i, node) { return 0.5; },
            hLineColor: function(i, node) { return '#aaaaaa'; },
            vLineColor: function(i, node) { return '#aaaaaa'; },
            paddingLeft: function(i, node) { return 4; },
            paddingRight: function(i, node) { return 4; },
            paddingTop: function(i, node) { return 2; },
            paddingBottom: function(i, node) { return 2; }
          },
          margin: [0, 0, 0, 10]
        });
        
        // Celkem položek
        content.push({
          text: `Celkem položek: ${deliveryNote?.total_items || 0} ks`,
          alignment: 'right',
          margin: [0, 5, 0, 15]
        });
        
        // Poznámky
        content.push({
          text: 'Poznámky:',
          bold: true,
          margin: [0, 10, 0, 5]
        });
        
        content.push({
          text: deliveryNote?.order?.notes || 'Bez poznámek',
          margin: [0, 0, 0, 20]
        });
        
        // Podpisy
        content.push({
          columns: [
            {
              width: '*',
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 100, y2: 0, lineWidth: 1 }] },
                { text: 'Vydal', alignment: 'center', margin: [0, 5, 0, 0] }
              ]
            },
            { width: '*', text: '' },
            {
              width: '*',
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 100, y2: 0, lineWidth: 1 }] },
                { text: 'Převzal', alignment: 'center', margin: [0, 5, 0, 0] }
              ]
            }
          ],
          margin: [0, 20, 0, 0]
        });
      } else {
        content.push({
          text: 'Žádné položky v dodacím listu',
          alignment: 'center',
          margin: [0, 20, 0, 0]
        });
      }
      
      return content;
    } catch (error) {
      console.error('Chyba při generování dodacího listu:', error);
      return [
        { text: 'Při generování dokumentu došlo k chybě', style: 'header', color: 'red' },
        { text: `Chyba: ${error.message}`, color: 'red' }
      ];
    }
  }, `dodaci-list-${deliveryNote?.delivery_note_number || new Date().getTime()}.pdf`);
};