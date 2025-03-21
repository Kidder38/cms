import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    // Validace
    if (!formData.username || !formData.password) {
      setLocalError('Vyplňte prosím všechna pole.');
      return;
    }
    
    setLoading(true);
    
    try {
      await login(formData.username, formData.password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Chyba při přihlášení:', error);
      setLocalError(error.response?.data?.message || 'Přihlášení se nezdařilo.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Header as="h5" className="text-center">Přihlášení</Card.Header>
            <Card.Body>
              {(localError || error) && (
                <Alert variant="danger">{localError || error}</Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label>Uživatelské jméno</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Zadejte uživatelské jméno"
                    disabled={loading}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Heslo</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Zadejte heslo"
                    disabled={loading}
                    required
                  />
                </Form.Group>
                
                <div className="d-grid gap-2">
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Přihlašování...' : 'Přihlásit se'}
                  </Button>
                </div>
              </Form>
              
              <div className="mt-3 text-center">
                <p>
                  Nemáte účet? <Link to="/register">Zaregistrujte se</Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;