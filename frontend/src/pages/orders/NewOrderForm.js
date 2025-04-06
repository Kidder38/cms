import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Import axios základního balíčku místo nakonfigurované instance
import axios from 'axios';
import { API_URL } from '../../config';

const NewOrderForm = () => {
  // Hooks pro navigaci a získání ID z URL
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  // Autentizační kontext
  const { user, token } = useAuth();
  
  // Stav formuláře
  const [formData, setFormData] = useState({
    customer_id: '',
    order_number: '',
    name: '',
    status: 'created',
    estimated_end_date: '',
    notes: ''
  });
  
  // Stav komponenty
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);
  
  // Vytvoření autorizačních hlaviček pro požadavky
  const createAuthHeaders = useCallback(() => {
    const currentToken = token || localStorage.getItem('token');
    if (!currentToken) {
      return {};
    }
    
    return {
      'Authorization': `Bearer ${currentToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }, [token]);
  
  // Bezpečná metoda pro API požadavky s ošetřením chyb
  const callApi = useCallback(async (method, endpoint, data = null) => {
    try {
      const headers = createAuthHeaders();
      const url = `${API_URL}${endpoint}`;
      
      console.log(`Odesílám ${method} požadavek na ${url}`);
      console.log('Hlavičky:', headers);
      if (data) {
        console.log('Data:', data);
      }
      
      const config = {
        method,
        url,
        headers,
        data
      };
      
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error('API chyba:', error);
      
      // Pokud je chyba autentizace, nastav stav
      if (error.response?.status === 401) {
        setAuthStatus({
          status: 'error',
          message: 'Přihlášení vypršelo nebo je neplatné. Přihlaste se znovu.'
        });
        
        // Po chvíli přesměruj na přihlašovací stránku
        setTimeout(() => {
          localStorage.removeItem('token');
          navigate('/login');
        }, 2000);
      }
      
      throw error;
    }
  }, [createAuthHeaders, navigate]);
  
  // Funkce pro ověření přihlášení
  const verifyAuth = useCallback(async () => {
    try {
      const currentToken = token || localStorage.getItem('token');
      if (!currentToken) {
        setAuthStatus({ 
          status: 'error', 
          message: 'Nejste přihlášeni. Přihlaste se prosím.' 
        });
        return false;
      }
      
      const profileData = await callApi('get', '/api/auth/profile');
      
      if (profileData && profileData.user) {
        setAuthStatus({ 
          status: 'success', 
          message: `Přihlášen jako ${profileData.user.username} (${profileData.user.role})` 
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Chyba při ověřování přihlášení:', error);
      setAuthStatus({ 
        status: 'error', 
        message: 'Token je neplatný nebo vypršel. Přihlaste se znovu.' 
      });
      return false;
    }
  }, [token, callApi]);
  
  // Funkce pro načtení zákazníků
  const fetchCustomers = useCallback(async () => {
    try {
      const response = await callApi('get', '/api/customers');
      
      if (response && Array.isArray(response.customers)) {
        // Filtrujeme případné null hodnoty
        return response.customers.filter(c => c != null) || [];
      }
      
      return [];
    } catch (error) {
      console.error('Chyba při načítání zákazníků:', error);
      return [];
    }
  }, [callApi]);
  
  // Funkce pro načtení zakázky
  const fetchOrder = useCallback(async (orderId) => {
    try {
      if (!orderId) return null;
      
      const response = await callApi('get', `/api/orders/${orderId}`);
      
      if (response && response.order) {
        return response.order;
      }
      
      return null;
    } catch (error) {
      console.error(`Chyba při načítání zakázky ID ${orderId}:`, error);
      return null;
    }
  }, [callApi]);
  
  // Načtení dat při inicializaci komponenty
  useEffect(() => {
    const initializeComponent = async () => {
      setLoading(true);
      try {
        // Ověř přihlášení
        const isAuthenticated = await verifyAuth();
        if (!isAuthenticated) {
          setLoading(false);
          return;
        }
        
        // Načti zákazníky
        const customersList = await fetchCustomers();
        setCustomers(customersList);
        
        // Pokud editujeme, načti existující zakázku
        if (isEditing && id) {
          const orderData = await fetchOrder(id);
          
          if (orderData) {
            // Správné formátování dat
            setFormData({
              customer_id: orderData.customer_id ? orderData.customer_id.toString() : '',
              order_number: orderData.order_number || '',
              name: orderData.name || '',
              status: orderData.status || 'created',
              estimated_end_date: orderData.estimated_end_date 
                ? new Date(orderData.estimated_end_date).toISOString().split('T')[0] 
                : '',
              notes: orderData.notes || ''
            });
          } else {
            setError('Nepodařilo se načíst data zakázky.');
          }
        }
      } catch (error) {
        console.error('Chyba při inicializaci:', error);
        setError(`Chyba při načítání dat: ${error.message || 'Neznámá chyba'}`);
      } finally {
        setLoading(false);
      }
    };
    
    initializeComponent();
  }, [id, isEditing, verifyAuth, fetchCustomers, fetchOrder]);
  
  // Generování čísla zakázky
  const generateOrderNumber = () => {
    const today = new Date();
    const year = today.getFullYear().toString().substr(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    setFormData(prev => ({ 
      ...prev, 
      order_number: `ZAK-${year}${month}${day}-${random}` 
    }));
  };
  
  // Změna hodnot formuláře
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Validace formuláře
  const validateForm = () => {
    // Ověření přihlášení
    if (!user) {
      return 'Pro vytvoření zakázky je nutné být přihlášen.';
    }
    
    // Ověření role pro vytváření zakázek
    if (!isEditing && user.role !== 'admin') {
      return 'Pro vytvoření nové zakázky potřebujete administrátorská práva.';
    }
    
    // Validace povinných polí
    if (!formData.customer_id) {
      return 'Vyberte zákazníka.';
    }
    
    if (!formData.order_number) {
      return 'Zadejte číslo zakázky.';
    }
    
    if (!formData.name) {
      return 'Zadejte název zakázky.';
    }
    
    // Validace hodnot
    const customerIdNum = parseInt(formData.customer_id);
    if (isNaN(customerIdNum)) {
      return 'Neplatné ID zákazníka.';
    }
    
    return null;
  };
  
  // Odeslání formuláře
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validace formuláře
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      // Příprava dat
      const requestData = {
        customer_id: parseInt(formData.customer_id),
        order_number: formData.order_number.trim(),
        name: formData.name.trim(),
        status: formData.status || 'created',
        estimated_end_date: formData.estimated_end_date || null,
        notes: formData.notes || ''
      };
      
      // Odeslání požadavku
      let response;
      if (isEditing) {
        response = await callApi('put', `/api/orders/${id}`, requestData);
      } else {
        response = await callApi('post', '/api/orders', requestData);
      }
      
      // Zpracování odpovědi
      console.log('Odpověď od serveru:', response);
      
      // Úspěch
      setSaveSuccess(true);
      setTimeout(() => {
        navigate('/orders');
      }, 1500);
    } catch (error) {
      console.error('Chyba při ukládání zakázky:', error);
      
      // Zpracování různých typů chyb
      if (error.response) {
        if (error.response.status === 401) {
          setError('Pro vytváření zakázek musíte být přihlášen. Přihlášení vypršelo nebo je neplatné.');
        } else if (error.response.status === 403) {
          setError('Pro vytváření zakázek potřebujete administrátorská práva.');
        } else if (error.response.status === 400) {
          setError(error.response.data?.message || 'Neplatné údaje. Zkontrolujte prosím zadané hodnoty.');
        } else if (error.response.status === 409) {
          setError('Zakázka s tímto číslem již existuje. Zvolte prosím jiné číslo zakázky.');
        } else {
          setError(`Chyba serveru (${error.response.status}): ${error.response.data?.message || 'Neznámá chyba'}`);
        }
      } else {
        setError(`Chyba: ${error.message || 'Neznámá chyba. Zkuste to prosím později.'}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Render pro stav načítání
  if (loading && !error && !saveSuccess) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Načítání...</p>
        </div>
      </Container>
    );
  }
  
  // Render pro uživatele bez přihlášení
  if (!user) {
    return (
      <Container>
        <Alert variant="danger">
          <Alert.Heading>Přístup odepřen</Alert.Heading>
          <p>Pro přístup k této funkci musíte být přihlášen.</p>
          <Button as={Link} to="/login" variant="primary" className="mt-2">Přihlásit se</Button>
        </Alert>
      </Container>
    );
  }
  
  // Render pro uživatele bez dostatečných oprávnění
  if (!isEditing && user.role !== 'admin') {
    return (
      <Container>
        <Alert variant="warning">
          <Alert.Heading>Nedostatečná oprávnění</Alert.Heading>
          <p>Pro vytvoření nové zakázky potřebujete administrátorská práva.</p>
          <Button as={Link} to="/orders" variant="primary" className="mt-2">Zpět na seznam zakázek</Button>
        </Alert>
      </Container>
    );
  }
  
  // Hlavní render formuláře
  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{isEditing ? 'Upravit zakázku' : 'Nová zakázka'}</h1>
        <Button as={Link} to="/orders" variant="outline-secondary">
          Zpět na seznam
        </Button>
      </div>
      
      {/* Status autentizace */}
      {authStatus && (
        <Alert variant={authStatus.status === 'success' ? 'info' : 'warning'} className="mb-3">
          <div className="d-flex align-items-center">
            <div className="me-2">
              <Badge bg={authStatus.status === 'success' ? 'success' : 'danger'} pill>
                {authStatus.status === 'success' ? 'Přihlášen' : 'Chyba'}
              </Badge>
            </div>
            <div>{authStatus.message}</div>
          </div>
        </Alert>
      )}
      
      {/* Zprávy pro uživatele */}
      {error && <Alert variant="danger">{error}</Alert>}
      {saveSuccess && <Alert variant="success">Zakázka byla úspěšně uložena.</Alert>}
      
      <Card className="shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="formCustomer">
                  <Form.Label>Zákazník <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="">-- Vyberte zákazníka --</option>
                    {Array.isArray(customers) && customers.length > 0 ? (
                      customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>Žádní zákazníci k dispozici</option>
                    )}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group controlId="formOrderNumber">
                  <Form.Label>Číslo zakázky <span className="text-danger">*</span></Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="text"
                      name="order_number"
                      value={formData.order_number}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder="např. ZAK-230415-001"
                    />
                    <Button 
                      variant="outline-secondary" 
                      onClick={generateOrderNumber}
                      disabled={loading || isEditing}
                      type="button"
                    >
                      Generovat
                    </Button>
                  </div>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group controlId="formOrderName" className="mb-3">
              <Form.Label>Název zakázky <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Zadejte název zakázky"
              />
            </Form.Group>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="formStatus">
                  <Form.Label>Stav zakázky</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="created">Vytvořeno</option>
                    <option value="active">Aktivní</option>
                    <option value="completed">Dokončeno</option>
                    <option value="cancelled">Zrušeno</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group controlId="formEndDate">
                  <Form.Label>Předpokládaný konec</Form.Label>
                  <Form.Control
                    type="date"
                    name="estimated_end_date"
                    value={formData.estimated_end_date}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group controlId="formNotes" className="mb-4">
              <Form.Label>Poznámky</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={loading}
                placeholder="Zadejte poznámky k zakázce"
              />
            </Form.Group>
            
            <div className="d-flex gap-2 justify-content-end">
              <Button 
                variant="outline-secondary" 
                as={Link} 
                to="/orders"
                disabled={loading}
              >
                Zrušit
              </Button>
              
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading}
              >
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
                  isEditing ? 'Uložit změny' : 'Vytvořit zakázku'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      {isEditing && (
        <div className="mt-4">
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Další akce</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-2">
                <Button 
                  as={Link} 
                  to={`/orders/${id}`} 
                  variant="outline-primary"
                >
                  Zobrazit detail
                </Button>
                <Button 
                  as={Link} 
                  to={`/orders/${id}/add-rental`} 
                  variant="outline-success"
                >
                  Přidat výpůjčku
                </Button>
                <Button 
                  as={Link} 
                  to={`/orders/${id}/delivery-note`} 
                  variant="outline-secondary"
                >
                  Generovat dodací list
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}
    </Container>
  );
};

export default NewOrderForm;