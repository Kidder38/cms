import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Alert, Table } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from '../../axios-config';
import { formatCurrency, formatDate, ORDER_STATUS } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { FaEye, FaFileAlt, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all'); // 'all', 'active', 'completed'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // První useEffect - načítání dat
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoading(false);
        setError('Pro zobrazení detailů zákazníka je nutné být přihlášen.');
        return;
      }

      try {
        // Načtení dat zákazníka a jeho zakázek paralelně
        const [customerResponse, ordersResponse] = await Promise.all([
          axios.get(`/customers/${id}`),
          axios.get(`/customers/${id}/orders`)
        ]);
        
        setCustomer(customerResponse.data.customer);
        const orders = ordersResponse.data.orders || [];
        setCustomerOrders(orders);
        setFilteredOrders(orders);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání dat:', error);
        if (error.response?.status === 401) {
          setError('Pro zobrazení detailů zákazníka je nutné být přihlášen.');
        } else {
          setError(error.response?.data?.message || 'Nepodařilo se načíst data. Zkuste to prosím později.');
        }
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, token]);
  
  // Druhý useEffect - filtrování zakázek
  useEffect(() => {
    if (orderFilter === 'all') {
      setFilteredOrders(customerOrders || []);
    } else {
      setFilteredOrders(customerOrders?.filter(order => order.status === orderFilter) || []);
    }
  }, [orderFilter, customerOrders]);
  
  const handleDelete = async () => {
    if (!window.confirm('Opravdu chcete smazat tohoto zákazníka?')) {
      return;
    }
    
    try {
      await axios.delete(`/customers/${id}`);
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
  const activeRentals = customerOrders?.reduce(
    (total, order) => total + parseInt(order.active_rentals || 0), 0
  ) || 0;
  
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
          
          <Button
            as={Link}
            to={`/orders/new?customer=${id}`}
            variant="success"
            className="me-2"
          >
            <FaFileAlt className="me-1" /> Nová zakázka
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
          
          {/* Přehled zakázek zákazníka */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Souhrn aktivit</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4} className="text-center mb-3 mb-md-0">
                  <h4>{customerOrders?.length || 0}</h4>
                  <div className="text-muted">Celkem zakázek</div>
                </Col>
                <Col md={4} className="text-center mb-3 mb-md-0">
                  <h4>{customerOrders?.filter(order => order.status === 'active').length || 0}</h4>
                  <div className="text-muted">Aktivních zakázek</div>
                </Col>
                <Col md={4} className="text-center">
                  <h4 className={activeRentals > 10 ? 'text-warning' : ''}>
                    {activeRentals}
                    {activeRentals > 10 && <FaExclamationTriangle className="ms-2" title="Vysoký počet aktivních výpůjček" />}
                  </h4>
                  <div className="text-muted">Aktivních výpůjček</div>
                </Col>
              </Row>
              
              {activeRentals > 10 && (
                <Alert variant="warning" className="mt-3 mb-0">
                  <FaExclamationTriangle className="me-2" />
                  Zákazník má vysoký počet aktivních výpůjček. Zvažte kontrolu stavu zakázek.
                </Alert>
              )}
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Přehled aktivit</h5>
              <div className="btn-group">
                <Button 
                  variant={orderFilter === 'all' ? 'primary' : 'outline-primary'} 
                  size="sm"
                  onClick={() => setOrderFilter('all')}
                >
                  Všechny
                </Button>
                <Button 
                  variant={orderFilter === 'active' ? 'primary' : 'outline-primary'} 
                  size="sm"
                  onClick={() => setOrderFilter('active')}
                >
                  Aktivní
                </Button>
                <Button 
                  variant={orderFilter === 'completed' ? 'primary' : 'outline-primary'} 
                  size="sm"
                  onClick={() => setOrderFilter('completed')}
                >
                  Dokončené
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {customerOrders.length === 0 ? (
                <div>
                  <Alert variant="info" className="mb-3">
                    <FaInfoCircle className="me-2" />
                    Zákazník zatím nemá žádné zakázky.
                  </Alert>
                  <div className="text-center">
                    <Button
                      as={Link}
                      to={`/orders/new?customer=${id}`}
                      variant="success"
                    >
                      <FaFileAlt className="me-1" /> Vytvořit první zakázku
                    </Button>
                  </div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <Alert variant="info">
                  <FaInfoCircle className="me-2" />
                  Žádné zakázky neodpovídají vybranému filtru.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Číslo zakázky</th>
                        <th>Název</th>
                        <th>Vytvořeno</th>
                        <th>Stav</th>
                        <th>Aktivní položky</th>
                        <th>Akce</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(order => (
                        <tr key={order.id}>
                          <td>{order.order_number}</td>
                          <td>{order.name}</td>
                          <td>{formatDate(order.creation_date)}</td>
                          <td>
                            <Badge bg={ORDER_STATUS[order.status]?.color || 'secondary'}>
                              {ORDER_STATUS[order.status]?.label || order.status}
                            </Badge>
                          </td>
                          <td>
                            {parseInt(order.active_rentals) > 0 ? (
                              <Badge bg="warning" pill>
                                {order.active_rentals}
                              </Badge>
                            ) : (
                              <Badge bg="success" pill>
                                0
                              </Badge>
                            )}
                          </td>
                          <td>
                            <Button 
                              as={Link} 
                              to={`/orders/${order.id}`} 
                              variant="outline-primary" 
                              size="sm"
                              title="Zobrazit detail zakázky"
                            >
                              <FaEye /> 
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CustomerDetail;