import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, InputGroup, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL, formatCurrency, EQUIPMENT_STATUS } from '../../config';
import { useAuth } from '../../context/AuthContext';
import ImportEquipmentModal from '../../components/equipment/ImportEquipmentModal';

const EquipmentList = () => {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  
  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/equipment`);
      setEquipment(response.data.equipment);
      setLoading(false);
    } catch (error) {
      console.error('Chyba při načítání vybavení:', error);
      setError('Nepodařilo se načíst vybavení. Zkuste to prosím později.');
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchEquipment();
  }, []);
  
  // Filtrované vybavení podle vyhledávání
  const filteredEquipment = equipment.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.inventory_number.toLowerCase().includes(search.toLowerCase()) ||
    (item.category_name && item.category_name.toLowerCase().includes(search.toLowerCase()))
  );
  
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
          <InputGroup>
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
              Žádné vybavení nebylo nalezeno.
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