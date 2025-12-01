/

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

/**
 * Generátor pro doklad o odpisu
 * 
 * @param {Object} writeOffData - Data odpisu
 * @returns {Promise<void>} Promise
 */
export const generateInventoryCheckPdf = async (inventoryData) => {
  return createAndDownloadPdf(async (pdfMake, htmlToPdf) => {
    try {
      const content = [];
      
      // Hlavička dokumentu
      content.push({
        text: 'INVENTURNÍ SEZNAM',
        style: 'header',
        alignment: 'center'
      });
      
      // Zpracování stavu inventury
      let statusText = 'Probíhá';
      let statusColor = 'orange';
      
      if (inventoryData?.status === 'completed') {
        statusText = 'Dokončeno';
        statusColor = 'green';
      } else if (inventoryData?.status === 'canceled') {
        statusText = 'Zrušeno';
        statusColor = 'red';
      }
      
      content.push({
        text: `Sklad: ${inventoryData?.warehouse_name || 'Neznámý'}`,
        style: 'subheader',
        alignment: 'center'
      });
      
      content.push({
        text: `Datum: ${formatDate(inventoryData?.check_date || new Date())}`,
        alignment: 'center',
        margin: [0, 0, 0, 5]
      });
      
      content.push({
        text: `Stav: ${statusText}`,
        alignment: 'center',
        color: statusColor,
        bold: true,
        margin: [0, 0, 0, 15]
      });
      
      // Základní informace
      content.push({
        columns: [
          {
            width: '*',
            text: `Vytvořil: ${inventoryData?.created_by_name || 'Neuvedeno'}`,
            fontSize: 10
          },
          {
            width: '*',
            text: `Datum vytvoření: ${formatDate(inventoryData?.created_at || new Date())}`,
            alignment: 'right',
            fontSize: 10
          }
        ],
        margin: [0, 0, 0, 10]
      });
      
      // Tabulka inventurních položek
      if (inventoryData?.items && inventoryData.items.length > 0) {
        // Statistiky
        const totalItems = inventoryData.items.length;
        const checkedItems = inventoryData.items.filter(item => item.actual_quantity !== null).length;
        const discrepancyItems = inventoryData.items.filter(
          item => item.actual_quantity !== null && item.actual_quantity !== item.expected_quantity
        ).length;
        
        content.push({
          text: `Celkem položek: ${totalItems} | Zkontrolováno: ${checkedItems} | Nesrovnalosti: ${discrepancyItems}`,
          fontSize: 9,
          margin: [0, 0, 0, 10]
        });
        
        // Tabulka položek
        const tableBody = [
          [
            { text: 'Název', style: 'tableHeader' },
            { text: 'Inv. č.', style: 'tableHeader', alignment: 'center' },
            { text: 'Kategorie', style: 'tableHeader' },
            { text: 'Očekáváno', style: 'tableHeader', alignment: 'center' },
            { text: 'Skutečně', style: 'tableHeader', alignment: 'center' },
            { text: 'Rozdíl', style: 'tableHeader', alignment: 'center' },
            { text: 'Poznámka', style: 'tableHeader' }
          ]
        ];
        
        // Naplníme tabulku daty
        inventoryData.items.forEach(item => {
          const difference = item.actual_quantity !== null ? 
                          item.actual_quantity - item.expected_quantity : null;
          
          let diffText = '-';
          if (difference !== null) {
            diffText = difference === 0 ? '0' : (difference > 0 ? `+${difference}` : `${difference}`);
          }
          
          // Určení barvy pozadí podle stavu
          let fillColor = null;
          if (item.actual_quantity === null) {
            fillColor = '#f0f0f0'; // světle šedá pro nezkontrolované
          } else if (difference === 0) {
            fillColor = '#dcffdc'; // světle zelená pro shodné
          } else if (difference > 0) {
            fillColor = '#fff5dc'; // světle oranžová pro přebytek
          } else if (difference < 0) {
            fillColor = '#ffdcdc'; // světle červená pro chybějící
          }
          
          tableBody.push([
            { text: item.name || 'Neuvedeno', fillColor: fillColor },
            { text: item.inventory_number || '-', alignment: 'center', fillColor: fillColor },
            { text: item.category_name || '-', fillColor: fillColor },
            { text: `${item.expected_quantity || 0} ks`, alignment: 'center', fillColor: fillColor },
            { text: item.actual_quantity !== null ? `${item.actual_quantity} ks` : 'Nezkontrolováno', alignment: 'center', fillColor: fillColor },
            { text: diffText, alignment: 'center', fillColor: fillColor },
            { text: item.notes || '', fillColor: fillColor }
          ]);
        });
        
        // Přidáme tabulku do dokumentu
        content.push({
          table: {
            headerRows: 1,
            widths: ['*', 60, 80, 70, 70, 50, '*'],
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
            paddingLeft: function(i, node) { return 4; },
            paddingRight: function(i, node) { return 4; },
            paddingTop: function(i, node) { return 3; },
            paddingBottom: function(i, node) { return 3; }
          },
          margin: [0, 0, 0, 20]
        });
        
        // Shrnutí nesrovnalostí
        if (discrepancyItems > 0) {
          content.push({
            text: 'Shrnutí nesrovnalostí:',
            fontSize: 10,
            bold: true,
            margin: [0, 10, 0, 5]
          });
          
          // Výpočet statistik nesrovnalostí
          const missingItems = inventoryData.items.filter(
            item => item.actual_quantity !== null && item.actual_quantity < item.expected_quantity
          );
          const excessItems = inventoryData.items.filter(
            item => item.actual_quantity !== null && item.actual_quantity > item.expected_quantity
          );
          
          const totalMissing = missingItems.reduce((sum, item) => 
            sum + (item.expected_quantity - item.actual_quantity), 0);
          const totalExcess = excessItems.reduce((sum, item) => 
            sum + (item.actual_quantity - item.expected_quantity), 0);
          
          content.push({
            text: `Celkem chybí: ${totalMissing} ks (${missingItems.length} položek)`,
            fontSize: 9,
            margin: [0, 0, 0, 2]
          });
          
          content.push({
            text: `Celkem přebývá: ${totalExcess} ks (${excessItems.length} položek)`,
            fontSize: 9,
            margin: [0, 0, 0, 15]
          });
          
          // Poznámky k inventuře
          content.push({
            text: 'Poznámky:',
            fontSize: 10,
            bold: true,
            margin: [0, 0, 0, 5]
          });
          
          content.push({
            text: inventoryData?.notes || 'Bez poznámek',
            fontSize: 8,
            margin: [0, 0, 0, 30]
          });
          
          // Podpisy
          content.push({
            columns: [
              {
                width: '*',
                stack: [
                  { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 1 }] },
                  { text: 'Provedl', alignment: 'center', margin: [0, 5, 0, 0] }
                ]
              },
              { width: '*', text: '' },
              {
                width: '*',
                stack: [
                  { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 1 }] },
                  { text: 'Schválil', alignment: 'center', margin: [0, 5, 0, 0] }
                ]
              }
            ],
            margin: [0, 0, 0, 0]
          });
        } else {
          // Poznámky k inventuře bez nesrovnalostí
          content.push({
            text: 'Poznámky:',
            fontSize: 10,
            bold: true,
            margin: [0, 10, 0, 5]
          });
          
          content.push({
            text: inventoryData?.notes || 'Bez poznámek',
            fontSize: 8,
            margin: [0, 0, 0, 30]
          });
          
          // Podpisy bez nesrovnalostí
          content.push({
            columns: [
              {
                width: '*',
                stack: [
                  { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 1 }] },
                  { text: 'Provedl', alignment: 'center', margin: [0, 5, 0, 0] }
                ]
              },
              { width: '*', text: '' },
              {
                width: '*',
                stack: [
                  { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 1 }] },
                  { text: 'Schválil', alignment: 'center', margin: [0, 5, 0, 0] }
                ]
              }
            ],
            margin: [0, 0, 0, 0]
          });
        }
      } else {
        content.push({
          text: 'Žádné položky v inventuře',
          alignment: 'center',
          margin: [0, 20, 0, 0],
          italic: true
        });
      }
      
      return content;
    } catch (error) {
      console.error('Chyba při generování záznamu o inventuře:', error);
      return [
        { text: 'Při generování dokumentu došlo k chybě', style: 'header', color: 'red' },
        { text: `Chyba: ${error.message}`, color: 'red' }
      ];
    }
  }, `inventurni-seznam-${inventoryData?.id || new Date().getTime()}.pdf`);
};

export const generateWriteOffDocumentPdf = async (writeOffData) => {
  return createAndDownloadPdf(async (pdfMake, htmlToPdf) => {
    try {
      const content = [];
      
      // Mapování důvodu odpisu na text
      let reasonText = 'Neuvedeno';
      switch(writeOffData?.reason) {
        case 'damaged': reasonText = 'Poškozeno'; break;
        case 'lost': reasonText = 'Ztraceno'; break;
        case 'expired': reasonText = 'Prošlá životnost'; break;
        case 'other': reasonText = 'Jiný důvod'; break;
        default: reasonText = writeOffData?.reason || 'Neuvedeno';
      }
      
      // Hlavička dokumentu
      content.push({
        text: 'ZÁZNAM O ODPISU MAJETKU',
        style: 'header',
        alignment: 'center'
      });
      
      if (writeOffData?.id) {
        content.push({
          text: `Č. ${writeOffData.id}`,
          style: 'subheader',
          alignment: 'center',
          margin: [0, 0, 0, 5]
        });
      }
      
      content.push({
        text: `Datum vystavení: ${formatDate(writeOffData?.write_off_date || new Date())}`,
        alignment: 'center',
        margin: [0, 0, 0, 15]
      });
      
      // Informace o vystavovateli
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
              { text: 'Vystavil:', bold: true, fontSize: 11, margin: [0, 0, 0, 5] },
              { 
                text: [
                  { text: `${writeOffData?.created_by_name || 'Neuvedeno'}\n`, bold: true, fontSize: 10 },
                  { text: `Důvod odpisu: ${reasonText}\n`, fontSize: 9 },
                  { text: `Datum odpisu: ${formatDate(writeOffData?.write_off_date || new Date())}\n`, fontSize: 9 },
                  { text: `Celková hodnota: ${formatCurrency(writeOffData?.total_value || 0)}`, fontSize: 9 }
                ]
              }
            ]
          }
        ],
        columnGap: 20,
        margin: [0, 0, 0, 20]
      });
      
      // Tabulka odepsaných položek
      if (writeOffData?.items && writeOffData.items.length > 0) {
        // Nadpis tabulky
        content.push({
          text: 'Seznam odepsaných položek',
          style: 'subheader',
          margin: [0, 10, 0, 5]
        });
        
        // Vytvoříme tabulku položek
        const tableBody = [
          [
            { text: 'Pořadí', style: 'tableHeader', alignment: 'center' },
            { text: 'Název', style: 'tableHeader' },
            { text: 'Inv. č.', style: 'tableHeader', alignment: 'center' },
            { text: 'Sklad', style: 'tableHeader' },
            { text: 'Množství', style: 'tableHeader', alignment: 'center' },
            { text: 'Hodnota/ks', style: 'tableHeader', alignment: 'right' },
            { text: 'Celkem', style: 'tableHeader', alignment: 'right' }
          ]
        ];
        
        // Naplníme tabulku daty
        writeOffData.items.forEach((item, index) => {
          tableBody.push([
            { text: (index + 1).toString(), alignment: 'center' },
            { text: item.equipment_name || 'Neuvedeno' },
            { text: item.inventory_number || '-', alignment: 'center' },
            { text: item.warehouse_name || 'Neuvedeno' },
            { text: `${item.quantity || 1} ks`, alignment: 'center' },
            { text: formatCurrency(item.unit_value || 0), alignment: 'right' },
            { text: formatCurrency(item.total_value || 0), alignment: 'right' }
          ]);
        });
        
        // Přidáme zápatí s celkovou částkou
        tableBody.push([
          { text: 'Celkem:', colSpan: 6, alignment: 'right', bold: true },
          {}, {}, {}, {}, {},
          { text: formatCurrency(writeOffData.total_value || 0), alignment: 'right', bold: true }
        ]);
        
        // Přidáme tabulku do dokumentu s vylepšeným stylem
        content.push({
          table: {
            headerRows: 1,
            widths: [40, '*', 60, 70, 60, 70, 70],
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
          margin: [0, 10, 0, 5]
        });
        
        content.push({
          text: writeOffData?.notes || 'Bez poznámek',
          margin: [0, 0, 0, 30]
        });
        
        // Podpisy na třech místech
        content.push({
          columns: [
            {
              width: '*',
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 1 }] },
                { text: 'Vystavil', alignment: 'center', margin: [0, 5, 0, 0] }
              ]
            },
            {
              width: '*',
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 1 }] },
                { text: 'Schválil', alignment: 'center', margin: [0, 5, 0, 0] }
              ]
            },
            {
              width: '*',
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 1 }] },
                { text: 'Účetní', alignment: 'center', margin: [0, 5, 0, 0] }
              ]
            }
          ],
          margin: [0, 0, 0, 0]
        });
      } else {
        // Pokud nejsou žádné položky
        content.push({
          text: 'Žádné položky v odpisu',
          alignment: 'center',
          margin: [0, 20, 0, 0],
          italic: true
        });
      }
      
      return content;
    } catch (error) {
      console.error('Chyba při generování záznamu o odpisu:', error);
      return [
        { text: 'Při generování dokumentu došlo k chybě', style: 'header', color: 'red' },
        { text: `Chyba: ${error.message}`, color: 'red' }
      ];
    }
  }, `zapis-o-odpisu-${writeOffData?.id || new Date().getTime()}.pdf`);
};