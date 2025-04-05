import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from '../../axios-config';

const CustomerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    type: 'individual',
    name: '',
    email: '',
    phone: '',
    address: '',
    ico: '',
    dic: '',
    customer_category: 'regular',
    credit: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  useEffect(() => {
    // Pokud editujeme, načteme data zákazníka
    if (isEditing) {
      const fetchCustomer = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`/api/customers/${id}`);
          const customerData = response.data.customer;
          
          setFormData({
            type: customerData.type,
            name: customerData.name,
            email: customerData.email || '',
            phone: customerData.phone || '',
            address: customerData.address || '',
            ico: customerData.ico || '',
            dic: customerData.dic || '',
            customer_category: customerData.customer_category,
            credit: customerData.credit || 0
          });
        } catch (error) {
          console.error('Chyba při načítání zákazníka:', error);
          setError('Nepodařilo se načíst zákazníka. Zkuste to prosím později.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchCustomer();
    }
  }, [id, isEditing]);
  
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? parseFloat(value) : value 
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      if (isEditing) {
        // Aktualizace existujícího zákazníka
        await axios.put(`/api/customers/${id}`, formData);
      } else {
        // Vytvoření nového zákazníka
        await axios.post(`/api/customers`, formData);
      }
      
      setSaveSuccess(true);
      
      // Přesměrování zpět na seznam po úspěšném uložení
      setTimeout(() => {
        navigate('/customers');
      }, 1500);
    } catch (error) {
      console.error('Chyba při ukládání zákazníka:', error);
      setError(error.response?.data?.message || 'Chyba při ukládání zákazníka. Zkuste to prosím později.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container>
      <h1 className="mb-4">{isEditing ? 'Upravit zákazníka' : 'Přidat nového zákazníka'}</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {saveSuccess && <Alert variant="success">Zákazník byl úspěšně uložen.</Alert>}
      
      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Typ zákazníka</Form.Label>
                  <Form.Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="individual">Fyzická osoba</option>
                    <option value="company">Firma</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kategorie zákazníka</Form.Label>
                  <Form.Select
                    name="customer_category"
                    value={formData.customer_category}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="regular">Běžný</option>
                    <option value="vip">VIP</option>
                    <option value="wholesale">Velkoobchod</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Název/Jméno *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="Zadejte jméno nebo název firmy"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Zadejte emailovou adresu"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Telefon</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Zadejte telefonní číslo"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Adresa</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Zadejte adresu"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>IČO</Form.Label>
                  <Form.Control
                    type="text"
                    name="ico"
                    value={formData.ico}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Zadejte IČO"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>DIČ</Form.Label>
                  <Form.Control
                    type="text"
                    name="dic"
                    value={formData.dic}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Zadejte DIČ"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kredit (Kč)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="credit"
                    value={formData.credit}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button 
                as={Link} 
                to="/customers" 
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

export default CustomerForm;