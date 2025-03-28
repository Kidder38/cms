import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Badge, 
  ListGroup, 
  Alert, 
  Table,
  Modal,
  Spinner,
  Tabs,
  Tab
} from 'react-bootstrap';
import { 
  Link, 
  useParams, 
  useNavigate 
} from 'react-router-dom';
import axios from 'axios';
import { 
  API_URL, 
  formatDate, 
  formatCurrency, 
  ORDER_STATUS, 
  RENTAL_STATUS 
} from '../../config';
import { useAuth } from '../../context/AuthContext';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaArrowLeft, 
  FaUndo,
  FaEye,
  FaFileAlt,
  FaReceipt,
  FaExchangeAlt
} from 'react-icons/fa';

import RentalReturnModal from './RentalReturnModal';
import AddRentalForm from './AddRentalForm';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Stavy pro data zakázky
  const [order, setOrder] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [returns, setReturns] = useState([]);
  const [billingData, setBillingData] = useState([]);
  
  // Nové stavy pro seskupené pohyby podle dávek
  const [issueBatches, setIssueBatches] = useState([]);
  const [returnBatches, setReturnBatches] = useState([]);

  // Stavy pro modální okna
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showAddRentalModal, setShowAddRentalModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);

  // Stavy pro zpracování
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Validace ID
  const validateId = useCallback(() => {
    // Kontrola, zda ID existuje a je číslo
    if (!id || isNaN(parseInt(id))) {
      setError('Neplatné ID zakázky. Prosím, zkuste se vrátit na seznam zakázek a vybrat platnou zakázku.');
      setLoading(false);
      return false;
    }
    return true;
  }, [id]);

  // Funkce pro seskupení výpůjček podle dávek
  const groupRentalsByBatch = useCallback((rentalsList) => {
    const batchMap = {};
    
    rentalsList.forEach(rental => {
      if (rental.batch_id) {
        if (!batchMap[rental.batch_id]) {
          batchMap[rental.batch_id] = {
            batch_id: rental.batch_id,
            date: rental.issue_date,
            rentals: [],
            status: 'issued'
          };
        }
        batchMap[rental.batch_id].rentals.push(rental);
      }
    });
    
    // Převedení mapy na pole a seřazení podle data (od nejnovějších)
    return Object.values(batchMap).sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
  }, []);
  
  // Funkce pro seskupení vratek podle dávek
  const groupReturnsByBatch = useCallback((returnsList) => {
    const batchMap = {};
    
    returnsList.forEach(returnItem => {
      if (returnItem.batch_id) {
        if (!batchMap[returnItem.batch_id]) {
          batchMap[returnItem.batch_id] = {
            batch_id: returnItem.batch_id,
            date: returnItem.return_date,
            returns: [],
            status: 'returned'
          };
        }
        batchMap[returnItem.batch_id].returns.push(returnItem);
      }
    });
    
    // Převedení mapy na pole a seřazení podle data (od nejnovějších)
    return Object.values(batchMap).sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
  }, []);

  // Načtení kompletních dat zakázky
  const fetchOrderDetails = useCallback(async () => {
    // Nejprve ověříme, zda je ID platné
    if (!validateId()) return;

    try {
      setLoading(true);
      
      // Získáme číselnou hodnotu ID
      const numericId = parseInt(id);
      
      // Paralelní načítání dat
      const [
        orderResponse, 
        rentalsResponse, 
        returnsResponse, 
        billingResponse
      ] = await Promise.all([
        axios.get(`${API_URL}/orders/${numericId}`),
        axios.get(`${API_URL}/orders/${numericId}/rentals`),
        axios.get(`${API_URL}/orders/${numericId}/returns`),
        axios.get(`${API_URL}/orders/${numericId}/billing-data`)
      ]);

      setOrder(orderResponse.data.order);
      setRentals(rentalsResponse.data.rentals);
      setReturns(returnsResponse.data.returns);
      setBillingData(billingResponse.data.billingData);
      
      // Seskupení výpůjček a vratek podle dávek
      setIssueBatches(groupRentalsByBatch(rentalsResponse.data.rentals));
      setReturnBatches(groupReturnsByBatch(returnsResponse.data.returns));
    } catch (error) {
      console.error('Chyba při načítání dat:', error);
      setError('Nepodařilo se načíst detail zakázky. ' + (error.response?.data?.message || ''));
    } finally {
      setLoading(false);
    }
  }, [id, validateId, groupRentalsByBatch, groupReturnsByBatch]);

  // Inicializace dat při načtení komponenty
  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Výpočet celkové ceny zakázky
  const calculateTotalPrice = () => {
    return rentals.reduce((total, rental) => {
      const days = rental.actual_return_date 
        ? Math.max(1, Math.ceil((new Date(rental.actual_return_date) - new Date(rental.issue_date)) / (1000 * 60 * 60 * 24)))
        : Math.max(1, Math.ceil((new Date() - new Date(rental.issue_date)) / (1000 * 60 * 60 * 24)));
      
      return total + (rental.daily_rate * (rental.quantity || 1) * days);
    }, 0);
  };

  // Smazání zakázky
  const handleDeleteOrder = async () => {
    if (!validateId()) return;
    if (!window.confirm('Opravdu chcete smazat tuto zakázku?')) return;

    try {
      const numericId = parseInt(id);
      await axios.delete(`${API_URL}/orders/${numericId}`);
      navigate('/orders');
    } catch (error) {
      console.error('Chyba při mazání zakázky:', error);
      alert(error.response?.data?.message || 'Chyba při mazání zakázky');
    }
  };

  // Renderování loading stavu
  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Načítání detailu zakázky...</p>
      </Container>
    );
  }

  // Renderování chyby
  if (error) {
    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
        <Button 
          variant="secondary" 
          onClick={() => navigate('/orders')}
        >
          Zpět na seznam zakázek
        </Button>
      </Container>
    );
  }

  // Pokud nemáme data zakázky, zobrazíme chybu
  if (!order) {
    return (
      <Container>
        <Alert variant="warning">
          Zakázka nebyla nalezena nebo nebylo možné načíst její detaily.
        </Alert>
        <Button 
          variant="secondary" 
          onClick={() => navigate('/orders')}
        >
          Zpět na seznam zakázek
        </Button>
      </Container>
    );
  }

  // Renderování detail zakázky
  return (
    <Container>
      {/* Hlavička sekce */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h1>Zakázka č. {order.order_number}</h1>
          <Badge 
            bg={ORDER_STATUS[order.status].color} 
            className="fs-6"
          >
            {ORDER_STATUS[order.status].label}
          </Badge>
        </Col>
        <Col className="text-end">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/orders')} 
            className="me-2"
          >
            <FaArrowLeft className="me-1" /> Zpět
          </Button>
          {user?.role === 'admin' && (
            <>
              <Button 
                variant="primary" 
                as={Link} 
                to={`/orders/edit/${id}`}
                className="me-2"
              >
                <FaEdit className="me-1" /> Upravit
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDeleteOrder}
              >
                <FaTrash className="me-1" /> Smazat
              </Button>
            </>
          )}
        </Col>
      </Row>

      {/* Záložky pro lepší organizaci obsahu */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="overview" title="Přehled">
          <Row>
            {/* Levý sloupec - základní informace */}
            <Col md={6}>
              <Card className="mb-3">
                <Card.Header>
                  <h5 className="mb-0">Základní informace</h5>
                </Card.Header>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong>Zákazník:</strong>{' '}
                    <Link to={`/customers/${order.customer_id}`}>
                      {order.customer_name}
                    </Link>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Datum vytvoření:</strong> {formatDate(order.creation_date)}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Předpokládaný konec:</strong>{' '}
                    {formatDate(order.estimated_end_date) || 'Neurčeno'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Celková cena:</strong>{' '}
                    {formatCurrency(calculateTotalPrice())}
                  </ListGroup.Item>
                </ListGroup>
              </Card>

              {/* Poznámky */}
              <Card className="mb-3">
                <Card.Header>
                  <h5 className="mb-0">Poznámky</h5>
                </Card.Header>
                <Card.Body>
                  {order.notes || 'Žádné poznámky'}
                </Card.Body>
              </Card>
            </Col>

            {/* Pravý sloupec - výpůjčky a akce */}
            <Col md={6}>
              {/* Sekce výpůjček */}
              <Card className="mb-3">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Výpůjčky</h5>
                  {user?.role === 'admin' && order.status !== 'completed' && (
                    <div>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => setShowAddRentalModal(true)}
                        className="me-2"
                      >
                        <FaPlus className="me-1" /> Přidat výpůjčku
                      </Button>
                      <Button 
                        variant="warning" 
                        size="sm"
                        as={Link}
                        to="/orders/batch-return"
                      >
                        <FaUndo className="me-1" /> Hromadná vratka
                      </Button>
                    </div>
                  )}
                </Card.Header>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Vybavení</th>
                      <th>Množství</th>
                      <th>Datum</th>
                      <th>Stav</th>
                      <th>Akce</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentals.length > 0 ? (
                      rentals.map(rental => (
                        <tr key={rental.id}>
                          <td>{rental.equipment_name}</td>
                          <td>{rental.quantity || 1} ks</td>
                          <td>{formatDate(rental.issue_date)}</td>
                          <td>
                            <Badge bg={RENTAL_STATUS[rental.status]?.color || 'secondary'}>
                              {RENTAL_STATUS[rental.status]?.label || rental.status}
                            </Badge>
                          </td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => {
                                setSelectedRental(rental);
                                setShowReturnModal(true);
                              }}
                              disabled={rental.status === 'returned'}
                            >
                              <FaUndo className="me-1" /> Vrátit
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center">Žádné výpůjčky</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card>

              {/* Dokumenty */}
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Dokumenty</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    <Button 
                      variant="outline-primary"
                      as={Link}
                      to={`/orders/${id}/delivery-note`}
                    >
                      <FaFileAlt className="me-2" /> Dodací list zakázky
                    </Button>
                    <Button 
                      variant="outline-success"
                      as={Link}
                      to={`/orders/${id}/billing-data`}
                    >
                      <FaReceipt className="me-2" /> Fakturační podklady
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* Nová záložka pro pohyby podle dávek */}
        <Tab eventKey="movements" title="Pohyby zboží">
          <Row>
            <Col md={12}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Výdeje zboží</h5>
                </Card.Header>
                <Card.Body>
                  {issueBatches.length > 0 ? (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Datum</th>
                          <th>Počet položek</th>
                          <th>ID dávky</th>
                          <th>Akce</th>
                        </tr>
                      </thead>
                      <tbody>
                        {issueBatches.map(batch => (
                          <tr key={batch.batch_id}>
                            <td>{formatDate(batch.date)}</td>
                            <td>{batch.rentals.length} položek ({batch.rentals.reduce((sum, r) => sum + (parseInt(r.quantity) || 1), 0)} ks)</td>
                            <td>
                              <span className="text-monospace">{batch.batch_id}</span>
                            </td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                as={Link}
                                to={`/orders/batch-rentals/${batch.batch_id}/delivery-note`}
                              >
                                <FaFileAlt className="me-1" /> Dodací list
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="info">
                      Žádné výdeje zboží pro tuto zakázku.
                    </Alert>
                  )}
                </Card.Body>
              </Card>

              <Card>
                <Card.Header>
                  <h5 className="mb-0">Vratky zboží</h5>
                </Card.Header>
                <Card.Body>
                  {returnBatches.length > 0 ? (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Datum</th>
                          <th>Počet položek</th>
                          <th>ID dávky</th>
                          <th>Akce</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnBatches.map(batch => (
                          <tr key={batch.batch_id}>
                            <td>{formatDate(batch.date)}</td>
                            <td>{batch.returns.length} položek ({batch.returns.reduce((sum, r) => sum + (parseInt(r.quantity) || 1), 0)} ks)</td>
                            <td>
                              <span className="text-monospace">{batch.batch_id}</span>
                            </td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                as={Link}
                                to={`/orders/batch-returns/${batch.batch_id}/delivery-note`}
                              >
                                <FaFileAlt className="me-1" /> Dodací list vratky
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="info">
                      Žádné vratky zboží pro tuto zakázku.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* Záložka pro faktury */}
        <Tab eventKey="billing" title="Fakturace">
          <Row>
            <Col md={12}>
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Fakturační podklady</h5>
                  <Button 
                    variant="primary" 
                    size="sm"
                    as={Link}
                    to={`/orders/${id}/billing-data`}
                  >
                    <FaPlus className="me-1" /> Vytvořit fakturační podklad
                  </Button>
                </Card.Header>
                <Card.Body>
                  {billingData && billingData.length > 0 ? (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Číslo faktury</th>
                          <th>Datum</th>
                          <th>Období od-do</th>
                          <th>Celková částka</th>
                          <th>Stav</th>
                          <th>Akce</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingData.map(billing => (
                          <tr key={billing.id}>
                            <td>{billing.invoice_number}</td>
                            <td>{formatDate(billing.billing_date)}</td>
                            <td>
                              {billing.billing_period_from && billing.billing_period_to ? (
                                `${formatDate(billing.billing_period_from)} - ${formatDate(billing.billing_period_to)}`
                              ) : (
                                <span className="text-muted">Neuvedeno</span>
                              )}
                            </td>
                            <td>{formatCurrency(billing.total_amount)}</td>
                            <td>
                              <Badge 
                                bg={
                                  billing.status === 'paid' ? 'success' :
                                  billing.status === 'created' ? 'secondary' :
                                  billing.status === 'sent' ? 'primary' :
                                  billing.status === 'overdue' ? 'danger' : 'warning'
                                }
                              >
                                {billing.status === 'paid' ? 'Zaplaceno' :
                                 billing.status === 'created' ? 'Vytvořeno' :
                                 billing.status === 'sent' ? 'Odesláno' :
                                 billing.status === 'overdue' ? 'Po splatnosti' : billing.status}
                              </Badge>
                            </td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                as={Link}
                                to={`/orders/${id}/billing-data/${billing.id}`}
                              >
                                <FaEye className="me-1" /> Detail
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="info">
                      Žádné fakturační podklady pro tuto zakázku.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* Záložka pro vratky */}
        <Tab eventKey="returns" title="Vratky">
          <Row>
            <Col md={12}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Vrácené položky</h5>
                </Card.Header>
                <Card.Body>
                  {returns.length > 0 ? (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Vybavení</th>
                          <th>Datum vrácení</th>
                          <th>Množství</th>
                          <th>Stav</th>
                          <th>Dodatečné poplatky</th>
                          <th>Akce</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returns.map(returnItem => (
                          <tr key={returnItem.id}>
                            <td>{returnItem.equipment_name}</td>
                            <td>{formatDate(returnItem.return_date)}</td>
                            <td>{returnItem.quantity || 1} ks</td>
                            <td>
                              <Badge 
                                bg={
                                  returnItem.condition === 'ok' ? 'success' :
                                  returnItem.condition === 'damaged' ? 'warning' :
                                  returnItem.condition === 'missing' ? 'danger' : 'secondary'
                                }
                              >
                                {returnItem.condition === 'ok' ? 'V pořádku' :
                                 returnItem.condition === 'damaged' ? 'Poškozeno' :
                                 returnItem.condition === 'missing' ? 'Chybí' : returnItem.condition}
                              </Badge>
                            </td>
                            <td>{formatCurrency(returnItem.additional_charges || 0)}</td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                as={Link}
                                to={`/orders/returns/${returnItem.id}`}
                              >
                                <FaEye className="me-1" /> Detail
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="info">
                      Žádné vrácené položky pro tuto zakázku.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>

      {/* Modální okna */}
      <RentalReturnModal
        show={showReturnModal}
        onHide={() => setShowReturnModal(false)}
        rental={selectedRental}
        onReturn={async (rentalId, returnData) => {
          try {
            // Ujistíme se, že ID zakázky je platné
            const numericId = parseInt(id);
            if (isNaN(numericId)) {
              throw new Error('Neplatné ID zakázky');
            }
            
            await axios.post(`${API_URL}/orders/${numericId}/rentals/${rentalId}/return`, returnData);
            fetchOrderDetails();
            setShowReturnModal(false);
            return returnData; // Vraťte returnData pro pozdější použití
          } catch (error) {
            console.error('Chyba při vracení:', error);
            throw error;
          }
        }}
      />

      <Modal 
        show={showAddRentalModal} 
        onHide={() => setShowAddRentalModal(false)}
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title>Přidat výpůjčku</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AddRentalForm 
            initialOrderId={parseInt(id)}
            onSuccess={() => {
              fetchOrderDetails();
              setShowAddRentalModal(false);
            }}
          />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default OrderDetail;