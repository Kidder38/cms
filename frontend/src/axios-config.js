import axios from 'axios';
import { API_URL } from './config';

// Konfigurace výchozí URL pro axios požadavky
axios.defaults.baseURL = API_URL;

// Nastavení defaultního timeout
axios.defaults.timeout = 10000; // 10 sekund

// Funkce pro nastavení auth tokenu
export const setAuthToken = (token) => {
  if (token) {
    // Aplikace tokenu na všechny požadavky
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    // Odstranění auth hlavičky
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Nastavení tokenu při inicializaci
const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}

// Přidání interceptoru pro zpracování chyb
axios.interceptors.response.use(
  response => response,
  error => {
    // V případě 401 chyby
    if (error.response && error.response.status === 401) {
      // Zde může být kód pro odhlášení, přesměrování apod.
      console.warn('Neautorizovaný přístup');
    }
    
    return Promise.reject(error);
  }
);

export default axios;