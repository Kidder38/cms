import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

// Vytvoření kontextu
const AuthContext = createContext();

// Provider komponenta
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Funkce pro nastavení auth hlavičky pro každý požadavek
  const setAuthHeader = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Funkce pro přihlášení
  const login = async (username, password) => {
    try {
      setError(null);
      const response = await axios.post(`${API_URL}/auth/login`, { username, password });
      
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
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
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
      if (!token) {
        // DOČASNÉ ŘEŠENÍ: Automatické přihlášení admina
        console.log('Automatické přihlášení admina pro vývoj/testování');
        setUser({
          id: 1,
          username: 'admin',
          email: 'admin@pujcovna.cz',
          first_name: 'Admin',
          last_name: 'Administrátor',
          role: 'admin'
        });
        setLoading(false);
        return;
      }
      
      try {
        // Nastavení authorization hlavičky
        setAuthHeader(token);
        
        const response = await axios.get(`${API_URL}/auth/profile`);
        setUser(response.data.user);
      } catch (error) {
        console.error('Chyba při ověřování tokenu:', error);
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