import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from '../../axios-config';
import { useAuth } from '../../context/AuthContext';
import { FaCheck, FaTimes, FaWarehouse, FaClipboardCheck } from 'react-icons/fa';

const InventoryCheckForm = () => {
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
  
  const [warehouses, setWarehouses] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [formData, setFormData] = useState({
    warehouse_id: '',
    check_date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'in_progress'
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1); // 1 = základní informace, 2 = kontrola položek
  
  // Načtení skladů
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await axios.get('/api/warehouses');
        setWarehouses(response.data.warehouses);
      } catch (error) {
        console.error('Chyba při načítání skladů:', error);
        setError('Nepodařilo se načíst sklady. Zkuste to prosím později.');
      }
    };
    
    fetchWarehouses();
  }, []);
  
  // Načtení dat při editaci
  useEffect(() => {
    if (isEditing) {
      const fetchInventoryCheck = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`/api/inventory-checks/${id}`);
          const inventoryData = response.data.inventory_check;
          
          setFormData({
            warehouse_id: inventoryData.warehouse_id,
            check_date: new Date(inventoryData.check_date).toISOString().split('T')[0],
            notes: inventoryData.notes || '',
            status: inventoryData.status
          });
          
          setItems(inventoryData.items || []);
          
          // Pokud už jsou položky, přejdeme na krok 2
          if (inventoryData.items && inventoryData.items.length > 0) {
            setStep(2);
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Chyba při načítání inventury:', error);
          setError('Nepodařilo se načíst data inventury. Zkuste to prosím později.');
          setLoading(false);
        }
      };
      
      fetchInventoryCheck();
    }
  }, [id, isEditing]);
  
  // Načtení vybavení ze skladu při výběru skladu nebo při editaci
  useEffect(() => {
    if (formData.warehouse_id) {
      const fetchEquipment = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`/api/warehouses/${formData.warehouse_id}/equipment`);
          setEquipment(response.data.equipment);
          
          // Pokud vytváříme novou inventuru, nastavíme automaticky položky
          if (!isEditing || (isEditing && items.length === 0)) {
            const newItems = response.data.equipment.map(item => ({
              equipment_id: item.id,
              name: item.name,
              inventory_number: item.inventory_number,
              category_name: item.category_name,
              expected_quantity: parseInt(item.total_stock) || 0,
              actual_quantity: null,
              notes: ''
            }));
            setItems(newItems);
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Chyba při načítání vybavení:', error);
          setError('Nepodařilo se načíst vybavení skladu. Zkuste to prosím později.');
          setLoading(false);
        }
      };
      
      fetchEquipment();
    }
  }, [formData.warehouse_id, isEditing, items.length]);
  
  // Zpracování změn ve formuláři
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Zpracování změn v položkách
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = field === 'actual_quantity' ? 
                            (value === '' ? null : parseInt(value)) : 
                            value;
    setItems(newItems);
  };
  
  // Přechod na další krok
  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.warehouse_id) {
        setError('Prosím vyberte sklad pro inventuru.');
        return;
      }
      
      setStep(2);
    }
  };
  
  // Přechod na předchozí krok
  const handlePrevStep = () => {
    setStep(1);
  };
  
  // Automatické vyplnění aktuálního množství podle očekávaného
  const handleAutoFill = () => {
    const newItems = items.map(item => ({
      ...item,
      actual_quantity: item.expected_quantity
    }));
    setItems(newItems);
  };
  
  // Označení všech zkontrolovaných položek
  const handleMarkAllChecked = () => {
    const newItems = items.map(item => ({
      ...item,
      actual_quantity: item.actual_quantity === null ? item.expected_quantity : item.actual_quantity
    }));
    setItems(newItems);
  };
  
  // Označení položky jako zkontrolované
  const handleMarkChecked = (index) => {
    const newItems = [...items];
    newItems[index].actual_quantity = newItems[index].expected_quantity;
    setItems(newItems);
  };
  
  // Vytvoření nebo aktualizace inventury
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (isEditing) {
        // V případě editace aktualizujeme položky inventury jednu po druhé
        for (const item of items) {
          if (item.actual_quantity !== null) {
            await axios.put(`/api/inventory-checks/${id}/items/${item.id}`, {
              actual_quantity: item.actual_quantity,
              notes: item.notes
            });
          }
        }
        
        // Získáme aktualizovaná data
        response = await axios.get(`/api/inventory-checks/${id}`);
      } else {
        // V případě vytvoření nové inventury
        const itemsToSubmit = items.map(item => ({
          equipment_id: item.equipment_id,
          expected_quantity: item.expected_quantity,
          actual_quantity: item.actual_quantity,
          notes: item.notes
        }));
        
        const submitData = {
          ...formData,
          items: itemsToSubmit
        };
        
        response = await axios.post('/api/inventory-checks', submitData);
      }
      
      setSuccess(true);
      
      // Přesměrování na detail inventury
      setTimeout(() => {
        const inventoryId = isEditing ? id : response.data.inventory_check.id;
        navigate(`/inventory-checks/${inventoryId}`);
      }, 1500);
    } catch (error) {
      console.error('Chyba při ukládání inventury:', error);
      setError(error.response?.data?.message || 'Chyba při ukládání inventury.');
    } finally {
      setLoading(false);
    }
  };
  
  // Kontrola stavu inventury - kolik položek zbývá zkontrolovat
  const remainingItems = items.filter(item => item.actual_quantity === null).length;
  const checkedItems = items.length - remainingItems;
  const percentageComplete = items.length > 0 ? Math.round((checkedItems / items.length) * 100) : 0;
  
  if (!user || user.role !== 'admin') {
    return null; // Skryjeme obsah, když probíhá přesměrování
  }
  
  return (
    <Container>
      <h1 className="mb-4">{isEditing ? 'Upravit inventuru' : 'Nová inventura'}</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">Inventura byla úspěšně uložena.</Alert>}
      
      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              {step === 1 ? (
                <>
                  <FaWarehouse className="me-2" />
                  Základní informace
                </>
              ) : (
                <>
                  <FaClipboardCheck className="me-2" />
                  Kontrola položek
                </>
              )}
            </h5>
            {step === 2 && (
              <div>
                <span className="text-muted me-2">
                  Zkontrolováno {checkedItems} z {items.length} položek ({percentageComplete}%)
                </span>
                <div className="progress" style={{ width: '200px', display: 'inline-block' }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{ width: `${percentageComplete}%` }}
                    aria-valuenow={percentageComplete}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {step === 1 && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Sklad *</Form.Label>
                    <Form.Select
                      name="warehouse_id"
                      value={formData.warehouse_id}
                      onChange={handleChange}
                      required
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
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Datum kontroly *</Form.Label>
                    <Form.Control
                      type="date"
                      name="check_date"
                      value={formData.check_date}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Poznámky</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Zadejte případné poznámky k inventuře"
                    />
                  </Form.Group>
                </Col>
                
                <Col xs={12} className="d-flex justify-content-end">
                  <Button
                    as={Link}
                    to="/inventory-checks"
                    variant="outline-secondary"
                    className="me-2"
                    disabled={loading}
                  >
                    Zrušit
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleNextStep}
                    disabled={loading || !formData.warehouse_id}
                  >
                    {loading ? 'Načítání...' : 'Další krok'}
                  </Button>
                </Col>
              </Row>
            )}
            
            {step === 2 && (
              <>
                <div className="mb-3 d-flex justify-content-between">
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={handlePrevStep}
                    disabled={loading || isEditing}
                    className="me-2"
                  >
                    Zpět
                  </Button>
                  
                  <div>
                    <Button
                      type="button"
                      variant="outline-primary"
                      onClick={handleAutoFill}
                      className="me-2"
                      disabled={loading}
                    >
                      Vyplnit všechny podle očekávaného množství
                    </Button>
                    <Button
                      type="button"
                      variant="outline-success"
                      onClick={handleMarkAllChecked}
                      disabled={loading}
                    >
                      Označit vše jako zkontrolované
                    </Button>
                  </div>
                </div>
                
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Název</th>
                        <th>Inv. číslo</th>
                        <th>Kategorie</th>
                        <th>Očekáváno</th>
                        <th>Skutečně</th>
                        <th>Rozdíl</th>
                        <th>Poznámky</th>
                        <th>Akce</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => {
                        const difference = item.actual_quantity !== null ? 
                                          item.actual_quantity - item.expected_quantity : 
                                          null;
                        return (
                          <tr key={index} className={
                            item.actual_quantity === null ? 'table-light' :
                            difference === 0 ? 'table-success' :
                            difference < 0 ? 'table-danger' : 'table-warning'
                          }>
                            <td>{index + 1}</td>
                            <td>{item.name}</td>
                            <td>{item.inventory_number}</td>
                            <td>{item.category_name}</td>
                            <td className="text-center">{item.expected_quantity}</td>
                            <td>
                              <Form.Control
                                type="number"
                                min="0"
                                value={item.actual_quantity === null ? '' : item.actual_quantity}
                                onChange={(e) => handleItemChange(index, 'actual_quantity', e.target.value)}
                                disabled={loading}
                                style={{ width: '80px' }}
                              />
                            </td>
                            <td className={
                              item.actual_quantity === null ? '' :
                              difference === 0 ? 'text-success' :
                              difference < 0 ? 'text-danger' : 'text-warning'
                            }>
                              {item.actual_quantity !== null ? (
                                difference > 0 ? `+${difference}` : difference
                              ) : '-'}
                            </td>
                            <td>
                              <Form.Control
                                type="text"
                                value={item.notes || ''}
                                onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                                disabled={loading}
                                placeholder="Poznámka"
                              />
                            </td>
                            <td className="text-center">
                              <Button
                                variant={item.actual_quantity === null ? 'outline-primary' : 'outline-success'}
                                size="sm"
                                onClick={() => handleMarkChecked(index)}
                                disabled={loading}
                                title={item.actual_quantity === null ? 'Označit jako zkontrolované' : 'Aktualizovat na očekávanou hodnotu'}
                              >
                                {item.actual_quantity === null ? <FaCheck /> : <FaCheck />}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
                
                <div className="d-flex justify-content-between mt-3">
                  <div>
                    {isEditing && (
                      <Form.Group className="mb-3">
                        <Form.Label>Stav inventury</Form.Label>
                        <Form.Select
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          disabled={loading}
                        >
                          <option value="in_progress">Probíhá</option>
                          <option value="completed">Dokončeno</option>
                          <option value="canceled">Zrušeno</option>
                        </Form.Select>
                      </Form.Group>
                    )}
                  </div>
                  <div>
                    <Button
                      as={Link}
                      to="/inventory-checks"
                      variant="outline-secondary"
                      className="me-2"
                      disabled={loading}
                    >
                      Zrušit
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
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
                        isEditing ? 'Aktualizovat inventuru' : 'Vytvořit inventuru'
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default InventoryCheckForm;