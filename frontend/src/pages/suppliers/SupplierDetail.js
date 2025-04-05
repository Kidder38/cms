import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Alert, Table, Spinner } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from '../../axios-config';
import { formatDate } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { FaEdit, FaTrashAlt, FaPlus, FaEye } from 'react-icons/fa';

const SupplierDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [supplier, setSupplier] = useState(null);
  const [supplierEquipment, setSupplierEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Načtení dat dodavatele a jeho vybavení paralelně
        const [supplierResponse, equipmentResponse] = await Promise.all([
          axios.get(`/suppliers/${id}`),
          axios.get(`/suppliers/${id}/equipment`)
        ]);
        
        setSupplier(supplierResponse.data.supplier);
        setSupplierEquipment(equipmentResponse.data.equipment || []);
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
    if (!window.confirm('Opravdu chcete smazat tohoto dodavatele?')) {
      return;
    }
    
    try {
      await axios.delete(`/suppliers/${id}`);
      alert('Dodavatel byl úspěšně smazán.');
      navigate('/suppliers');
    } catch (error) {
      console.error('Chyba při mazání dodavatele:', error);
      alert(error.response?.data?.message || 'Chyba při mazání dodavatele.');
    }
  };
  
  if (loading) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Načítání...</span>
          </Spinner>
          <p className="mt-2">Načítání dat dodavatele...</p>
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
  
  if (!supplier) {
    return (
      <Container>
        <Alert variant="warning">Dodavatel nebyl nalezen.</Alert>
      </Container>
    );
  }
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Detail dodavatele</h1>
        </Col>
        <Col xs="auto">
          <Button 
            as={Link} 
            to="/suppliers" 
            variant="outline-secondary" 
            className="me-2"
          >
            Zpět na seznam
          </Button>
          
          {user?.role === 'admin' && (
            <>
              <Button 
                as={Link} 
                to={`/suppliers/edit/${id}`} 
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
                to={`/equipment/new?supplier=${id}`} 
                variant="success"
              >
                <FaPlus className="me-1" /> Přidat exterrní vybavení
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
                <strong>Název:</strong> {supplier.name}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Kontaktní osoba:</strong> {supplier.contact_person || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Email:</strong> {supplier.email || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Telefon:</strong> {supplier.phone || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Adresa:</strong> {supplier.address || 'Neuvedeno'}
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Finanční informace</h5>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>IČO:</strong> {supplier.ico || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>DIČ:</strong> {supplier.dic || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Bankovní účet:</strong> {supplier.bank_account || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Vytvořeno:</strong> {formatDate(supplier.created_at)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Naposledy upraveno:</strong> {formatDate(supplier.updated_at)}
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
      
      {supplier.notes && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Poznámky</h5>
          </Card.Header>
          <Card.Body>
            <p className="mb-0">{supplier.notes}</p>
          </Card.Body>
        </Card>
      )}
      
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Externí vybavení</h5>
          {user?.role === 'admin' && (
            <Button 
              as={Link} 
              to={`/equipment/new?supplier=${id}`} 
              variant="success" 
              size="sm"
            >
              <FaPlus className="me-1" /> Přidat vybavení
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          {supplierEquipment.length === 0 ? (
            <Alert variant="info">
              Tento dodavatel zatím nemá žádné vybavení v evidenci.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Název</th>
                    <th>Inv. číslo</th>
                    <th>Typ</th>
                    <th>Stav</th>
                    <th>Počet ks</th>
                    <th>Náklady</th>
                    <th>Období půjčky</th>
                    <th>Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierEquipment.map(equipment => (
                    <tr key={equipment.id}>
                      <td>
                        <Link to={`/equipment/${equipment.id}`} className="fw-bold">
                          {equipment.name}
                        </Link>
                      </td>
                      <td>{equipment.inventory_number}</td>
                      <td>{equipment.product_designation || '-'}</td>
                      <td>
                        <Badge bg={getStatusColor(equipment.status)}>
                          {getStatusLabel(equipment.status)}
                        </Badge>
                      </td>
                      <td>{equipment.total_stock}</td>
                      <td>{equipment.external_rental_cost ? `${equipment.external_rental_cost} Kč` : '-'}</td>
                      <td>
                        {equipment.rental_start_date ? 
                          `${formatDate(equipment.rental_start_date)} - ${formatDate(equipment.rental_end_date || 'neurčeno')}` 
                          : '-'}
                      </td>
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

// Pomocné funkce pro zobrazení stavu vybavení
const getStatusLabel = (status) => {
  const statusMap = {
    'available': 'Dostupné',
    'borrowed': 'Vypůjčeno',
    'maintenance': 'V servisu',
    'retired': 'Vyřazeno'
  };
  return statusMap[status] || status;
};

const getStatusColor = (status) => {
  const colorMap = {
    'available': 'success',
    'borrowed': 'warning',
    'maintenance': 'info',
    'retired': 'danger'
  };
  return colorMap[status] || 'secondary';
};

export default SupplierDetail;