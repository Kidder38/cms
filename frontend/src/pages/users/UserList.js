import React, { useState, useEffect } from 'react';
import { Table, Button, Alert, Spinner, Card, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/users`);
        setUsers(response.data.users || []);
        setError(null);
      } catch (err) {
        console.error('Chyba při načítání uživatelů:', err);
        setError('Nepodařilo se načíst data uživatelů. ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filtrace uživatelů podle vyhledávání
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

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

  // Smazání uživatele
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Opravdu chcete smazat tohoto uživatele?')) return;
    
    try {
      await axios.delete(`${API_URL}/users/${id}`);
      setUsers(users.filter(user => user.id !== id));
    } catch (err) {
      console.error('Chyba při mazání uživatele:', err);
      alert('Nepodařilo se smazat uživatele: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Správa uživatelů</h1>
        <Link to="/users/new" className="btn btn-primary">
          Přidat uživatele
        </Link>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <Form>
            <InputGroup>
              <Form.Control
                placeholder="Vyhledat uživatele..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button 
                  variant="outline-secondary"
                  onClick={() => setSearchTerm('')}
                >
                  &times;
                </Button>
              )}
            </InputGroup>
          </Form>
        </Card.Body>
      </Card>
      
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Načítání...</span>
          </Spinner>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID</th>
              <th>Jméno</th>
              <th>Uživatelské jméno</th>
              <th>Email</th>
              <th>Role</th>
              <th>Vytvořeno</th>
              <th>Akce</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">
                  {searchTerm ? 'Žádní uživatelé neodpovídají vyhledávání' : 'Zatím nejsou žádní uživatelé'}
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{`${user.first_name || ''} ${user.last_name || ''}`}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{getRoleName(user.role)}</td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Link to={`/users/${user.id}`} className="btn btn-sm btn-info">
                        Zobrazit
                      </Link>
                      <Link to={`/users/edit/${user.id}`} className="btn btn-sm btn-warning">
                        Upravit
                      </Link>
                      {/* Nemůžeme smazat sami sebe */}
                      {currentUser.id !== user.id && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Smazat
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default UserList;