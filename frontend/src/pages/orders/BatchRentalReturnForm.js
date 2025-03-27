import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Table, 
  Alert,
  Modal 
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL, formatDate, formatCurrency } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { FaFileAlt, FaCheck, FaTimes } from 'react-icons/fa';

const BatchRentalReturnForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Stavy pro formulář
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [rentals, setRentals] = useState([]);
  const [selectedRentals, setSelectedRentals] = useState({});
  const [returnData, setReturnData] = useState({
    actual_return_date: new Date().toISOString().split('T')[0],
    condition: 'ok',
    damage_description: '',
    batch_id: `BATCH-RETURN-${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}-${Math.floor(Math.random() * 1000)}`
  });

  // Stavy pro zpracování
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [batchReturnResult, setBatchReturnResult] = useState(null);

  // Načtení seznamu zakázek s aktivními výpůjčkami
  useEffect(() => {
    const fetchOrdersWithRentals = async () => {
      try {
        const response = await axios.get(`${API_URL}/orders`);
        // Filtrování zakázek s aktivními výpůjčkami
        const ordersWithRentals = response.data.orders.filter(order => 
          order.status !== 'completed'
        );
        setOrders(ordersWithRentals);
      } catch (error) {
        console.error('Chyba při načítání zakázek:', error);
        setError('Nepodařilo se načíst zakázky. Zkuste to prosím později.');
      }
    };

    fetchOrdersWithRentals();
  }, []);

  // Načtení výpůjček pro vybranou zakázku
  useEffect(() => {
    const fetchRentalsForOrder = async () => {
      if (!selectedOrder) {
        setRentals([]);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/orders/${selectedOrder}/rentals`);
        // Filtrování aktivních výpůjček, které ještě nebyly vráceny
        const activeRentals = response.data.rentals.filter(
          rental => rental.status !== 'returned'
        );
        setRentals(activeRentals);
        
        // Inicializace vybraných výpůjček
        const initialSelectedRentals = {};
        activeRentals.forEach(rental => {
          initialSelectedRentals[rental.id] = {
            selected: false,
            quantity: rental.quantity || 1
          };
        });
        setSelectedRentals(initialSelectedRentals);
      } catch (error) {
        console.error('Chyba při načítání výpůjček:', error);
        setError('Nepodařilo se načíst výpůjčky. Zkuste to prosím později.');
      }
    };

    fetchRentalsForOrder();
  }, [selectedOrder]);

  // Změna stavu vybrané výpůjčky
  const toggleRentalSelection = (rentalId) => {
    setSelectedRentals(prev => ({
      ...prev,
      [rentalId]: {
        ...prev[rentalId],
        selected: !prev[rentalId].selected
      }
    }));
  };

  // Změna množství pro vybranou výpůjčku
  const handleQuantityChange = (rentalId, quantity) => {
    setSelectedRentals(prev => ({
      ...prev,
      [rentalId]: {
        ...prev[rentalId],
        quantity: Math.min(
          Math.max(1, parseInt(quantity) || 1), 
          rentals.find(r => r.id === rentalId).quantity
        )
      }
    }));
  };

  // Zpracování změn ve formuláři vratky
  const handleReturnDataChange = (e) => {
    const { name, value } = e.target;
    setReturnData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validace formuláře
  const validateForm = () => {
    // Kontrola, zda je vybrána alespoň jedna výpůjčka
    const hasSelectedRentals = Object.values(selectedRentals)
      .some(rental => rental.selected);
    
    if (!hasSelectedRentals) {
      setError('Musíte vybrat alespoň jednu výpůjčku k vrácení.');
      return false;
    }

    // Kontrola popisu poškození, pokud není stav "ok"
    if (returnData.condition !== 'ok' && !returnData.damage_description.trim()) {
      setError('Pro poškozenou výpůjčku musíte popsat poškození.');
      return false;
    }

    return true;
  };

  // Odeslání hromadné vratky
  const handleBatchReturn = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Příprava hromadné vratky
      const batchReturns = [];

      for (const [rentalId, rentalData] of Object.entries(selectedRentals)) {
        if (rentalData.selected) {
          batchReturns.push({
            rental_id: rentalId,
            return_quantity: rentalData.quantity,
            ...returnData
          });
        }
      }

      // Hromadné volání API pro vrácení
      const returns = [];
      for (const returnItem of batchReturns) {
        const response = await axios.post(
          `/orders/${selectedOrder}/rentals/${returnItem.rental_id}/return`, 
          returnItem
        );
        returns.push(response.data);
      }

      // Úspěšná hromadná vratka
      setBatchReturnResult({
        success: returns.length,
        batchId: returnData.batch_id
      });
    } catch (error) {
      console.error('Chyba při hromadné vratce:', error);
      setError(error.response?.data?.message || 'Chyba při zpracování hromadné vratky.');
    } finally {
      setLoading(false);
    }
  };

  // Renderování formuláře
  return (
    <Container>
      <h1 className="mb-4">Hromadná vratka vybavení</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      {batchReturnResult ? (
        <Card>
          <Card.Body>
            <Alert variant="success">
              <h4>Hromadná vratka byla úspěšně zpracována</h4>
              <p>Počet vrácených položek: {batchReturnResult.success}</p>
              <div className="mt-3">
                <Button 
                  as={Link} 
                  to={`/orders/batch-returns/${batchReturnResult.batchId}/delivery-note`} 
                  variant="primary"
                  className="me-2"
                >
                  <FaFileAlt className="me-2" /> Zobrazit dodací list vratek
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setBatchReturnResult(null);
                    setSelectedOrder('');
                  }}
                >
                  Zpět na formulář
                </Button>
              </div>
            </Alert>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body>
            <Form>
              {/* Výběr zakázky */}
              <Row className="mb-3">
                <Col>
                  <Form.Group>
                    <Form.Label>Vyberte zakázku *</Form.Label>
                    <Form.Select
                      value={selectedOrder}
                      onChange={(e) => setSelectedOrder(e.target.value)}
                      disabled={loading}
                    >
                      <option value="">Vyberte zakázku</option>
                      {orders.map(order => (
                        <option key={order.id} value={order.id}>
                          {order.order_number} - {order.customer_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {/* Seznam výpůjček */}
              {selectedOrder && (
                <>
                  <h4>Seznam aktivních výpůjček</h4>
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Vybrat</th>
                        <th>Vybavení</th>
                        <th>Inventární č.</th>
                        <th>Datum vypůjčení</th>
                        <th>Plánované vrácení</th>
                        <th>Množství</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rentals.map(rental => (
                        <tr key={rental.id}>
                          <td className="text-center">
                            <Form.Check
                              type="checkbox"
                              checked={selectedRentals[rental.id]?.selected || false}
                              onChange={() => toggleRentalSelection(rental.id)}
                            />
                          </td>
                          <td>{rental.equipment_name}</td>
                          <td>{rental.inventory_number}</td>
                          <td>{formatDate(rental.issue_date)}</td>
                          <td>{formatDate(rental.planned_return_date)}</td>
                          <td>
                            {selectedRentals[rental.id]?.selected ? (
                              <Form.Control
                                type="number"
                                min="1"
                                max={rental.quantity}
                                value={selectedRentals[rental.id].quantity}
                                onChange={(e) => handleQuantityChange(rental.id, e.target.value)}
                              />
                            ) : (
                              `${rental.quantity} ks`
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {/* Hromadné parametry vratky */}
                  <Card className="mb-3">
                    <Card.Header>Parametry hromadné vratky</Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Datum vrácení *</Form.Label>
                            <Form.Control
                              type="date"
                              name="actual_return_date"
                              value={returnData.actual_return_date}
                              onChange={handleReturnDataChange}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Stav *</Form.Label>
                            <Form.Select
                              name="condition"
                              value={returnData.condition}
                              onChange={handleReturnDataChange}
                            >
                              <option value="ok">V pořádku</option>
                              <option value="damaged">Poškozeno</option>
                              <option value="missing">Chybí</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Dodatečné poplatky</Form.Label>
                            <Form.Control
                              type="number"
                              name="additional_charges"
                              min="0"
                              step="0.01"
                              onChange={handleReturnDataChange}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      {returnData.condition !== 'ok' && (
                        <Row>
                          <Col>
                            <Form.Group className="mb-3">
                              <Form.Label>Popis poškození *</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={3}
                                name="damage_description"
                                value={returnData.damage_description}
                                onChange={handleReturnDataChange}
                                required
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      )}
                    </Card.Body>
                  </Card>

                  {/* Tlačítka akce */}
                  <div className="d-flex justify-content-end gap-2">
                    <Button 
                      variant="secondary" 
                      onClick={() => setSelectedOrder('')}
                      disabled={loading}
                    >
                      <FaTimes className="me-2" /> Zrušit
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={handleBatchReturn}
                      disabled={loading}
                    >
                      <FaCheck className="me-2" /> 
                      {loading ? 'Zpracování...' : 'Potvrdit hromadnou vratku'}
                    </Button>
                  </div>
                </>
              )}
            </Form>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default BatchRentalReturnForm;