import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, Spinner, Row, Col, Tabs, Tab, Table, Badge } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';

const UserAccessForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [userCustomers, setUserCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('customers');
  
  // Formulář pro přidání nového přístupu
  const [newCustomerAccess, setNewCustomerAccess] = useState({
    customer_id: '',
    access_type: 'read'
  });
  
  const [newOrderAccess, setNewOrderAccess] = useState({
    order_id: '',
    access_type: 'read'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Načtení detailu uživatele
        const userResponse = await axios.get(`${API_URL}/api/users/${id}`);
        setUser(userResponse.data.user);
        
        // Načtení všech zákazníků a zakázek
        const [customersResponse, ordersResponse] = await Promise.all([
          axios.get(`${API_URL}/api/customers`),
          axios.get(`${API_URL}/api/orders`)
        ]);
        
        // Ošetření null hodnot z API
        setCustomers(customersResponse.data?.customers || []);
        setOrders(ordersResponse.data?.orders || []);
        
        // Načtení zákazníků a zakázek přiřazených uživateli
        const [userCustomersResponse, userOrdersResponse] = await Promise.all([
          axios.get(`${API_URL}/api/users/${id}/customers`),
          axios.get(`${API_URL}/api/users/${id}/orders`)
        ]);
        
        // Ošetření null hodnot z API
        setUserCustomers(userCustomersResponse.data?.customers || []);
        setUserOrders(userOrdersResponse.data?.orders || []);
        
        setError(null);
      } catch (err) {
        console.error('Chyba při načítání dat:', err);
        setError('Nepodařilo se načíst data. ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Získání dostupných zákazníků (kteří ještě nejsou přiřazeni)
  const getAvailableCustomers = () => {
    if (!userCustomers || !customers) return [];
    const assignedCustomerIds = userCustomers.map(c => c.id);
    return customers.filter(c => !assignedCustomerIds.includes(c.id));
  };

  // Získání dostupných zakázek (které ještě nejsou přiřazeny)
  const getAvailableOrders = () => {
    if (!userOrders || !orders) return [];
    const assignedOrderIds = userOrders.map(o => o.id);
    return orders.filter(o => !assignedOrderIds.includes(o.id));
  };

  // Přidání přístupu k zákazníkovi
  const handleAddCustomerAccess = async (e) => {
    e.preventDefault();
    
    if (!newCustomerAccess.customer_id) {
      setError('Vyberte zákazníka.');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await axios.post(`${API_URL}/api/users/${id}/customer-access`, {
        customerId: newCustomerAccess.customer_id,
        accessType: newCustomerAccess.access_type
      });
      
      // Přidání nově přiřazeného zákazníka do seznamu
      const addedCustomer = customers.find(c => c.id === parseInt(newCustomerAccess.customer_id));
      if (addedCustomer) {
        setUserCustomers([...userCustomers, {
          ...addedCustomer,
          access_type: newCustomerAccess.access_type
        }]);
      }
      
      // Reset formuláře
      setNewCustomerAccess({
        customer_id: '',
        access_type: 'read'
      });
      
      setError(null);
    } catch (err) {
      console.error('Chyba při přidávání přístupu k zákazníkovi:', err);
      setError('Nepodařilo se přidat přístup k zákazníkovi. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Přidání přístupu k zakázce
  const handleAddOrderAccess = async (e) => {
    e.preventDefault();
    
    if (!newOrderAccess.order_id) {
      setError('Vyberte zakázku.');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await axios.post(`${API_URL}/api/users/${id}/order-access`, {
        orderId: newOrderAccess.order_id,
        accessType: newOrderAccess.access_type
      });
      
      // Přidání nově přiřazené zakázky do seznamu
      const addedOrder = orders.find(o => o.id === parseInt(newOrderAccess.order_id));
      if (addedOrder) {
        setUserOrders([...userOrders, {
          ...addedOrder,
          access_type: newOrderAccess.access_type
        }]);
      }
      
      // Reset formuláře
      setNewOrderAccess({
        order_id: '',
        access_type: 'read'
      });
      
      setError(null);
    } catch (err) {
      console.error('Chyba při přidávání přístupu k zakázce:', err);
      setError('Nepodařilo se přidat přístup k zakázce. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Odebrání přístupu k zákazníkovi
  const handleRemoveCustomerAccess = async (customerId) => {
    if (!window.confirm('Opravdu chcete odebrat přístup k tomuto zákazníkovi?')) return;
    
    try {
      setLoading(true);
      
      await axios.delete(`${API_URL}/api/users/${id}/customer-access`, {
        data: { customerId }
      });
      
      // Odebrání zákazníka ze seznamu
      setUserCustomers(userCustomers.filter(c => c.id !== customerId));
      
      setError(null);
    } catch (err) {
      console.error('Chyba při odebírání přístupu k zákazníkovi:', err);
      setError('Nepodařilo se odebrat přístup k zákazníkovi. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Odebrání přístupu k zakázce
  const handleRemoveOrderAccess = async (orderId) => {
    if (!window.confirm('Opravdu chcete odebrat přístup k této zakázce?')) return;
    
    try {
      setLoading(true);
      
      await axios.delete(`${API_URL}/api/users/${id}/order-access`, {
        data: { orderId }
      });
      
      // Odebrání zakázky ze seznamu
      setUserOrders(userOrders.filter(o => o.id !== orderId));
      
      setError(null);
    } catch (err) {
      console.error('Chyba při odebírání přístupu k zakázce:', err);
      setError('Nepodařilo se odebrat přístup k zakázce. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Aktualizace úrovně přístupu k zákazníkovi
  const handleUpdateCustomerAccess = async (customerId, accessType) => {
    try {
      setLoading(true);
      
      await axios.put(`${API_URL}/api/users/${id}/customer-access`, {
        customerId,
        accessType
      });
      
      // Aktualizace zákazníka v seznamu
      setUserCustomers(userCustomers.map(c => {
        if (c.id === customerId) {
          return { ...c, access_type: accessType };
        }
        return c;
      }));
      
      setError(null);
    } catch (err) {
      console.error('Chyba při aktualizaci přístupu k zákazníkovi:', err);
      setError('Nepodařilo se aktualizovat přístup k zákazníkovi. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Aktualizace úrovně přístupu k zakázce
  const handleUpdateOrderAccess = async (orderId, accessType) => {
    try {
      setLoading(true);
      
      await axios.put(`${API_URL}/api/users/${id}/order-access`, {
        orderId,
        accessType
      });
      
      // Aktualizace zakázky v seznamu
      setUserOrders(userOrders.map(o => {
        if (o.id === orderId) {
          return { ...o, access_type: accessType };
        }
        return o;
      }));
      
      setError(null);
    } catch (err) {
      console.error('Chyba při aktualizaci přístupu k zakázce:', err);
      setError('Nepodařilo se aktualizovat přístup k zakázce. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Načítání...</span>
        </Spinner>
      </div>
    );
  }

  if (!user) {
    return <Alert variant="warning">Uživatel nebyl nalezen.</Alert>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Správa přístupů uživatele</h1>
        <div>
          <Link to={`/users/${id}`} className="btn btn-secondary me-2">
            Zpět na detail
          </Link>
          <Link to="/users" className="btn btn-primary">
            Seznam uživatelů
          </Link>
        </div>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <h5>Uživatel: {user.username}</h5>
          <p>Role: {user.role === 'admin' ? 'Administrátor' : 'Uživatel'}</p>
          {user.role === 'admin' && (
            <Alert variant="info">
              Tento uživatel má administrátorská práva a má automaticky přístup ke všem záznamům. 
              Přidávání specifických přístupů není nutné.
            </Alert>
          )}
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      <Tabs
        activeKey={activeTab}
        onSelect={k => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="customers" title="Přístup k zákazníkům">
          <Card className="mb-4">
            <Card.Header>Přidat přístup k zákazníkovi</Card.Header>
            <Card.Body>
              <Form onSubmit={handleAddCustomerAccess}>
                <Row>
                  <Col md={5}>
                    <Form.Group className="mb-3">
                      <Form.Label>Zákazník</Form.Label>
                      <Form.Select
                        value={newCustomerAccess.customer_id}
                        onChange={e => setNewCustomerAccess({...newCustomerAccess, customer_id: e.target.value})}
                        required
                      >
                        <option value="">Vyberte zákazníka</option>
                        {getAvailableCustomers().map(customer => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name} (ID: {customer.id})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  
                  <Col md={5}>
                    <Form.Group className="mb-3">
                      <Form.Label>Úroveň přístupu</Form.Label>
                      <Form.Select
                        value={newCustomerAccess.access_type}
                        onChange={e => setNewCustomerAccess({...newCustomerAccess, access_type: e.target.value})}
                        required
                      >
                        <option value="read">Pouze čtení</option>
                        <option value="write">Čtení a zápis</option>
                        <option value="admin">Administrátor</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  
                  <Col md={2} className="d-flex align-items-end">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      className="mb-3"
                      disabled={loading || getAvailableCustomers().length === 0}
                    >
                      Přidat
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>

          <h5>Seznam přiřazených zákazníků</h5>
          {!userCustomers || userCustomers.length === 0 ? (
            <Alert variant="info">Uživatel nemá přiřazené žádné zákazníky.</Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Název</th>
                  <th>Typ zákazníka</th>
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
                    <td>
                      <Form.Select
                        value={customer.access_type}
                        onChange={e => handleUpdateCustomerAccess(customer.id, e.target.value)}
                        disabled={loading}
                        size="sm"
                      >
                        <option value="read">Pouze čtení</option>
                        <option value="write">Čtení a zápis</option>
                        <option value="admin">Administrátor</option>
                      </Form.Select>
                    </td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveCustomerAccess(customer.id)}
                        disabled={loading}
                      >
                        Odebrat
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Tab>

        <Tab eventKey="orders" title="Přístup k zakázkám">
          <Card className="mb-4">
            <Card.Header>Přidat přístup k zakázce</Card.Header>
            <Card.Body>
              <Form onSubmit={handleAddOrderAccess}>
                <Row>
                  <Col md={5}>
                    <Form.Group className="mb-3">
                      <Form.Label>Zakázka</Form.Label>
                      <Form.Select
                        value={newOrderAccess.order_id}
                        onChange={e => setNewOrderAccess({...newOrderAccess, order_id: e.target.value})}
                        required
                      >
                        <option value="">Vyberte zakázku</option>
                        {getAvailableOrders().map(order => (
                          <option key={order.id} value={order.id}>
                            {order.order_number} (ID: {order.id})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  
                  <Col md={5}>
                    <Form.Group className="mb-3">
                      <Form.Label>Úroveň přístupu</Form.Label>
                      <Form.Select
                        value={newOrderAccess.access_type}
                        onChange={e => setNewOrderAccess({...newOrderAccess, access_type: e.target.value})}
                        required
                      >
                        <option value="read">Pouze čtení</option>
                        <option value="write">Čtení a zápis</option>
                        <option value="admin">Administrátor</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  
                  <Col md={2} className="d-flex align-items-end">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      className="mb-3"
                      disabled={loading || getAvailableOrders().length === 0}
                    >
                      Přidat
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>

          <h5>Seznam přiřazených zakázek</h5>
          {!userOrders || userOrders.length === 0 ? (
            <Alert variant="info">Uživatel nemá přiřazené žádné zakázky.</Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Číslo zakázky</th>
                  <th>Zákazník</th>
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
                    <td>
                      <Form.Select
                        value={order.access_type}
                        onChange={e => handleUpdateOrderAccess(order.id, e.target.value)}
                        disabled={loading}
                        size="sm"
                      >
                        <option value="read">Pouze čtení</option>
                        <option value="write">Čtení a zápis</option>
                        <option value="admin">Administrátor</option>
                      </Form.Select>
                    </td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveOrderAccess(order.id)}
                        disabled={loading}
                      >
                        Odebrat
                      </Button>
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

export default UserAccessForm;