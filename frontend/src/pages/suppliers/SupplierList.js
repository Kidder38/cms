import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from '../../axios-config';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaEdit, FaBox, FaSearch } from 'react-icons/fa';

const SupplierList = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axios.get('/suppliers');
        setSuppliers(response.data.suppliers);
        setFilteredSuppliers(response.data.suppliers);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání dodavatelů:', error);
        setError('Nepodařilo se načíst seznam dodavatelů. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchSuppliers();
  }, []);
  
  // Filtrování dodavatelů podle vyhledávacího termínu
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSuppliers(suppliers);
    } else {
      const filtered = suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone?.includes(searchTerm) ||
        supplier.ico?.includes(searchTerm)
      );
      setFilteredSuppliers(filtered);
    }
  }, [suppliers, searchTerm]);
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  if (loading) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Načítání...</span>
          </Spinner>
          <p className="mt-2">Načítání seznamu dodavatelů...</p>
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
          <h1>Seznam dodavatelů</h1>
        </Col>
        <Col xs="auto">
          {user?.role === 'admin' && (
            <Button 
              as={Link} 
              to="/suppliers/new" 
              variant="success"
            >
              <FaPlus className="me-1" /> Nový dodavatel
            </Button>
          )}
        </Col>
      </Row>
      
      <Card className="mb-4">
        <Card.Body>
          <InputGroup>
            <Form.Control
              placeholder="Hledat podle názvu, kontaktní osoby, emailu, telefonu nebo IČO..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
          </InputGroup>
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Body>
          {filteredSuppliers.length === 0 ? (
            <Alert variant="info">
              {searchTerm 
                ? 'Žádný dodavatel neodpovídá vašemu vyhledávání.' 
                : 'Zatím nejsou evidováni žádní dodavatelé.'}
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Název</th>
                    <th>Kontaktní osoba</th>
                    <th>Email</th>
                    <th>Telefon</th>
                    <th>IČO</th>
                    <th className="text-center">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map(supplier => (
                    <tr key={supplier.id}>
                      <td>
                        <Link to={`/suppliers/${supplier.id}`} className="fw-bold">
                          {supplier.name}
                        </Link>
                      </td>
                      <td>{supplier.contact_person || '-'}</td>
                      <td>{supplier.email || '-'}</td>
                      <td>{supplier.phone || '-'}</td>
                      <td>{supplier.ico || '-'}</td>
                      <td className="text-center">
                        <Button 
                          as={Link} 
                          to={`/suppliers/${supplier.id}`} 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          title="Detail dodavatele"
                        >
                          <FaBox />
                        </Button>
                        
                        {user?.role === 'admin' && (
                          <Button 
                            as={Link} 
                            to={`/suppliers/edit/${supplier.id}`} 
                            variant="outline-success" 
                            size="sm"
                            title="Upravit dodavatele"
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

export default SupplierList;