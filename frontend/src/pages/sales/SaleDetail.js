import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Alert, Table, Badge } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from '../../axios-config';
import { formatCurrency, formatDate } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { FaEdit, FaTrash, FaFilePdf, FaFileInvoice, FaArrowLeft } from 'react-icons/fa';

const SaleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchSale = async () => {
      try {
        const response = await axios.get(`/api/sales/${id}`);
        setSale(response.data.sale);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání prodeje:', error);
        setError('Nepodařilo se načíst data prodeje. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchSale();
  }, [id]);
  
  const handleDelete = async () => {
    if (!window.confirm('Opravdu chcete smazat tento prodej? Tato akce nemůže být vrácena a položky budou vráceny zpět na sklad.')) {
      return;
    }
    
    try {
      await axios.delete(`/api/sales/${id}`);
      alert('Prodej byl úspěšně smazán.');
      navigate('/sales');
    } catch (error) {
      console.error('Chyba při mazání prodeje:', error);
      alert(error.response?.data?.message || 'Chyba při mazání prodeje.');
    }
  };
  
  const generatePdf = async () => {
    try {
      // Import alternativní PDF utility s lepší podporou češtiny
      const { generateSaleInvoicePdf } = await import('../../util/pdfUtilsAlternative');
      
      // Generování PDF - alternativní utilita se postará o stažení PDF
      await generateSaleInvoicePdf(sale);
    } catch (error) {
      console.error('Chyba při generování PDF:', error);
      alert('Nepodařilo se vygenerovat PDF. Zkuste to prosím později.');
    }
  };
  
  if (loading) {
    return (
      <Container>
        <Alert variant="info">Načítání dat...</Alert>
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
  
  if (!sale) {
    return (
      <Container>
        <Alert variant="warning">Prodej nebyl nalezen.</Alert>
      </Container>
    );
  }
  
  return (
    <Container>
      <Row className="mb-4 align-items-center">
        <Col>
          <h1>
            <FaFileInvoice className="me-2" />
            Detail prodeje
          </h1>
        </Col>
        <Col xs="auto">
          <Button 
            as={Link} 
            to="/sales" 
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
            <FaFilePdf className="me-1" /> Prodejní doklad
          </Button>
          
          {user?.role === 'admin' && (
            <>
              <Button 
                as={Link} 
                to={`/sales/edit/${id}`} 
                variant="outline-success"
                className="me-2"
                title="Upravit prodej"
              >
                <FaEdit className="me-1" /> Upravit
              </Button>
              
              <Button 
                variant="outline-danger"
                onClick={handleDelete}
                title="Smazat prodej"
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
                <strong>Číslo faktury / dokladu:</strong> {sale.invoice_number || 'Neuvedeno'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Datum prodeje:</strong> {formatDate(sale.sale_date)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Zákazník:</strong>{' '}
                {sale.customer_id ? (
                  <Link to={`/customers/${sale.customer_id}`}>
                    {sale.customer_name}
                  </Link>
                ) : (
                  'Hotovostní prodej'
                )}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Způsob platby:</strong>{' '}
                <Badge bg="info">
                  {sale.payment_method === 'cash' && 'Hotovost'}
                  {sale.payment_method === 'card' && 'Platební karta'}
                  {sale.payment_method === 'bank_transfer' && 'Bankovní převod'}
                  {sale.payment_method === 'invoice' && 'Faktura'}
                  {!sale.payment_method && 'Neuvedeno'}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Celková cena:</strong> {formatCurrency(sale.total_amount)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Vytvořeno:</strong> {formatDate(sale.created_at)}
              </ListGroup.Item>
              {sale.created_by_name && (
                <ListGroup.Item>
                  <strong>Vytvořil:</strong> {sale.created_by_name}
                </ListGroup.Item>
              )}
              {sale.notes && (
                <ListGroup.Item>
                  <strong>Poznámky:</strong><br />
                  {sale.notes}
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>
        
        <Col md={7}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Položky prodeje</h5>
            </Card.Header>
            <Card.Body>
              {sale.items && sale.items.length > 0 ? (
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
                      {sale.items.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <Link to={`/equipment/${item.equipment_id}`}>
                              {item.equipment_name}
                            </Link>
                          </td>
                          <td>{item.inventory_number || '-'}</td>
                          <td>{item.quantity} ks</td>
                          <td>{formatCurrency(item.unit_price)}</td>
                          <td className="text-end">{formatCurrency(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="4" className="text-end fw-bold">Celková cena:</td>
                        <td className="text-end fw-bold">{formatCurrency(sale.total_amount)}</td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              ) : (
                <Alert variant="warning">
                  Tento prodej neobsahuje žádné položky.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SaleDetail;