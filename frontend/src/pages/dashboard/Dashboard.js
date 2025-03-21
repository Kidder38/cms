import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL, formatDate, formatCurrency, EQUIPMENT_STATUS } from '../../config';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    equipment: {
      total: 0,
      available: 0,
      borrowed: 0,
      maintenance: 0
    },
    categories: [],
    recentlyAdded: []
  });
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // V reálné aplikaci bychom měli endpoint pro dashboard data
        // Pro jednoduchost zde použijeme endpoint pro vybavení
        const equipmentResponse = await axios.get(`${API_URL}/equipment`);
        const categoriesResponse = await axios.get(`${API_URL}/categories`);
        
        // Zpracování dat pro statistiky
        const equipmentData = equipmentResponse.data.equipment;
        
        const availableCount = equipmentData.filter(item => item.status === 'available').length;
        const borrowedCount = equipmentData.filter(item => item.status === 'borrowed').length;
        const maintenanceCount = equipmentData.filter(item => item.status === 'maintenance').length;
        
        // Seřazení podle datumu přidání (od nejnovějších)
        const recentlyAdded = [...equipmentData]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
        
        setStats({
          equipment: {
            total: equipmentData.length,
            available: availableCount,
            borrowed: borrowedCount,
            maintenance: maintenanceCount
          },
          categories: categoriesResponse.data.categories,
          recentlyAdded
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání dat pro dashboard:', error);
        setError('Nepodařilo se načíst data pro dashboard. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (loading) {
    return (
      <Container>
        <Row className="justify-content-center">
          <Col>
            <Alert variant="info">Načítání dat...</Alert>
          </Col>
        </Row>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container>
        <Row className="justify-content-center">
          <Col>
            <Alert variant="danger">{error}</Alert>
          </Col>
        </Row>
      </Container>
    );
  }
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Dashboard</h1>
          <p>Vítejte, {user?.first_name || user?.username}! Zde jsou přehledné informace o půjčovně.</p>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col md={6} lg={3} className="mb-3">
          <Card className="h-100">
            <Card.Body className="text-center">
              <Card.Title>Celkem vybavení</Card.Title>
              <h2>{stats.equipment.total}</h2>
              <Button variant="primary" as={Link} to="/equipment" size="sm">
                Zobrazit všechny
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-3">
          <Card className="h-100 text-white bg-success">
            <Card.Body className="text-center">
              <Card.Title>Dostupné</Card.Title>
              <h2>{stats.equipment.available}</h2>
              <small>{Math.round((stats.equipment.available / stats.equipment.total) * 100) || 0}% z celkového počtu</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-3">
          <Card className="h-100 text-white bg-warning">
            <Card.Body className="text-center">
              <Card.Title>Vypůjčené</Card.Title>
              <h2>{stats.equipment.borrowed}</h2>
              <small>{Math.round((stats.equipment.borrowed / stats.equipment.total) * 100) || 0}% z celkového počtu</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-3">
          <Card className="h-100 text-white bg-info">
            <Card.Body className="text-center">
              <Card.Title>V servisu</Card.Title>
              <h2>{stats.equipment.maintenance}</h2>
              <small>{Math.round((stats.equipment.maintenance / stats.equipment.total) * 100) || 0}% z celkového počtu</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col md={6} className="mb-3">
          <Card className="h-100">
            <Card.Header>Nedávno přidané vybavení</Card.Header>
            <ListGroup variant="flush">
              {stats.recentlyAdded.length > 0 ? (
                stats.recentlyAdded.map(item => (
                  <ListGroup.Item key={item.id}>
                    <Row>
                      <Col xs={8}>
                        <Link to={`/equipment/${item.id}`}>{item.name}</Link>
                        <br />
                        <small className="text-muted">
                          {item.category_name} | {formatCurrency(item.daily_rate)}/den
                        </small>
                      </Col>
                      <Col xs={4} className="text-end">
                        <span className={`badge bg-${EQUIPMENT_STATUS[item.status].color}`}>
                          {EQUIPMENT_STATUS[item.status].label}
                        </span>
                        <br />
                        <small className="text-muted">
                          {formatDate(item.created_at)}
                        </small>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                ))
              ) : (
                <ListGroup.Item>Žádné vybavení nebylo nedávno přidáno.</ListGroup.Item>
              )}
            </ListGroup>
            <Card.Footer>
              <Button variant="outline-primary" as={Link} to="/equipment" size="sm">
                Zobrazit všechny
              </Button>
            </Card.Footer>
          </Card>
        </Col>
        
        <Col md={6} className="mb-3">
          <Card className="h-100">
            <Card.Header>Kategorie vybavení</Card.Header>
            <ListGroup variant="flush">
              {stats.categories.length > 0 ? (
                stats.categories.map(category => (
                  <ListGroup.Item key={category.id}>
                    <Row>
                      <Col>
                        <Link to={`/categories/${category.id}`}>{category.name}</Link>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                ))
              ) : (
                <ListGroup.Item>Žádné kategorie nebyly nalezeny.</ListGroup.Item>
              )}
            </ListGroup>
            <Card.Footer>
              <Button variant="outline-primary" as={Link} to="/categories" size="sm">
                Spravovat kategorie
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;