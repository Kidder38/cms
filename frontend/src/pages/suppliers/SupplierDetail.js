import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Alert, Table, Spinner, Modal, Form } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from '../../axios-config';
import { formatDate, formatCurrency } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { FaEdit, FaTrashAlt, FaPlus, FaEye, FaWarehouse, FaExchangeAlt, FaBoxes, FaShoppingCart, FaTimesCircle } from 'react-icons/fa';

const SupplierDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [supplier, setSupplier] = useState(null);
  const [supplierEquipment, setSupplierEquipment] = useState([]);
  const [supplierWarehouses, setSupplierWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Stavy pro modální okna
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showWriteOffModal, setShowWriteOffModal] = useState(false);
  
  // Formulářové stavy
  const [warehouseForm, setWarehouseForm] = useState({
    name: '',
    description: '',
    location: '',
    contact_person: '',
    phone: '',
    email: '',
    notes: ''
  });
  
  const [inventoryForm, setInventoryForm] = useState({
    warehouse_id: '',
    check_date: new Date().toISOString().slice(0, 10),
    notes: ''
  });
  
  const [transferForm, setTransferForm] = useState({
    equipment_id: '',
    quantity: 1,
    source_warehouse_id: '',
    target_warehouse_id: '',
    notes: ''
  });
  
  const [sellForm, setSellForm] = useState({
    equipment_id: '',
    quantity: 1,
    unit_price: '',
    customer_id: '',
    invoice_number: '',
    notes: ''
  });
  
  const [writeOffForm, setWriteOffForm] = useState({
    equipment_id: '',
    quantity: 1,
    reason: 'damaged',
    notes: ''
  });
  
  // Stavy pro pomocná data
  const [warehouses, setWarehouses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Načtení dat dodavatele, jeho vybavení a skladů paralelně
        const [supplierResponse, equipmentResponse, warehousesResponse] = await Promise.all([
          axios.get(`/api/suppliers/${id}`),
          axios.get(`/api/suppliers/${id}/equipment`),
          axios.get(`/api/suppliers/${id}/warehouses`)
        ]);
        
        setSupplier(supplierResponse.data.supplier);
        setSupplierEquipment(equipmentResponse.data.equipment || []);
        setSupplierWarehouses(warehousesResponse.data.warehouses || []);
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
        console.error('Chyba při načítání doplňkových dat:', error);
      }
    };
    
    fetchData();
    fetchRelatedData();
  }, [id]);
  
  const handleDelete = async () => {
    if (!window.confirm('Opravdu chcete smazat tohoto dodavatele?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/suppliers/${id}`);
      alert('Dodavatel byl úspěšně smazán.');
      navigate('/suppliers');
    } catch (error) {
      console.error('Chyba při mazání dodavatele:', error);
      alert(error.response?.data?.message || 'Chyba při mazání dodavatele.');
    }
  };
  
  // Funkce pro manipulaci s formulářem skladu
  const handleWarehouseChange = (e) => {
    const { name, value } = e.target;
    setWarehouseForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Odeslání formuláře pro vytvoření skladu
  const handleWarehouseSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Přidat supplier_id do dat formuláře
      const warehouseData = {
        ...warehouseForm,
        supplier_id: id,
        is_external: true
      };
      
      await axios.post('/api/warehouses', warehouseData);
      
      // Aktualizovat seznam skladů
      const response = await axios.get(`/api/suppliers/${id}/warehouses`);
      setSupplierWarehouses(response.data.warehouses || []);
      
      // Aktualizovat globální seznam skladů
      const allWarehousesRes = await axios.get('/api/warehouses');
      setWarehouses(allWarehousesRes.data.warehouses);
      
      // Resetovat formulář a zavřít modální okno
      setWarehouseForm({
        name: '',
        description: '',
        location: '',
        contact_person: '',
        phone: '',
        email: '',
        notes: ''
      });
      
      setShowWarehouseModal(false);
      alert('Sklad byl úspěšně vytvořen.');
    } catch (error) {
      console.error('Chyba při vytváření skladu:', error);
      alert(error.response?.data?.message || 'Chyba při vytváření skladu.');
    } finally {
      setLoading(false);
    }
  };
  
  // Funkce pro manipulaci s formulářem inventury
  const handleInventoryChange = (e) => {
    const { name, value } = e.target;
    setInventoryForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Odeslání formuláře pro vytvoření inventury
  const handleInventorySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const inventoryData = {
        ...inventoryForm,
        created_by: user.id
      };
      
      const response = await axios.post('/api/inventory-checks', inventoryData);
      
      // Přesměrování na detail inventury
      alert('Inventura byla úspěšně vytvořena.');
      navigate(`/inventory-checks/${response.data.id}`);
    } catch (error) {
      console.error('Chyba při vytváření inventury:', error);
      alert(error.response?.data?.message || 'Chyba při vytváření inventury.');
      setLoading(false);
    }
  };
  
  // Funkce pro zahájení procesu přesunu vybavení
  const handleTransferClick = (equipment) => {
    setSelectedEquipment(equipment);
    setTransferForm({
      equipment_id: equipment.id,
      quantity: 1,
      source_warehouse_id: equipment.warehouse_id,
      target_warehouse_id: '',
      notes: ''
    });
    setShowTransferModal(true);
  };
  
  // Funkce pro manipulaci s formulářem přesunu
  const handleTransferChange = (e) => {
    const { name, value } = e.target;
    setTransferForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Odeslání formuláře pro přesun vybavení
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post('/api/equipment/transfer', transferForm);
      
      // Aktualizovat seznam vybavení
      const equipmentResponse = await axios.get(`/api/suppliers/${id}/equipment`);
      setSupplierEquipment(equipmentResponse.data.equipment || []);
      
      setShowTransferModal(false);
      alert('Vybavení bylo úspěšně přesunuto.');
    } catch (error) {
      console.error('Chyba při přesunu vybavení:', error);
      alert(error.response?.data?.message || 'Chyba při přesunu vybavení.');
    } finally {
      setLoading(false);
    }
  };
  
  // Funkce pro zahájení procesu prodeje vybavení
  const handleSellClick = (equipment) => {
    setSelectedEquipment(equipment);
    setSellForm({
      equipment_id: equipment.id,
      quantity: 1,
      unit_price: equipment.daily_rate || equipment.purchase_price || '',
      customer_id: '',
      invoice_number: '',
      notes: ''
    });
    setShowSellModal(true);
  };
  
  // Funkce pro manipulaci s formulářem prodeje
  const handleSellChange = (e) => {
    const { name, value } = e.target;
    setSellForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Odeslání formuláře pro prodej vybavení
  const handleSellSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post('/api/sales', sellForm);
      
      // Aktualizovat seznam vybavení
      const equipmentResponse = await axios.get(`/api/suppliers/${id}/equipment`);
      setSupplierEquipment(equipmentResponse.data.equipment || []);
      
      setShowSellModal(false);
      alert('Prodej byl úspěšně zaznamenán.');
    } catch (error) {
      console.error('Chyba při zaznamenávání prodeje:', error);
      alert(error.response?.data?.message || 'Chyba při zaznamenávání prodeje.');
    } finally {
      setLoading(false);
    }
  };
  
  // Funkce pro zahájení procesu odpisu vybavení
  const handleWriteOffClick = (equipment) => {
    setSelectedEquipment(equipment);
    setWriteOffForm({
      equipment_id: equipment.id,
      quantity: 1,
      reason: 'damaged',
      notes: ''
    });
    setShowWriteOffModal(true);
  };
  
  // Funkce pro manipulaci s formulářem odpisu
  const handleWriteOffChange = (e) => {
    const { name, value } = e.target;
    setWriteOffForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Odeslání formuláře pro odpis vybavení
  const handleWriteOffSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post('/api/write-offs', {
        ...writeOffForm,
        created_by: user.id
      });
      
      // Aktualizovat seznam vybavení
      const equipmentResponse = await axios.get(`/api/suppliers/${id}/equipment`);
      setSupplierEquipment(equipmentResponse.data.equipment || []);
      
      setShowWriteOffModal(false);
      alert('Odpis byl úspěšně zaznamenán.');
    } catch (error) {
      console.error('Chyba při zaznamenávání odpisu:', error);
      alert(error.response?.data?.message || 'Chyba při zaznamenávání odpisu.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Načítání...</span>
          </Spinner>
          <p className="mt-2">Načítání dat dodavatele...</p>
        </div>
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
  
  if (!supplier) {
    return (
      <Container>
        <Alert variant="warning">Dodavatel nebyl nalezen.</Alert>
      </Container>
    );
  }
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Detail dodavatele</h1>
        </Col>
        <Col xs="auto">
          <Button 
            as={Link} 
            to="/suppliers" 
            variant="outline-secondary" 
            className="me-2"
          >
            Zpět na seznam
          </Button>
          
          {user?.role === 'admin' && (
            <>
              <Button 
                as={Link} 
                to={`/suppliers/edit/${id}`} 
                variant="primary" 
                className="me-2"
              >
                <FaEdit className="me-1" /> Upravit
              </Button>
              
              <Button 
                variant="danger" 
                onClick={handleDelete}
                className="me-2"
              >
                <FaTrashAlt className="me-1" /> Smazat
              </Button>
              
              <Button 
                variant="success"
                className="me-2"
                onClick={() => setShowWarehouseModal(true)}
              >
                <FaWarehouse className="me-1" /> Přidat sklad
              </Button>
              
              <Button 
                as={Link} 
                to={`/equipment/new?supplier=${id}`} 
                variant="success"
              >
                <FaPlus className="me-1" /> Přidat externí vybavení
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
                <strong>Název:</strong> {supplier.name}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Kontaktní osoba:</strong> {supplier.contact_person || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Email:</strong> {supplier.email || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Telefon:</strong> {supplier.phone || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Adresa:</strong> {supplier.address || 'Neuvedeno'}
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Finanční informace</h5>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>IČO:</strong> {supplier.ico || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>DIČ:</strong> {supplier.dic || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Bankovní účet:</strong> {supplier.bank_account || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Vytvořeno:</strong> {formatDate(supplier.created_at)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Naposledy upraveno:</strong> {formatDate(supplier.updated_at)}
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
      
      {supplier.notes && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Poznámky</h5>
          </Card.Header>
          <Card.Body>
            <p className="mb-0">{supplier.notes}</p>
          </Card.Body>
        </Card>
      )}
      
      {/* Sekce skladů */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Sklady dodavatele</h5>
          {user?.role === 'admin' && (
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => setShowWarehouseModal(true)}
            >
              <FaWarehouse className="me-1" /> Přidat sklad
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          {supplierWarehouses.length === 0 ? (
            <Alert variant="info">
              Tento dodavatel zatím nemá žádné sklady v evidenci.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Název</th>
                    <th>Umístění</th>
                    <th>Kontaktní osoba</th>
                    <th>Kontakt</th>
                    <th>Počet položek</th>
                    <th>Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierWarehouses.map(warehouse => (
                    <tr key={warehouse.id}>
                      <td>
                        <Link to={`/warehouses/${warehouse.id}`} className="fw-bold">
                          {warehouse.name}
                        </Link>
                      </td>
                      <td>{warehouse.location || '-'}</td>
                      <td>{warehouse.contact_person || '-'}</td>
                      <td>{warehouse.phone || warehouse.email || '-'}</td>
                      <td>{warehouse.equipment_count || 0}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button 
                            as={Link} 
                            to={`/warehouses/${warehouse.id}`} 
                            variant="outline-primary" 
                            size="sm"
                            title="Detail skladu"
                          >
                            <FaEye />
                          </Button>
                          
                          {user?.role === 'admin' && (
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              title="Zahájit inventuru"
                              onClick={() => {
                                setInventoryForm(prev => ({
                                  ...prev,
                                  warehouse_id: warehouse.id
                                }));
                                setShowInventoryModal(true);
                              }}
                            >
                              <FaBoxes />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Sekce externího vybavení */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Externí vybavení</h5>
          <div>
            {user?.role === 'admin' && (
              <Button 
                as={Link} 
                to={`/equipment/new?supplier=${id}`} 
                variant="success" 
                size="sm"
                className="me-2"
              >
                <FaPlus className="me-1" /> Přidat vybavení
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          {supplierEquipment.length === 0 ? (
            <Alert variant="info">
              Tento dodavatel zatím nemá žádné vybavení v evidenci.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Název</th>
                    <th>Inv. číslo</th>
                    <th>Typ</th>
                    <th>Sklad</th>
                    <th>Stav</th>
                    <th>Počet ks</th>
                    <th>Dostupné</th>
                    <th>Náklady</th>
                    <th>Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierEquipment.map(equipment => (
                    <tr key={equipment.id}>
                      <td>
                        <Link to={`/equipment/${equipment.id}`} className="fw-bold">
                          {equipment.name}
                        </Link>
                      </td>
                      <td>{equipment.inventory_number}</td>
                      <td>{equipment.product_designation || '-'}</td>
                      <td>{equipment.warehouse_name || 'Neurčen'}</td>
                      <td>
                        <Badge bg={getStatusColor(equipment.status)}>
                          {getStatusLabel(equipment.status)}
                        </Badge>
                      </td>
                      <td>{equipment.total_stock}</td>
                      <td>{equipment.available_stock || 0}</td>
                      <td>{equipment.external_rental_cost ? `${equipment.external_rental_cost} Kč` : '-'}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button 
                            as={Link} 
                            to={`/equipment/${equipment.id}`} 
                            variant="outline-primary" 
                            size="sm"
                            title="Detail vybavení"
                          >
                            <FaEye />
                          </Button>
                          
                          {user?.role === 'admin' && equipment.status !== 'retired' && (
                            <>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                title="Přesunout"
                                onClick={() => handleTransferClick(equipment)}
                              >
                                <FaExchangeAlt />
                              </Button>
                              <Button
                                variant="outline-success"
                                size="sm"
                                title="Prodat"
                                onClick={() => handleSellClick(equipment)}
                              >
                                <FaShoppingCart />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                title="Odepsat"
                                onClick={() => handleWriteOffClick(equipment)}
                              >
                                <FaTimesCircle />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Modální okno pro přidání nového skladu */}
      <Modal show={showWarehouseModal} onHide={() => setShowWarehouseModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Přidat sklad pro dodavatele</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleWarehouseSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Název skladu</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={warehouseForm.name}
                    onChange={handleWarehouseChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Umístění</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={warehouseForm.location}
                    onChange={handleWarehouseChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Popis</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={warehouseForm.description}
                onChange={handleWarehouseChange}
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kontaktní osoba</Form.Label>
                  <Form.Control
                    type="text"
                    name="contact_person"
                    value={warehouseForm.contact_person}
                    onChange={handleWarehouseChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Telefon</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={warehouseForm.phone}
                    onChange={handleWarehouseChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={warehouseForm.email}
                onChange={handleWarehouseChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Poznámky</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={warehouseForm.notes}
                onChange={handleWarehouseChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowWarehouseModal(false)}>
              Zrušit
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Ukládání...' : 'Uložit sklad'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      
      {/* Modální okno pro vytvoření inventury */}
      <Modal show={showInventoryModal} onHide={() => setShowInventoryModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Zahájit inventuru</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleInventorySubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Sklad</Form.Label>
              <Form.Select
                name="warehouse_id"
                value={inventoryForm.warehouse_id}
                onChange={handleInventoryChange}
                required
                disabled={inventoryForm.warehouse_id !== ''}
              >
                <option value="">Vyberte sklad</option>
                {supplierWarehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Datum inventury</Form.Label>
              <Form.Control
                type="date"
                name="check_date"
                value={inventoryForm.check_date}
                onChange={handleInventoryChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Poznámky</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={inventoryForm.notes}
                onChange={handleInventoryChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowInventoryModal(false)}>
              Zrušit
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Vytváření...' : 'Vytvořit inventuru'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      
      {/* Modální okno pro přesun vybavení */}
      <Modal show={showTransferModal} onHide={() => setShowTransferModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Přesun vybavení</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleTransferSubmit}>
          <Modal.Body>
            {selectedEquipment && (
              <Alert variant="info">
                <strong>Vybavení: </strong> {selectedEquipment.name} (ID: {selectedEquipment.inventory_number})
              </Alert>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>Množství</Form.Label>
              <Form.Control
                type="number"
                name="quantity"
                value={transferForm.quantity}
                onChange={handleTransferChange}
                min="1"
                max={selectedEquipment?.available_stock || 1}
                required
              />
              {selectedEquipment && (
                <Form.Text className="text-muted">
                  Dostupné množství: {selectedEquipment.available_stock || 0} ks
                </Form.Text>
              )}
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Zdrojový sklad</Form.Label>
              <Form.Select
                name="source_warehouse_id"
                value={transferForm.source_warehouse_id}
                onChange={handleTransferChange}
                required
                disabled
              >
                <option value="">Vyberte zdrojový sklad</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </Form.Select>
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
                  .filter(w => w.id !== transferForm.source_warehouse_id)
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
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowTransferModal(false)}>
              Zrušit
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Přesouvání...' : 'Přesunout'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      
      {/* Modální okno pro prodej vybavení */}
      <Modal show={showSellModal} onHide={() => setShowSellModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Prodej vybavení</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSellSubmit}>
          <Modal.Body>
            {selectedEquipment && (
              <Alert variant="info">
                <strong>Vybavení: </strong> {selectedEquipment.name} (ID: {selectedEquipment.inventory_number})
              </Alert>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>Množství</Form.Label>
              <Form.Control
                type="number"
                name="quantity"
                value={sellForm.quantity}
                onChange={handleSellChange}
                min="1"
                max={selectedEquipment?.available_stock || 1}
                required
              />
              {selectedEquipment && (
                <Form.Text className="text-muted">
                  Dostupné množství: {selectedEquipment.available_stock || 0} ks
                </Form.Text>
              )}
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
      
      {/* Modální okno pro odpis vybavení */}
      <Modal show={showWriteOffModal} onHide={() => setShowWriteOffModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Odpis vybavení</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleWriteOffSubmit}>
          <Modal.Body>
            {selectedEquipment && (
              <Alert variant="info">
                <strong>Vybavení: </strong> {selectedEquipment.name} (ID: {selectedEquipment.inventory_number})
              </Alert>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>Množství</Form.Label>
              <Form.Control
                type="number"
                name="quantity"
                value={writeOffForm.quantity}
                onChange={handleWriteOffChange}
                min="1"
                max={selectedEquipment?.available_stock || 1}
                required
              />
              {selectedEquipment && (
                <Form.Text className="text-muted">
                  Dostupné množství: {selectedEquipment.available_stock || 0} ks
                </Form.Text>
              )}
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
    </Container>
  );
};

// Pomocné funkce pro zobrazení stavu vybavení
const getStatusLabel = (status) => {
  const statusMap = {
    'available': 'Dostupné',
    'borrowed': 'Vypůjčeno',
    'maintenance': 'V servisu',
    'retired': 'Vyřazeno'
  };
  return statusMap[status] || status;
};

const getStatusColor = (status) => {
  const colorMap = {
    'available': 'success',
    'borrowed': 'warning',
    'maintenance': 'info',
    'retired': 'danger'
  };
  return colorMap[status] || 'secondary';
};

export default SupplierDetail;