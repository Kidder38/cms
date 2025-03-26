import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Alert, Table } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaFileInvoiceDollar, FaFileAlt, FaPlus, FaEdit, FaTrash, FaArrowLeft, FaUndo } from 'react-icons/fa';
import axios from 'axios';
import { API_URL, formatDate, formatCurrency, ORDER_STATUS, RENTAL_STATUS } from '../../config';
import { useAuth } from '../../context/AuthContext';
import RentalReturnModal from './RentalReturnModal';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Stav pro modální okno vrácení výpůjčky
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  
  // Stav pro získání informací o fakturačních podkladech
  const [billingData, setBillingData] = useState([]);
  const [loadingBillingData, setLoadingBillingData] = useState(false);
  
  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/orders/${id}`);
      setOrder(response.data.order);
      setRentals(response.data.rentals);
      setLoading(false);
      
      // Také načteme fakturační podklady
      fetchBillingData();
    } catch (error) {
      console.error('Chyba při načítání dat:', error);
      setError('Nepodařilo se načíst data. Zkuste to prosím později.');
      setLoading(false);
    }
  };
  
  // Načtení fakturačních podkladů
  const fetchBillingData = async () => {
    try {
      setLoadingBillingData(true);
      const response = await axios.get(`${API_URL}/orders/${id}/billing-data`);
      setBillingData(response.data.billingData || []);
      setLoadingBillingData(false);
    } catch (error) {
      console.error('Chyba při načítání fakturačních podkladů:', error);
      // Není kritická chyba, jen zobrazíme prázdný seznam
      setBillingData([]);
      setLoadingBillingData(false);
    }
  };
  
  useEffect(() => {
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
  
  // Otevření modálního okna pro vrácení výpůjčky
  const handleReturnClick = (rental) => {
    setSelectedRental(rental);
    setShowReturnModal(true);
  };
  
  // Zpracování vrácení výpůjčky
  const handleReturnRental = async (rentalId, returnData) => {
    try {
      const response = await axios.post(`${API_URL}/orders/${id}/rentals/${rentalId}/return`, returnData);
      
      // Aktualizace dat po úspěšném vrácení
      fetchOrderDetail();
      
      return response.data; // Vracíme data odpovědi pro získání ID vratky
    } catch (error) {
      console.error('Chyba při vracení výpůjčky:', error);
      throw error;
    }
  };
  
  // Výpočet celkové ceny zakázky
  const calculateTotalPrice = () => {
    if (!rentals || rentals.length === 0) return 0;
    
    return rentals.reduce((total, rental) => {
      // Počet dní výpůjčky
      let days = 1; // Minimálně 1 den
      
      if (rental.actual_return_date && rental.issue_date) {
        // Pokud je výpůjčka vrácena, použijeme skutečnou délku
        const issueDate = new Date(rental.issue_date);
        const returnDate = new Date(rental.actual_return_date);
        days = Math.ceil((returnDate - issueDate) / (1000 * 60 * 60 * 24));
      } else if (rental.planned_return_date && rental.issue_date) {
        // Jinak použijeme plánovanou délku
        const issueDate = new Date(rental.issue_date);
        const returnDate = new Date(rental.planned_return_date);
        days = Math.ceil((returnDate - issueDate) / (1000 * 60 * 60 * 24));
      }
      
      // Zajistíme, že počet dní je alespoň 1
      days = Math.max(1, days);
      
      // Výpočet ceny za výpůjčku (denní sazba * počet dní * množství)
      const quantity = rental.quantity || 1;
      const dailyRate = parseFloat(rental.daily_rate) || 0;
      return total + (days * dailyRate * quantity);
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
            <FaArrowLeft className="me-1" /> Zpět na seznam
          </Button>
          
          {user?.role === 'admin' && (
            <>
              <Button 
                as={Link} 
                to={`/orders/edit/${id}`} 
                variant="primary" 
                className="me-2"
              >
                <FaEdit className="me-1" /> Upravit
              </Button>
              
              <Button 
                variant="danger" 
                onClick={handleDelete}
              >
                <FaTrash className="me-1" /> Smazat
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
                <strong>Celková cena:</strong> {formatCurrency(calculateTotalPrice())}
              </ListGroup.Item>
            </ListGroup>
          </Card>
          
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Dokumenty</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button
                  variant="outline-primary"
                  as={Link}
                  to={`/orders/${id}/delivery-note`}
                >
                  <FaFileAlt className="me-2" /> Generovat dodací list
                </Button>
                
                <Button
                  variant="outline-success"
                  as={Link}
                  to={`/orders/${id}/billing-data`}
                >
                  <FaFileInvoiceDollar className="me-2" /> Generovat podklad pro fakturaci
                </Button>
              </div>
              
              {billingData.length > 0 && (
                <div className="mt-3">
                  <h6>Existující fakturační podklady:</h6>
                  <ListGroup>
                    {billingData.map(item => (
                      <ListGroup.Item key={item.id} action as={Link} to={`/orders/${id}/billing-data/${item.id}`}>
                        {item.invoice_number} ({formatDate(item.billing_date)}) - {formatCurrency(item.total_amount)}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              )}
            </Card.Body>
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
              {user?.role === 'admin' && order.status !== 'completed' && (
                <Button 
                  as={Link} 
                  to={`/orders/${id}/add-rental`} 
                  variant="primary" 
                  size="sm"
                >
                  <FaPlus className="me-1" /> Přidat výpůjčku
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
                      <th>Množství</th>
                      <th>Vydáno</th>
                      <th>Plánované vrácení</th>
                      <th>Stav</th>
                      <th>Akce</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentals.map(rental => (
                      <tr key={rental.id}>
                        <td>{rental.equipment_name}</td>
                        <td>{rental.quantity || 1} ks</td>
                        <td>{formatDate(rental.issue_date) || '-'}</td>
                        <td>{formatDate(rental.planned_return_date) || '-'}</td>
                        <td>
                          <Badge bg={RENTAL_STATUS[rental.status].color}>
                            {RENTAL_STATUS[rental.status].label}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            {/* Tlačítko pro dodací list výpůjčky */}
                            <Button
                              as={Link}
                              to={`/rentals/${rental.id}/delivery-note`}
                              variant="outline-info"
                              size="sm"
                              title="Dodací list výpůjčky"
                            >
                              <FaFileAlt />
                            </Button>
                            
                            {/* Tlačítko pro vrácení výpůjčky */}
                            {user?.role === 'admin' && rental.status !== 'returned' && order.status !== 'completed' && (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleReturnClick(rental)}
                                title="Vrátit výpůjčku"
                              >
                                <FaUndo />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Modální okno pro vrácení výpůjčky */}
      <RentalReturnModal
        show={showReturnModal}
        onHide={() => setShowReturnModal(false)}
        rental={selectedRental}
        onReturn={handleReturnRental}
      />
    </Container>
  );
};

export default OrderDetail;