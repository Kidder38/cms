import React, { useState, useEffect, useMemo } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Table, 
  Alert,
  Modal, 
  Tabs, 
  Tab, 
  InputGroup,
  Badge
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL, formatDate, formatCurrency } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { 
  FaFileAlt, 
  FaCheck, 
  FaTimes, 
  FaSearch, 
  FaTrash, 
  FaShoppingCart, 
  FaFilter,
  FaListUl,
  FaExchangeAlt,
  FaArrowLeft
} from 'react-icons/fa';

const BatchRentalReturnForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Stavy pro formulář
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [returnCart, setReturnCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  
  // Stav pro formulář vratky
  const [returnData, setReturnData] = useState({
    actual_return_date: new Date().toISOString().split('T')[0],
    condition: 'ok',
    damage_description: '',
    additional_charges: '',
    batch_id: `BATCH-RETURN-${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}-${Math.floor(Math.random() * 1000)}`
  });

  // Stavy pro zpracování
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [batchReturnResult, setBatchReturnResult] = useState(null);
  const [activeTab, setActiveTab] = useState('browse');

  // Načtení seznamu zakázek s aktivními výpůjčkami
  useEffect(() => {
    const fetchOrdersWithRentals = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/orders`);
        // Filtrování zakázek s aktivními výpůjčkami
        const ordersWithRentals = response.data.orders.filter(order => 
          order.status !== 'completed'
        );
        setOrders(ordersWithRentals);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání zakázek:', error);
        setError('Nepodařilo se načíst zakázky. Zkuste to prosím později.');
        setLoading(false);
      }
    };

    fetchOrdersWithRentals();
  }, []);

  // Načtení kategorií
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories`);
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error('Chyba při načítání kategorií:', error);
      }
    };

    fetchCategories();
  }, []);

  // Načtení výpůjček pro vybranou zakázku
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!selectedOrder) {
        setRentals([]);
        setOrderDetails(null);
        return;
      }

      try {
        setLoading(true);
        
        // Načtení detailu zakázky a výpůjček
        const [orderResponse, rentalsResponse] = await Promise.all([
          axios.get(`${API_URL}/orders/${selectedOrder}`),
          axios.get(`${API_URL}/orders/${selectedOrder}/rentals`)
        ]);
        
        setOrderDetails(orderResponse.data.order);
        
        // Filtrování aktivních výpůjček, které ještě nebyly vráceny
        const activeRentals = rentalsResponse.data.rentals?.filter(
          rental => rental && rental.status !== 'returned'
        ) || [];
        
        // Kategorizace vybavení
        activeRentals.forEach(rental => {
          const category = categories.find(c => c.id === rental.category_id);
          rental.category_name = category ? category.name : 'Bez kategorie';
        });
        
        setRentals(activeRentals);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání výpůjček:', error);
        setError('Nepodařilo se načíst výpůjčky. Zkuste to prosím později.');
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [selectedOrder, categories]);

  // Filtrované výpůjčky podle vyhledávání a kategorie
  const filteredRentals = useMemo(() => {
    if (!rentals.length) return [];
    
    return rentals.filter(rental => {
      // Filtr podle vyhledávání
      const searchMatch = searchTerm === '' || 
        rental.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        rental.inventory_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtr podle kategorie
      const categoryMatch = selectedCategory === '' || 
        rental.category_id === parseInt(selectedCategory);
      
      return searchMatch && categoryMatch;
    });
  }, [rentals, searchTerm, selectedCategory]);

  // Přidání položky do košíku
  const addToReturnCart = (rental, quantity = 1) => {
    // Ověřit, že množství je v platném rozsahu
    const maxQuantity = rental.quantity;
    
    if (quantity > maxQuantity) {
      setError(`Nelze vrátit více než ${maxQuantity} kusů položky "${rental.equipment_name}".`);
      setTimeout(() => setError(null), 3000);
      quantity = maxQuantity;
    }
    
    // Zkontrolujeme, zda položka už je v košíku
    const existingItemIndex = returnCart.findIndex(
      item => item.rental_id === rental.id
    );
    
    if (existingItemIndex >= 0) {
      // Položka už je v košíku, aktualizujeme množství
      const updatedCart = [...returnCart];
      const currentQuantity = updatedCart[existingItemIndex].quantity;
      
      // Ověříme, že nové množství nepřekročí dostupný počet kusů
      const newQuantity = Math.min(currentQuantity + quantity, maxQuantity);
      
      updatedCart[existingItemIndex].quantity = newQuantity;
      setReturnCart(updatedCart);
    } else {
      // Položka ještě není v košíku, přidáme ji
      setReturnCart([
        ...returnCart,
        {
          rental_id: rental.id,
          equipment_name: rental.equipment_name,
          inventory_number: rental.inventory_number,
          quantity: Math.min(quantity, maxQuantity),
          max_quantity: maxQuantity,
          issue_date: rental.issue_date,
          planned_return_date: rental.planned_return_date
        }
      ]);
    }
    
    // Zobrazení potvrzení přidání do košíku
    const toast = document.createElement('div');
    toast.className = 'position-fixed bottom-0 end-0 p-3';
    toast.style.zIndex = 11;
    toast.innerHTML = `
      <div class="toast show" role="alert">
        <div class="toast-header bg-success text-white">
          <strong class="me-auto">Položka přidána k vrácení</strong>
          <button type="button" class="btn-close" onclick="this.parentElement.parentElement.parentElement.remove()"></button>
        </div>
        <div class="toast-body">
          <div>Položka "${rental.equipment_name}" byla přidána k vrácení (${quantity} ks).</div>
          <small>V košíku: ${returnCart.length + (existingItemIndex >= 0 ? 0 : 1)} položek</small>
          <div class="mt-2">
            <button type="button" class="btn btn-sm btn-outline-secondary" 
              onclick="document.querySelector('[data-rr-ui-event-key=\'cart\']').click(); this.parentElement.parentElement.parentElement.parentElement.remove()">
              Přejít do košíku
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // Změna množství položky v košíku
  const updateCartItemQuantity = (index, newQuantity) => {
    const updatedCart = [...returnCart];
    const item = updatedCart[index];
    const oldQuantity = item.quantity;
    
    // Ověříme, že nové množství nepřekročí dostupný počet kusů
    if (newQuantity > item.max_quantity) {
      setError(`Nelze vrátit více než ${item.max_quantity} kusů položky "${item.equipment_name}".`);
      setTimeout(() => setError(null), 3000);
      newQuantity = item.max_quantity;
    }
    
    // Zajistíme minimální množství 1
    newQuantity = Math.max(1, newQuantity);
    
    updatedCart[index].quantity = newQuantity;
    setReturnCart(updatedCart);
  };

  // Odstranění položky z košíku
  const removeFromCart = (index) => {
    const updatedCart = returnCart.filter((_, i) => i !== index);
    setReturnCart(updatedCart);
  };

  // Rychlé přidání/odebrání množství položky v košíku
  const quickAddQuantity = (index, amount) => {
    const updatedCart = [...returnCart];
    const item = updatedCart[index];
    const oldQuantity = item.quantity;
    let newQuantity = oldQuantity + amount;
    
    // Kontrola maximálního množství
    if (newQuantity > item.max_quantity) {
      setError(`Nelze vrátit více než ${item.max_quantity} kusů.`);
      setTimeout(() => setError(null), 3000);
      newQuantity = item.max_quantity;
    }
    
    // Kontrola minimálního množství
    if (newQuantity < 1) {
      newQuantity = 1;
    }
    
    updatedCart[index].quantity = newQuantity;
    setReturnCart(updatedCart);
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
    // Kontrola, zda je vybrána zakázka
    if (!selectedOrder) {
      setError('Musíte vybrat zakázku.');
      return false;
    }
    
    // Kontrola, zda je něco v košíku k vrácení
    if (returnCart.length === 0) {
      setError('Musíte vybrat alespoň jednu položku k vrácení.');
      return false;
    }

    // Kontrola popisu poškození, pokud není stav "ok"
    if (returnData.condition !== 'ok' && !returnData.damage_description.trim()) {
      setError('Pro poškozenou výpůjčku musíte popsat poškození.');
      return false;
    }
    
    // Kontrola správnosti data
    if (!returnData.actual_return_date) {
      setError('Musíte zadat datum vrácení.');
      return false;
    }
    
    // Kontrola, že datum vratky není v budoucnosti
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const returnDate = new Date(returnData.actual_return_date);
    if (returnDate > today) {
      setError('Datum vrácení nemůže být v budoucnosti.');
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
      const batchReturns = returnCart.map(item => ({
        rental_id: item.rental_id,
        return_quantity: item.quantity,
        ...returnData
      }));

      // Hromadné volání API pro vrácení
      const returns = [];
      for (const returnItem of batchReturns) {
        const response = await axios.post(
          `${API_URL}/orders/${selectedOrder}/rentals/${returnItem.rental_id}/return`, 
          returnItem
        );
        returns.push(response.data);
      }

      // Úspěšná hromadná vratka
      setBatchReturnResult({
        success: returns.length,
        batchId: returnData.batch_id
      });
      
      // Vyčistíme košík
      setReturnCart([]);
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
      <Row className="mb-4 align-items-center">
        <Col>
          <h1>Hromadná vratka vybavení</h1>
        </Col>
        <Col className="text-end">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/orders')}
          >
            <FaArrowLeft className="me-2" /> Zpět na zakázky
          </Button>
        </Col>
      </Row>

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
        <>
          {/* Výběr zakázky */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Výběr zakázky</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Vyberte zakázku *</Form.Label>
                    <Form.Select
                      value={selectedOrder}
                      onChange={(e) => {
                        setSelectedOrder(e.target.value);
                        setReturnCart([]);
                        setActiveTab('browse');
                      }}
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
                {orderDetails && (
                  <Col md={6}>
                    <div className="p-3 bg-light rounded">
                      <h6>Detail zakázky:</h6>
                      <p className="mb-1">Číslo: <strong>{orderDetails.order_number}</strong></p>
                      <p className="mb-1">Zákazník: <strong>{orderDetails.customer_name}</strong></p>
                      <p className="mb-0">Datum vytvoření: <strong>{formatDate(orderDetails.creation_date)}</strong></p>
                    </div>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>

          {/* Seznam výpůjček - pouze pokud je vybrána zakázka */}
          {selectedOrder && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Výběr položek k vrácení</h5>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <Alert variant="info">Načítání položek...</Alert>
                ) : rentals.length === 0 ? (
                  <Alert variant="warning">Tato zakázka nemá žádné aktivní výpůjčky k vrácení.</Alert>
                ) : (
                  <>
                    {/* Formulář vratky */}
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
                                value={returnData.additional_charges}
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

                    {/* Tabbed interface pro procházení a košík */}
                    <Tabs
                      activeKey={activeTab}
                      onSelect={(k) => setActiveTab(k)}
                      className="mb-3"
                    >
                      <Tab 
                        eventKey="browse" 
                        title={
                          <span>
                            <FaSearch className="me-2" />
                            Procházet výpůjčky
                          </span>
                        }
                      >
                        <div className="mb-3">
                          <Row>
                            <Col md={6}>
                              <InputGroup>
                                <Form.Control
                                  placeholder="Hledat podle názvu nebo inv. čísla..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
                                  Vyčistit
                                </Button>
                              </InputGroup>
                            </Col>
                            <Col md={6}>
                              <Form.Select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                              >
                                <option value="">Všechny kategorie</option>
                                {categories.map(category => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </Form.Select>
                            </Col>
                          </Row>
                        </div>

                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                          <Table striped bordered hover responsive>
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                              <tr>
                                <th>Vybavení</th>
                                <th>Inv. číslo</th>
                                <th>Kategorie</th>
                                <th>Datum výpůjčky</th>
                                <th>Množství</th>
                                <th>Akce</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredRentals.length === 0 ? (
                                <tr>
                                  <td colSpan="6" className="text-center">
                                    Nebyla nalezena žádná výpůjčka odpovídající kritériím.
                                  </td>
                                </tr>
                              ) : (
                                filteredRentals.map(rental => {
                                  // Kontrola, zda položka je již v košíku
                                  const inCart = returnCart.some(item => item.rental_id === rental.id);
                                  const maxQty = rental.quantity;
                                  
                                  return (
                                    <tr key={rental.id}>
                                      <td>{rental.equipment_name}</td>
                                      <td>{rental.inventory_number}</td>
                                      <td>{rental.category_name}</td>
                                      <td>{formatDate(rental.issue_date)}</td>
                                      <td>{rental.quantity} ks</td>
                                      <td>
                                        <div className="d-flex align-items-center">
                                          <Form.Control
                                            type="number"
                                            size="sm"
                                            min="1"
                                            max={maxQty}
                                            style={{ width: '70px' }}
                                            defaultValue="1"
                                            placeholder="Ks"
                                            onChange={(e) => {
                                              // Kontrola maxima při změně hodnoty
                                              const value = parseInt(e.target.value);
                                              if (value > maxQty) {
                                                e.target.value = maxQty;
                                                setError(`Nelze vrátit více než ${maxQty} kusů.`);
                                                setTimeout(() => setError(null), 3000);
                                              }
                                              e.currentTarget.dataset.quantity = e.target.value;
                                            }}
                                            onKeyDown={(e) => {
                                              // Zamezit zadání hodnoty mimo rozsah pomocí šipek
                                              if (e.key === 'ArrowUp') {
                                                const newValue = parseInt(e.target.value || 0) + 1;
                                                if (newValue > maxQty) {
                                                  e.preventDefault();
                                                  e.target.value = maxQty;
                                                }
                                              }
                                            }}
                                            className="me-2"
                                          />

                                          <Button
                                            variant={inCart ? "outline-primary" : "primary"}
                                            size="sm"
                                            onClick={(e) => {
                                              // Získat hodnotu ze sousedního inputu
                                              const input = e.target.closest('div').querySelector('input');
                                              let quantity = parseInt(input?.value || 1);
                                              
                                              // Ověření maximum
                                              if (quantity > maxQty) {
                                                quantity = maxQty;
                                                setError(`Nelze vrátit více než ${maxQty} kusů.`);
                                                setTimeout(() => setError(null), 3000);
                                              }
                                              
                                              // Ověření minimum
                                              if (quantity < 1 || isNaN(quantity)) {
                                                quantity = 1;
                                              }
                                              
                                              addToReturnCart(rental, quantity);
                                              // Reset inputu
                                              if (input) input.value = 1;
                                            }}
                                          >
                                            {inCart ? 'Přidat další' : 'Vrátit'}
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </Table>
                        </div>
                      </Tab>
                      
                      <Tab 
                        eventKey="cart" 
                        title={
                          <span>
                            <FaShoppingCart className="me-2" />
                            Košík vratek ({returnCart.length})
                          </span>
                        }
                      >
                        {returnCart.length === 0 ? (
                          <Alert variant="info">
                            Košík je prázdný. Přidejte položky, které chcete vrátit.
                          </Alert>
                        ) : (
                          <div>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                              <Table striped bordered hover responsive>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                                  <tr>
                                    <th style={{ width: '30%' }}>Vybavení</th>
                                    <th style={{ width: '15%' }}>Inv. číslo</th>
                                    <th style={{ width: '15%' }}>Datum výpůjčky</th>
                                    <th style={{ width: '25%' }}>Množství k vrácení</th>
                                    <th style={{ width: '15%' }}>Akce</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {returnCart.map((item, index) => (
                                    <tr key={index}>
                                      <td>
                                        <strong>{item.equipment_name}</strong>
                                      </td>
                                      <td>{item.inventory_number}</td>
                                      <td>{formatDate(item.issue_date)}</td>
                                      <td>
                                        <InputGroup size="sm">
                                          <Button
                                            variant="outline-secondary"
                                            onClick={() => quickAddQuantity(index, -1)}
                                            disabled={item.quantity <= 1}
                                          >
                                            -
                                          </Button>
                                          <Form.Control
                                            type="number"
                                            min="1"
                                            max={item.max_quantity}
                                            value={item.quantity}
                                            onChange={(e) => {
                                              // Kontrola hodnoty při změně
                                              let value = parseInt(e.target.value);
                                              if (value > item.max_quantity) {
                                                value = item.max_quantity;
                                                e.target.value = value;
                                                setError(`Nelze vrátit více než ${item.max_quantity} kusů.`);
                                                setTimeout(() => setError(null), 3000);
                                              }
                                              updateCartItemQuantity(index, value);
                                            }}
                                            onKeyDown={(e) => {
                                              // Omezení hodnoty při použití šipek
                                              if (e.key === 'ArrowUp') {
                                                const newValue = item.quantity + 1;
                                                if (newValue > item.max_quantity) {
                                                  e.preventDefault();
                                                }
                                              }
                                            }}
                                            style={{ textAlign: 'center' }}
                                          />
                                          <Button
                                            variant="outline-secondary"
                                            onClick={() => quickAddQuantity(index, 1)}
                                            disabled={item.quantity >= item.max_quantity}
                                          >
                                            +
                                          </Button>
                                        </InputGroup>
                                        <small className="text-muted d-block text-center mt-1">
                                          (max: {item.max_quantity} ks)
                                        </small>
                                      </td>
                                      <td className="text-center">
                                        <Button
                                          variant="outline-danger"
                                          size="sm"
                                          onClick={() => removeFromCart(index)}
                                        >
                                          <FaTrash />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                          </div>
                        )}
                      </Tab>
                    </Tabs>

                    {/* Tlačítka akce */}
                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => {
                          setSelectedOrder('');
                          setReturnCart([]);
                        }}
                        disabled={loading}
                      >
                        <FaTimes className="me-2" /> Zrušit
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={handleBatchReturn}
                        disabled={loading || returnCart.length === 0}
                      >
                        <FaCheck className="me-2" /> 
                        {loading ? 'Zpracování...' : 'Potvrdit hromadnou vratku'}
                      </Button>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          )}
        </>
      )}
    </Container>
  );
};

export default BatchRentalReturnForm;