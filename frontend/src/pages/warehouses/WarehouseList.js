import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Spinner, Alert, Badge, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from '../../axios-config';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaEdit, FaBox, FaSearch, FaWarehouse, FaTruck } from 'react-icons/fa';

const WarehouseList = () => {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'internal', 'external'
  
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await axios.get('/api/warehouses');
        setWarehouses(response.data.warehouses);
        setFilteredWarehouses(response.data.warehouses);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání skladů:', error);
        setError('Nepodařilo se načíst seznam skladů. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchWarehouses();
  }, []);
  
  // Filtrování skladů podle vyhledávacího termínu a aktivní záložky
  useEffect(() => {
    let filtered = warehouses;
    
    // Filtrování podle typu skladu
    if (activeTab === 'internal') {
      filtered = warehouses.filter(warehouse => !warehouse.is_external);
    } else if (activeTab === 'external') {
      filtered = warehouses.filter(warehouse => warehouse.is_external);
    }
    
    // Filtrování podle vyhledávacího termínu
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(warehouse => 
        warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warehouse.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warehouse.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warehouse.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredWarehouses(filtered);
  }, [warehouses, searchTerm, activeTab]);
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  if (loading) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Načítání...</span>
          </Spinner>
          <p className="mt-2">Načítání seznamu skladů...</p>
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
  
  return (
    <Container>
      <Row className="mb-4 align-items-center">
        <Col>
          <h1>Sklady</h1>
        </Col>
        <Col xs="auto">
          {user?.role === 'admin' && (
            <Button 
              as={Link} 
              to="/warehouses/new" 
              variant="success"
            >
              <FaPlus className="me-1" /> Nový sklad
            </Button>
          )}
        </Col>
      </Row>
      
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col>
              <InputGroup>
                <Form.Control
                  placeholder="Hledat podle názvu, umístění nebo popisu..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
              </InputGroup>
            </Col>
            <Col md="auto" className="mt-3 mt-md-0">
              <Nav variant="pills" className="flex-row">
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'all'} 
                    onClick={() => handleTabChange('all')}
                    className="d-flex align-items-center"
                  >
                    <FaBox className="me-1" /> Všechny
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'internal'} 
                    onClick={() => handleTabChange('internal')}
                    className="d-flex align-items-center"
                  >
                    <FaWarehouse className="me-1" /> Interní
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'external'} 
                    onClick={() => handleTabChange('external')}
                    className="d-flex align-items-center"
                  >
                    <FaTruck className="me-1" /> Externí
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Body>
          {filteredWarehouses.length === 0 ? (
            <Alert variant="info">
              {searchTerm 
                ? 'Žádný sklad neodpovídá vašemu vyhledávání.' 
                : 'Zatím nejsou evidovány žádné sklady.'}
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Název</th>
                    <th>Typ</th>
                    <th>Umístění</th>
                    <th>Dodavatel</th>
                    <th>Kontakt</th>
                    <th className="text-center">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWarehouses.map(warehouse => (
                    <tr key={warehouse.id}>
                      <td>
                        <Link to={`/warehouses/${warehouse.id}`} className="fw-bold">
                          {warehouse.name}
                        </Link>
                      </td>
                      <td>
                        {warehouse.is_external ? (
                          <Badge bg="info">Externí</Badge>
                        ) : (
                          <Badge bg="success">Interní</Badge>
                        )}
                      </td>
                      <td>{warehouse.location || '-'}</td>
                      <td>
                        {warehouse.is_external ? (
                          warehouse.supplier_name ? (
                            <Link to={`/suppliers/${warehouse.supplier_id}`}>
                              {warehouse.supplier_name}
                            </Link>
                          ) : '-'
                        ) : '-'}
                      </td>
                      <td>{warehouse.contact_person || '-'}</td>
                      <td className="text-center">
                        <Button 
                          as={Link} 
                          to={`/warehouses/${warehouse.id}`} 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          title="Detail skladu"
                        >
                          <FaBox />
                        </Button>
                        
                        {user?.role === 'admin' && (
                          <Button 
                            as={Link} 
                            to={`/warehouses/edit/${warehouse.id}`} 
                            variant="outline-success" 
                            size="sm"
                            title="Upravit sklad"
                          >
                            <FaEdit />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default WarehouseList;