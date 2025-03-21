import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Alert } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL, formatCurrency, formatDate, EQUIPMENT_STATUS } from '../../config';
import { useAuth } from '../../context/AuthContext';

const EquipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const response = await axios.get(`${API_URL}/equipment/${id}`);
        setEquipment(response.data.equipment);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání dat:', error);
        setError('Nepodařilo se načíst data. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchEquipment();
  }, [id]);
  
  const handleDelete = async () => {
    if (!window.confirm('Opravdu chcete smazat toto vybavení?')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/equipment/${id}`);
      alert('Vybavení bylo úspěšně smazáno.');
      navigate('/equipment');
    } catch (error) {
      console.error('Chyba při mazání vybavení:', error);
      alert(error.response?.data?.message || 'Chyba při mazání vybavení.');
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
  
  if (!equipment) {
    return (
      <Container>
        <Alert variant="warning">Vybavení nebylo nalezeno.</Alert>
      </Container>
    );
  }
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Detail vybavení</h1>
        </Col>
        <Col xs="auto">
          <Button 
            as={Link} 
            to="/equipment" 
            variant="outline-secondary" 
            className="me-2"
          >
            Zpět na seznam
          </Button>
          
          {user?.role === 'admin' && (
            <>
              <Button 
                as={Link} 
                to={`/equipment/edit/${id}`} 
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
                <strong>Název:</strong> {equipment.name}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Inventární číslo:</strong> {equipment.inventory_number}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Kategorie:</strong> {equipment.category_name}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Stav:</strong>{' '}
                <Badge bg={EQUIPMENT_STATUS[equipment.status].color}>
                  {EQUIPMENT_STATUS[equipment.status].label}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Umístění:</strong> {equipment.location || 'Neuvedeno'}
              </ListGroup.Item>
            </ListGroup>
          </Card>
          
          <Card>
            <Card.Header>
              <h5 className="mb-0">Finanční informace</h5>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>Denní sazba:</strong> {formatCurrency(equipment.daily_rate)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Pořizovací cena:</strong> {formatCurrency(equipment.purchase_price) || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Přidáno dne:</strong> {formatDate(equipment.created_at)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Naposledy upraveno:</strong> {formatDate(equipment.updated_at)}
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Popis</h5>
            </Card.Header>
            <Card.Body>
              {equipment.description || 'Bez popisu'}
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <h5 className="mb-0">Fotografie</h5>
            </Card.Header>
            <Card.Body className="text-center">
              {equipment.photo_url ? (
                <img 
                  src={equipment.photo_url} 
                  alt={equipment.name} 
                  className="img-fluid" 
                  style={{ maxHeight: '300px' }}
                />
              ) : (
                <Alert variant="light">Fotografie není k dispozici</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default EquipmentDetail;