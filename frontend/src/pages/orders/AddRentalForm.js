import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Table } from 'react-bootstrap';
import { FaTrash, FaPlus, FaFileAlt } from 'react-icons/fa';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL, formatCurrency, formatDate } from '../../config';

const AddRentalForm = () => {
  const { order_id } = useParams();
  const navigate = useNavigate();
  
  // Stav pro celý formulář
  const [formData, setFormData] = useState({
    issue_date: new Date().toISOString().split('T')[0],
    planned_return_date: '',
    status: 'created',
    note: ''
  });

  // Stav pro seznam položek výpůjček
  const [rentalItems, setRentalItems] = useState([{
    equipment_id: '',
    quantity: 1,
    daily_rate: 0
  }]);
  
  const [equipment, setEquipment] = useState([]);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Stav pro batch_id
  const [batchId, setBatchId] = useState(null);
  const [showDeliveryNoteOption, setShowDeliveryNoteOption] = useState(false);
  
  // Výpočet celkové ceny
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Načtení dat zakázky a dostupného vybavení
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Načtení zakázky
        const orderResponse = await axios.get(`${API_URL}/orders/${order_id}`);
        setOrder(orderResponse.data.order);
        
        // Načtení dostupného vybavení
        const equipmentResponse = await axios.get(`${API_URL}/equipment`);
        const availableEquipment = equipmentResponse.data.equipment.filter(
          item => item.status === 'available' && (item.total_stock > 0)
        );
        setEquipment(availableEquipment);
        
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání dat:', error);
        setError('Nepodařilo se načíst data. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [order_id]);

  // Přepočet celkové ceny při změně dat
  useEffect(() => {
    calculateTotals();
  }, [rentalItems, formData.issue_date, formData.planned_return_date]);

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

  // Výpočet celkové ceny - OPRAVENO: Neaktualizuje rentalItems
  const calculateTotals = () => {
    const days = calculateDays();
    
    // Výpočet celkové ceny bez změny rentalItems
    let total = 0;
    for (const item of rentalItems) {
      const subtotal = item.daily_rate * item.quantity * days;
      total += subtotal;
    }
    
    setTotalPrice(total);
  };
  
  // Přidání nové položky do seznamu
  const addRentalItem = () => {
    setRentalItems([
      ...rentalItems,
      {
        equipment_id: '',
        quantity: 1,
        daily_rate: 0
      }
    ]);
  };
  
  // Odstranění položky ze seznamu
  const removeRentalItem = (index) => {
    if (rentalItems.length <= 1) {
      // Ponechat alespoň jednu položku
      return;
    }
    
    const newItems = rentalItems.filter((_, i) => i !== index);
    setRentalItems(newItems);
  };
  
  // Změna hodnoty v položce
  const handleItemChange = (index, field, value) => {
    const newItems = [...rentalItems];
    
    // Pokud se změnilo equipment_id, načteme denní sazbu
    if (field === 'equipment_id') {
      const selectedEquipment = equipment.find(eq => eq.id.toString() === value);
      if (selectedEquipment) {
        newItems[index] = {
          ...newItems[index],
          [field]: value,
          daily_rate: selectedEquipment.daily_rate
        };
      } else {
        newItems[index] = {
          ...newItems[index],
          [field]: value,
          daily_rate: 0
        };
      }
    } else if (field === 'quantity') {
      // Zajistíme, že množství je vždy alespoň 1
      const quantity = Math.max(1, parseInt(value) || 1);
      
      // Kontrola dostupnosti - omezíme množství podle skladových zásob
      if (newItems[index].equipment_id) {
        const selectedEquipment = equipment.find(eq => eq.id.toString() === newItems[index].equipment_id);
        if (selectedEquipment && selectedEquipment.total_stock) {
          const maxQuantity = parseInt(selectedEquipment.total_stock);
          newItems[index] = {
            ...newItems[index],
            [field]: Math.min(quantity, maxQuantity) // Omezíme množství na maximum dostupných kusů
          };
        } else {
          newItems[index] = {
            ...newItems[index],
            [field]: quantity
          };
        }
      } else {
        newItems[index] = {
          ...newItems[index],
          [field]: quantity
        };
      }
    } else {
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
    }
    
    setRentalItems(newItems);
  };
  
  // Změna hodnoty v hlavním formuláři
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Kontrola dostupnosti vybraného vybavení
  const checkAvailability = (equipmentId, quantity) => {
    const selectedEquipment = equipment.find(eq => eq.id.toString() === equipmentId);
    if (!selectedEquipment) return false;
    
    // Kontrola, zda je dostatek kusů
    if (selectedEquipment.total_stock && parseInt(selectedEquipment.total_stock) >= quantity) {
      return true;
    }
    
    return false;
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
    
    // Kontrola položek
    for (let i = 0; i < rentalItems.length; i++) {
      const item = rentalItems[i];
      
      if (!item.equipment_id) {
        setError(`Položka #${i+1}: Vybavení musí být vybráno.`);
        return false;
      }
      
      if (item.quantity < 1) {
        setError(`Položka #${i+1}: Množství musí být alespoň 1.`);
        return false;
      }
      
      // Kontrola dostupnosti
      if (!checkAvailability(item.equipment_id, item.quantity)) {
        setError(`Položka #${i+1}: Není dostatek kusů na skladě.`);
        return false;
      }
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
      // Vygenerujeme jedno batch_id pro celou skupinu výpůjček
      const batchId = `ISSUE-${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}-${Math.floor(Math.random() * 1000)}`;
      
      // Vytvoření pole pro uložení jednotlivých výpůjček
      const rentalsToSave = rentalItems.map(item => ({
        order_id: parseInt(order_id),
        equipment_id: parseInt(item.equipment_id),
        quantity: parseInt(item.quantity),
        issue_date: formData.issue_date,
        planned_return_date: formData.planned_return_date,
        daily_rate: parseFloat(item.daily_rate),
        status: formData.status,
        note: formData.note,
        batch_id: batchId // Přidáme batch_id
      }));
      
      // Pole pro ukládání výsledků
      const results = [];
      
      // Postupné ukládání jednotlivých výpůjček
      for (const rental of rentalsToSave) {
        const response = await axios.post(`${API_URL}/orders/${order_id}/rentals`, rental);
        results.push(response.data);
      }
      
      // Uložíme batch_id pro pozdější použití
      setBatchId(batchId);
      setSaveSuccess(true);
      
      // Zobrazíme možnost generovat dodací list
      setShowDeliveryNoteOption(true);
      
      // Automatické přesměrování je zde zakomentováno, aby uživatel mohl nejprve zobrazit dodací list
      // setTimeout(() => {
      //   navigate(`/orders/${order_id}`);
      // }, 1500);
    } catch (error) {
      console.error('Chyba při přidání výpůjčky:', error);
      setError(error.response?.data?.message || 'Chyba při přidání výpůjčky.');
    } finally {
      setLoading(false);
    }
  };
  
  // Získání informací o dostupných kusech vybraného vybavení
  const getAvailabilityInfo = (equipmentId) => {
    if (!equipmentId) return '';
    
    const selectedEquipment = equipment.find(eq => eq.id.toString() === equipmentId);
    if (!selectedEquipment) return '';
    
    return `K dispozici: ${selectedEquipment.total_stock || 0} ks`;
  };
  
  // Vypočítání subtotal pro konkrétní položku - dynamicky bez ukládání do stavu
  const calculateItemSubtotal = (item) => {
    return item.daily_rate * item.quantity * calculateDays();
  };
  
  if (loading) {
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
        <Button 
          as={Link} 
          to={`/orders/${order_id}`} 
          variant="outline-secondary"
        >
          Zpět na zakázku
        </Button>
      </Container>
    );
  }
  
  if (!order) {
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
  
  const days = calculateDays();
  
  return (
    <Container>
      <h1 className="mb-4">Přidat výpůjčku do zakázky #{order.order_number}</h1>
      
      {equipment.length === 0 && (
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
            <h5 className="mb-0">Základní informace</h5>
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
              
              <div className="mb-3">
                <h5>Seznam vypůjčených položek</h5>
                <p className="text-muted">Počet dní: {days} {days === 1 ? 'den' : days >= 2 && days <= 4 ? 'dny' : 'dní'}</p>
              </div>
              
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Vybavení</th>
                    <th style={{ width: '15%' }}>Množství</th>
                    <th style={{ width: '15%' }}>Denní sazba</th>
                    <th style={{ width: '20%' }}>Celkem</th>
                    <th style={{ width: '10%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rentalItems.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <Form.Select
                          value={item.equipment_id}
                          onChange={(e) => handleItemChange(index, 'equipment_id', e.target.value)}
                          required
                          disabled={loading}
                        >
                          <option value="">Vyberte vybavení</option>
                          {equipment.map(eq => (
                            <option key={eq.id} value={eq.id}>
                              {eq.name} - {eq.inventory_number} ({formatCurrency(eq.daily_rate)}/den)
                            </option>
                          ))}
                        </Form.Select>
                        <small className="text-muted">{getAvailabilityInfo(item.equipment_id)}</small>
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          required
                          disabled={loading}
                        />
                      </td>
                      <td>
                        {formatCurrency(item.daily_rate)}
                      </td>
                      <td>
                        {formatCurrency(calculateItemSubtotal(item))}
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeRentalItem(index)}
                          disabled={loading || rentalItems.length <= 1}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="5">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={addRentalItem}
                        disabled={loading}
                      >
                        <FaPlus /> Přidat položku
                      </Button>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="text-end">
                      <strong>Celkem:</strong>
                    </td>
                    <td>
                      <strong>{formatCurrency(totalPrice)}</strong>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </Table>
              
              <div className="d-flex justify-content-end gap-2 mt-3">
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
                  disabled={loading || equipment.length === 0}
                >
                  {loading ? 'Ukládání...' : 'Přidat výpůjčku'}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default AddRentalForm;