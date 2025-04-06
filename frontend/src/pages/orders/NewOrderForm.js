import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from '../../axios-config';
import { setAuthToken } from '../../axios-config';
import { useAuth } from '../../context/AuthContext';

const NewOrderForm = () => {
  // Hooks pro navigaci a získání ID z URL
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  // Autentizační kontext
  const { user, token, isAuthenticated } = useAuth();
  
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
  
  // Funkce pro ověření tokenu
  const verifyAuth = useCallback(async () => {
    try {
      // Získání tokenu z kontextu nebo localStorage
      const currentToken = token || localStorage.getItem('token');
      
      if (!currentToken) {
        console.error('Není k dispozici žádný autentizační token');
        setAuthStatus({ 
          status: 'error', 
          message: 'Nejste přihlášeni. Přihlaste se prosím.' 
        });
        return false;
      }
      
      // Nastavení tokenu pro axios
      setAuthToken(currentToken);
      
      // Testovací volání API pro ověření platnosti tokenu
      const profileResponse = await axios.get('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      
      if (profileResponse.data && profileResponse.data.user) {
        setAuthStatus({ 
          status: 'success', 
          message: `Přihlášen jako ${profileResponse.data.user.username} (${profileResponse.data.user.role})` 
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Chyba při ověřování tokenu:', error);
      setAuthStatus({ 
        status: 'error', 
        message: 'Token je neplatný nebo vypršel. Přihlaste se znovu.' 
      });
      return false;
    }
  }, [token]);
  
  // Funkce pro načtení seznamu zákazníků
  const fetchCustomers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return [];
      
      setAuthToken(token);
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      const response = await axios.get('/api/customers', { headers });
      
      if (response.data && Array.isArray(response.data.customers)) {
        return response.data.customers.filter(c => c != null) || [];
      }
      
      return [];
    } catch (error) {
      console.error('Chyba při načítání zákazníků:', error);
      throw error;
    }
  }, []);
  
  // Funkce pro načtení detailu zakázky
  const fetchOrderDetail = useCallback(async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !orderId) return null;
      
      setAuthToken(token);
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      const response = await axios.get(`/api/orders/${orderId}`, { headers });
      
      if (response.data && response.data.order) {
        return response.data.order;
      }
      
      return null;
    } catch (error) {
      console.error('Chyba při načítání detailu zakázky:', error);
      throw error;
    }
  }, []);
  
  // Efekt pro inicializaci - ověření přihlášení
  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      try {
        // Nejprve ověříme autentizaci
        const isAuthenticated = await verifyAuth();
        if (!isAuthenticated) {
          setLoading(false);
          return;
        }
        
        // Načteme zákazníky
        const customersList = await fetchCustomers();
        setCustomers(customersList);
        
        // Pokud editujeme, načteme detail zakázky
        if (isEditing && id) {
          const orderDetail = await fetchOrderDetail(id);
          
          if (orderDetail) {
            setFormData({
              customer_id: orderDetail.customer_id ? orderDetail.customer_id.toString() : '',
              order_number: orderDetail.order_number || '',
              name: orderDetail.name || '',
              status: orderDetail.status || 'created',
              estimated_end_date: orderDetail.estimated_end_date 
                ? new Date(orderDetail.estimated_end_date).toISOString().split('T')[0] 
                : '',
              notes: orderDetail.notes || ''
            });
          }
        }
      } catch (error) {
        console.error('Chyba při inicializaci formuláře:', error);
        if (error.response?.status === 401) {
          setError('Pro přístup k této funkci musíte být přihlášen. Vaše přihlášení vypršelo.');
          // Přesměrování na login po krátké prodlevě
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          setError(`Chyba při načítání dat: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    
    initializeForm();
  }, [isEditing, id, verifyAuth, fetchCustomers, fetchOrderDetail, navigate]);
  
  // Funkce pro generování čísla zakázky
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
  
  // Handler pro změny v polích formuláře
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Validace formuláře
  const validateForm = () => {
    // Ověření přihlášení
    if (!isAuthenticated || !user) {
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
    
    // Převod customer_id na číslo a ověření platnosti
    const customerIdNum = parseInt(formData.customer_id);
    if (isNaN(customerIdNum)) {
      return 'Neplatné ID zákazníka.';
    }
    
    // Pokud editujeme, ověříme platnost ID
    if (isEditing && (!id || isNaN(parseInt(id)))) {
      return 'Neplatné ID zakázky pro úpravu.';
    }
    
    return null;
  };
  
  // Funkce pro uložení formuláře
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
      // Získání a nastavení tokenu
      const currentToken = token || localStorage.getItem('token');
      if (!currentToken) {
        throw new Error('Pro uložení zakázky je nutné být přihlášen.');
      }
      
      setAuthToken(currentToken);
      
      // Příprava dat pro odeslání
      const requestData = {
        customer_id: parseInt(formData.customer_id),
        order_number: formData.order_number.trim(),
        name: formData.name.trim(),
        status: formData.status || 'created',
        estimated_end_date: formData.estimated_end_date || null,
        notes: formData.notes || ''
      };
      
      // Explicitní hlavičky
      const headers = {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      // Odeslání požadavku
      let response;
      if (isEditing) {
        response = await axios.put(`/api/orders/${id}`, requestData, { headers });
      } else {
        response = await axios.post('/api/orders', requestData, { headers });
      }
      
      // Zpracování odpovědi
      console.log('Odpověď od serveru:', response.data);
      
      // Označení úspěchu a přesměrování
      setSaveSuccess(true);
      setTimeout(() => {
        navigate('/orders');
      }, 1500);
    } catch (error) {
      console.error('Chyba při ukládání zakázky:', error);
      
      // Detailní logování chyby
      if (error.response) {
        console.error('Status chyby:', error.response.status);
        console.error('Data chyby:', error.response.data);
      }
      
      // Zpracování různých typů chyb
      if (error.response?.status === 401) {
        setError('Pro vytváření zakázek musíte být přihlášen. Přihlášení vypršelo nebo je neplatné.');
        
        // Přesměrování na login po neúspěšné autentizaci
        localStorage.removeItem('token');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (error.response?.status === 403) {
        setError('Pro vytváření zakázek potřebujete administrátorská práva.');
      } else if (error.response?.status === 400) {
        setError(error.response.data?.message || 'Neplatné údaje. Zkontrolujte prosím zadané hodnoty.');
      } else if (error.response?.status === 409) {
        setError('Zakázka s tímto číslem již existuje. Zvolte prosím jiné číslo zakázky.');
      } else {
        setError(error.message || 'Chyba při ukládání zakázky. Zkuste to prosím později.');
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
  if (!isAuthenticated || !user) {
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