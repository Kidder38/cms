import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Alert } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL, formatCurrency, formatDate } from '../../config';
import { useAuth } from '../../context/AuthContext';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await axios.get(`${API_URL}/customers/${id}`);
        setCustomer(response.data.customer);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání dat:', error);
        setError('Nepodařilo se načíst data. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchCustomer();
  }, [id]);
  
  const handleDelete = async () => {
    if (!window.confirm('Opravdu chcete smazat tohoto zákazníka?')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/customers/${id}`);
      alert('Zákazník byl úspěšně smazán.');
      navigate('/customers');
    } catch (error) {
      console.error('Chyba při mazání zákazníka:', error);
      alert(error.response?.data?.message || 'Chyba při mazání zákazníka.');
    }
  };
  
  const getCustomerCategoryLabel = (category) => {
    switch(category) {
      case 'regular': return { label: 'Běžný', color: 'secondary' };
      case 'vip': return { label: 'VIP', color: 'primary' };
      case 'wholesale': return { label: 'Velkoobchod', color: 'success' };
      default: return { label: 'Neznámý', color: 'secondary' };
    }
  };
  
  if (loading) {
    return (
      <Container>
        <Alert variant="info">Načítání dat...</Alert>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }
  
  if (!customer) {
    return (
      <Container>
        <Alert variant="warning">Zákazník nebyl nalezen.</Alert>
      </Container>
    );
  }
  
  const categoryInfo = getCustomerCategoryLabel(customer.customer_category);
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Detail zákazníka</h1>
        </Col>
        <Col xs="auto">
          <Button 
            as={Link} 
            to="/customers" 
            variant="outline-secondary" 
            className="me-2"
          >
            Zpět na seznam
          </Button>
          
          {user?.role === 'admin' && (
            <>
              <Button 
                as={Link} 
                to={`/customers/edit/${id}`} 
                variant="primary" 
                className="me-2"
              >
                Upravit
              </Button>
              
              <Button 
                variant="danger" 
                onClick={handleDelete}
              >
                Smazat
              </Button>
            </>
          )}
        </Col>
      </Row>
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Základní informace</h5>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>Název/Jméno:</strong> {customer.name}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Typ:</strong> {customer.type === 'individual' ? 'Fyzická osoba' : 'Firma'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Kategorie:</strong>{' '}
                <Badge bg={categoryInfo.color}>
                  {categoryInfo.label}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Email:</strong> {customer.email || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Telefon:</strong> {customer.phone || 'Neuvedeno'}
              </ListGroup.Item>
            </ListGroup>
          </Card>
          
          <Card>
            <Card.Header>
              <h5 className="mb-0">Finanční informace</h5>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>Kredit:</strong> {formatCurrency(customer.credit) || '0 Kč'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Vytvořeno:</strong> {formatDate(customer.created_at)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Naposledy upraveno:</strong> {formatDate(customer.updated_at)}
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Fakturační údaje</h5>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>Adresa:</strong> {customer.address || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>IČO:</strong> {customer.ico || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>DIČ:</strong> {customer.dic || 'Neuvedeno'}
              </ListGroup.Item>
            </ListGroup>
          </Card>
          
          {/* V budoucnu zde může být přehled zakázek zákazníka */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">Přehled aktivit</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">Zde bude v budoucnu zobrazen přehled zakázek a výpůjček zákazníka.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CustomerDetail;