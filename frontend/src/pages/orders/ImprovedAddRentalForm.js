import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Tabs, Tab, InputGroup, Badge } from 'react-bootstrap';
import { FaTrash, FaPlus, FaFileAlt, FaSearch, FaTags, FaListUl, FaShoppingCart } from 'react-icons/fa';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL, formatCurrency, formatDate } from '../../config';
import { useAuth } from '../../context/AuthContext';

const ImprovedAddRentalForm = ({ initialOrderId, onSuccess }) => {
  const params = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const order_id = initialOrderId || params.order_id;
  
  // Stav pro celý formulář
  const [formData, setFormData] = useState({
    issue_date: new Date().toISOString().split('T')[0],
    planned_return_date: '',
    status: 'created',
    note: ''
  });

  // Stav pro seznam položek výpůjček (košík)
  const [rentalCart, setRentalCart] = useState([]);
  
  // Stav pro vyhledávání
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Data z API
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Stav pro batch_id
  const [batchId, setBatchId] = useState(null);
  const [showDeliveryNoteOption, setShowDeliveryNoteOption] = useState(false);
  
  // Výpočet celkové ceny
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Aktivní tab
  const [activeTab, setActiveTab] = useState('browse'); // browse, cart
  
  // Nejprve ověříme, jestli je uživatel přihlášen a má oprávnění
  useEffect(() => {
    if (!user) {
      setError('Pro přístup k této funkci musíte být přihlášen.');
      setLoading(false);
      return;
    }
    
    if (user.role !== 'admin') {
      setError('Nemáte oprávnění pro přístup k této funkci.');
      setLoading(false);
      return;
    }
  }, [user]);
  
  // Validace ID parametru
  useEffect(() => {
    if (!order_id || isNaN(parseInt(order_id))) {
      setError('Neplatné ID zakázky. Prosím, zkuste se vrátit na seznam zakázek a vybrat platnou zakázku.');
      setLoading(false);
      return;
    }
  }, [order_id]);
  
  // Načtení dat zakázky, kategorií a dostupného vybavení
  useEffect(() => {
    // Počkej na přihlášení uživatele a validní order_id
    if (!user) return;
    if (!order_id || isNaN(parseInt(order_id))) return;
    
    const fetchData = async () => {
      try {
        const numericOrderId = parseInt(order_id);
        
        // Zajistíme, že token je nastaven na každém požadavku
        if (localStorage.getItem('token')) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
        }
        
        // Načtení zakázky, vybavení a kategorií současně
        const [orderResponse, equipmentResponse, categoriesResponse] = await Promise.all([
          axios.get(`${API_URL}/orders/${numericOrderId}`),
          axios.get(`${API_URL}/equipment`),
          axios.get(`${API_URL}/categories`)
        ]);
        
        setOrder(orderResponse.data.order);
        
        // Filtrujeme pouze dostupné vybavení
        const availableEquipment = (equipmentResponse.data.equipment || []).filter(
          item => item.status === 'available' && (item.available_stock > 0)
        );
        setEquipment(availableEquipment);
        
        // Nastavíme kategorie
        setCategories(categoriesResponse.data.categories || []);
        
        setLoading(false);
        setError(null);
      } catch (error) {
        console.error('Chyba při načítání dat:', error);
        
        // Pokud je chyba autorizace, zobrazíme specifickou zprávu
        if (error.response?.status === 401) {
          setError('Pro přístup k této funkci se musíte přihlásit. Přihlášení vypršelo nebo je neplatné.');
        } else {
          setError('Nepodařilo se načíst data. ' + (error.response?.data?.message || 'Zkuste to prosím později.'));
        }
        setLoading(false);
      }
    };
    
    fetchData();
  }, [order_id, user]);

  // Přepočet celkové ceny při změně košíku nebo datumů
  useEffect(() => {
    calculateTotals();
  }, [rentalCart, formData.issue_date, formData.planned_return_date]);

  // Filtrované vybavení podle vyhledávání a kategorie
  const filteredEquipment = useMemo(() => {
    return equipment.filter(item => {
      // Filtr podle vyhledávání
      const searchMatch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.inventory_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtr podle kategorie
      const categoryMatch = selectedCategory === '' || 
        item.category_id === parseInt(selectedCategory);
      
      return searchMatch && categoryMatch;
    });
  }, [equipment, searchTerm, selectedCategory]);

  // Výpočet počtu dní mezi datumy
  const calculateDays = () => {
    if (!formData.issue_date || !formData.planned_return_date) {
      return 1; // Minimálně 1 den
    }

    const startDate = new Date(formData.issue_date);
    const endDate = new Date(formData.planned_return_date);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays || 1; // Minimálně 1 den
  };

  // Výpočet celkové ceny
  const calculateTotals = () => {
    const days = calculateDays();
    
    let total = 0;
    for (const item of rentalCart) {
      const subtotal = item.daily_rate * item.quantity * days;
      total += subtotal;
    }
    
    setTotalPrice(total);
  };
  
  // Přidání položky do košíku
  const addToCart = (equipmentItem, quantity = 1) => {
    // Zkontrolujeme, zda položka už je v košíku
    const existingItemIndex = rentalCart.findIndex(
      item => item.equipment_id === equipmentItem.id
    );
    
    // Aktualizujeme dostupné množství po přidání do košíku
    const updatedEquipment = [...equipment];
    const equipItemIndex = updatedEquipment.findIndex(item => item.id === equipmentItem.id);
    
    if (existingItemIndex >= 0) {
      // Položka už je v košíku, zvýšíme množství
      const updatedCart = [...rentalCart];
      const currentQuantity = updatedCart[existingItemIndex].quantity;
      
      // Ověříme, že nové množství nepřekročí dostupný počet kusů
      const newQuantity = currentQuantity + quantity;
      const availableQuantity = equipmentItem.available_stock;
      
      if (newQuantity > availableQuantity) {
        setError(`Nelze přidat více než ${availableQuantity} kusů položky "${equipmentItem.name}".`);
        setTimeout(() => setError(null), 3000);
        updatedCart[existingItemIndex].quantity = availableQuantity;
      } else {
        updatedCart[existingItemIndex].quantity = newQuantity;
        
        // Aktualizace dostupných ks pro zobrazení
        if (equipItemIndex >= 0) {
          updatedEquipment[equipItemIndex].available_stock -= quantity;
        }
      }
      
      setRentalCart(updatedCart);
    } else {
      // Položka ještě není v košíku, přidáme ji
      setRentalCart([
        ...rentalCart,
        {
          equipment_id: equipmentItem.id,
          equipment_name: equipmentItem.name,
          inventory_number: equipmentItem.inventory_number,
          quantity: Math.min(quantity, equipmentItem.available_stock),
          daily_rate: equipmentItem.daily_rate,
          available_stock: equipmentItem.available_stock
        }
      ]);
      
      // Aktualizace dostupných ks pro zobrazení
      if (equipItemIndex >= 0) {
        updatedEquipment[equipItemIndex].available_stock -= quantity;
      }
    }
    
    // Aktualizujeme stav equipment s novými hodnotami dostupnosti
    setEquipment(updatedEquipment);
    
    // ZMĚNA: Zůstaneme na kartě procházet vybavení
    // Ukažeme oznámení, kolik položek je v košíku
    const cartItemCount = rentalCart.length + (existingItemIndex >= 0 ? 0 : 1);
    
    // Potvrzení přidání do košíku
    const toast = document.createElement('div');
    toast.className = 'position-fixed bottom-0 end-0 p-3';
    toast.style.zIndex = 11;
    toast.innerHTML = `
      <div class="toast show" role="alert">
        <div class="toast-header bg-success text-white">
          <strong class="me-auto">Položka přidána</strong>
          <button type="button" class="btn-close" onclick="this.parentElement.parentElement.parentElement.remove()"></button>
        </div>
        <div class="toast-body">
          <div>Položka "${equipmentItem.name}" byla přidána do košíku (${quantity} ks).</div>
          <small>V košíku: ${cartItemCount} položek</small>
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
    const updatedCart = [...rentalCart];
    const item = updatedCart[index];
    const oldQuantity = item.quantity;
    
    // Ověříme, že nové množství nepřekročí dostupný počet kusů
    if (newQuantity > item.available_stock) {
      setError(`Nelze přidat více než ${item.available_stock} kusů položky "${item.equipment_name}".`);
      setTimeout(() => setError(null), 3000);
      newQuantity = item.available_stock;
    }
    
    // Zajistíme minimální množství 1
    newQuantity = Math.max(1, newQuantity);
    
    updatedCart[index].quantity = newQuantity;
    setRentalCart(updatedCart);
    
    // Aktualizace dostupných ks pro zobrazení
    const updatedEquipment = [...equipment];
    const equipItemIndex = updatedEquipment.findIndex(equip => equip.id === item.equipment_id);
    
    if (equipItemIndex >= 0) {
      const quantityChange = newQuantity - oldQuantity;
      updatedEquipment[equipItemIndex].available_stock -= quantityChange;
      setEquipment(updatedEquipment);
    }
  };
  
  // Odstranění položky z košíku
  const removeFromCart = (index) => {
    // Aktualizace dostupných ks pro zobrazení
    const removedItem = rentalCart[index];
    if (removedItem) {
      const updatedEquipment = [...equipment];
      const equipItemIndex = updatedEquipment.findIndex(item => item.id === removedItem.equipment_id);
      
      if (equipItemIndex >= 0) {
        // Vrátíme ks zpět do dostupného množství
        updatedEquipment[equipItemIndex].available_stock += removedItem.quantity;
        setEquipment(updatedEquipment);
      }
    }
    
    const updatedCart = rentalCart.filter((_, i) => i !== index);
    setRentalCart(updatedCart);
  };
  
  // Rychlé přidání množství položky v košíku
  const quickAddQuantity = (index, amount) => {
    const updatedCart = [...rentalCart];
    const item = updatedCart[index];
    const oldQuantity = item.quantity;
    let newQuantity = oldQuantity + amount;
    
    // Kontrola maximálního množství
    if (newQuantity > item.available_stock) {
      setError(`Nelze přidat více než ${item.available_stock} kusů.`);
      setTimeout(() => setError(null), 3000);
      newQuantity = item.available_stock;
    }
    
    // Kontrola minimálního množství
    if (newQuantity < 1) {
      newQuantity = 1;
    }
    
    updatedCart[index].quantity = newQuantity;
    setRentalCart(updatedCart);
    
    // Aktualizace dostupných ks pro zobrazení
    const updatedEquipment = [...equipment];
    const equipItemIndex = updatedEquipment.findIndex(equip => equip.id === item.equipment_id);
    
    if (equipItemIndex >= 0) {
      const quantityChange = newQuantity - oldQuantity;
      updatedEquipment[equipItemIndex].available_stock -= quantityChange;
      setEquipment(updatedEquipment);
    }
  };
  
  // Změna hodnoty v hlavním formuláři
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Validace formuláře před odesláním
  const validateForm = () => {
    // Kontrola data
    if (!formData.issue_date) {
      setError('Datum vydání je povinné.');
      return false;
    }
    
    if (!formData.planned_return_date) {
      setError('Plánované datum vrácení je povinné.');
      return false;
    }
    
    // Kontrola, že datum vrácení je po datu vydání
    const issueDate = new Date(formData.issue_date);
    const returnDate = new Date(formData.planned_return_date);
    if (returnDate <= issueDate) {
      setError('Datum vrácení musí být po datu vydání.');
      return false;
    }
    
    // Kontrola, zda je něco v košíku
    if (rentalCart.length === 0) {
      setError('Musíte přidat alespoň jednu položku do košíku.');
      return false;
    }
    
    return true;
  };
  
  // Odeslání formuláře
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      const numericOrderId = parseInt(order_id);
      if (isNaN(numericOrderId)) {
        throw new Error('Neplatné ID zakázky');
      }
      
      // Zajistíme, že token je nastaven na každém požadavku
      if (localStorage.getItem('token')) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
      } else {
        throw new Error('Pro přístup k této funkci se musíte přihlásit.');
      }
      
      // Vygenerujeme jedno batch_id pro celou skupinu výpůjček
      const batchId = `ISSUE-${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}-${Math.floor(Math.random() * 1000)}`;
      
      // Vytvoření pole pro uložení jednotlivých výpůjček
      const rentalsToSave = rentalCart.map(item => ({
        order_id: numericOrderId,
        equipment_id: parseInt(item.equipment_id),
        quantity: parseInt(item.quantity),
        issue_date: formData.issue_date,
        planned_return_date: formData.planned_return_date,
        daily_rate: parseFloat(item.daily_rate),
        status: formData.status,
        note: formData.note,
        batch_id: batchId
      }));
      
      // Pole pro ukládání výsledků
      const results = [];
      
      // Postupné ukládání jednotlivých výpůjček
      for (const rental of rentalsToSave) {
        const response = await axios.post(`${API_URL}/orders/${numericOrderId}/rentals`, rental);
        results.push(response.data);
      }
      
      // Uložíme batch_id pro pozdější použití
      setBatchId(batchId);
      setSaveSuccess(true);
      
      // Zobrazíme možnost generovat dodací list
      setShowDeliveryNoteOption(true);
      
    } catch (error) {
      console.error('Chyba při přidání výpůjčky:', error);
      
      // Pokud je chyba autorizace, zobrazíme specifickou zprávu
      if (error.response?.status === 401) {
        setError('Pro přístup k této funkci se musíte přihlásit. Přihlášení vypršelo nebo je neplatné.');
      } else {
        setError(error.response?.data?.message || error.message || 'Chyba při přidání výpůjčky.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Vypočítání subtotal pro konkrétní položku
  const calculateItemSubtotal = (item) => {
    return item.daily_rate * item.quantity * calculateDays();
  };
  
  // State pro feedback při úspěšném uložení
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  if (loading && !error) {
    return (
      <Container>
        <Alert variant="info">Načítání dat...</Alert>
      </Container>
    );
  }
  
  if (error && !saveSuccess) {
    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
        <div className="mt-3">
          <Button 
            as={Link} 
            to={`/orders/${order_id}`} 
            variant="outline-secondary"
            className="me-2"
          >
            Zpět na zakázku
          </Button>
          
          {error.includes('přihlásit') && (
            <Button 
              as={Link} 
              to="/login" 
              variant="primary"
            >
              Přihlásit se
            </Button>
          )}
        </div>
      </Container>
    );
  }
  
  if (!order && !saveSuccess) {
    return (
      <Container>
        <Alert variant="warning">Zakázka nebyla nalezena.</Alert>
        <Button 
          as={Link} 
          to="/orders" 
          variant="outline-secondary"
        >
          Zpět na seznam zakázek
        </Button>
      </Container>
    );
  }

  if (onSuccess && saveSuccess) {
    onSuccess();
  }
  
  const days = calculateDays();
  
  return (
    <Container>
      <h1 className="mb-4">Přidat výpůjčku do zakázky #{order?.order_number}</h1>
      
      {equipment.length === 0 && !saveSuccess && (
        <Alert variant="warning">
          Není k dispozici žádné dostupné vybavení k vypůjčení.
        </Alert>
      )}
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {saveSuccess && showDeliveryNoteOption && (
        <Alert variant="success">
          <p>Výpůjčky byly úspěšně přidány.</p>
          <div className="mt-2">
            <Button 
              as={Link} 
              to={`/orders/batch-rentals/${batchId}/delivery-note`} 
              variant="primary"
              className="me-2"
            >
              <FaFileAlt className="me-2" /> Zobrazit dodací list
            </Button>
            <Button 
              as={Link} 
              to={`/orders/${order_id}`} 
              variant="outline-secondary"
            >
              Zpět na zakázku
            </Button>
          </div>
        </Alert>
      )}
      
      {!saveSuccess && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Podrobnosti výpůjčky</h5>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Datum vydání *</Form.Label>
                    <Form.Control
                      type="date"
                      name="issue_date"
                      value={formData.issue_date}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Plánované datum vrácení *</Form.Label>
                    <Form.Control
                      type="date"
                      name="planned_return_date"
                      value={formData.planned_return_date}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Stav výpůjčky</Form.Label>
                    <Form.Select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="created">Vytvořeno</option>
                      <option value="issued">Vydáno</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Poznámka</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={1}
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Poznámka k výpůjčce"
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <div className="mb-2">
                <h5>Výběr položek k vypůjčení</h5>
                <p className="text-muted">
                  Počet dní: {days} {days === 1 ? 'den' : days >= 2 && days <= 4 ? 'dny' : 'dní'} | 
                  Položek v košíku: {rentalCart.length} | 
                  Celková cena: {formatCurrency(totalPrice)}
                </p>
              </div>
              
              {/* Tabbed interface for Browse/Cart */}
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
                      Procházet vybavení
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
                          <th>Název</th>
                          <th>Inv. číslo</th>
                          <th>Kategorie</th>
                          <th>Dostupné ks</th>
                          <th>Cena/den</th>
                          <th>Akce</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEquipment.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center">
                              Nebyla nalezena žádná položka odpovídající kritériím.
                            </td>
                          </tr>
                        ) : (
                          filteredEquipment.map(item => {
                            // Najdeme kategorii pro zobrazení
                            const category = categories.find(cat => cat.id === item.category_id);
                            
                            // Kontrola, zda položka je již v košíku
                            const inCart = rentalCart.some(cartItem => cartItem.equipment_id === item.id);
                            
                            return (
                              <tr key={item.id}>
                                <td>{item.name}</td>
                                <td>{item.inventory_number}</td>
                                <td>{category ? category.name : 'Neznámá kategorie'}</td>
                                <td>
                                  <Badge 
                                    bg={item.available_stock > 5 ? 'success' : 
                                       item.available_stock > 0 ? 'warning' : 'danger'}
                                  >
                                    {item.available_stock} ks
                                  </Badge>
                                </td>
                                <td>{formatCurrency(item.daily_rate)}</td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <Form.Control
                                      type="number"
                                      size="sm"
                                      min="1"
                                      max={item.available_stock}
                                      style={{ width: '70px' }}
                                      defaultValue="1"
                                      placeholder="Ks"
                                      onChange={(e) => {
                                        // Kontrola maxima při změně hodnoty
                                        const value = parseInt(e.target.value);
                                        if (value > item.available_stock) {
                                          e.target.value = item.available_stock;
                                          setError(`Nelze zadat více než ${item.available_stock} kusů.`);
                                          setTimeout(() => setError(null), 3000);
                                        }
                                        e.currentTarget.dataset.quantity = e.target.value;
                                      }}
                                      onKeyDown={(e) => {
                                        // Zamezit zadání hodnoty mimo rozsah pomocí šipek
                                        if (e.key === 'ArrowUp') {
                                          const newValue = parseInt(e.target.value || 0) + 1;
                                          if (newValue > item.available_stock) {
                                            e.preventDefault();
                                            e.target.value = item.available_stock;
                                          }
                                        }
                                      }}
                                      disabled={item.available_stock <= 0}
                                      className="me-2"
                                    />

                                    <Button
                                      variant={inCart ? "outline-success" : "success"}
                                      size="sm"
                                      onClick={(e) => {
                                        // Získat hodnotu ze sousedního inputu
                                        const input = e.target.closest('div').querySelector('input');
                                        let quantity = parseInt(input?.value || 1);
                                        
                                        // Ověření maximum
                                        if (quantity > item.available_stock) {
                                          quantity = item.available_stock;
                                          setError(`Nelze přidat více než ${item.available_stock} kusů.`);
                                          setTimeout(() => setError(null), 3000);
                                        }
                                        
                                        // Ověření minimum
                                        if (quantity < 1 || isNaN(quantity)) {
                                          quantity = 1;
                                        }
                                        
                                        addToCart(item, quantity);
                                        // Reset inputu
                                        if (input) input.value = 1;
                                      }}
                                      disabled={item.available_stock <= 0}
                                    >
                                      {inCart ? 'Přidat' : 'Přidat'}
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
                      Košík ({rentalCart.length})
                    </span>
                  }
                >
                  {rentalCart.length === 0 ? (
                    <Alert variant="info">
                      Košík je prázdný. Přidejte položky z nabídky vybavení.
                    </Alert>
                  ) : (
                    <div>
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <Table striped bordered hover responsive>
                          <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                            <tr>
                              <th style={{ width: '30%' }}>Vybavení</th>
                              <th style={{ width: '20%' }}>Množství</th>
                              <th style={{ width: '15%' }}>Cena/den</th>
                              <th style={{ width: '15%' }}>Dny</th>
                              <th style={{ width: '15%' }}>Celkem</th>
                              <th style={{ width: '5%' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {rentalCart.map((item, index) => (
                              <tr key={index}>
                                <td>
                                  <strong>{item.equipment_name}</strong>
                                  <br />
                                  <small className="text-muted">Inv. č.: {item.inventory_number}</small>
                                </td>
                                <td>
                                  <InputGroup size="sm">
                                    <Button
                                      variant="outline-secondary"
                                      onClick={() => quickAddQuantity(index, -1)}
                                    >
                                      -
                                    </Button>
                                    <Form.Control
                                      type="number"
                                      min="1"
                                      max={item.available_stock}
                                      value={item.quantity}
                                      onChange={(e) => {
                                        // Kontrola hodnoty při změně
                                        let value = parseInt(e.target.value);
                                        if (value > item.available_stock) {
                                          value = item.available_stock;
                                          e.target.value = value;
                                          setError(`Nelze zadat více než ${item.available_stock} kusů.`);
                                          setTimeout(() => setError(null), 3000);
                                        }
                                        updateCartItemQuantity(index, value);
                                      }}
                                      onKeyDown={(e) => {
                                        // Omezení hodnoty při použití šipek
                                        if (e.key === 'ArrowUp') {
                                          const newValue = item.quantity + 1;
                                          if (newValue > item.available_stock) {
                                            e.preventDefault();
                                          }
                                        }
                                      }}
                                      style={{ textAlign: 'center' }}
                                    />
                                    <Button
                                      variant="outline-secondary"
                                      onClick={() => quickAddQuantity(index, 1)}
                                      disabled={item.quantity >= item.available_stock}
                                    >
                                      +
                                    </Button>
                                  </InputGroup>
                                  <small className="text-muted d-block text-center mt-1">
                                    (max: {item.available_stock} ks)
                                  </small>
                                </td>
                                <td>
                                  {formatCurrency(item.daily_rate)}
                                </td>
                                <td>{days}</td>
                                <td>
                                  {formatCurrency(calculateItemSubtotal(item))}
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
                          <tfoot>
                            <tr>
                              <td colSpan="4" className="text-end">
                                <strong>Celkem:</strong>
                              </td>
                              <td>
                                <strong>{formatCurrency(totalPrice)}</strong>
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </Table>
                      </div>
                    </div>
                  )}
                </Tab>
              </Tabs>
              
              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button 
                  as={Link} 
                  to={`/orders/${order_id}`} 
                  variant="outline-secondary"
                  disabled={loading}
                >
                  Zrušit
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={loading || rentalCart.length === 0}
                >
                  {loading ? 'Ukládání...' : 'Vytvořit výpůjčky'}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default ImprovedAddRentalForm;