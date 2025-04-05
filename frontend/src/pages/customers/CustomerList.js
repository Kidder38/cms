import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, InputGroup, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const CustomerList = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(`${API_URL}/customers`);
        setCustomers(response.data.customers);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání zákazníků:', error);
        setError('Nepodařilo se načíst zákazníky. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchCustomers();
  }, []);
  
  // Filtrovaní zákazníci podle vyhledávání
  const filteredCustomers = customers?.filter(customer =>
    customer && customer.name?.toLowerCase().includes(search.toLowerCase()) ||
    (customer && customer.email && customer.email.toLowerCase().includes(search.toLowerCase())) ||
    (customer && customer.phone && customer.phone.includes(search)) ||
    (customer && customer.ico && customer.ico.includes(search))
  ) || [];
  
  if (loading) {
    return (
      <Container>
        <Alert variant="info">Načítání zákazníků...</Alert>
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
      <h1 className="mb-4">Zákazníci</h1>
      
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <Form.Control
              placeholder="Hledat zákazníka podle jména, emailu, telefonu nebo IČO"
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
          <Col md={6} className="d-flex justify-content-end">
            <Button as={Link} to="/customers/new" variant="primary">
              Přidat zákazníka
            </Button>
          </Col>
        )}
      </Row>
      
      <Card>
        <Card.Body>
          {filteredCustomers.length === 0 ? (
            <Alert variant="info">
              Žádní zákazníci nebyli nalezeni.
            </Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Název/Jméno</th>
                  <th>Typ</th>
                  <th>Kategorie</th>
                  <th>Email</th>
                  <th>Telefon</th>
                  <th>IČO</th>
                  <th>Akce</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.type === 'individual' ? 'Fyzická osoba' : 'Firma'}</td>
                    <td>
                      {customer.customer_category === 'regular' ? 'Běžný' : 
                      customer.customer_category === 'vip' ? 'VIP' : 'Velkoobchod'}
                    </td>
                    <td>{customer.email || '-'}</td>
                    <td>{customer.phone || '-'}</td>
                    <td>{customer.ico || '-'}</td>
                    <td>
                      <Button 
                        as={Link} 
                        to={`/customers/${customer.id}`} 
                        variant="outline-primary" 
                        size="sm"
                        className="me-1"
                      >
                        Detail
                      </Button>
                      
                      {user?.role === 'admin' && (
                        <Button 
                          as={Link} 
                          to={`/customers/edit/${customer.id}`} 
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
    </Container>
  );
};

export default CustomerList;