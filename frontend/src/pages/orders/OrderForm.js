import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from '../../axios-config';
import { useAuth } from '../../context/AuthContext';

const OrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { user } = useAuth();
  
  // Inicializace stavu
  const [formData, setFormData] = useState({
    customer_id: '',
    order_number: '',
    name: '',
    status: 'created',
    estimated_end_date: '',
    notes: ''
  });
  
  // Garantujeme, že customers bude vždy pole
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Kontrola přihlášení a oprávnění uživatele
  useEffect(() => {
    if (!user) {
      setError('Pro přístup k této funkci musíte být přihlášen.');
    } else if (!isEditing && user.role !== 'admin') {
      setError('Pro vytvoření nové zakázky potřebujete administrátorská práva.');
    }
  }, [user, isEditing]);
  
  // Načtení zákazníků po ověření uživatele
  useEffect(() => {
    // Pokud nemáme uživatele nebo nemá oprávnění, nevoláme API
    if (!user) return;
    if (!isEditing && user.role !== 'admin') return;
    
    const loadCustomers = async () => {
      try {
        setLoading(true);
        
        // Ověříme, že máme platný token před voláním API
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('Token není k dispozici, přeskakuji načítání zákazníků');
          setLoading(false);
          setError('Pro načtení zákazníků je nutné být přihlášen.');
          return;
        }
        
        // Zajistíme nastavení auth hlavičky
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        const response = await axios.get('/api/customers');
        
        // Bezpečná inicializace seznamu zákazníků - dodatečná úroveň kontroly
        if (response && response.data) {
          if (Array.isArray(response.data.customers)) {
            // Filtrujeme případné null nebo undefined hodnoty
            const filteredCustomers = response.data.customers.filter(customer => customer != null);
            setCustomers(filteredCustomers);
            
            if (filteredCustomers.length === 0) {
              console.warn('Seznam zákazníků je prázdný');
            }
          } else {
            console.warn('Neočekávaný formát dat zákazníků - není pole:', response.data);
            setCustomers([]);
          }
        } else {
          console.warn('Neočekávaný formát dat zákazníků - chybí data:', response);
          setCustomers([]);
        }
      } catch (error) {
        console.error('Chyba při načítání zákazníků:', error);
        
        // Specifické chybové hlášení podle typu chyby
        if (error.response?.status === 401) {
          setError('Pro načtení zákazníků je nutné být přihlášen. Vaše přihlášení vypršelo nebo je neplatné.');
        } else if (error.response?.status === 403) {
          setError('Nemáte oprávnění pro přístup k seznamu zákazníků.');
        } else {
          setError(error.response?.data?.message || 'Nepodařilo se načíst seznam zákazníků. Zkuste to prosím později.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadCustomers();
  }, [user, isEditing]);
  
  // Načtení dat zakázky při editaci
  useEffect(() => {
    if (!user || !isEditing) return;
    
    const loadOrder = async () => {
      try {
        setLoading(true);
        
        // Ověříme, že máme platný token před voláním API
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('Token není k dispozici, přeskakuji načítání zakázky');
          setLoading(false);
          setError('Pro načtení zakázky je nutné být přihlášen.');
          return;
        }
        
        // Zajistíme nastavení auth hlavičky
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Dodatečná kontrola ID
        if (!id || isNaN(parseInt(id))) {
          console.error('Neplatné ID zakázky:', id);
          setError('Neplatné ID zakázky.');
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`/api/orders/${id}`);
        
        if (response && response.data) {
          if (response.data.order) {
            const orderData = response.data.order;
            
            // Preventivní kontrola datových typů před nastavením do formuláře
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
            console.warn('Chybí pole order v odpovědi API:', response.data);
            setError('Zakázka nebyla nalezena nebo má neplatný formát');
          }
        } else {
          console.warn('Neočekávaný formát dat při načítání zakázky:', response);
          setError('Zakázka nebyla nalezena nebo má neplatný formát');
        }
      } catch (error) {
        console.error('Chyba při načítání zakázky:', error);
        
        // Specifické chybové hlášení podle typu chyby
        if (error.response?.status === 401) {
          setError('Pro načtení zakázky je nutné být přihlášen. Vaše přihlášení vypršelo nebo je neplatné.');
        } else if (error.response?.status === 403) {
          setError('Nemáte oprávnění pro přístup k této zakázce.');
        } else if (error.response?.status === 404) {
          setError('Zakázka nebyla nalezena.');
        } else {
          setError('Nepodařilo se načíst zakázku. ' + (error.response?.data?.message || 'Zkuste to prosím později.'));
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadOrder();
  }, [id, isEditing, user]);
  
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
  
  // Zpracování změn formuláře
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Odeslání formuláře
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Ověříme, že máme platný token před odesláním
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Pro uložení zakázky je nutné být přihlášen. Vaše přihlášení vypršelo.');
      return;
    }
    
    // Ověříme přihlášení uživatele
    if (!user) {
      setError('Pro uložení zakázky je nutné být přihlášen.');
      return;
    }
    
    // Ověření oprávnění pro vytvoření zakázky
    if (!isEditing && user.role !== 'admin') {
      setError('Pro vytvoření nové zakázky potřebujete administrátorská práva.');
      return;
    }
    
    // Validace všech povinných polí
    if (!formData.customer_id) {
      setError('Vyberte zákazníka.');
      return;
    }
    
    if (!formData.order_number) {
      setError('Zadejte číslo zakázky.');
      return;
    }
    
    if (!formData.name) {
      setError('Zadejte název zakázky.');
      return;
    }
    
    // Převod customer_id na číslo a ověření platnosti
    const customerIdNum = parseInt(formData.customer_id);
    if (isNaN(customerIdNum)) {
      setError('Neplatné ID zákazníka.');
      return;
    }
    
    // Pokud editujeme, ověříme platnost ID
    if (isEditing && (!id || isNaN(parseInt(id)))) {
      setError('Neplatné ID zakázky pro úpravu.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      // Zajistíme nastavení auth hlavičky
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Konstrukce požadavku s explicitními kontrolami
      const requestData = {
        customer_id: customerIdNum,
        order_number: formData.order_number.trim(),
        name: formData.name.trim(),
        status: formData.status || 'created',
        estimated_end_date: formData.estimated_end_date || null,
        notes: formData.notes || ''
      };
      
      let response;
      
      if (isEditing) {
        // Aktualizace existující zakázky
        response = await axios.put(`/api/orders/${id}`, requestData);
      } else {
        // Vytvoření nové zakázky
        response = await axios.post('/api/orders', requestData);
      }
      
      // Ověření odpovědi od serveru
      if (!response || !response.data) {
        throw new Error('Neplatná odpověď od serveru.');
      }
      
      setSaveSuccess(true);
      
      // Přesměrování zpět na seznam po úspěšném uložení
      setTimeout(() => {
        navigate('/orders');
      }, 1500);
    } catch (error) {
      console.error('Chyba při ukládání zakázky:', error);
      
      // Detailnější log chyby
      if (error.response) {
        console.error('Status chyby:', error.response.status);
        console.error('Data chyby:', error.response.data);
      }
      
      // Specifická chybová hlášení dle stavového kódu
      if (error.response?.status === 401) {
        setError('Pro vytváření zakázek musíte být přihlášen. Přihlášení vypršelo nebo je neplatné.');
      } else if (error.response?.status === 403) {
        setError('Pro vytváření zakázek potřebujete administrátorská práva.');
      } else if (error.response?.status === 400) {
        setError(error.response.data?.message || 'Neplatné údaje. Zkontrolujte prosím zadané hodnoty.');
      } else if (error.response?.status === 409) {
        setError('Zakázka s tímto číslem již existuje. Zvolte prosím jiné číslo zakázky.');
      } else if (error.response?.status === 500) {
        setError('Chyba na straně serveru. Zkuste to prosím později.');
      } else {
        setError(error.response?.data?.message || error.message || 'Chyba při ukládání zakázky. Zkuste to prosím později.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Podmíněné renderování pro uživatele bez přihlášení
  if (!user) {
    return (
      <Container>
        <Alert variant="danger">
          <p>Pro přístup k této funkci musíte být přihlášen.</p>
          <Button as={Link} to="/login" variant="primary" className="mt-2">Přihlásit se</Button>
        </Alert>
      </Container>
    );
  }
  
  // Podmíněné renderování pro uživatele bez dostatečných oprávnění
  if (!isEditing && user?.role !== 'admin') {
    return (
      <Container>
        <Alert variant="warning">
          <p>Pro vytvoření nové zakázky potřebujete administrátorská práva.</p>
          <Button as={Link} to="/orders" variant="primary" className="mt-2">Zpět na seznam zakázek</Button>
        </Alert>
      </Container>
    );
  }
  
  // Zobrazení během načítání
  if (loading && !error && !saveSuccess) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Načítání...</span>
          </Spinner>
          <p className="mt-3">Načítání dat...</p>
        </div>
      </Container>
    );
  }
  
  // Hlavní renderování formuláře
  return (
    <Container>
      <h1 className="mb-4">{isEditing ? 'Upravit zakázku' : 'Přidat novou zakázku'}</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {saveSuccess && <Alert variant="success">Zakázka byla úspěšně uložena.</Alert>}
      
      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Zákazník *</Form.Label>
                  <Form.Select
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Vyberte zákazníka</option>
                    {/* Bezpečný způsob renderování seznamu zákazníků */}
                    {Array.isArray(customers) && customers.length > 0 && customers.map(customer => {
                      // Ještě jedna úroveň kontroly pro každého zákazníka
                      if (!customer) return null;
                      return (
                        <option 
                          key={customer.id || `unknown-${Math.random()}`} 
                          value={customer.id || ''}
                        >
                          {customer.name || 'Zákazník bez jména'}
                        </option>
                      );
                    })}
                    {(!Array.isArray(customers) || customers.length === 0) && (
                      <option disabled>Žádní zákazníci k dispozici</option>
                    )}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Číslo zakázky *</Form.Label>
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
            
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Název zakázky *</Form.Label>
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
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Stav</Form.Label>
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
                <Form.Group className="mb-3">
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
            
            <Row>
              <Col>
                <Form.Group className="mb-3">
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
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button 
                as={Link} 
                to="/orders" 
                variant="outline-secondary"
                disabled={loading}
              >
                Zrušit
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Ukládání...' : 'Uložit'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OrderForm;