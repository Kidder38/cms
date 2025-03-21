import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, InputGroup, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const CategoryList = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories`);
        setCategories(response.data.categories);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání kategorií:', error);
        setError('Nepodařilo se načíst kategorie. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Filtrované kategorie podle vyhledávání
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(search.toLowerCase())
  );
  
  if (loading) {
    return (
      <Container>
        <Alert variant="info">Načítání kategorií...</Alert>
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
      <h1 className="mb-4">Kategorie vybavení</h1>
      
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <Form.Control
              placeholder="Hledat kategorii"
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
            <Button as={Link} to="/categories/new" variant="primary">
              Přidat kategorii
            </Button>
          </Col>
        )}
      </Row>
      
      <Card>
        <Card.Body>
          {filteredCategories.length === 0 ? (
            <Alert variant="info">
              Žádné kategorie nebyly nalezeny.
            </Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Název</th>
                  <th>Popis</th>
                  <th>Počet položek</th>
                  <th>Akce</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map(category => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{category.description || '-'}</td>
                    <td>{category.item_count || 0}</td>
                    <td>
                      <Button 
                        as={Link} 
                        to={`/equipment?category=${category.id}`} 
                        variant="outline-primary" 
                        size="sm"
                        className="me-1"
                      >
                        Zobrazit vybavení
                      </Button>
                      
                      {user?.role === 'admin' && (
                        <Button 
                          as={Link} 
                          to={`/categories/edit/${category.id}`} 
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

export default CategoryList;