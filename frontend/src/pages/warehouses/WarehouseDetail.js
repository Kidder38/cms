import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Alert, Table, Spinner } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from '../../axios-config';
import { formatDate, EQUIPMENT_STATUS } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { FaEdit, FaTrashAlt, FaPlus, FaEye, FaExternalLinkAlt, FaWarehouse, FaTruck, FaInfoCircle } from 'react-icons/fa';

const WarehouseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [warehouse, setWarehouse] = useState(null);
  const [warehouseEquipment, setWarehouseEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Načtení dat skladu a jeho vybavení paralelně
        const [warehouseResponse, equipmentResponse] = await Promise.all([
          axios.get(`/api/warehouses/${id}`),
          axios.get(`/api/warehouses/${id}/equipment`)
        ]);
        
        setWarehouse(warehouseResponse.data.warehouse);
        setWarehouseEquipment(equipmentResponse.data.equipment || []);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání dat:', error);
        setError('Nepodařilo se načíst data. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  const handleDelete = async () => {
    if (!window.confirm('Opravdu chcete smazat tento sklad?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/warehouses/${id}`);
      alert('Sklad byl úspěšně smazán.');
      navigate('/warehouses');
    } catch (error) {
      console.error('Chyba při mazání skladu:', error);
      alert(error.response?.data?.message || 'Chyba při mazání skladu.');
    }
  };
  
  if (loading) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Načítání...</span>
          </Spinner>
          <p className="mt-2">Načítání dat skladu...</p>
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
  
  if (!warehouse) {
    return (
      <Container>
        <Alert variant="warning">Sklad nebyl nalezen.</Alert>
      </Container>
    );
  }
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>
            {warehouse.is_external ? (
              <FaTruck className="me-2 text-info" />
            ) : (
              <FaWarehouse className="me-2 text-success" />
            )}
            {warehouse.name}
          </h1>
          <h5 className="text-muted">
            {warehouse.is_external ? 'Externí sklad' : 'Interní sklad'}
          </h5>
        </Col>
        <Col xs="auto">
          <Button 
            as={Link} 
            to="/warehouses" 
            variant="outline-secondary" 
            className="me-2"
          >
            Zpět na seznam
          </Button>
          
          {user?.role === 'admin' && (
            <>
              <Button 
                as={Link} 
                to={`/warehouses/edit/${id}`} 
                variant="primary" 
                className="me-2"
              >
                <FaEdit className="me-1" /> Upravit
              </Button>
              
              <Button 
                variant="danger" 
                onClick={handleDelete}
                className="me-2"
              >
                <FaTrashAlt className="me-1" /> Smazat
              </Button>
              
              <Button 
                as={Link} 
                to={`/equipment/new?warehouse=${id}`} 
                variant="success"
              >
                <FaPlus className="me-1" /> Přidat vybavení
              </Button>
            </>
          )}
        </Col>
      </Row>
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Základní informace</h5>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>Název:</strong> {warehouse.name}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Typ:</strong>{' '}
                {warehouse.is_external ? (
                  <Badge bg="info">Externí</Badge>
                ) : (
                  <Badge bg="success">Interní</Badge>
                )}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Umístění:</strong> {warehouse.location || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Vytvořeno:</strong> {formatDate(warehouse.created_at)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Naposledy upraveno:</strong> {formatDate(warehouse.updated_at)}
              </ListGroup.Item>
            </ListGroup>
          </Card>
          
          {warehouse.description && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Popis</h5>
              </Card.Header>
              <Card.Body>
                <p className="mb-0">{warehouse.description}</p>
              </Card.Body>
            </Card>
          )}
        </Col>
        
        <Col md={6}>
          {warehouse.is_external && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Informace o dodavateli</h5>
              </Card.Header>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Dodavatel:</strong>{' '}
                  {warehouse.supplier_name ? (
                    <Link to={`/suppliers/${warehouse.supplier_id}`}>
                      {warehouse.supplier_name} <FaExternalLinkAlt className="ms-1" size="0.7em" />
                    </Link>
                  ) : 'Neuvedeno'}
                </ListGroup.Item>
              </ListGroup>
            </Card>
          )}
          
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Kontaktní informace</h5>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>Kontaktní osoba:</strong> {warehouse.contact_person || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Email:</strong> {warehouse.email || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Telefon:</strong> {warehouse.phone || 'Neuvedeno'}
              </ListGroup.Item>
            </ListGroup>
          </Card>
          
          {warehouse.notes && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Poznámky</h5>
              </Card.Header>
              <Card.Body>
                <p className="mb-0">{warehouse.notes}</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
      
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Vybavení v tomto skladu</h5>
          {user?.role === 'admin' && (
            <Button 
              as={Link} 
              to={`/equipment/new?warehouse=${id}`} 
              variant="success" 
              size="sm"
            >
              <FaPlus className="me-1" /> Přidat vybavení
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          {warehouseEquipment.length === 0 ? (
            <Alert variant="info">
              <FaInfoCircle className="me-2" />
              Tento sklad zatím neobsahuje žádné vybavení.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Název</th>
                    <th>Inv. číslo</th>
                    <th>Kategorie</th>
                    <th>Stav</th>
                    <th>Celkem ks</th>
                    <th>Dostupné ks</th>
                    <th>Denní sazba</th>
                    <th>Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouseEquipment.map(equipment => (
                    <tr key={equipment.id}>
                      <td>
                        <Link to={`/equipment/${equipment.id}`} className="fw-bold">
                          {equipment.name}
                        </Link>
                      </td>
                      <td>{equipment.inventory_number}</td>
                      <td>{equipment.category_name || '-'}</td>
                      <td>
                        <Badge bg={EQUIPMENT_STATUS[equipment.status]?.color || 'secondary'}>
                          {EQUIPMENT_STATUS[equipment.status]?.label || equipment.status}
                        </Badge>
                      </td>
                      <td>{equipment.total_stock}</td>
                      <td>{equipment.available_stock}</td>
                      <td>{equipment.daily_rate} Kč</td>
                      <td>
                        <Button 
                          as={Link} 
                          to={`/equipment/${equipment.id}`} 
                          variant="outline-primary" 
                          size="sm"
                          title="Detail vybavení"
                        >
                          <FaEye />
                        </Button>
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

export default WarehouseDetail;