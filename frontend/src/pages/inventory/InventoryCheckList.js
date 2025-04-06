import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from '../../axios-config';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaEdit, FaSearch, FaClipboardCheck, FaEye } from 'react-icons/fa';
import { formatDate } from '../../config';

const InventoryCheckList = () => {
  const { user } = useAuth();
  const [inventoryChecks, setInventoryChecks] = useState([]);
  const [filteredChecks, setFilteredChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  useEffect(() => {
    const fetchInventoryChecks = async () => {
      try {
        const response = await axios.get('/api/inventory-checks');
        setInventoryChecks(response.data.inventory_checks);
        setFilteredChecks(response.data.inventory_checks);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání inventur:', error);
        setError('Nepodařilo se načíst seznam inventur. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchInventoryChecks();
  }, []);
  
  // Filtrování inventur podle vyhledávacího termínu a statusu
  useEffect(() => {
    let filtered = inventoryChecks;
    
    // Filtrování podle statusu
    if (statusFilter !== 'all') {
      filtered = filtered.filter(check => check.status === statusFilter);
    }
    
    // Filtrování podle vyhledávacího termínu
    if (searchTerm.trim() !== '') {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(check => 
        check.warehouse_name?.toLowerCase().includes(lowerCaseSearchTerm) ||
        check.notes?.toLowerCase().includes(lowerCaseSearchTerm) ||
        check.created_by_name?.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }
    
    setFilteredChecks(filtered);
  }, [inventoryChecks, searchTerm, statusFilter]);
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'in_progress':
        return <Badge bg="warning">Probíhá</Badge>;
      case 'completed':
        return <Badge bg="success">Dokončeno</Badge>;
      case 'canceled':
        return <Badge bg="danger">Zrušeno</Badge>;
      default:
        return <Badge bg="secondary">Neznámý</Badge>;
    }
  };
  
  if (loading) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Načítání...</span>
          </Spinner>
          <p className="mt-2">Načítání seznamu inventur...</p>
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
          <h1>
            <FaClipboardCheck className="me-2" />
            Inventury
          </h1>
        </Col>
        <Col xs="auto">
          {user?.role === 'admin' && (
            <Button 
              as={Link} 
              to="/inventory-checks/new" 
              variant="success"
            >
              <FaPlus className="me-1" /> Nová inventura
            </Button>
          )}
        </Col>
      </Row>
      
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-end">
            <Col md={6}>
              <InputGroup>
                <Form.Control
                  placeholder="Hledat podle skladu, poznámek nebo uživatele..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
              </InputGroup>
            </Col>
            <Col md={3} className="mt-3 mt-md-0">
              <Form.Group>
                <Form.Label>Filtrovat podle stavu</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                >
                  <option value="all">Všechny stavy</option>
                  <option value="in_progress">Probíhající</option>
                  <option value="completed">Dokončené</option>
                  <option value="canceled">Zrušené</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Body>
          {filteredChecks.length === 0 ? (
            <Alert variant="info">
              {searchTerm || statusFilter !== 'all'
                ? 'Žádná inventura neodpovídá vašemu vyhledávání.'
                : 'Zatím nejsou evidovány žádné inventury.'}
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Sklad</th>
                    <th>Stav</th>
                    <th>Vytvořil</th>
                    <th>Rozdíly</th>
                    <th>Vytvořeno</th>
                    <th className="text-center">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChecks.map(check => (
                    <tr key={check.id}>
                      <td>{formatDate(check.check_date)}</td>
                      <td>
                        <Link to={`/warehouses/${check.warehouse_id}`} className="fw-bold">
                          {check.warehouse_name}
                        </Link>
                      </td>
                      <td>{getStatusBadge(check.status)}</td>
                      <td>{check.created_by_name}</td>
                      <td>
                        {check.has_differences ? (
                          <Badge bg="warning">Ano</Badge>
                        ) : (
                          <Badge bg="success">Ne</Badge>
                        )}
                      </td>
                      <td>{formatDate(check.created_at)}</td>
                      <td className="text-center">
                        <Button 
                          as={Link} 
                          to={`/inventory-checks/${check.id}`} 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          title="Detail inventury"
                        >
                          <FaEye />
                        </Button>
                        
                        {user?.role === 'admin' && check.status === 'in_progress' && (
                          <Button 
                            as={Link} 
                            to={`/inventory-checks/edit/${check.id}`} 
                            variant="outline-success" 
                            size="sm"
                            title="Upravit inventuru"
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

export default InventoryCheckList;