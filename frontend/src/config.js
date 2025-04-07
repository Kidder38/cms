// Dynamické nastavení API URL podle prostředí
export const API_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin  // V produkci používáme stejnou doménu, /api cesty jsou již v routerech
  : 'http://localhost:5001';  // Při vývoji použijeme localhost a port serveru

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