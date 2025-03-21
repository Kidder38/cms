import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const { register, error } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
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
    if (Object.values(formData).some(field => field === '')) {
      setLocalError('Vyplňte prosím všechna pole.');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Hesla se neshodují.');
      return;
    }
    
    if (formData.password.length < 6) {
      setLocalError('Heslo musí mít alespoň 6 znaků.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Odstranění confirmPassword z dat pro registraci
      const { confirmPassword, ...registerData } = formData;
      
      await register(registerData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Chyba při registraci:', error);
      setLocalError(error.response?.data?.message || 'Registrace se nezdařila.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Header as="h5" className="text-center">Registrace nového uživatele</Card.Header>
            <Card.Body>
              {(localError || error) && (
                <Alert variant="danger">{localError || error}</Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
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
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="email">
                      <Form.Label>E-mail</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Zadejte e-mail"
                        disabled={loading}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="first_name">
                      <Form.Label>Jméno</Form.Label>
                      <Form.Control
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="Zadejte jméno"
                        disabled={loading}
                        required
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="last_name">
                      <Form.Label>Příjmení</Form.Label>
                      <Form.Control
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="Zadejte příjmení"
                        disabled={loading}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
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
                      <Form.Text className="text-muted">
                        Heslo musí mít alespoň 6 znaků.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="confirmPassword">
                      <Form.Label>Potvrzení hesla</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Potvrďte heslo"
                        disabled={loading}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <div className="d-grid gap-2">
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Registrace...' : 'Zaregistrovat se'}
                  </Button>
                </div>
              </Form>
              
              <div className="mt-3 text-center">
                <p>
                  Již máte účet? <Link to="/login">Přihlaste se</Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;