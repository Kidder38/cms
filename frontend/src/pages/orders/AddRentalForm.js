import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL, formatCurrency } from '../../config';

const AddRentalForm = () => {
  const { order_id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    equipment_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    planned_return_date: '',
    daily_rate: '',
    status: 'created'
  });
  
  const [equipment, setEquipment] = useState([]);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Načtení zakázky
        const orderResponse = await axios.get(`${API_URL}/orders/${order_id}`);
        setOrder(orderResponse.data.order);
        
        // Načtení dostupného vybavení
        const equipmentResponse = await axios.get(`${API_URL}/equipment`);
        const availableEquipment = equipmentResponse.data.equipment.filter(
          item => item.status === 'available'
        );
        setEquipment(availableEquipment);
        
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání dat:', error);
        setError('Nepodařilo se načíst data. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [order_id]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'equipment_id') {
      // Pokud se změnilo vybavení, aktualizujeme denní sazbu
      const selectedEquipment = equipment.find(item => item.id.toString() === value);
      if (selectedEquipment) {
        setFormData(prev => ({ 
          ...prev, 
          [name]: value,
          daily_rate: selectedEquipment.daily_rate 
        }));
        return;
      }
    }
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'daily_rate' ? parseFloat(value) : value 
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaveSuccess(false);
    
    // Vytvoření kopie dat s případnými úpravami
    const dataToSend = {
      ...formData,
      equipment_id: parseInt(formData.equipment_id), // Zajistí, že ID je číslo
      daily_rate: parseFloat(formData.daily_rate) // Zajistí, že sazba je číslo
    };
    
    try {
      await axios.post(`${API_URL}/orders/${order_id}/rentals`, dataToSend);
      
      setSaveSuccess(true);
      
      // Přesměrování zpět na detail zakázky po úspěšném uložení
      setTimeout(() => {
        navigate(`/orders/${order_id}`);
      }, 1500);
    } catch (error) {
      console.error('Chyba při přidání výpůjčky:', error);
      // Zobrazení detailnější chybové zprávy
      setError(error.response?.data?.message || (error.response?.data?.error ? 
        `Chyba: ${error.response.data.error}` : 'Chyba při přidání výpůjčky'));
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Container>
        <Alert variant="info">Načítání dat...</Alert>
      </Container>
    );
  }
  
  if (error && !saveSuccess) {
    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }
  
  if (!order) {
    return (
      <Container>
        <Alert variant="warning">Zakázka nebyla nalezena.</Alert>
      </Container>
    );
  }
  
  return (
    <Container>
      <h1 className="mb-4">Přidat výpůjčku do zakázky #{order.order_number}</h1>
      
      {equipment.length === 0 && (
        <Alert variant="warning">
          Není k dispozici žádné dostupné vybavení k vypůjčení.
        </Alert>
      )}
      
      {error && <Alert variant="danger">{error}</Alert>}
      {saveSuccess && <Alert variant="success">Výpůjčka byla úspěšně přidána.</Alert>}
      
      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vybavení *</Form.Label>
                  <Form.Select
                    name="equipment_id"
                    value={formData.equipment_id}
                    onChange={handleChange}
                    required
                    disabled={loading || equipment.length === 0}
                  >
                    <option value="">Vyberte vybavení</option>
                    {equipment.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {item.inventory_number} ({formatCurrency(item.daily_rate)}/den)
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Denní sazba (Kč) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="daily_rate"
                    value={formData.daily_rate}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Datum vydání</Form.Label>
                  <Form.Control
                    type="date"
                    name="issue_date"
                    value={formData.issue_date}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Plánované datum vrácení</Form.Label>
                  <Form.Control
                    type="date"
                    name="planned_return_date"
                    value={formData.planned_return_date}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Stav výpůjčky</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="created">Vytvořeno</option>
                    <option value="issued">Vydáno</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button 
                as={Link} 
                to={`/orders/${order_id}`} 
                variant="outline-secondary"
                disabled={loading}
              >
                Zrušit
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={loading || equipment.length === 0}
              >
                {loading ? 'Ukládání...' : 'Přidat výpůjčku'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AddRentalForm;