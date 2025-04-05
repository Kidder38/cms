import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from '../../axios-config';
import { formatDate, formatCurrency, EQUIPMENT_STATUS } from '../../config';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
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
    // Počkej, až se načte autentizace
    if (authLoading) {
      return;
    }
    
    // Pokud uživatel není přihlášený, nenačítej data
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    const fetchDashboardData = async () => {
      try {
        // Načtení základních dat pro dashboard (všichni uživatelé)
        const customersResponse = await axios.get(`/api/customers`);
        const ordersResponse = await axios.get(`/api/orders`);
        
        // Zpracování dat pro statistiky
        const customersData = customersResponse.data.customers || [];
        const ordersData = ordersResponse.data.orders || [];
        
        // Data pro základní statistiky (všichni uživatelé)
        let statsData = {
          equipment: {
            total: 0,
            available: 0,
            borrowed: 0,
            maintenance: 0
          },
          categories: [],
          recentlyAdded: [],
          customers: customersData.length,
          orders: ordersData.length,
          activeOrders: ordersData.filter(order => order.status === 'active').length
        };
        
        // Pokud je uživatel admin, načti i data o vybavení
        if (user?.role === 'admin') {
          try {
            const equipmentResponse = await axios.get(`/api/equipment`);
            const categoriesResponse = await axios.get(`/api/categories`);
            
            const equipmentData = equipmentResponse.data.equipment || [];
            
            const availableCount = equipmentData.filter(item => item.status === 'available').length;
            const borrowedCount = equipmentData.filter(item => item.status === 'borrowed').length;
            const maintenanceCount = equipmentData.filter(item => item.status === 'maintenance').length;
            
            // Seřazení podle datumu přidání (od nejnovějších)
            const recentlyAdded = [...equipmentData]
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .slice(0, 5);
              
            // Aktualizace dat pro statistiky (pouze admin)
            statsData = {
              ...statsData,
              equipment: {
                total: equipmentData.length,
                available: availableCount,
                borrowed: borrowedCount,
                maintenance: maintenanceCount
              },
              categories: categoriesResponse.data.categories || [],
              recentlyAdded
            };
          } catch (equipmentError) {
            console.error('Chyba při načítání dat o vybavení:', equipmentError);
            // Pokračuj s běžnými daty - chyba vybavení nezastaví dashboard
          }
        }
        
        // Nastavení dat pro dashboard
        setStats(statsData);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání dat pro dashboard:', error);
        setError('Nepodařilo se načíst data pro dashboard. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user, isAuthenticated, authLoading]);
  
  if (authLoading || loading) {
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
  
  // Pokud uživatel není přihlášený, nenačítej dashboard
  if (!isAuthenticated) {
    return (
      <Container>
        <Row className="justify-content-center">
          <Col>
            <Alert variant="warning">Pro zobrazení dashboardu se musíte přihlásit.</Alert>
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
          <h1 className="fw-bold">Přehled</h1>
          <p className="text-muted">Vítejte, {user?.first_name || user?.username}! Zde jsou přehledné informace o půjčovně.</p>
        </Col>
      </Row>
      
      {user?.role === 'admin' && (
        <Row className="mb-4">
          <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 dashboard-card shadow-sm">
              <Card.Body className="text-center">
                <Card.Title className="fw-bold">Celkem vybavení</Card.Title>
                <h2 className="my-3 fw-bold">{stats.equipment.total}</h2>
                <p className="text-muted mb-3">Položek evidováno</p>
                <Button variant="outline-primary" as={Link} to="/equipment" className="w-100">
                  Zobrazit všechny
                </Button>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 dashboard-card shadow-sm">
              <Card.Body className="text-center">
                <Card.Title className="fw-bold text-success">Dostupné</Card.Title>
                <h2 className="my-3 fw-bold text-success">{stats.equipment.available}</h2>
                <p className="text-muted mb-3">{Math.round((stats.equipment.available / stats.equipment.total) * 100) || 0}% z celkového počtu</p>
                <Button variant="outline-success" as={Link} to="/equipment" className="w-100">
                  Zobrazit dostupné
                </Button>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 dashboard-card shadow-sm">
              <Card.Body className="text-center">
                <Card.Title className="fw-bold text-warning">Vypůjčené</Card.Title>
                <h2 className="my-3 fw-bold text-warning">{stats.equipment.borrowed}</h2>
                <p className="text-muted mb-3">{Math.round((stats.equipment.borrowed / stats.equipment.total) * 100) || 0}% z celkového počtu</p>
                <Button variant="outline-warning" as={Link} to="/equipment" className="w-100">
                  Zobrazit vypůjčené
                </Button>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 dashboard-card shadow-sm">
              <Card.Body className="text-center">
                <Card.Title className="fw-bold text-info">V servisu</Card.Title>
                <h2 className="my-3 fw-bold text-info">{stats.equipment.maintenance}</h2>
                <p className="text-muted mb-3">{Math.round((stats.equipment.maintenance / stats.equipment.total) * 100) || 0}% z celkového počtu</p>
                <Button variant="outline-info" as={Link} to="/equipment" className="w-100">
                  Zobrazit vše
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="h-100 dashboard-card shadow-sm">
            <Card.Body className="text-center">
              <Card.Title className="fw-bold text-primary">Počet zákazníků</Card.Title>
              <h2 className="my-3 fw-bold">{stats.customers || 0}</h2>
              <p className="text-muted mb-3">Registrovaných v systému</p>
              <Button variant="outline-primary" as={Link} to="/customers" className="w-100">
                Zobrazit zákazníky
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-3">
          <Card className="h-100 dashboard-card shadow-sm">
            <Card.Body className="text-center">
              <Card.Title className="fw-bold text-success">Celkem zakázek</Card.Title>
              <h2 className="my-3 fw-bold">{stats.orders || 0}</h2>
              <p className="text-muted mb-3">Všech zakázek v systému</p>
              <Button variant="outline-success" as={Link} to="/orders" className="w-100">
                Zobrazit zakázky
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-3">
          <Card className="h-100 dashboard-card shadow-sm">
            <Card.Body className="text-center">
              <Card.Title className="fw-bold text-warning">Aktivní zakázky</Card.Title>
              <h2 className="my-3 fw-bold">{stats.activeOrders || 0}</h2>
              <p className="text-muted mb-3">{stats.orders ? Math.round((stats.activeOrders / stats.orders) * 100) : 0}% z celkového počtu</p>
              <Button variant="outline-warning" as={Link} to="/orders" className="w-100">
                Zobrazit aktivní
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {user?.role === 'admin' && (
        <Row>
          <Col md={6} className="mb-3">
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0 fw-bold">Nedávno přidané vybavení</h5>
              </Card.Header>
              <ListGroup variant="flush">
                {stats.recentlyAdded && stats.recentlyAdded.length > 0 ? (
                  stats.recentlyAdded.map(item => (
                    <ListGroup.Item key={item.id} className="py-3">
                      <Row>
                        <Col xs={8}>
                          <Link to={`/equipment/${item.id}`} className="text-decoration-none fw-semibold">{item.name}</Link>
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
                  <ListGroup.Item className="py-3 text-center text-muted">Žádné vybavení nebylo nedávno přidáno.</ListGroup.Item>
                )}
              </ListGroup>
              <Card.Footer className="bg-white border-top">
                <Button variant="outline-primary" as={Link} to="/equipment" className="w-100">
                  Zobrazit všechny
                </Button>
              </Card.Footer>
            </Card>
          </Col>
          
          <Col md={6} className="mb-3">
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0 fw-bold">Kategorie vybavení</h5>
              </Card.Header>
              <ListGroup variant="flush">
                {stats.categories && stats.categories.length > 0 ? (
                  stats.categories.map(category => (
                    <ListGroup.Item key={category.id} className="py-3">
                      <Row>
                        <Col>
                          <Link to={`/categories/${category.id}`} className="text-decoration-none fw-semibold">{category.name}</Link>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item className="py-3 text-center text-muted">Žádné kategorie nebyly nalezeny.</ListGroup.Item>
                )}
              </ListGroup>
              <Card.Footer className="bg-white border-top">
                <Button variant="outline-primary" as={Link} to="/categories" className="w-100">
                  Spravovat kategorie
                </Button>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Dashboard;