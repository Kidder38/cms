import React, { createContext, useState, useContext, useEffect } from 'react';
import axios, { setAuthToken } from '../axios-config';

// Vytvoření kontextu
const AuthContext = createContext();

// Provider komponenta
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Funkce pro nastavení auth hlavičky nyní využívá importovanou funkci
  const setAuthHeader = (token) => {
    setAuthToken(token);
  };

  // Funkce pro přihlášení
  const login = async (username, password) => {
    try {
      setError(null);
      const response = await axios.post(`/api/auth/login`, { username, password });
      
      const { token, user } = response.data;
      
      // Uložení tokenu do localStorage
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      
      // Nastavení auth hlavičky
      setAuthHeader(token);
      
      return user;
    } catch (error) {
      setError(error.response?.data?.message || 'Přihlášení se nezdařilo.');
      throw error;
    }
  };

  // Funkce pro registraci
  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post(`/api/auth/register`, userData);
      
      const { token, user } = response.data;
      
      // Uložení tokenu do localStorage
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      
      // Nastavení auth hlavičky
      setAuthHeader(token);
      
      return user;
    } catch (error) {
      setError(error.response?.data?.message || 'Registrace se nezdařila.');
      throw error;
    }
  };

  // Funkce pro odhlášení
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    
    // Odstranění auth hlavičky
    setAuthHeader(null);
  };

  // Ověření existujícího tokenu a získání informací o uživateli
  useEffect(() => {
    const verifyToken = async () => {
      // Vždy zkontrolujeme localStorage přímo (mohl být změněn v jiném tabu)
      const storedToken = localStorage.getItem('token');
      
      if (!storedToken) {
        console.warn('Žádný token v localStorage, uživatel není přihlášen');
        setLoading(false);
        setUser(null);
        setToken(null);
        return;
      }
      
      // Pokud je token v localStorage, ale liší se od tokenu ve stavu,
      // aktualizujeme stav tokenu
      if (storedToken !== token) {
        console.log('Token v localStorage se liší od tokenu ve stavu, aktualizuji...');
        setToken(storedToken);
      }
      
      try {
        // Nastavení authorization hlavičky - vždy použijeme aktuální token z localStorage
        setAuthHeader(storedToken);
        
        console.log('Ověřuji token...');
        const response = await axios.get(`/api/auth/profile`);
        console.log('Profil uživatele úspěšně načten');
        setUser(response.data.user);
      } catch (error) {
        console.error('Chyba při ověřování tokenu:', error);
        console.error('Status chyby:', error.response?.status);
        console.error('Data chyby:', error.response?.data);
        
        // Vyčistit token a uživatele
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setAuthHeader(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // Přidání interceptoru pro automatické obnovení tokenu nebo odhlášení při 401 chybě
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          if (token) {
            console.warn('Detekován neplatný token, odhlašuji...');
            logout();
          }
        }
        return Promise.reject(error);
      }
    );
  
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token, logout]);  // Přidaný logout do závislostí

  // Vyexportování hodnot a funkcí kontextu
  const value = {
    user,
    token,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook pro použití Auth kontextu
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth musí být použit uvnitř AuthProvider');
  }
  return context;
};