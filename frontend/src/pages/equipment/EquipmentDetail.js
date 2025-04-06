import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Alert, Modal, Form } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from '../../axios-config';
import { formatCurrency, formatDate, EQUIPMENT_STATUS } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { FaTrash, FaExchangeAlt, FaArrowAltCircleDown, FaBarcode, FaTimesCircle } from 'react-icons/fa';

const EquipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modální okna pro různé akce
  const [showSellModal, setShowSellModal] = useState(false);
  const [showWriteOffModal, setShowWriteOffModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  // Formulářové údaje pro různé akce
  const [sellForm, setSellForm] = useState({
    quantity: 1,
    unit_price: '',
    customer_id: '',
    invoice_number: '',
    notes: ''
  });
  
  const [writeOffForm, setWriteOffForm] = useState({
    quantity: 1,
    reason: 'damaged',
    notes: ''
  });
  
  const [transferForm, setTransferForm] = useState({
    quantity: 1,
    target_warehouse_id: '',
    notes: ''
  });
  
  const [warehouses, setWarehouses] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const response = await axios.get(`/api/equipment/${id}`);
        setEquipment(response.data.equipment);
        // Předvyplnit cenu prodeje podle denní sazby nebo pořizovací ceny
        setSellForm(prev => ({
          ...prev,
          unit_price: response.data.equipment.daily_rate || response.data.equipment.purchase_price || ''
        }));
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání dat:', error);
        setError('Nepodařilo se načíst data. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    const fetchRelatedData = async () => {
      try {
        const [warehousesRes, customersRes] = await Promise.all([
          axios.get('/api/warehouses'),
          axios.get('/api/customers')
        ]);
        setWarehouses(warehousesRes.data.warehouses);
        setCustomers(customersRes.data.customers);
      } catch (error) {
        console.error('Chyba při načítání dat:', error);
      }
    };
    
    fetchEquipment();
    fetchRelatedData();
  }, [id]);
  
  const handleDelete = async () => {
    if (!window.confirm('Opravdu chcete smazat toto vybavení?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/equipment/${id}`);
      alert('Vybavení bylo úspěšně smazáno.');
      navigate('/equipment');
    } catch (error) {
      console.error('Chyba při mazání vybavení:', error);
      alert(error.response?.data?.message || 'Chyba při mazání vybavení.');
    }
  };
  
  // Funkce pro manipulaci s formulářem prodeje
  const handleSellChange = (e) => {
    const { name, value } = e.target;
    setSellForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Funkce pro manipulaci s formulářem odpisu
  const handleWriteOffChange = (e) => {
    const { name, value } = e.target;
    setWriteOffForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Funkce pro manipulaci s formulářem přesunu
  const handleTransferChange = (e) => {
    const { name, value } = e.target;
    setTransferForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Odeslání formuláře prodeje
  const handleSellSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post('/api/sales', {
        equipment_id: id,
        quantity: sellForm.quantity,
        unit_price: sellForm.unit_price,
        customer_id: sellForm.customer_id || null,
        invoice_number: sellForm.invoice_number || null,
        notes: sellForm.notes || null
      });
      
      // Aktualizovat data vybavení
      const response = await axios.get(`/api/equipment/${id}`);
      setEquipment(response.data.equipment);
      setShowSellModal(false);
      alert('Prodej byl úspěšně zaznamenán.');
    } catch (error) {
      console.error('Chyba při zaznamenávání prodeje:', error);
      alert(error.response?.data?.message || 'Chyba při zaznamenávání prodeje.');
    } finally {
      setLoading(false);
    }
  };
  
  // Odeslání formuláře odpisu
  const handleWriteOffSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post('/api/write-offs', {
        equipment_id: id,
        quantity: writeOffForm.quantity,
        reason: writeOffForm.reason,
        notes: writeOffForm.notes || null
      });
      
      // Aktualizovat data vybavení
      const response = await axios.get(`/api/equipment/${id}`);
      setEquipment(response.data.equipment);
      setShowWriteOffModal(false);
      alert('Odpis byl úspěšně zaznamenán.');
    } catch (error) {
      console.error('Chyba při zaznamenávání odpisu:', error);
      alert(error.response?.data?.message || 'Chyba při zaznamenávání odpisu.');
    } finally {
      setLoading(false);
    }
  };
  
  // Odeslání formuláře přesunu
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post('/api/equipment/transfer', {
        equipment_id: id,
        quantity: transferForm.quantity,
        target_warehouse_id: transferForm.target_warehouse_id,
        notes: transferForm.notes || null
      });
      
      // Aktualizovat data vybavení
      const response = await axios.get(`/api/equipment/${id}`);
      setEquipment(response.data.equipment);
      setShowTransferModal(false);
      alert('Přesun byl úspěšně zaznamenán.');
    } catch (error) {
      console.error('Chyba při zaznamenávání přesunu:', error);
      alert(error.response?.data?.message || 'Chyba při zaznamenávání přesunu.');
    } finally {
      setLoading(false);
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
                className="me-2"
              >
                Smazat
              </Button>
              
              <Button 
                variant="outline-primary"
                onClick={() => setShowTransferModal(true)}
                className="me-2"
                title="Přesunout do jiného skladu"
              >
                <FaExchangeAlt /> Přesunout
              </Button>
              
              <Button 
                variant="outline-success"
                onClick={() => setShowSellModal(true)}
                className="me-2"
                title="Prodat"
              >
                <FaArrowAltCircleDown /> Prodat
              </Button>
              
              <Button 
                variant="outline-danger"
                onClick={() => setShowWriteOffModal(true)}
                title="Odepsat"
              >
                <FaTimesCircle /> Odepsat
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
                <strong>Číslo artiklu:</strong> {equipment.article_number || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Označení výrobku:</strong> {equipment.product_designation || 'Neuvedeno'}
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
                <strong>Sklad:</strong> {equipment.warehouse_name || 'Neurčen'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Umístění ve skladu:</strong> {equipment.location || 'Neuvedeno'}
              </ListGroup.Item>
            </ListGroup>
          </Card>
          
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Finanční informace</h5>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>Denní sazba:</strong> {formatCurrency(equipment.daily_rate)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Měsíční sazba:</strong> {formatCurrency(equipment.monthly_rate) || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Pořizovací cena:</strong> {formatCurrency(equipment.purchase_price) || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Hodnota materiálu:</strong> {formatCurrency(equipment.material_value) || 'Neuvedeno'}
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Technické informace</h5>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>Hmotnost/kus:</strong> {equipment.weight_per_piece ? `${equipment.weight_per_piece} kg` : 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>m2/ks:</strong> {equipment.square_meters_per_piece || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Sklad celkem:</strong> {equipment.total_stock || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Dostupné množství:</strong> {equipment.available_stock || 'Neuvedeno'}
                {equipment.rented_quantity > 0 && (
                  <span className="ms-2">
                    <Badge bg="warning">{equipment.rented_quantity} ks vypůjčeno</Badge>
                  </span>
                )}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>m2/celkem:</strong> {equipment.total_square_meters || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Přidáno dne:</strong> {formatDate(equipment.created_at)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Naposledy upraveno:</strong> {formatDate(equipment.updated_at)}
              </ListGroup.Item>
            </ListGroup>
          </Card>
          
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
      
      {/* Modální okno pro prodej */}
      <Modal show={showSellModal} onHide={() => setShowSellModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Prodej zboží</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSellSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Množství</Form.Label>
              <Form.Control
                type="number"
                name="quantity"
                value={sellForm.quantity}
                onChange={handleSellChange}
                min="1"
                max={equipment.available_stock}
                required
              />
              <Form.Text className="text-muted">
                Dostupné množství: {equipment.available_stock} ks
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Cena za jednotku</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                name="unit_price"
                value={sellForm.unit_price}
                onChange={handleSellChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Zákazník</Form.Label>
              <Form.Select
                name="customer_id"
                value={sellForm.customer_id}
                onChange={handleSellChange}
              >
                <option value="">Vyberte zákazníka (nepovinné)</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Číslo faktury</Form.Label>
              <Form.Control
                type="text"
                name="invoice_number"
                value={sellForm.invoice_number}
                onChange={handleSellChange}
                placeholder="Zadejte číslo faktury (nepovinné)"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Poznámky</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={sellForm.notes}
                onChange={handleSellChange}
                placeholder="Zadejte poznámky k prodeji (nepovinné)"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowSellModal(false)}>
              Zrušit
            </Button>
            <Button variant="success" type="submit" disabled={loading}>
              {loading ? 'Zpracování...' : 'Potvrdit prodej'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      
      {/* Modální okno pro odpis */}
      <Modal show={showWriteOffModal} onHide={() => setShowWriteOffModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Odpis zboží</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleWriteOffSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Množství</Form.Label>
              <Form.Control
                type="number"
                name="quantity"
                value={writeOffForm.quantity}
                onChange={handleWriteOffChange}
                min="1"
                max={equipment.available_stock}
                required
              />
              <Form.Text className="text-muted">
                Dostupné množství: {equipment.available_stock} ks
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Důvod odpisu</Form.Label>
              <Form.Select
                name="reason"
                value={writeOffForm.reason}
                onChange={handleWriteOffChange}
                required
              >
                <option value="damaged">Poškozeno</option>
                <option value="lost">Ztraceno</option>
                <option value="expired">Prošlá životnost</option>
                <option value="other">Jiný důvod</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Poznámky</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={writeOffForm.notes}
                onChange={handleWriteOffChange}
                placeholder="Zadejte detaily důvodu odpisu"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowWriteOffModal(false)}>
              Zrušit
            </Button>
            <Button variant="danger" type="submit" disabled={loading}>
              {loading ? 'Zpracování...' : 'Potvrdit odpis'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      
      {/* Modální okno pro přesun do jiného skladu */}
      <Modal show={showTransferModal} onHide={() => setShowTransferModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Přesun zboží do jiného skladu</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleTransferSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Množství</Form.Label>
              <Form.Control
                type="number"
                name="quantity"
                value={transferForm.quantity}
                onChange={handleTransferChange}
                min="1"
                max={equipment.available_stock}
                required
              />
              <Form.Text className="text-muted">
                Dostupné množství: {equipment.available_stock} ks
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Cílový sklad</Form.Label>
              <Form.Select
                name="target_warehouse_id"
                value={transferForm.target_warehouse_id}
                onChange={handleTransferChange}
                required
              >
                <option value="">Vyberte cílový sklad</option>
                {warehouses
                  .filter(w => w.id !== equipment.warehouse_id)
                  .map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))
                }
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Poznámky</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={transferForm.notes}
                onChange={handleTransferChange}
                placeholder="Zadejte poznámky k přesunu (nepovinné)"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowTransferModal(false)}>
              Zrušit
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Zpracování...' : 'Potvrdit přesun'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default EquipmentDetail;