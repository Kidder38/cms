import axios from 'axios';
import { API_URL } from './config';

// Vytvoření instance s výchozí konfigurací
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 sekund
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Funkce pro nastavení auth tokenu
export const setAuthToken = (token) => {
  if (token) {
    // Aplikace tokenu na všechny požadavky
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // Zálohovat token do localStorage, pro případ obnovení stránky
    localStorage.setItem('token', token);
  } else {
    // Odstranění auth hlavičky
    delete axiosInstance.defaults.headers.common['Authorization'];
    // Vymazání tokenu z localStorage
    localStorage.removeItem('token');
  }
};

// Přidání retry mechanismu pro nestabilní připojení
axiosInstance.defaults.raxConfig = {
  retry: 3,                  // Počet pokusů o opakování
  retryDelay: 1000,          // Zpoždění mezi pokusy (1s)
  statusCodesToRetry: [408, 500, 502, 503, 504, 0], // Reagovat na chyby serveru a timeout
  backoffType: 'static'      // Konstantní zpoždění mezi pokusy
};

// Nastavení tokenu při inicializaci
const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}

// Monitoring požadavků v development módu
if (process.env.NODE_ENV !== 'production') {
  axiosInstance.interceptors.request.use((config) => {
    console.log(`${config.method.toUpperCase()} ${config.url}`);
    return config;
  });
}

// Přidání interceptoru pro zpracování chyb
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    // Zachycení chyb sítě
    if (!error.response) {
      console.error('Síťová chyba:', error.message);
      // Akce pro chyby sítě - např. zobrazení upozornění
    }
    // V případě 401 chyby (neautorizovaný přístup)
    else if (error.response.status === 401) {
      console.warn('Neautorizovaný přístup');
      // Vymazání tokenu
      setAuthToken(null);
      // Přesměrování na přihlašovací stránku, pokud nejsme již tam
      if (window.location.pathname !== '/login') {
        // Použít window.location místo history.push(), protože potřebujeme kompletní refresh
        window.location.href = '/login';
      }
    }
    // V případě 403 chyby (zakázaný přístup)
    else if (error.response.status === 403) {
      console.warn('Přístup zakázán');
      // Zobrazení zprávy o nedostatečných oprávněních
    }
    // V případě 500+ chyb (chyby serveru)
    else if (error.response.status >= 500) {
      console.error('Chyba serveru:', error.message);
      // Zobrazení zprávy o chybě serveru
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;