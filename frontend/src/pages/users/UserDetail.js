import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col, Alert, Spinner, Table, Badge, Tabs, Tab } from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const UserDetail = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [userCustomers, setUserCustomers] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Načtení detailu uživatele
        const userResponse = await axios.get(`${API_URL}/users/${id}`);
        setUser(userResponse.data.user);
        
        // Načtení zákazníků a zakázek přiřazených uživateli
        const [customersResponse, ordersResponse] = await Promise.all([
          axios.get(`${API_URL}/users/${id}/customers`),
          axios.get(`${API_URL}/users/${id}/orders`)
        ]);
        
        // Ošetření null hodnot z API
        setUserCustomers(customersResponse.data?.customers || []);
        setUserOrders(ordersResponse.data?.orders || []);
        
        setError(null);
      } catch (err) {
        console.error('Chyba při načítání uživatele:', err);
        setError('Nepodařilo se načíst detail uživatele. ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  const handleDeleteUser = async () => {
    if (!window.confirm('Opravdu chcete smazat tohoto uživatele?')) return;
    
    try {
      await axios.delete(`${API_URL}/users/${id}`);
      navigate('/users');
    } catch (err) {
      console.error('Chyba při mazání uživatele:', err);
      alert('Nepodařilo se smazat uživatele: ' + (err.response?.data?.message || err.message));
    }
  };

  // Formátování data pro zobrazení
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('cs-CZ') + ' ' + date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  };

  // Mapování rolí na česká jména
  const getRoleName = (role) => {
    switch (role) {
      case 'admin': return 'Administrátor';
      case 'user': return 'Uživatel';
      default: return role;
    }
  };

  // Získání jména typu přístupu
  const getAccessTypeName = (accessType) => {
    switch (accessType) {
      case 'read': return 'Pouze čtení';
      case 'write': return 'Čtení a zápis';
      case 'admin': return 'Administrátor';
      default: return accessType;
    }
  };

  // Barva odznaku pro typ přístupu
  const getAccessTypeBadgeVariant = (accessType) => {
    switch (accessType) {
      case 'read': return 'info';
      case 'write': return 'success';
      case 'admin': return 'danger';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Načítání...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!user) {
    return <Alert variant="warning">Uživatel nebyl nalezen.</Alert>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Detail uživatele</h1>
        <div>
          <Link to="/users" className="btn btn-secondary me-2">
            Zpět na seznam
          </Link>
          <Link to={`/users/edit/${id}`} className="btn btn-warning me-2">
            Upravit
          </Link>
          <Link to={`/users/${id}/access`} className="btn btn-info me-2">
            Správa přístupů
          </Link>
          {currentUser.id !== user.id && (
            <Button variant="danger" onClick={handleDeleteUser}>
              Smazat
            </Button>
          )}
        </div>
      </div>

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header as="h5">Informace o uživateli</Card.Header>
            <Card.Body>
              <Row className="mb-2">
                <Col md={4} className="fw-bold">ID:</Col>
                <Col md={8}>{user.id}</Col>
              </Row>
              <Row className="mb-2">
                <Col md={4} className="fw-bold">Jméno:</Col>
                <Col md={8}>{`${user.first_name || ''} ${user.last_name || ''}`}</Col>
              </Row>
              <Row className="mb-2">
                <Col md={4} className="fw-bold">Uživatelské jméno:</Col>
                <Col md={8}>{user.username}</Col>
              </Row>
              <Row className="mb-2">
                <Col md={4} className="fw-bold">Email:</Col>
                <Col md={8}>{user.email}</Col>
              </Row>
              <Row className="mb-2">
                <Col md={4} className="fw-bold">Role:</Col>
                <Col md={8}>
                  <Badge bg={user.role === 'admin' ? 'danger' : 'primary'}>
                    {getRoleName(user.role)}
                  </Badge>
                </Col>
              </Row>
              <Row className="mb-2">
                <Col md={4} className="fw-bold">Vytvořeno:</Col>
                <Col md={8}>{formatDate(user.created_at)}</Col>
              </Row>
              <Row className="mb-2">
                <Col md={4} className="fw-bold">Aktualizováno:</Col>
                <Col md={8}>{formatDate(user.updated_at)}</Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="customers" id="user-detail-tabs" className="mb-3">
        <Tab eventKey="customers" title="Přiřazení zákazníci">
          {!userCustomers || userCustomers.length === 0 ? (
            <Alert variant="info">Uživatel nemá přiřazené žádné zákazníky.</Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Název</th>
                  <th>Typ zákazníka</th>
                  <th>Email</th>
                  <th>Telefon</th>
                  <th>Úroveň přístupu</th>
                  <th>Akce</th>
                </tr>
              </thead>
              <tbody>
                {userCustomers.map(customer => (
                  <tr key={customer.id}>
                    <td>{customer.id}</td>
                    <td>{customer.name}</td>
                    <td>
                      {customer.type === 'individual' ? 'Jednotlivec' : 'Firma'}
                    </td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>
                      <Badge bg={getAccessTypeBadgeVariant(customer.access_type)}>
                        {getAccessTypeName(customer.access_type)}
                      </Badge>
                    </td>
                    <td>
                      <Link to={`/customers/${customer.id}`} className="btn btn-sm btn-info">
                        Zobrazit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Tab>

        <Tab eventKey="orders" title="Přiřazené zakázky">
          {!userOrders || userOrders.length === 0 ? (
            <Alert variant="info">Uživatel nemá přiřazené žádné zakázky.</Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Číslo zakázky</th>
                  <th>Zákazník</th>
                  <th>Datum vytvoření</th>
                  <th>Stav</th>
                  <th>Úroveň přístupu</th>
                  <th>Akce</th>
                </tr>
              </thead>
              <tbody>
                {userOrders.map(order => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.order_number}</td>
                    <td>{order.customer_name || 'N/A'}</td>
                    <td>{formatDate(order.creation_date)}</td>
                    <td>
                      <Badge bg={
                        order.status === 'completed' ? 'success' :
                        order.status === 'active' ? 'primary' :
                        order.status === 'cancelled' ? 'danger' : 'secondary'
                      }>
                        {order.status === 'created' ? 'Vytvořeno' :
                         order.status === 'active' ? 'Aktivní' :
                         order.status === 'completed' ? 'Dokončeno' :
                         order.status === 'cancelled' ? 'Zrušeno' : order.status}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={getAccessTypeBadgeVariant(order.access_type)}>
                        {getAccessTypeName(order.access_type)}
                      </Badge>
                    </td>
                    <td>
                      <Link to={`/orders/${order.id}`} className="btn btn-sm btn-info">
                        Zobrazit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Tab>
      </Tabs>
    </div>
  );
};

export default UserDetail;