import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <div className="jumbotron bg-light p-5 rounded">
            <h1 className="display-4">Půjčovna stavebního vybavení</h1>
            <p className="lead">
              Nabízíme široký sortiment profesionálního stavebního vybavení k zapůjčení. 
              Ať už jste profesionál nebo kutíl, u nás najdete vše, co potřebujete.
            </p>
            <hr className="my-4" />
            <p>
              Již jste zaregistrováni? Přihlaste se a spravujte své výpůjčky.
            </p>
            {isAuthenticated ? (
              <Button variant="primary" as={Link} to="/dashboard" size="lg">
                Přejít do aplikace
              </Button>
            ) : (
              <Button variant="primary" as={Link} to="/login" size="lg">
                Přihlásit se
              </Button>
            )}
          </div>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>Široký sortiment</Card.Title>
              <Card.Text>
                Vyberte si z našeho rozsáhlého sortimentu vybavení, od ručního nářadí až po těžké stavební stroje.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>Profesionální přístup</Card.Title>
              <Card.Text>
                Naši zkušení pracovníci vám rádi poradí s výběrem správného vybavení pro váš projekt.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>Flexibilní podmínky</Card.Title>
              <Card.Text>
                Nabízíme krátkodobé i dlouhodobé výpůjčky za výhodné ceny s možností doručení na místo.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Jak to funguje?</Card.Title>
              <Card.Text>
                <ol>
                  <li>Zaregistrujte se a vytvořte si účet</li>
                  <li>Projděte si náš katalog a vyberte potřebné vybavení</li>
                  <li>Rezervujte vybavení online nebo telefonicky</li>
                  <li>Vyzvedněte si vybavení v naší provozovně</li>
                  <li>Po dokončení projektu vybavení vraťte</li>
                </ol>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;