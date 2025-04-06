import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Alert, Table, Badge, Spinner } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from '../../axios-config';
import { formatDate } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { FaEdit, FaFileAlt, FaArrowLeft, FaCheck, FaTimes, FaFilePdf } from 'react-icons/fa';

const InventoryCheckDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inventoryCheck, setInventoryCheck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterOnlyDifferences, setFilterOnlyDifferences] = useState(false);
  
  useEffect(() => {
    const fetchInventoryCheck = async () => {
      try {
        const response = await axios.get(`/api/inventory-checks/${id}`);
        setInventoryCheck(response.data.inventory_check);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání inventury:', error);
        setError('Nepodařilo se načíst data inventury. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchInventoryCheck();
  }, [id]);
  
  const handleComplete = async () => {
    if (!window.confirm('Opravdu chcete označit tuto inventuru jako dokončenou? Po dokončení již nebude možné ji upravit.')) {
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await axios.put(`/api/inventory-checks/${id}/complete`);
      setInventoryCheck(response.data.inventory_check);
      alert('Inventura byla úspěšně dokončena.');
    } catch (error) {
      console.error('Chyba při dokončování inventury:', error);
      alert(error.response?.data?.message || 'Chyba při dokončování inventury.');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleCancel = async () => {
    if (!window.confirm('Opravdu chcete zrušit tuto inventuru? Po zrušení již nebude možné ji upravit.')) {
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await axios.put(`/api/inventory-checks/${id}/cancel`);
      setInventoryCheck(response.data.inventory_check);
      alert('Inventura byla úspěšně zrušena.');
    } catch (error) {
      console.error('Chyba při rušení inventury:', error);
      alert(error.response?.data?.message || 'Chyba při rušení inventury.');
    } finally {
      setActionLoading(false);
    }
  };
  
  const generatePdf = async () => {
    try {
      setActionLoading(true);
      
      // Import PDF utility s lepší podporou češtiny
      const { generateInventoryCheckPdf } = await import('../../util/pdfUtilsAlternative');
      
      // Generování PDF a zobrazení
      const pdf = await generateInventoryCheckPdf(inventoryCheck);
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Chyba při generování PDF:', error);
      alert('Nepodařilo se vygenerovat PDF. Zkuste to prosím později.');
    } finally {
      setActionLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Načítání...</span>
          </Spinner>
          <p className="mt-2">Načítání detailu inventury...</p>
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
  
  if (!inventoryCheck) {
    return (
      <Container>
        <Alert variant="warning">Inventura nebyla nalezena.</Alert>
      </Container>
    );
  }
  
  // Analýza dat inventury
  const totalItems = inventoryCheck.items.length;
  const checkedItems = inventoryCheck.items.filter(item => item.actual_quantity !== null).length;
  const discrepancyItems = inventoryCheck.items.filter(
    item => item.actual_quantity !== null && item.actual_quantity !== item.expected_quantity
  ).length;
  const percentageChecked = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
  
  // Výpočet statistik nesrovnalostí
  const missingItems = inventoryCheck.items.filter(
    item => item.actual_quantity !== null && item.actual_quantity < item.expected_quantity
  );
  
  const excessItems = inventoryCheck.items.filter(
    item => item.actual_quantity !== null && item.actual_quantity > item.expected_quantity
  );
  
  const totalMissing = missingItems.reduce((sum, item) => 
    sum + (item.expected_quantity - item.actual_quantity), 0);
  
  const totalExcess = excessItems.reduce((sum, item) => 
    sum + (item.actual_quantity - item.expected_quantity), 0);
  
  return (
    <Container>
      <Row className="mb-4 align-items-center">
        <Col>
          <h1>
            <FaFileAlt className="me-2" />
            Detail inventury
          </h1>
        </Col>
        <Col xs="auto">
          <Button 
            as={Link} 
            to="/inventory-checks" 
            variant="outline-secondary"
            className="me-2"
          >
            <FaArrowLeft className="me-1" /> Zpět na seznam
          </Button>
          
          <Button 
            variant="outline-primary"
            onClick={generatePdf}
            className="me-2"
            disabled={actionLoading}
            title="Generovat PDF"
          >
            <FaFilePdf className="me-1" /> Tisk
          </Button>
          
          {user?.role === 'admin' && inventoryCheck.status === 'in_progress' && (
            <>
              <Button 
                as={Link} 
                to={`/inventory-checks/edit/${id}`} 
                variant="outline-success"
                className="me-2"
                title="Upravit inventuru"
              >
                <FaEdit className="me-1" /> Upravit
              </Button>
              
              <Button 
                variant="success"
                onClick={handleComplete}
                className="me-2"
                disabled={actionLoading}
                title="Dokončit inventuru"
              >
                <FaCheck className="me-1" /> Dokončit
              </Button>
              
              <Button 
                variant="danger"
                onClick={handleCancel}
                disabled={actionLoading}
                title="Zrušit inventuru"
              >
                <FaTimes className="me-1" /> Zrušit
              </Button>
            </>
          )}
        </Col>
      </Row>
      
      <Row>
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Základní informace</h5>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>Sklad:</strong>{' '}
                <Link to={`/warehouses/${inventoryCheck.warehouse_id}`}>
                  {inventoryCheck.warehouse_name}
                </Link>
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Datum kontroly:</strong> {formatDate(inventoryCheck.check_date)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Stav:</strong>{' '}
                <Badge bg={
                  inventoryCheck.status === 'completed' ? 'success' : 
                  inventoryCheck.status === 'canceled' ? 'danger' : 'warning'
                }>
                  {inventoryCheck.status === 'completed' ? 'Dokončeno' : 
                   inventoryCheck.status === 'canceled' ? 'Zrušeno' : 'Probíhá'}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Vytvořil:</strong> {inventoryCheck.created_by_name}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Vytvořeno:</strong> {formatDate(inventoryCheck.created_at)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Naposledy upraveno:</strong> {formatDate(inventoryCheck.updated_at)}
              </ListGroup.Item>
              {inventoryCheck.notes && (
                <ListGroup.Item>
                  <strong>Poznámky:</strong><br />
                  {inventoryCheck.notes}
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
          
          <Card>
            <Card.Header>
              <h5 className="mb-0">Shrnutí inventury</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="text-muted mb-1">Zkontrolováno položek</div>
                <h3>
                  {checkedItems} / {totalItems} položek
                  <small className="text-muted ms-2">({percentageChecked}%)</small>
                </h3>
                <div className="progress mb-2">
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{ width: `${percentageChecked}%` }}
                    aria-valuenow={percentageChecked}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>
              
              <Row>
                <Col md={6}>
                  <Card className="bg-light mb-3">
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">Nesrovnalosti</h6>
                          <p className="mb-0">{discrepancyItems} položek</p>
                        </div>
                        <h5 className={
                          discrepancyItems > 0 ? 'text-danger mb-0' : 'text-success mb-0'
                        }>
                          {discrepancyItems === 0 ? 'OK' : `${discrepancyItems} ks`}
                        </h5>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="bg-light mb-3">
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">Chybějící</h6>
                          <p className="mb-0">{missingItems.length} položek</p>
                        </div>
                        <h5 className={
                          totalMissing > 0 ? 'text-danger mb-0' : 'text-success mb-0'
                        }>
                          {totalMissing > 0 ? `-${totalMissing} ks` : '0 ks'}
                        </h5>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Card className="bg-light">
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">Přebývající</h6>
                          <p className="mb-0">{excessItems.length} položek</p>
                        </div>
                        <h5 className={
                          totalExcess > 0 ? 'text-warning mb-0' : 'text-success mb-0'
                        }>
                          {totalExcess > 0 ? `+${totalExcess} ks` : '0 ks'}
                        </h5>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="bg-light">
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">Nezkontrolováno</h6>
                          <p className="mb-0">{totalItems - checkedItems} položek</p>
                        </div>
                        <h5 className={
                          totalItems - checkedItems > 0 ? 'text-warning mb-0' : 'text-success mb-0'
                        }>
                          {totalItems - checkedItems > 0 ? 
                            `${totalItems - checkedItems} ks` : 'Vše zkontrolováno'}
                        </h5>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={8}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Položky inventury</h5>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="filterSwitch"
                  checked={filterOnlyDifferences}
                  onChange={() => setFilterOnlyDifferences(!filterOnlyDifferences)}
                />
                <label className="form-check-label" htmlFor="filterSwitch">
                  Pouze nesrovnalosti
                </label>
              </div>
            </Card.Header>
            <Card.Body>
              {inventoryCheck.items && inventoryCheck.items.length > 0 ? (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Název</th>
                        <th>Inv. č.</th>
                        <th>Očekáváno</th>
                        <th>Skutečně</th>
                        <th>Rozdíl</th>
                        <th>Poznámka</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryCheck.items
                        .filter(item => !filterOnlyDifferences || 
                          (item.actual_quantity !== null && item.actual_quantity !== item.expected_quantity))
                        .map((item, index) => {
                          const difference = item.actual_quantity !== null ? 
                            item.actual_quantity - item.expected_quantity : null;
                          
                          return (
                            <tr key={item.id} className={
                              item.actual_quantity === null ? 'table-light' :
                              difference === 0 ? 'table-success' :
                              difference < 0 ? 'table-danger' : 'table-warning'
                            }>
                              <td>
                                <Link to={`/equipment/${item.equipment_id}`}>
                                  {item.name}
                                </Link>
                              </td>
                              <td>{item.inventory_number}</td>
                              <td className="text-center">{item.expected_quantity}</td>
                              <td className="text-center">
                                {item.actual_quantity !== null ? item.actual_quantity : '-'}
                              </td>
                              <td className={
                                item.actual_quantity === null ? 'text-center' :
                                difference === 0 ? 'text-success fw-bold text-center' :
                                difference < 0 ? 'text-danger fw-bold text-center' : 'text-warning fw-bold text-center'
                              }>
                                {item.actual_quantity !== null ? (
                                  difference > 0 ? `+${difference}` : difference
                                ) : '-'}
                              </td>
                              <td>{item.notes}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <Alert variant="warning">
                  Tato inventura neobsahuje žádné položky.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default InventoryCheckDetail;