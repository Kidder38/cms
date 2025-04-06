import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, InputGroup, Form, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from '../../axios-config';
import { formatCurrency, EQUIPMENT_STATUS } from '../../config';
import { useAuth } from '../../context/AuthContext';
import ImportEquipmentModal from '../../components/equipment/ImportEquipmentModal';

const EquipmentList = () => {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedWarehouses, setSelectedWarehouses] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  
  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/equipment`);
      setEquipment(response.data.equipment);
      setLoading(false);
    } catch (error) {
      console.error('Chyba při načítání vybavení:', error);
      setError('Nepodařilo se načíst vybavení. Zkuste to prosím později.');
      setLoading(false);
    }
  };
  
  const fetchWarehouses = async () => {
    try {
      const response = await axios.get('/api/warehouses');
      setWarehouses(response.data.warehouses);
    } catch (error) {
      console.error('Chyba při načítání skladů:', error);
    }
  };
  
  useEffect(() => {
    fetchEquipment();
    fetchWarehouses();
  }, []);
  
  const handleWarehouseSelect = (warehouseId) => {
    setSelectedWarehouses(prev => {
      if (prev.includes(warehouseId)) {
        // Pokud už je vybraný, odstraníme ho
        return prev.filter(id => id !== warehouseId);
      } else {
        // Jinak ho přidáme
        return [...prev, warehouseId];
      }
    });
  };
  
  // Filtrované vybavení podle vyhledávání a vybraných skladů
  const filteredEquipment = equipment?.filter(item => {
    // Nejdříve aplikujeme textové vyhledávání
    const matchesSearch = item && (
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.inventory_number?.toLowerCase().includes(search.toLowerCase()) ||
      (item.category_name && item.category_name.toLowerCase().includes(search.toLowerCase()))
    );
    
    // Potom filtrujeme podle vybraných skladů (pokud jsou nějaké vybrané)
    const matchesWarehouse = selectedWarehouses.length === 0 || 
      (item.warehouse_id && selectedWarehouses.includes(item.warehouse_id));
    
    return matchesSearch && matchesWarehouse;
  }) || [];
  
  const handleImportComplete = () => {
    // Po úspěšném importu aktualizujeme seznam vybavení
    fetchEquipment();
  };
  
  if (loading) {
    return (
      <Container>
        <Alert variant="info">Načítání vybavení...</Alert>
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
  
  return (
    <Container>
      <h1 className="mb-4">Seznam vybavení</h1>
      
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Hledat vybavení"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <Button 
                variant="outline-secondary"
                onClick={() => setSearch('')}
              >
                ×
              </Button>
            )}
          </InputGroup>
          
          {warehouses.length > 0 && (
            <div className="mb-3">
              <Form.Label>Filtrovat podle skladu:</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {warehouses.map(warehouse => (
                  <Badge 
                    key={warehouse.id}
                    bg={selectedWarehouses.includes(warehouse.id) ? "primary" : "light"} 
                    text={selectedWarehouses.includes(warehouse.id) ? "white" : "dark"}
                    className="p-2 cursor-pointer"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleWarehouseSelect(warehouse.id)}
                  >
                    {warehouse.name}
                    {selectedWarehouses.includes(warehouse.id) && (
                      <span className="ms-1">×</span>
                    )}
                  </Badge>
                ))}
                {selectedWarehouses.length > 0 && (
                  <Badge 
                    bg="danger" 
                    className="p-2 cursor-pointer"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedWarehouses([])}
                  >
                    Zrušit filtry ×
                  </Badge>
                )}
              </div>
            </div>
          )}
        </Col>
        
        {user?.role === 'admin' && (
          <Col md={6} className="d-flex justify-content-end gap-2">
            <Button 
              variant="outline-primary"
              onClick={() => setShowImportModal(true)}
            >
              Import z Excelu
            </Button>
            <Button as={Link} to="/equipment/new" variant="primary">
              Přidat vybavení
            </Button>
          </Col>
        )}
      </Row>
      
      <Card>
        <Card.Body>
          {filteredEquipment.length === 0 ? (
            <Alert variant="info">
              {search || selectedWarehouses.length > 0 
                ? 'Žádné vybavení neodpovídá zadaným filtrům.'
                : 'Žádné vybavení nebylo nalezeno.'}
            </Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Název</th>
                  <th>Inventární číslo</th>
                  <th>Kategorie</th>
                  <th>Denní sazba</th>
                  <th>Stav</th>
                  <th>Sklad</th>
                  <th>Umístění</th>
                  <th>Akce</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.inventory_number}</td>
                    <td>{item.category_name || '-'}</td>
                    <td>{formatCurrency(item.daily_rate)}</td>
                    <td>
                      <span className={`badge bg-${EQUIPMENT_STATUS[item.status].color}`}>
                        {EQUIPMENT_STATUS[item.status].label}
                      </span>
                    </td>
                    <td>
                      {item.warehouse_name ? (
                        <Badge 
                          bg={item.warehouse_id && selectedWarehouses.includes(item.warehouse_id) ? "primary" : "light"}
                          text={item.warehouse_id && selectedWarehouses.includes(item.warehouse_id) ? "white" : "dark"}
                          className="p-1"
                        >
                          {item.warehouse_name}
                        </Badge>
                      ) : '-'}
                    </td>
                    <td>{item.location || '-'}</td>
                    <td>
                      <Button 
                        as={Link} 
                        to={`/equipment/${item.id}`} 
                        variant="outline-primary" 
                        size="sm"
                        className="me-1"
                      >
                        Detail
                      </Button>
                      
                      {user?.role === 'admin' && (
                        <Button 
                          as={Link} 
                          to={`/equipment/edit/${item.id}`} 
                          variant="outline-secondary" 
                          size="sm"
                        >
                          Upravit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      {/* Modal pro import vybavení */}
      <ImportEquipmentModal 
        show={showImportModal}
        onHide={() => setShowImportModal(false)}
        onImportComplete={handleImportComplete}
      />
    </Container>
  );
};

export default EquipmentList;