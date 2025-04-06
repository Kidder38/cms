import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../axios-config';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isEditMode = !!id;

  const initialFormState = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    role: 'user',
    currentPassword: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordChanged, setPasswordChanged] = useState(false);

  useEffect(() => {
    // Načtení dat uživatele při editaci
    if (isEditMode) {
      const fetchUser = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`/api/users/${id}`);
          const userData = response.data.user;
          
          setFormData({
            ...initialFormState,
            username: userData.username || '',
            email: userData.email || '',
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            role: userData.role || 'user',
            // Heslo se nenačítá z bezpečnostních důvodů
            password: '',
            confirmPassword: ''
          });
          
          setError(null);
        } catch (err) {
          console.error('Chyba při načítání uživatele:', err);
          setError('Nepodařilo se načíst data uživatele. ' + (err.response?.data?.message || err.message));
        } finally {
          setLoading(false);
        }
      };

      fetchUser();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Sledování změny hesel
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordChanged(true);
    }
  };

  const validateForm = () => {
    if (!formData.username.trim()) return 'Uživatelské jméno je povinné.';
    if (!formData.email.trim()) return 'Email je povinný.';
    if (!isEditMode && !formData.password) return 'Heslo je povinné.';
    if (formData.password && formData.password.length < 6) return 'Heslo musí mít alespoň 6 znaků.';
    if (formData.password !== formData.confirmPassword) return 'Hesla se neshodují.';
    
    // Kontrola vyplnění současného hesla při změně hesla v editačním režimu
    if (isEditMode && formData.password && !formData.currentPassword) {
      return 'Pro změnu hesla musíte zadat současné heslo.';
    }
    
    return null;
  };

  // Funkce pro testování připojení a autentizace
  const testAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Získáme token z localStorage
      const token = localStorage.getItem('token');
      console.log('Token z localStorage:', token ? token.substring(0, 20) + '...' : 'není k dispozici');
      
      // Explicitně nastavíme token do hlavičky
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('Token nastaven do hlavičky');
      } else {
        console.error('Token není k dispozici v localStorage');
      }
      
      // Test auth endpoint pro diagnostiku
      const authResponse = await axios.get('/api/debug/auth');
      console.log('Auth test response:', authResponse.data);
      
      // Test profilu uživatele - ověření, že token funguje
      const profileResponse = await axios.get('/api/auth/profile');
      console.log('User profile:', profileResponse.data);
      
      setError('DIAGNOSTIKA: Auth test úspěšný! Token je platný.');
    } catch (err) {
      console.error('Auth test error:', err);
      setError('DIAGNOSTIKA SELHALA: ' + (err.response?.data?.message || err.message) + 
              ' (Status: ' + (err.response?.status || 'neznámý') + ')');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Nejprve provedeme diagnostický test
    try {
      setLoading(true);
      await testAuth(); // Test připojení
      setLoading(false);
    } catch (testErr) {
      console.error('Test auth selhal:', testErr);
      setError('Diagnostický test selhal: ' + testErr.message);
      setLoading(false);
      return; // Zastavíme další zpracování
    }
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    try {
      setLoading(true);
      
      // Explicitně znovu nastavíme token
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('Token nastaven pro požadavek:', token.substring(0, 20) + '...');
      }
      
      // Vytvoření objektu s daty uživatele
      const userData = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role
      };
      
      // Přidání hesla pouze pokud bylo vyplněno (u editace není povinné)
      if (formData.password) {
        userData.password = formData.password;
      }
      
      if (isEditMode) {
        // Editace existujícího uživatele
        await axios.put(`/api/users/${id}`, userData);
        
        // Pokud bylo změněno heslo, odesláme samostatný požadavek na změnu hesla
        if (passwordChanged && formData.password && formData.currentPassword) {
          await axios.post(`/api/users/${id}/change-password`, {
            currentPassword: formData.currentPassword,
            newPassword: formData.password
          });
        }
      } else {
        // Vytvoření nového uživatele s logovacími výpisy
        console.log('Posílám data uživatele:', userData);
        
        // Logovací výpis hlaviček
        console.log('Hlavičky požadavku:', axios.defaults.headers.common);
        
        // Vytvoření nového uživatele s explicitní hlavičkou Authorization
        const response = await axios.post('/api/users', userData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Odpověď serveru:', response.data);
      }
      
      // Přesměrování na seznam uživatelů
      navigate('/users');
    } catch (err) {
      console.error('Chyba při ukládání uživatele:', err);
      console.error('Status chyby:', err.response?.status);
      console.error('Data chyby:', err.response?.data);
      console.error('Config:', err.config);
      
      // Podrobnější chybová zpráva
      setError('Nepodařilo se uložit uživatele. ' + 
               (err.response?.data?.message || err.message) +
               ' (Status: ' + (err.response?.status || 'neznámý') + ')');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{isEditMode ? 'Úprava uživatele' : 'Přidání nového uživatele'}</h1>
        <Link to="/users" className="btn btn-secondary">
          Zpět na seznam
        </Link>
      </div>
      
      <Card>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Uživatelské jméno *</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Jméno</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Příjmení</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            {isEditMode && (
              <Row className="mb-3">
                <Col md={12}>
                  <Alert variant="info" className="mb-3">
                    Pokud chcete změnit heslo, vyplňte současné heslo a poté nové heslo níže.
                  </Alert>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Současné heslo</Form.Label>
                    <Form.Control
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}
            
            <Row>              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {isEditMode ? 'Nové heslo' : 'Heslo *'}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={!isEditMode}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {isEditMode ? 'Potvrzení nového hesla' : 'Potvrzení hesla *'}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required={!isEditMode}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Role *</Form.Label>
              <Form.Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="user">Uživatel</option>
                <option value="admin">Administrátor</option>
              </Form.Select>
            </Form.Group>
            
            <div className="d-flex gap-2 mt-4">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Ukládání...
                  </>
                ) : (
                  'Uložit'
                )}
              </Button>
              {isEditMode && (
                <Button variant="info" as={Link} to={`/users/${id}/access`}>
                  Správa přístupů
                </Button>
              )}
              <Button variant="secondary" as={Link} to="/users">
                Zrušit
              </Button>
              
              {/* Tlačítko pro testování autentizace */}
              <Button 
                variant="warning" 
                onClick={(e) => {
                  e.preventDefault();
                  testAuth();
                }}
                disabled={loading}
              >
                {loading ? 'Testování...' : 'Test autentizace'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default UserForm;