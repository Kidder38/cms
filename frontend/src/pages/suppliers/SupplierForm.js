import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from '../../axios-config';
import { useAuth } from '../../context/AuthContext';

const SupplierForm = () => {
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
  
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    ico: '',
    dic: '',
    bank_account: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Načtení dat při editaci
  useEffect(() => {
    if (isEditing) {
      const fetchSupplier = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`/api/suppliers/${id}`);
          const supplierData = response.data.supplier;
          
          setFormData({
            name: supplierData.name || '',
            contact_person: supplierData.contact_person || '',
            email: supplierData.email || '',
            phone: supplierData.phone || '',
            address: supplierData.address || '',
            ico: supplierData.ico || '',
            dic: supplierData.dic || '',
            bank_account: supplierData.bank_account || '',
            notes: supplierData.notes || ''
          });
          
          setLoading(false);
        } catch (error) {
          console.error('Chyba při načítání dodavatele:', error);
          setError('Nepodařilo se načíst dodavatele. Zkuste to prosím později.');
          setLoading(false);
        }
      };
      
      fetchSupplier();
    }
  }, [id, isEditing]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Základní validace formuláře
    if (!formData.name.trim()) {
      setError('Název dodavatele je povinný.');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      if (isEditing) {
        // Aktualizace existujícího dodavatele
        await axios.put(`/api/suppliers/${id}`, formData);
        setSuccess(true);
        setTimeout(() => {
          navigate(`/suppliers/${id}`);
        }, 1500);
      } else {
        // Vytvoření nového dodavatele
        const response = await axios.post('/api/suppliers', formData);
        setSuccess(true);
        setTimeout(() => {
          navigate(`/suppliers/${response.data.supplier.id}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Chyba při ukládání dodavatele:', error);
      setError(error.response?.data?.message || 'Při ukládání dodavatele došlo k chybě. Zkuste to prosím později.');
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
          <p className="mt-2">Načítání dat dodavatele...</p>
        </div>
      </Container>
    );
  }
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>{isEditing ? 'Upravit dodavatele' : 'Nový dodavatel'}</h1>
        </Col>
        <Col xs="auto">
          <Button 
            as={Link} 
            to="/suppliers" 
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
          Dodavatel byl úspěšně {isEditing ? 'aktualizován' : 'vytvořen'}.
        </Alert>
      )}
      
      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Název dodavatele *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Zadejte název dodavatele"
                    required
                  />
                </Form.Group>
                
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
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>IČO</Form.Label>
                  <Form.Control
                    type="text"
                    name="ico"
                    value={formData.ico}
                    onChange={handleChange}
                    placeholder="IČO"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>DIČ</Form.Label>
                  <Form.Control
                    type="text"
                    name="dic"
                    value={formData.dic}
                    onChange={handleChange}
                    placeholder="DIČ"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Bankovní účet</Form.Label>
                  <Form.Control
                    type="text"
                    name="bank_account"
                    value={formData.bank_account}
                    onChange={handleChange}
                    placeholder="Číslo bankovního účtu"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Adresa</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Adresa dodavatele"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-4">
              <Form.Label>Poznámky</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Poznámky k dodavateli"
              />
            </Form.Group>
            
            <div className="d-flex justify-content-between">
              <Button 
                variant="secondary" 
                as={Link} 
                to="/suppliers"
              >
                Zrušit
              </Button>
              
              <Button 
                type="submit" 
                variant="primary"
                disabled={submitting}
              >
                {submitting ? 'Ukládám...' : (isEditing ? 'Uložit změny' : 'Vytvořit dodavatele')}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SupplierForm;