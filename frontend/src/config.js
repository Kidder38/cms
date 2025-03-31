// Dynamické nastavení API URL podle prostředí
export const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // V produkci bude API na stejné doméně (relativní cesta)
  : 'http://localhost:5001/api';  // Při vývoji použijeme localhost

// Formátování data
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('cs-CZ');
};

// Formátování měny
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '';
  
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK'
  }).format(amount);
};

// Stavy vybavení
export const EQUIPMENT_STATUS = {
  available: { label: 'Dostupné', color: 'success' },
  borrowed: { label: 'Vypůjčeno', color: 'warning' },
  maintenance: { label: 'V servisu', color: 'info' },
  retired: { label: 'Vyřazeno', color: 'danger' }
};

// Stavy zakázek
export const ORDER_STATUS = {
  created: { label: 'Vytvořeno', color: 'secondary' },
  active: { label: 'Aktivní', color: 'primary' },
  completed: { label: 'Dokončeno', color: 'success' },
  cancelled: { label: 'Zrušeno', color: 'danger' }
};

// Stavy výpůjček
export const RENTAL_STATUS = {
  created: { label: 'Vytvořeno', color: 'secondary' },
  issued: { label: 'Vydáno', color: 'warning' },
  returned: { label: 'Vráceno', color: 'success' },
  damaged: { label: 'Poškozeno', color: 'danger' }
};