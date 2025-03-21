import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';

const CategoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  useEffect(() => {
    // Pokud editujeme, načteme data kategorie
    if (isEditing) {
      const fetchCategory = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`${API_URL}/categories/${id}`);
          const categoryData = response.data.category;
          
          setFormData({
            name: categoryData.name,
            description: categoryData.description || ''
          });
        } catch (error) {
          console.error('Chyba při načítání kategorie:', error);
          setError('Nepodařilo se načíst kategorii. Zkuste to prosím později.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchCategory();
    }
  }, [id, isEditing]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      if (isEditing) {
        // Aktualizace existující kategorie
        await axios.put(`${API_URL}/categories/${id}`, formData);
      } else {
        // Vytvoření nové kategorie
        await axios.post(`${API_URL}/categories`, formData);
      }
      
      setSaveSuccess(true);
      
      // Přesměrování zpět na seznam po úspěšném uložení
      setTimeout(() => {
        navigate('/categories');
      }, 1500);
    } catch (error) {
      console.error('Chyba při ukládání kategorie:', error);
      setError(error.response?.data?.message || 'Chyba při ukládání kategorie. Zkuste to prosím později.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container>
      <h1 className="mb-4">{isEditing ? 'Upravit kategorii' : 'Přidat novou kategorii'}</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {saveSuccess && <Alert variant="success">Kategorie byla úspěšně uložena.</Alert>}
      
      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Název kategorie *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="Zadejte název kategorie"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Popis</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Zadejte popis kategorie (nepovinné)"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button 
                as={Link} 
                to="/categories" 
                variant="outline-secondary"
                disabled={loading}
              >
                Zrušit
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Ukládání...' : 'Uložit'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CategoryForm;