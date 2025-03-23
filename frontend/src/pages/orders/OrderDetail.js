import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Alert, Table } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL, formatDate, formatCurrency, ORDER_STATUS, RENTAL_STATUS } from '../../config';
import { useAuth } from '../../context/AuthContext';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const response = await axios.get(`${API_URL}/orders/${id}`);
        setOrder(response.data.order);
        setRentals(response.data.rentals);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání dat:', error);
        setError('Nepodařilo se načíst data. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchOrderDetail();
  }, [id]);
  
  const handleDelete = async () => {
    if (!window.confirm('Opravdu chcete smazat tuto zakázku?')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/orders/${id}`);
      alert('Zakázka byla úspěšně smazána.');
      navigate('/orders');
    } catch (error) {
      console.error('Chyba při mazání zakázky:', error);
      alert(error.response?.data?.message || 'Chyba při mazání zakázky.');
    }
  };
  
  // Výpočet celkové ceny zakázky
  const calculateTotalPrice = () => {
    if (!rentals || rentals.length === 0) return 0;
    
    return rentals.reduce((total, rental) => {
      // Pokud je naplánované datum vrácení, vypočítáme cenu podle dnů
      if (rental.planned_return_date && rental.issue_date) {
        const issueDate = new Date(rental.issue_date);
        const returnDate = new Date(rental.planned_return_date);
        const days = Math.ceil((returnDate - issueDate) / (1000 * 60 * 60 * 24));
        return total + (days * rental.daily_rate);
      }
      // Jinak použijeme pouze denní sazbu
      return total + rental.daily_rate;
    }, 0);
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
  
  if (!order) {
    return (
      <Container>
        <Alert variant="warning">Zakázka nebyla nalezena.</Alert>
      </Container>
    );
  }
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Detail zakázky #{order.order_number}</h1>
        </Col>
        <Col xs="auto">
          <Button 
            as={Link} 
            to="/orders" 
            variant="outline-secondary" 
            className="me-2"
          >
            Zpět na seznam
          </Button>
          
          {user?.role === 'admin' && (
            <>
              <Button 
                as={Link} 
                to={`/orders/edit/${id}`} 
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
                <strong>Číslo zakázky:</strong> {order.order_number}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Stav:</strong>{' '}
                <Badge bg={ORDER_STATUS[order.status].color}>
                  {ORDER_STATUS[order.status].label}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Zákazník:</strong> {order.customer_name}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Kontakt:</strong> {order.customer_email || '-'} | {order.customer_phone || '-'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Datum vytvoření:</strong> {formatDate(order.creation_date)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Předpokládaný konec:</strong> {formatDate(order.estimated_end_date) || 'Neurčeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Celková odhadovaná cena:</strong> {formatCurrency(calculateTotalPrice())}
              </ListGroup.Item>
            </ListGroup>
          </Card>
          
          <Card>
            <Card.Header>
              <h5 className="mb-0">Poznámky</h5>
            </Card.Header>
            <Card.Body>
              {order.notes || 'Žádné poznámky.'}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Vypůjčené vybavení</h5>
              {user?.role === 'admin' && (
                <Button 
                  as={Link} 
                  to={`/orders/${id}/add-rental`} 
                  variant="primary" 
                  size="sm"
                >
                  Přidat výpůjčku
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              {rentals.length === 0 ? (
                <Alert variant="info">
                  Zakázka zatím neobsahuje žádné výpůjčky.
                </Alert>
              ) : (
                <Table responsive hover size="sm">
                  <thead>
                    <tr>
                      <th>Vybavení</th>
                      <th>Vydáno</th>
                      <th>Plánované vrácení</th>
                      <th>Stav</th>
                      <th>Denní sazba</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentals.map(rental => (
                      <tr key={rental.id}>
                        <td>{rental.equipment_name}</td>
                        <td>{formatDate(rental.issue_date) || '-'}</td>
                        <td>{formatDate(rental.planned_return_date) || '-'}</td>
                        <td>
                          <Badge bg={RENTAL_STATUS[rental.status].color}>
                            {RENTAL_STATUS[rental.status].label}
                          </Badge>
                        </td>
                        <td>{formatCurrency(rental.daily_rate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderDetail;