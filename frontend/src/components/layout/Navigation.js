import React from 'react';
import { Navbar, Nav, Container, NavDropdown, Image } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navigation = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="py-2 shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to={isAuthenticated ? "/dashboard" : "/login"} className="text-uppercase fw-bold">
          <span className="me-2">STAVIREZEK</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isAuthenticated && (
              <>
                <Nav.Link as={Link} to="/dashboard" className="px-3">Přehled</Nav.Link>
                
                {/* Menu pro kategorie - pouze pro adminy */}
                {user?.role === 'admin' && (
                  <NavDropdown title="Kategorie" id="categories-dropdown" className="px-2">
                    <NavDropdown.Item as={Link} to="/categories">Seznam kategorií</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={Link} to="/categories/new">Přidat kategorii</NavDropdown.Item>
                  </NavDropdown>
                )}
                
                {/* Menu pro zakázky */}
                <NavDropdown title="Zakázky" id="orders-dropdown" className="px-2">
                  <NavDropdown.Item as={Link} to="/orders">Seznam zakázek</NavDropdown.Item>
                  {user?.role === 'admin' && (
                    <>
                      <NavDropdown.Divider />
                      <NavDropdown.Item as={Link} to="/orders/new">Přidat zakázku</NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/orders/batch-return">Vratka</NavDropdown.Item>
                    </>
                  )}
                </NavDropdown>
                
                {/* Menu pro zákazníky */}
                <NavDropdown title="Zákazníci" id="customers-dropdown" className="px-2">
                  <NavDropdown.Item as={Link} to="/customers">Seznam zákazníků</NavDropdown.Item>
                  {user?.role === 'admin' && (
                    <>
                      <NavDropdown.Divider />
                      <NavDropdown.Item as={Link} to="/customers/new">Přidat zákazníka</NavDropdown.Item>
                    </>
                  )}
                </NavDropdown>
                
                {/* Menu pro sklady a logistiku */}
                <NavDropdown title="Skladové hospodářství" id="warehouses-dropdown" className="px-2">
                  <NavDropdown.Item as={Link} to="/warehouses">Přehled skladů</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/equipment">Vybavení</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/suppliers">Dodavatelé</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={Link} to="/sales">Prodeje</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/write-offs">Odpisy</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/inventory-checks">Inventury</NavDropdown.Item>
                  {user?.role === 'admin' && (
                    <>
                      <NavDropdown.Divider />
                      <NavDropdown.Item as={Link} to="/warehouses/new">Přidat sklad</NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/equipment/new">Přidat vybavení</NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/suppliers/new">Přidat dodavatele</NavDropdown.Item>
                    </>
                  )}
                </NavDropdown>
                
                {/* Menu pro uživatele (pouze pro administrátory) */}
                {user?.role === 'admin' && (
                  <NavDropdown title="Uživatelé" id="users-dropdown" className="px-2">
                    <NavDropdown.Item as={Link} to="/users">Seznam uživatelů</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={Link} to="/users/new">Přidat uživatele</NavDropdown.Item>
                  </NavDropdown>
                )}
              </>
            )}
          </Nav>
          
          <Nav>
            {isAuthenticated ? (
              <NavDropdown 
                title={
                  <span>
                    <span className="text-white me-2">{user?.username || 'Uživatel'}</span>
                  </span>
                } 
                id="user-dropdown" 
                align="end"
              >
                <NavDropdown.Item disabled className="fw-bold">{user?.role === 'admin' ? 'Administrátor' : 'Uživatel'}</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>Odhlásit se</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" className="px-3">Přihlášení</Nav.Link>
                <Nav.Link as={Link} to="/register" className="px-3">Registrace</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;