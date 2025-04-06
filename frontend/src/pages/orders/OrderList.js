import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, InputGroup, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from '../../axios-config';
import { formatDate, ORDER_STATUS } from '../../config';
import { useAuth } from '../../context/AuthContext';

const OrderList = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`/api/orders`);
        setOrders(response.data.orders);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání zakázek:', error);
        setError('Nepodařilo se načíst zakázky. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);
  
  // Filtrované zakázky podle vyhledávání a stavu
  const filteredOrders = orders?.filter(order => {
    if (!order) return false;
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(search.toLowerCase()));
    
    const matchesFilter = filter === 'all' || order.status === filter;
    
    return matchesSearch && matchesFilter;
  }) || [];
  
  if (loading) {
    return (
      <Container>
        <Alert variant="info">Načítání zakázek...</Alert>
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
  
  return (
    <Container>
      <h1 className="mb-4">Zakázky</h1>
      
      <Row className="mb-4">
        <Col md={4}>
          <InputGroup>
            <Form.Control
              placeholder="Hledat podle čísla nebo zákazníka"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <Button 
                variant="outline-secondary"
                onClick={() => setSearch('')}
              >
                ×
              </Button>
            )}
          </InputGroup>
        </Col>
        
        <Col md={4}>
          <Form.Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Všechny stavy</option>
            <option value="created">Vytvořené</option>
            <option value="active">Aktivní</option>
            <option value="completed">Dokončené</option>
            <option value="cancelled">Zrušené</option>
          </Form.Select>
        </Col>
        
        {user?.role === 'admin' && (
          <Col md={4} className="d-flex justify-content-end">
            <div className="d-flex gap-2">
              <Button as={Link} to="/orders/new" variant="primary">
                Přidat zakázku
              </Button>
              <Button as={Link} to="/orders/new-form" variant="success">
                Nový formulář
              </Button>
            </div>
          </Col>
        )}
      </Row>
      
      <Card>
        <Card.Body>
          {filteredOrders.length === 0 ? (
            <Alert variant="info">
              Žádné zakázky nebyly nalezeny.
            </Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Číslo zakázky</th>
                  <th>Název zakázky</th>
                  <th>Zákazník</th>
                  <th>Datum vytvoření</th>
                  <th>Předpokládaný konec</th>
                  <th>Stav</th>
                  <th>Akce</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td>{order.order_number}</td>
                    <td>{order.name}</td>
                    <td>{order.customer_name}</td>
                    <td>{formatDate(order.creation_date)}</td>
                    <td>{formatDate(order.estimated_end_date) || '-'}</td>
                    <td>
                      <span className={`badge bg-${ORDER_STATUS[order.status].color}`}>
                        {ORDER_STATUS[order.status].label}
                      </span>
                    </td>
                    <td>
                      <Button 
                        as={Link} 
                        to={`/orders/${order.id}`} 
                        variant="outline-primary" 
                        size="sm"
                        className="me-1"
                      >
                        Detail
                      </Button>
                      
                      {user?.role === 'admin' && (
                        <>
                          <Button 
                            as={Link} 
                            to={`/orders/edit/${order.id}`} 
                            variant="outline-secondary" 
                            size="sm"
                            className="me-1"
                          >
                            Upravit
                          </Button>
                          <Button 
                            as={Link} 
                            to={`/orders/edit-new/${order.id}`} 
                            variant="outline-success" 
                            size="sm"
                          >
                            Nový editor
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OrderList;