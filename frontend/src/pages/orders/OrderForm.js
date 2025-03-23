import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL, ORDER_STATUS } from '../../config';

const OrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    customer_id: '',
    order_number: '',
    status: 'created',
    estimated_end_date: '',
    notes: ''
  });
  
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(`${API_URL}/customers`);
        setCustomers(response.data.customers);
      } catch (error) {
        console.error('Chyba při načítání zákazníků:', error);
        setError('Nepodařilo se načíst seznam zákazníků.');
      }
    };
    
    fetchCustomers();
    
    // Pokud editujeme, načteme data zakázky
    if (isEditing) {
      setLoading(true);
      
      const fetchOrder = async () => {
        try {
          const response = await axios.get(`${API_URL}/orders/${id}`);
          const orderData = response.data.order;
          
          setFormData({
            customer_id: orderData.customer_id.toString(),
            order_number: orderData.order_number,
            status: orderData.status,
            estimated_end_date: orderData.estimated_end_date ? 
              new Date(orderData.estimated_end_date).toISOString().split('T')[0] : '',
            notes: orderData.notes || ''
          });
          
          setLoading(false);
        } catch (error) {
          console.error('Chyba při načítání zakázky:', error);
          setError('Nepodařilo se načíst zakázku. Zkuste to prosím později.');
          setLoading(false);
        }
      };
      
      fetchOrder();
    }
  }, [id, isEditing]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      if (isEditing) {
        // Aktualizace existující zakázky
        await axios.put(`${API_URL}/orders/${id}`, formData);
      } else {
        // Vytvoření nové zakázky
        await axios.post(`${API_URL}/orders`, formData);
      }
      
      setSaveSuccess(true);
      
      // Přesměrování zpět na seznam po úspěšném uložení
      setTimeout(() => {
        navigate('/orders');
      }, 1500);
    } catch (error) {
      console.error('Chyba při ukládání zakázky:', error);
      setError(error.response?.data?.message || 'Chyba při ukládání zakázky. Zkuste to prosím později.');
    } finally {
      setLoading(false);
    }
  };
  
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
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
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
                    >
                      Generovat
                    </Button>
                  </div>
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
                    {Object.keys(ORDER_STATUS).map(key => (
                      <option key={key} value={key}>
                        {ORDER_STATUS[key].label}
                      </option>
                    ))}
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