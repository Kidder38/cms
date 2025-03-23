import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, InputGroup, Form, Modal } from 'react-bootstrap';
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
  
  // Stav pro modální okno při mazání
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data.categories);
      setError(null);
    } catch (error) {
      console.error('Chyba při načítání kategorií:', error);
      setError('Nepodařilo se načíst kategorie. Zkuste to prosím později.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // Funkce pro otevření modálního okna s potvrzením smazání
  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
    setDeleteError(null);
  };
  
  // Funkce pro zavření modálního okna
  const handleCloseModal = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
    setDeleteError(null);
  };
  
  // Funkce pro smazání kategorie
  const handleDelete = async () => {
    if (!categoryToDelete) return;
    
    setDeleting(true);
    setDeleteError(null);
    
    try {
      await axios.delete(`${API_URL}/categories/${categoryToDelete.id}`);
      
      // Aktualizace seznamu kategorií po úspěšném smazání
      setCategories(prevCategories => 
        prevCategories.filter(cat => cat.id !== categoryToDelete.id)
      );
      
      // Zavření modálního okna
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Chyba při mazání kategorie:', error);
      setDeleteError(
        error.response?.data?.message || 
        'Chyba při mazání kategorie. Zkuste to prosím později.'
      );
    } finally {
      setDeleting(false);
    }
  };
  
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
                        <>
                          <Button 
                            as={Link} 
                            to={`/categories/edit/${category.id}`} 
                            variant="outline-secondary" 
                            size="sm"
                            className="me-1"
                          >
                            Upravit
                          </Button>
                          
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDeleteClick(category)}
                          >
                            Smazat
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      {/* Modální okno pro potvrzení smazání kategorie */}
      <Modal show={showDeleteModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Smazat kategorii</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteError ? (
            <Alert variant="danger">{deleteError}</Alert>
          ) : (
            <p>
              Opravdu chcete smazat kategorii <strong>{categoryToDelete?.name}</strong>?
              {' '}
              Tuto akci nelze vrátit zpět.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Zrušit
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete} 
            disabled={deleting}
          >
            {deleting ? 'Mazání...' : 'Smazat'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CategoryList;