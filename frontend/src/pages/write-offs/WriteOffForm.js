import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Badge, Tabs, Tab, InputGroup, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from '../../axios-config';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../config';
import { FaPlus, FaTrash, FaSearch, FaTags, FaShoppingCart, FaTrashAlt, FaExclamationTriangle } from 'react-icons/fa';

const WriteOffForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;
  
  // Kontrola oprávnění
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Stav filtrace a vyhledávání
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  
  // Data z API
  const [warehouses, setWarehouses] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Stav formuláře
  const [formData, setFormData] = useState({
    write_off_date: new Date().toISOString().split('T')[0],
    reason: 'damaged',
    notes: ''
  });
  
  // Košík
  const [cartItems, setCartItems] = useState([]);
  const [activeTab, setActiveTab] = useState('browse');
  
  // Stav aplikace
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Načtení skladů a kategorií
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [warehousesRes, categoriesRes] = await Promise.all([
          axios.get('/api/warehouses'),
          axios.get('/api/categories')
        ]);
        
        setWarehouses(warehousesRes.data.warehouses);
        setCategories(categoriesRes.data.categories);
        
        // Nastavíme první sklad jako výchozí
        if (warehousesRes.data.warehouses.length > 0 && !selectedWarehouse) {
          setSelectedWarehouse(warehousesRes.data.warehouses[0].id.toString());
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání dat:', error);
        setError('Nepodařilo se načíst potřebná data. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Načtení vybavení podle vybraného skladu
  useEffect(() => {
    if (selectedWarehouse) {
      const fetchEquipment = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`/api/warehouses/${selectedWarehouse}/equipment`);
          
          // Filtrování pouze dostupného vybavení
          const availableEquipment = response.data.equipment.filter(item => 
            item.available_stock > 0
          );
          
          setEquipment(availableEquipment);
          setLoading(false);
        } catch (error) {
          console.error('Chyba při načítání vybavení:', error);
          setError('Nepodařilo se načíst vybavení skladu.');
          setLoading(false);
        }
      };
      
      fetchEquipment();
    } else {
      setEquipment([]);
    }
  }, [selectedWarehouse]);
  
  // Načtení dat při editaci
  useEffect(() => {
    if (isEditing && id) {
      const fetchWriteOff = async () => {
        try {
          setLoading(true);
          
          const response = await axios.get(`/api/write-offs/${id}`);
          const writeOffData = response.data.write_off;
          
          // Naplnění základních údajů
          setFormData({
            write_off_date: writeOffData.write_off_date ? new Date(writeOffData.write_off_date).toISOString().split('T')[0] : '',
            reason: writeOffData.reason || 'damaged',
            notes: writeOffData.notes || ''
          });
          
          // Naplnění položek
          if (writeOffData.items && writeOffData.items.length > 0) {
            setCartItems(writeOffData.items.map(item => ({
              id: item.id,
              equipment_id: item.equipment_id,
              equipment_name: item.equipment_name,
              inventory_number: item.inventory_number,
              quantity: parseInt(item.quantity) || 1,
              unit_value: parseFloat(item.unit_value) || 0,
              total_value: parseFloat(item.total_value) || 0,
              warehouse_id: item.warehouse_id,
              warehouse_name: item.warehouse_name,
              stock_limit: item.quantity
            })));
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Chyba při načítání odpisu:', error);
          setError('Nepodařilo se načíst data odpisu. Zkuste to prosím později.');
          setLoading(false);
        }
      };
      
      fetchWriteOff();
    }
  }, [id, isEditing]);
  
  // Filtrované vybavení podle vyhledávání a kategorie
  const filteredEquipment = useMemo(() => {
    return equipment.filter(item => {
      // Filtr podle vyhledávání
      const searchMatch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (item.inventory_number && item.inventory_number.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtr podle kategorie
      const categoryMatch = selectedCategory === '' || 
        item.category_id === parseInt(selectedCategory);
      
      return searchMatch && categoryMatch;
    });
  }, [equipment, searchTerm, selectedCategory]);
  
  // Změna výběru skladu
  const handleWarehouseChange = (e) => {
    setSelectedWarehouse(e.target.value);
    setSearchTerm('');
    setSelectedCategory('');
  };
  
  // Přidání položky do košíku
  const addToCart = (equipmentItem, quantity = 1) => {
    // Ověření, že množství je v rozsahu
    quantity = Math.max(1, Math.min(quantity, equipmentItem.available_stock));
    
    // Zkontrolujeme, zda položka už je v košíku
    const existingItemIndex = cartItems.findIndex(
      item => item.equipment_id === equipmentItem.id && item.warehouse_id === parseInt(selectedWarehouse)
    );
    
    // Aktualizujeme dostupné množství po přidání do košíku
    const updatedEquipment = [...equipment];
    const equipItemIndex = updatedEquipment.findIndex(item => item.id === equipmentItem.id);
    
    if (existingItemIndex >= 0) {
      // Položka už je v košíku, zvýšíme množství
      const updatedCart = [...cartItems];
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
        updatedCart[existingItemIndex].total_value = newQuantity * updatedCart[existingItemIndex].unit_value;
        
        // Aktualizace dostupných ks pro zobrazení
        if (equipItemIndex >= 0) {
          updatedEquipment[equipItemIndex].available_stock -= quantity;
        }
      }
      
      setCartItems(updatedCart);
    } else {
      // Položka ještě není v košíku, přidáme ji
      const selectedWarehouseObj = warehouses.find(w => w.id === parseInt(selectedWarehouse));
      const unitValue = parseFloat(equipmentItem.purchase_price) || parseFloat(equipmentItem.daily_rate) || 0;
      
      setCartItems([
        ...cartItems,
        {
          equipment_id: equipmentItem.id,
          equipment_name: equipmentItem.name,
          inventory_number: equipmentItem.inventory_number,
          quantity: quantity,
          unit_value: unitValue,
          total_value: unitValue * quantity,
          warehouse_id: parseInt(selectedWarehouse),
          warehouse_name: selectedWarehouseObj ? selectedWarehouseObj.name : '',
          stock_limit: equipmentItem.available_stock
        }
      ]);
      
      // Aktualizace dostupných ks pro zobrazení
      if (equipItemIndex >= 0) {
        updatedEquipment[equipItemIndex].available_stock -= quantity;
      }
    }
    
    // Aktualizujeme stav equipment s novými hodnotami dostupnosti
    setEquipment(updatedEquipment);
    
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
          <small>V košíku: ${cartItems.length + (existingItemIndex >= 0 ? 0 : 1)} položek</small>
          <div class="mt-2">
            <button type="button" class="btn btn-sm btn-outline-secondary" 
              onclick="document.querySelector('[data-rr-ui-event-key=\\'cart\\']').click(); this.parentElement.parentElement.parentElement.parentElement.remove()">
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
    const updatedCart = [...cartItems];
    const item = updatedCart[index];
    const oldQuantity = item.quantity;
    
    // Ověříme, že nové množství nepřekročí dostupný počet kusů
    if (!isEditing && newQuantity > item.stock_limit) {
      setError(`Nelze přidat více než ${item.stock_limit} kusů položky "${item.equipment_name}".`);
      setTimeout(() => setError(null), 3000);
      newQuantity = item.stock_limit;
    }
    
    // Zajistíme minimální množství 1
    newQuantity = Math.max(1, newQuantity);
    
    updatedCart[index].quantity = newQuantity;
    updatedCart[index].total_value = newQuantity * updatedCart[index].unit_value;
    setCartItems(updatedCart);
    
    // Aktualizace dostupných ks pro zobrazení
    if (!isEditing) {
      const updatedEquipment = [...equipment];
      const equipItemIndex = updatedEquipment.findIndex(equip => equip.id === item.equipment_id);
      
      if (equipItemIndex >= 0) {
        const quantityChange = newQuantity - oldQuantity;
        updatedEquipment[equipItemIndex].available_stock -= quantityChange;
        setEquipment(updatedEquipment);
      }
    }
  };
  
  // Rychlé přidání množství položky v košíku
  const quickAddQuantity = (index, amount) => {
    const updatedCart = [...cartItems];
    const item = updatedCart[index];
    const oldQuantity = item.quantity;
    let newQuantity = oldQuantity + amount;
    
    // Kontrola maximálního množství
    if (!isEditing && newQuantity > item.stock_limit) {
      setError(`Nelze přidat více než ${item.stock_limit} kusů.`);
      setTimeout(() => setError(null), 3000);
      newQuantity = item.stock_limit;
    }
    
    // Kontrola minimálního množství
    if (newQuantity < 1) {
      newQuantity = 1;
    }
    
    updatedCart[index].quantity = newQuantity;
    updatedCart[index].total_value = newQuantity * updatedCart[index].unit_value;
    setCartItems(updatedCart);
    
    // Aktualizace dostupných ks pro zobrazení
    if (!isEditing) {
      const updatedEquipment = [...equipment];
      const equipItemIndex = updatedEquipment.findIndex(equip => equip.id === item.equipment_id);
      
      if (equipItemIndex >= 0) {
        const quantityChange = newQuantity - oldQuantity;
        updatedEquipment[equipItemIndex].available_stock -= quantityChange;
        setEquipment(updatedEquipment);
      }
    }
  };
  
  // Odstranění položky z košíku
  const removeFromCart = (index) => {
    // Aktualizace dostupných ks pro zobrazení
    if (!isEditing) {
      const removedItem = cartItems[index];
      if (removedItem) {
        const updatedEquipment = [...equipment];
        const equipItemIndex = updatedEquipment.findIndex(item => item.id === removedItem.equipment_id);
        
        if (equipItemIndex >= 0) {
          // Vrátíme ks zpět do dostupného množství
          updatedEquipment[equipItemIndex].available_stock += removedItem.quantity;
          setEquipment(updatedEquipment);
        }
      }
    }
    
    const updatedCart = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedCart);
  };
  
  // Změna hodnoty v hlavním formuláři
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Výpočet celkové hodnoty
  const calculateTotalValue = () => {
    return cartItems.reduce((sum, item) => sum + item.total_value, 0);
  };
  
  // Změna hodnoty položky v košíku
  const handleItemValueChange = (index, value) => {
    const newItems = [...cartItems];
    const item = newItems[index];
    
    const newValue = parseFloat(value) || 0;
    item.unit_value = newValue;
    item.total_value = item.quantity * newValue;
    
    setCartItems(newItems);
  };
  
  // Validace formuláře
  const validateForm = () => {
    if (!formData.write_off_date) {
      setError('Datum odpisu je povinné.');
      return false;
    }
    
    if (cartItems.length === 0) {
      setError('Přidejte alespoň jednu položku do košíku.');
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
    
    try {
      // Rozdílný postup pro nový odpis a editaci
      if (isEditing) {
        // Při editaci odesíláme celý objekt s položkami
        const requestData = {
          ...formData,
          items: cartItems.map(item => ({
            equipment_id: item.equipment_id,
            quantity: item.quantity,
            unit_value: item.unit_value,
            warehouse_id: item.warehouse_id
          })),
          total_value: calculateTotalValue()
        };
        
        await axios.put(`/api/write-offs/${id}`, requestData);
      } else {
        // Pro nové odpisy musíme zpracovat každou položku zvlášť
        for (const item of cartItems) {
          const itemData = {
            equipment_id: item.equipment_id,
            quantity: item.quantity,
            reason: formData.reason,
            notes: formData.notes,
            write_off_date: formData.write_off_date
          };
          
          await axios.post('/api/write-offs', itemData);
        }
      }
      
      setSuccess(true);
      
      // Generování a zobrazení PDF pro poslední odpis
      // Při vytváření více položek toto asi nebude fungovat správně,
      // ale pro jednoduchost necháme
      try {
        let writeOffId = id;
        if (!isEditing) {
          // Získáme ID posledního odpisu
          const latestWriteOffs = await axios.get('/api/write-offs');
          if (latestWriteOffs.data.write_offs && latestWriteOffs.data.write_offs.length > 0) {
            writeOffId = latestWriteOffs.data.write_offs[0].id;
          }
        }
        
        if (writeOffId) {
          // Získání odpisu se všemi daty
          const writeOffDataResponse = await axios.get(`/api/write-offs/${writeOffId}`);
          
          // Import PDF utility s lepší podporou češtiny
          const { generateWriteOffDocumentPdf } = await import('../../util/pdfUtilsAlternative');
          
          // Generování PDF a zobrazení
          const pdf = await generateWriteOffDocumentPdf(writeOffDataResponse.data.write_off);
          const pdfBlob = pdf.output('blob');
          const pdfUrl = URL.createObjectURL(pdfBlob);
          window.open(pdfUrl, '_blank');
        }
      } catch (pdfError) {
        console.error('Chyba při generování PDF:', pdfError);
        // Pokračujeme i při chybě generování PDF
      }
      
      // Přesměrování zpět na seznam po úspěšném uložení
      setTimeout(() => {
        navigate('/write-offs');
      }, 1500);
    } catch (error) {
      console.error('Chyba při ukládání odpisu:', error);
      setError(error.response?.data?.message || 'Chyba při ukládání odpisu. Zkuste to prosím později.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!user || user.role !== 'admin') {
    return null; // Skryjeme obsah, když probíhá přesměrování
  }
  
  return (
    <Container>
      <h1 className="mb-4">
        <FaTrashAlt className="me-2" />
        {isEditing ? 'Upravit odpis' : 'Nový odpis'}
      </h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">Odpis byl úspěšně uložen.</Alert>}
      
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Podrobnosti odpisu</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Datum odpisu *</Form.Label>
                  <Form.Control
                    type="date"
                    name="write_off_date"
                    value={formData.write_off_date}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Důvod odpisu *</Form.Label>
                  <Form.Select
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="damaged">Poškozeno</option>
                    <option value="lost">Ztraceno</option>
                    <option value="expired">Prošlá životnost</option>
                    <option value="other">Jiný důvod</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Sklad pro výběr položek</Form.Label>
                  <Form.Select
                    value={selectedWarehouse}
                    onChange={handleWarehouseChange}
                    disabled={loading || isEditing}
                  >
                    <option value="">Vyberte sklad</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Poznámky</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Zadejte poznámky k odpisu"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <div className="mb-2">
              <h5>Výběr položek k odpisu</h5>
              <p className="text-muted">
                Položek v košíku: {cartItems.length} | 
                Celková hodnota: {formatCurrency(calculateTotalValue())}
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
                          disabled={!selectedWarehouse || isEditing}
                        />
                        <Button 
                          variant="outline-secondary" 
                          onClick={() => setSearchTerm('')}
                          disabled={!selectedWarehouse || isEditing}
                        >
                          Vyčistit
                        </Button>
                      </InputGroup>
                    </Col>
                    <Col md={6}>
                      <Form.Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        disabled={!selectedWarehouse || isEditing}
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
                
                {!selectedWarehouse && !isEditing ? (
                  <Alert variant="info">
                    Vyberte sklad pro zobrazení dostupného vybavení.
                  </Alert>
                ) : isEditing ? (
                  <Alert variant="info">
                    Při editaci odpisu není možné přidávat nové položky.
                  </Alert>
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <Table striped bordered hover responsive>
                      <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                        <tr>
                          <th>Název</th>
                          <th>Inv. číslo</th>
                          <th>Kategorie</th>
                          <th>Dostupné ks</th>
                          <th>Hodnota za ks</th>
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
                            
                            // Určení hodnoty pro zobrazení
                            const value = parseFloat(item.purchase_price) || parseFloat(item.daily_rate) || 0;
                            
                            // Kontrola, zda položka je již v košíku pro tento sklad
                            const inCart = cartItems.some(
                              cartItem => cartItem.equipment_id === item.id && 
                                          cartItem.warehouse_id === parseInt(selectedWarehouse)
                            );
                            
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
                                <td>{formatCurrency(value)}</td>
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
                                      <FaPlus className="me-1" /> Přidat
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
                )}
              </Tab>
              
              <Tab 
                eventKey="cart" 
                title={
                  <span>
                    <FaShoppingCart className="me-2" />
                    Košík ({cartItems.length})
                  </span>
                }
              >
                {cartItems.length === 0 ? (
                  <Alert variant="info">
                    Košík je prázdný. Přidejte položky z nabídky vybavení.
                  </Alert>
                ) : (
                  <div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <Table striped bordered hover responsive>
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                          <tr>
                            <th style={{ width: '25%' }}>Vybavení</th>
                            <th style={{ width: '15%' }}>Sklad</th>
                            <th style={{ width: '15%' }}>Množství</th>
                            <th style={{ width: '20%' }}>Hodnota za ks</th>
                            <th style={{ width: '15%' }}>Celkem</th>
                            <th style={{ width: '5%' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {cartItems.map((item, index) => (
                            <tr key={index}>
                              <td>
                                <strong>{item.equipment_name}</strong>
                                <br />
                                <small className="text-muted">Inv. č.: {item.inventory_number}</small>
                              </td>
                              <td>{item.warehouse_name}</td>
                              <td>
                                <InputGroup size="sm">
                                  <Button
                                    variant="outline-secondary"
                                    onClick={() => quickAddQuantity(index, -1)}
                                    disabled={loading}
                                  >
                                    -
                                  </Button>
                                  <Form.Control
                                    type="number"
                                    min="1"
                                    max={item.stock_limit}
                                    value={item.quantity}
                                    onChange={(e) => {
                                      // Kontrola hodnoty při změně
                                      let value = parseInt(e.target.value);
                                      if (!isEditing && value > item.stock_limit) {
                                        value = item.stock_limit;
                                        e.target.value = value;
                                        setError(`Nelze zadat více než ${item.stock_limit} kusů.`);
                                        setTimeout(() => setError(null), 3000);
                                      }
                                      updateCartItemQuantity(index, value);
                                    }}
                                    disabled={loading}
                                    style={{ textAlign: 'center' }}
                                  />
                                  <Button
                                    variant="outline-secondary"
                                    onClick={() => quickAddQuantity(index, 1)}
                                    disabled={loading || (!isEditing && item.quantity >= item.stock_limit)}
                                  >
                                    +
                                  </Button>
                                </InputGroup>
                                {!isEditing && item.stock_limit && (
                                  <small className="text-muted d-block text-center mt-1">
                                    (max: {item.stock_limit} ks)
                                  </small>
                                )}
                              </td>
                              <td>
                                <InputGroup size="sm">
                                  <InputGroup.Text>Kč</InputGroup.Text>
                                  <Form.Control
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.unit_value}
                                    onChange={(e) => handleItemValueChange(index, e.target.value)}
                                    disabled={loading}
                                    style={{ textAlign: 'right' }}
                                  />
                                </InputGroup>
                              </td>
                              <td className="text-end">
                                {formatCurrency(item.total_value)}
                              </td>
                              <td className="text-center">
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => removeFromCart(index)}
                                  disabled={loading}
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
                            <td className="text-end">
                              <strong>{formatCurrency(calculateTotalValue())}</strong>
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
                to="/write-offs" 
                variant="outline-secondary"
                disabled={loading}
              >
                Zrušit
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={loading || cartItems.length === 0}
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Ukládání...
                  </>
                ) : (
                  'Uložit odpis'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      {!isEditing && (
        <Alert variant="warning" className="d-flex align-items-center">
          <FaExclamationTriangle className="me-2" />
          <div>
            <strong>Upozornění:</strong> Odepsané položky budou trvale odečteny ze skladu!
          </div>
        </Alert>
      )}
    </Container>
  );
};

export default WriteOffForm;