import React from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navigation = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">Půjčovna Stavebnin</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Domů</Nav.Link>
            
            {isAuthenticated && (
              <>
                <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                
                {/* Menu pro vybavení */}
                <NavDropdown title="Vybavení" id="equipment-dropdown">
                  <NavDropdown.Item as={Link} to="/equipment">Seznam vybavení</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/categories">Kategorie</NavDropdown.Item>
                  {user?.role === 'admin' && (
                    <>
                      <NavDropdown.Divider />
                      <NavDropdown.Item as={Link} to="/equipment/new">Přidat vybavení</NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/categories/new">Přidat kategorii</NavDropdown.Item>
                    </>
                  )}
                </NavDropdown>
                
                {/* Menu pro zákazníky */}
                <NavDropdown title="Zákazníci" id="customers-dropdown">
                  <NavDropdown.Item as={Link} to="/customers">Seznam zákazníků</NavDropdown.Item>
                  {user?.role === 'admin' && (
                    <>
                      <NavDropdown.Divider />
                      <NavDropdown.Item as={Link} to="/customers/new">Přidat zákazníka</NavDropdown.Item>
                    </>
                  )}
                </NavDropdown>
                
                {/* Menu pro zakázky */}
                <NavDropdown title="Zakázky" id="orders-dropdown">
                  <NavDropdown.Item as={Link} to="/orders">Seznam zakázek</NavDropdown.Item>
                  {user?.role === 'admin' && (
                    <>
                      <NavDropdown.Divider />
                      <NavDropdown.Item as={Link} to="/orders/new">Přidat zakázku</NavDropdown.Item>
                    </>
                  )}
                </NavDropdown>
                
                {/* Později přidáme další menu */}
              </>
            )}
          </Nav>
          
          <Nav>
            {isAuthenticated ? (
              <NavDropdown title={user?.username || 'Uživatel'} id="user-dropdown">
                <NavDropdown.Item disabled>{user?.role === 'admin' ? 'Administrátor' : 'Uživatel'}</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>Odhlásit se</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Přihlášení</Nav.Link>
                <Nav.Link as={Link} to="/register">Registrace</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;