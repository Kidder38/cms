import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Alert, Table, Badge, Spinner } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from '../../axios-config';
import { formatCurrency, formatDate } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { FaEdit, FaTrash, FaFilePdf, FaTrashAlt, FaArrowLeft } from 'react-icons/fa';

const WriteOffDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [writeOff, setWriteOff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchWriteOff = async () => {
      try {
        const response = await axios.get(`/api/write-offs/${id}`);
        setWriteOff(response.data.write_off);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání odpisu:', error);
        setError('Nepodařilo se načíst data odpisu. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchWriteOff();
  }, [id]);
  
  const handleDelete = async () => {
    if (!window.confirm('Opravdu chcete smazat tento odpis? Položky budou vráceny na sklad. Tato akce nemůže být vrácena.')) {
      return;
    }
    
    try {
      await axios.delete(`/api/write-offs/${id}`);
      alert('Odpis byl úspěšně smazán a položky byly vráceny na sklad.');
      navigate('/write-offs');
    } catch (error) {
      console.error('Chyba při mazání odpisu:', error);
      alert(error.response?.data?.message || 'Chyba při mazání odpisu.');
    }
  };
  
  const generatePdf = async () => {
    try {
      // Import PDF utility
      const pdfUtils = await import('../../util/pdfUtilsAlternative');
      
      // Generování PDF pomocí alternativní utility
      await pdfUtils.generateWriteOffDocumentPdf(writeOff);
    } catch (error) {
      console.error('Chyba při generování PDF:', error);
      alert('Nepodařilo se vygenerovat PDF. Zkuste to prosím později.');
    }
  };
  
  if (loading) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Načítání...</span>
          </Spinner>
          <p className="mt-2">Načítání detailu odpisu...</p>
        </div>
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
  
  if (!writeOff) {
    return (
      <Container>
        <Alert variant="warning">Odpis nebyl nalezen.</Alert>
      </Container>
    );
  }
  
  return (
    <Container>
      <Row className="mb-4 align-items-center">
        <Col>
          <h1>
            <FaTrashAlt className="me-2" />
            Detail odpisu #{writeOff.id}
          </h1>
        </Col>
        <Col xs="auto">
          <Button 
            as={Link} 
            to="/write-offs" 
            variant="outline-secondary"
            className="me-2"
          >
            <FaArrowLeft className="me-1" /> Zpět na seznam
          </Button>
          
          <Button 
            variant="outline-primary"
            onClick={generatePdf}
            className="me-2"
            title="Generovat PDF"
          >
            <FaFilePdf className="me-1" /> Tisk
          </Button>
          
          {user?.role === 'admin' && (
            <>
              <Button 
                as={Link} 
                to={`/write-offs/edit/${id}`} 
                variant="outline-success"
                className="me-2"
                title="Upravit odpis"
              >
                <FaEdit className="me-1" /> Upravit
              </Button>
              
              <Button 
                variant="outline-danger"
                onClick={handleDelete}
                title="Smazat odpis"
              >
                <FaTrash className="me-1" /> Smazat
              </Button>
            </>
          )}
        </Col>
      </Row>
      
      <Row>
        <Col md={5}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Základní informace</h5>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>ID odpisu:</strong> {writeOff.id}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Datum odpisu:</strong> {formatDate(writeOff.write_off_date)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Důvod odpisu:</strong>{' '}
                <Badge bg={
                  writeOff.reason === 'damaged' ? 'danger' :
                  writeOff.reason === 'lost' ? 'warning' :
                  writeOff.reason === 'expired' ? 'secondary' : 'info'
                }>
                  {writeOff.reason === 'damaged' && 'Poškozeno'}
                  {writeOff.reason === 'lost' && 'Ztraceno'}
                  {writeOff.reason === 'expired' && 'Prošlá životnost'}
                  {writeOff.reason === 'other' && 'Jiný důvod'}
                  {!writeOff.reason && 'Neuvedeno'}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Celková hodnota:</strong> {formatCurrency(writeOff.total_value)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Vytvořil:</strong> {writeOff.created_by_name || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Vytvořeno:</strong> {formatDate(writeOff.created_at)}
              </ListGroup.Item>
              {writeOff.notes && (
                <ListGroup.Item>
                  <strong>Poznámky:</strong><br />
                  {writeOff.notes}
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>
        
        <Col md={7}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Odepsané položky</h5>
            </Card.Header>
            <Card.Body>
              {writeOff.items && writeOff.items.length > 0 ? (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Název</th>
                        <th>Inv. č.</th>
                        <th>Množství</th>
                        <th>Jednotková cena</th>
                        <th>Celkem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {writeOff.items.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <Link to={`/equipment/${item.equipment_id}`}>
                              {item.equipment_name}
                            </Link>
                          </td>
                          <td>{item.inventory_number || '-'}</td>
                          <td>{item.quantity} ks</td>
                          <td>{formatCurrency(item.unit_value)}</td>
                          <td className="text-end">{formatCurrency(item.total_value)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="4" className="text-end fw-bold">Celková hodnota:</td>
                        <td className="text-end fw-bold">{formatCurrency(writeOff.total_value)}</td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              ) : (
                <Alert variant="warning">
                  Tento odpis neobsahuje žádné položky.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default WriteOffDetail;