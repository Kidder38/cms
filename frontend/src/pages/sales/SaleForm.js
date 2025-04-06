import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Badge, Tabs, Tab, InputGroup, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from '../../axios-config';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../config';
import { FaPlus, FaTrash, FaSearch, FaTags, FaShoppingCart, FaFileInvoice } from 'react-icons/fa';

const SaleForm = () => {
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
  
  const [customers, setCustomers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  
  // Stav filtrace a vyhledávání
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  
  // Stav formuláře
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_number: '',
    sale_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: ''
  });
  
  // Košík
  const [cartItems, setCartItems] = useState([]);
  const [activeTab, setActiveTab] = useState('browse');
  
  // Stav aplikace
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Načtení zákazníků, kategorií a skladů
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [customersRes, categoriesRes, warehousesRes] = await Promise.all([
          axios.get('/api/customers'),
          axios.get('/api/categories'),
          axios.get('/api/warehouses')
        ]);
        
        setCustomers(customersRes.data.customers);
        setCategories(categoriesRes.data.categories);
        setWarehouses(warehousesRes.data.warehouses);
        
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
          
          // Filtrování pouze dostupného vybavení s cenou
          const availableEquipment = response.data.equipment.filter(item => 
            item.available_stock > 0 && (item.purchase_price > 0 || item.daily_rate > 0)
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
      const fetchSale = async () => {
        try {
          setLoading(true);
          
          const response = await axios.get(`/api/sales/${id}`);
          const saleData = response.data.sale;
          
          // Naplnění základních údajů
          setFormData({
            customer_id: saleData.customer_id || '',
            invoice_number: saleData.invoice_number || '',
            sale_date: saleData.sale_date ? new Date(saleData.sale_date).toISOString().split('T')[0] : '',
            payment_method: saleData.payment_method || 'cash',
            notes: saleData.notes || ''
          });
          
          // Naplnění položek
          if (saleData.items && saleData.items.length > 0) {
            setCartItems(saleData.items.map(item => ({
              id: item.id,
              equipment_id: item.equipment_id,
              equipment_name: item.equipment_name,
              inventory_number: item.inventory_number,
              quantity: parseInt(item.quantity) || 1,
              unit_price: parseFloat(item.unit_price) || 0,
              total_price: parseFloat(item.total_price) || 0,
              stock_limit: item.quantity
            })));
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Chyba při načítání prodeje:', error);
          setError('Nepodařilo se načíst data prodeje. Zkuste to prosím později.');
          setLoading(false);
        }
      };
      
      fetchSale();
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
      item => item.equipment_id === equipmentItem.id
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
        updatedCart[existingItemIndex].total_price = newQuantity * updatedCart[existingItemIndex].unit_price;
        
        // Aktualizace dostupných ks pro zobrazení
        if (equipItemIndex >= 0) {
          updatedEquipment[equipItemIndex].available_stock -= quantity;
        }
      }
      
      setCartItems(updatedCart);
    } else {
      // Položka ještě není v košíku, přidáme ji
      const unitPrice = parseFloat(equipmentItem.purchase_price) || parseFloat(equipmentItem.daily_rate) || 0;
      
      setCartItems([
        ...cartItems,
        {
          equipment_id: equipmentItem.id,
          equipment_name: equipmentItem.name,
          inventory_number: equipmentItem.inventory_number,
          quantity: quantity,
          unit_price: unitPrice,
          total_price: unitPrice * quantity,
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
    updatedCart[index].total_price = newQuantity * updatedCart[index].unit_price;
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
    updatedCart[index].total_price = newQuantity * updatedCart[index].unit_price;
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
  
  // Výpočet celkové ceny
  const calculateTotalAmount = () => {
    return cartItems.reduce((sum, item) => sum + item.total_price, 0);
  };
  
  // Změna ceny položky v košíku
  const handleItemPriceChange = (index, value) => {
    const newItems = [...cartItems];
    const item = newItems[index];
    
    const newPrice = parseFloat(value) || 0;
    item.unit_price = newPrice;
    item.total_price = item.quantity * newPrice;
    
    setCartItems(newItems);
  };
  
  // Validace formuláře
  const validateForm = () => {
    if (!formData.sale_date) {
      setError('Datum prodeje je povinné.');
      return false;
    }
    
    if (cartItems.length === 0) {
      setError('Přidejte alespoň jednu položku do košíku.');
      return false;
    }
    
    // Kontrola, že všechny položky mají platnou cenu
    const invalidPriceItems = cartItems.filter(item => item.unit_price <= 0);
    if (invalidPriceItems.length > 0) {
      const itemNames = invalidPriceItems.map(item => item.equipment_name).join(', ');
      setError(`Následující položky mají neplatnou cenu: ${itemNames}`);
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
      // Rozdílný postup pro nový prodej a editaci
      if (isEditing) {
        // Při editaci odesíláme celý objekt
        const requestData = {
          ...formData,
          items: cartItems.map(item => ({
            equipment_id: item.equipment_id,
            quantity: item.quantity,
            unit_price: item.unit_price
          })),
          total_amount: calculateTotalAmount()
        };
        
        await axios.put(`/api/sales/${id}`, requestData);
      } else {
        // Pro nové prodeje zpracujeme každou položku zvlášť
        let firstSaleId = null;
        
        for (const item of cartItems) {
          const itemData = {
            equipment_id: item.equipment_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            customer_id: formData.customer_id,
            invoice_number: formData.invoice_number,
            sale_date: formData.sale_date,
            payment_method: formData.payment_method,
            notes: formData.notes
          };
          
          const response = await axios.post('/api/sales', itemData);
          
          // Uložíme ID prvního prodeje pro PDF
          if (!firstSaleId && response.data.sale && response.data.sale.id) {
            firstSaleId = response.data.sale.id;
          }
        }
      }
      
      setSuccess(true);
      
      // Generování a zobrazení PDF
      try {
        let saleId = id;
        if (!isEditing) {
          // Získáme ID posledního prodeje, pokud nemáme ID z vytvořeného prodeje
          const latestSales = await axios.get('/api/sales');
          if (latestSales.data.sales && latestSales.data.sales.length > 0) {
            saleId = latestSales.data.sales[0].id;
          }
        }
        
        if (saleId) {
          // Získání prodeje se všemi daty
          const saleDataResponse = await axios.get(`/api/sales/${saleId}`);
          
          // Import alternativní PDF utility s lepší podporou češtiny
          const { generateSaleInvoicePdf } = await import('../../util/pdfUtilsAlternative');
          
          // Generování PDF a zobrazení
          const pdf = await generateSaleInvoicePdf(saleDataResponse.data.sale);
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
        navigate('/sales');
      }, 1500);
    } catch (error) {
      console.error('Chyba při ukládání prodeje:', error);
      setError(error.response?.data?.message || 'Chyba při ukládání prodeje. Zkuste to prosím později.');
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
        <FaFileInvoice className="me-2" />
        {isEditing ? 'Upravit prodej' : 'Nový prodej'}
      </h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">Prodej byl úspěšně uložen.</Alert>}
      
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Podrobnosti prodeje</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Zákazník</Form.Label>
                  <Form.Select
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">Hotovostní prodej</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Číslo faktury / dokladu</Form.Label>
                  <Form.Control
                    type="text"
                    name="invoice_number"
                    value={formData.invoice_number}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Zadejte číslo faktury"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Datum prodeje *</Form.Label>
                  <Form.Control
                    type="date"
                    name="sale_date"
                    value={formData.sale_date}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Způsob platby</Form.Label>
                  <Form.Select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="cash">Hotovost</option>
                    <option value="card">Platební karta</option>
                    <option value="bank_transfer">Bankovní převod</option>
                    <option value="invoice">Faktura</option>
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
                    placeholder="Zadejte poznámky k prodeji"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <div className="mb-2">
              <h5>Výběr položek k prodeji</h5>
              <p className="text-muted">
                Položek v košíku: {cartItems.length} | 
                Celková cena: {formatCurrency(calculateTotalAmount())}
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
                    Při editaci prodeje není možné přidávat nové položky.
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
                          <th>Cena za ks</th>
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
                            
                            // Určení ceny pro zobrazení
                            const price = parseFloat(item.purchase_price) || parseFloat(item.daily_rate) || 0;
                            
                            // Kontrola, zda položka je již v košíku
                            const inCart = cartItems.some(cartItem => cartItem.equipment_id === item.id);
                            
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
                                <td>{formatCurrency(price)}</td>
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
                            <th style={{ width: '30%' }}>Vybavení</th>
                            <th style={{ width: '20%' }}>Množství</th>
                            <th style={{ width: '25%' }}>Jednotková cena</th>
                            <th style={{ width: '20%' }}>Celkem</th>
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
                                    value={item.unit_price}
                                    onChange={(e) => handleItemPriceChange(index, e.target.value)}
                                    disabled={loading}
                                    style={{ textAlign: 'right' }}
                                  />
                                </InputGroup>
                              </td>
                              <td className="text-end">
                                {formatCurrency(item.total_price)}
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
                            <td colSpan="3" className="text-end">
                              <strong>Celkem:</strong>
                            </td>
                            <td className="text-end">
                              <strong>{formatCurrency(calculateTotalAmount())}</strong>
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
                to="/sales" 
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
                  'Uložit prodej'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SaleForm;