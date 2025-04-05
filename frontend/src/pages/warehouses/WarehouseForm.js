import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from '../../axios-config';
import { useAuth } from '../../context/AuthContext';

const WarehouseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;
  
  // Kontrola oprávnění
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  // Seznam dodavatelů
  const [suppliers, setSuppliers] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_external: false,
    supplier_id: '',
    location: '',
    contact_person: '',
    phone: '',
    email: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Načtení dodavatelů pro externí sklady
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axios.get('/suppliers');
        setSuppliers(response.data.suppliers);
      } catch (error) {
        console.error('Chyba při načítání dodavatelů:', error);
        setError('Nepodařilo se načíst seznam dodavatelů.');
      }
    };
    
    fetchSuppliers();
  }, []);
  
  // Načtení dat při editaci
  useEffect(() => {
    if (isEditing) {
      const fetchWarehouse = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`/warehouses/${id}`);
          const warehouseData = response.data.warehouse;
          
          setFormData({
            name: warehouseData.name || '',
            description: warehouseData.description || '',
            is_external: warehouseData.is_external || false,
            supplier_id: warehouseData.supplier_id || '',
            location: warehouseData.location || '',
            contact_person: warehouseData.contact_person || '',
            phone: warehouseData.phone || '',
            email: warehouseData.email || '',
            notes: warehouseData.notes || ''
          });
          
          setLoading(false);
        } catch (error) {
          console.error('Chyba při načítání skladu:', error);
          setError('Nepodařilo se načíst sklad. Zkuste to prosím později.');
          setLoading(false);
        }
      };
      
      fetchWarehouse();
    }
  }, [id, isEditing]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Základní validace formuláře
    if (!formData.name.trim()) {
      setError('Název skladu je povinný.');
      return;
    }
    
    if (formData.is_external && !formData.supplier_id) {
      setError('Pro externí sklad je potřeba vybrat dodavatele.');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      if (isEditing) {
        // Aktualizace existujícího skladu
        await axios.put(`/warehouses/${id}`, formData);
        setSuccess(true);
        setTimeout(() => {
          navigate(`/warehouses/${id}`);
        }, 1500);
      } else {
        // Vytvoření nového skladu
        const response = await axios.post('/warehouses', formData);
        setSuccess(true);
        setTimeout(() => {
          navigate(`/warehouses/${response.data.warehouse.id}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Chyba při ukládání skladu:', error);
      setError(error.response?.data?.message || 'Při ukládání skladu došlo k chybě. Zkuste to prosím později.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Načítání...</span>
          </Spinner>
          <p className="mt-2">Načítání dat skladu...</p>
        </div>
      </Container>
    );
  }
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>{isEditing ? 'Upravit sklad' : 'Nový sklad'}</h1>
        </Col>
        <Col xs="auto">
          <Button 
            as={Link} 
            to="/warehouses" 
            variant="outline-secondary"
          >
            Zpět na seznam
          </Button>
        </Col>
      </Row>
      
      {error && (
        <Alert variant="danger" className="mb-4">{error}</Alert>
      )}
      
      {success && (
        <Alert variant="success" className="mb-4">
          Sklad byl úspěšně {isEditing ? 'aktualizován' : 'vytvořen'}.
        </Alert>
      )}
      
      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Název skladu *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Zadejte název skladu"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="is-external"
                    name="is_external"
                    label="Externí sklad (vybavení od dodavatele)"
                    checked={formData.is_external}
                    onChange={handleChange}
                  />
                </Form.Group>
                
                {formData.is_external && (
                  <Form.Group className="mb-3">
                    <Form.Label>Dodavatel *</Form.Label>
                    <Form.Select
                      name="supplier_id"
                      value={formData.supplier_id}
                      onChange={handleChange}
                      required={formData.is_external}
                    >
                      <option value="">Vyberte dodavatele</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Text>
                      {suppliers.length === 0 && 'Nejsou k dispozici žádní dodavatelé. Nejprve prosím přidejte dodavatele.'}
                    </Form.Text>
                  </Form.Group>
                )}
                
                <Form.Group className="mb-3">
                  <Form.Label>Umístění</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Adresa nebo popis umístění skladu"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kontaktní osoba</Form.Label>
                  <Form.Control
                    type="text"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleChange}
                    placeholder="Jméno kontaktní osoby"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Telefon</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Telefonní číslo"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Popis</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Popis skladu"
              />
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Label>Poznámky</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Další poznámky ke skladu"
              />
            </Form.Group>
            
            <div className="d-flex justify-content-between">
              <Button 
                variant="secondary" 
                as={Link} 
                to="/warehouses"
              >
                Zrušit
              </Button>
              
              <Button 
                type="submit" 
                variant="primary"
                disabled={submitting}
              >
                {submitting ? 'Ukládám...' : (isEditing ? 'Uložit změny' : 'Vytvořit sklad')}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default WarehouseForm;