import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from '../../axios-config';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../config';
import { FaPlus, FaEdit, FaSearch, FaFilePdf, FaFilter, FaTrashAlt } from 'react-icons/fa';
import { generateWriteOffDocumentPdf } from '../../util/pdfUtilsAlternative';

const WriteOffList = () => {
  const { user } = useAuth();
  const [writeOffs, setWriteOffs] = useState([]);
  const [filteredWriteOffs, setFilteredWriteOffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    reason: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const writeOffsRes = await axios.get('/api/write-offs');
        
        setWriteOffs(writeOffsRes.data.write_offs);
        setFilteredWriteOffs(writeOffsRes.data.write_offs);
        
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání odpisů:', error);
        setError('Nepodařilo se načíst seznam odpisů. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filtrování odpisů podle vyhledávacího řetězce a filtrů
  useEffect(() => {
    let filtered = writeOffs;
    
    // Aplikace vyhledávání
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(writeOff => 
        (writeOff.id && writeOff.id.toString().includes(searchTerm)) ||
        (writeOff.created_by_name && writeOff.created_by_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (writeOff.notes && writeOff.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Aplikace filtru podle data od
    if (filters.dateFrom) {
      filtered = filtered.filter(writeOff => new Date(writeOff.write_off_date) >= new Date(filters.dateFrom));
    }
    
    // Aplikace filtru podle data do
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Nastavit na konec dne
      filtered = filtered.filter(writeOff => new Date(writeOff.write_off_date) <= toDate);
    }
    
    // Aplikace filtru podle důvodu
    if (filters.reason) {
      filtered = filtered.filter(writeOff => writeOff.reason === filters.reason);
    }
    
    setFilteredWriteOffs(filtered);
  }, [writeOffs, searchTerm, filters]);
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      reason: ''
    });
    setSearchTerm('');
  };
  
  const generatePdf = async (writeOffId) => {
    try {
      // Získání odpisu se všemi daty
      const writeOffDataResponse = await axios.get(`/api/write-offs/${writeOffId}`);
      
      // Generování PDF a zobrazení
      const pdf = await generateWriteOffDocumentPdf(writeOffDataResponse.data.write_off);
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Chyba při generování PDF:', error);
      alert('Nepodařilo se vygenerovat PDF. Zkuste to prosím později.');
    }
  };
  
  const deleteWriteOff = async (writeOffId) => {
    if (!window.confirm('Opravdu chcete smazat tento odpis? Položky budou vráceny na sklad.')) {
      return;
    }
    
    try {
      setLoading(true);
      await axios.delete(`/api/write-offs/${writeOffId}`);
      alert('Odpis byl úspěšně smazán a položky byly vráceny na sklad.');
      
      // Načtení aktualizovaného seznamu odpisů
      const writeOffsRes = await axios.get('/api/write-offs');
      setWriteOffs(writeOffsRes.data.write_offs);
      setFilteredWriteOffs(writeOffsRes.data.write_offs);
    } catch (error) {
      console.error('Chyba při mazání odpisu:', error);
      alert(error.response?.data?.message || 'Chyba při mazání odpisu.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && writeOffs.length === 0) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Načítání...</span>
          </Spinner>
          <p className="mt-2">Načítání seznamu odpisů...</p>
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
  
  return (
    <Container>
      <Row className="mb-4 align-items-center">
        <Col>
          <h1>
            <FaTrashAlt className="me-2" />
            Odpisy
          </h1>
        </Col>
        <Col xs="auto">
          {user?.role === 'admin' && (
            <Button 
              as={Link} 
              to="/write-offs/new" 
              variant="success"
            >
              <FaPlus className="me-1" /> Nový odpis
            </Button>
          )}
        </Col>
      </Row>
      
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-end mb-3">
            <Col md={8}>
              <InputGroup>
                <Form.Control
                  placeholder="Hledat podle ID, vytvořil, poznámek..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
              </InputGroup>
            </Col>
            <Col md={4} className="d-flex justify-content-md-end mt-3 mt-md-0">
              <Button
                variant="outline-secondary"
                onClick={() => setShowFilters(!showFilters)}
                className="me-2"
              >
                <FaFilter className="me-1" /> {showFilters ? 'Skrýt filtry' : 'Zobrazit filtry'}
              </Button>
              
              {(searchTerm || filters.dateFrom || filters.dateTo || filters.reason) && (
                <Button
                  variant="outline-danger"
                  onClick={clearFilters}
                >
                  Zrušit filtry
                </Button>
              )}
            </Col>
          </Row>
          
          {showFilters && (
            <Row className="mt-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Datum od</Form.Label>
                  <Form.Control
                    type="date"
                    name="dateFrom"
                    value={filters.dateFrom}
                    onChange={handleFilterChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Datum do</Form.Label>
                  <Form.Control
                    type="date"
                    name="dateTo"
                    value={filters.dateTo}
                    onChange={handleFilterChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Důvod odpisu</Form.Label>
                  <Form.Select
                    name="reason"
                    value={filters.reason}
                    onChange={handleFilterChange}
                  >
                    <option value="">Všechny důvody</option>
                    <option value="damaged">Poškozeno</option>
                    <option value="lost">Ztraceno</option>
                    <option value="expired">Prošlá životnost</option>
                    <option value="other">Jiný důvod</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Body>
          {filteredWriteOffs.length === 0 ? (
            <Alert variant="info">
              {searchTerm || filters.dateFrom || filters.dateTo || filters.reason
                ? 'Žádný odpis neodpovídá zadaným filtračním podmínkám.'
                : 'Zatím nejsou evidovány žádné odpisy.'}
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Datum</th>
                    <th>Důvod</th>
                    <th>Vytvořil</th>
                    <th>Položek</th>
                    <th>Celková hodnota</th>
                    <th className="text-center">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWriteOffs.map(writeOff => (
                    <tr key={writeOff.id}>
                      <td>{writeOff.id}</td>
                      <td>{formatDate(writeOff.write_off_date)}</td>
                      <td>
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
                      </td>
                      <td>{writeOff.created_by_name || 'Neuvedeno'}</td>
                      <td>{writeOff.item_count || '-'}</td>
                      <td>{formatCurrency(writeOff.total_value)}</td>
                      <td className="text-center">
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          title="Zobrazit detaily"
                          as={Link}
                          to={`/write-offs/${writeOff.id}`}
                        >
                          <FaEdit />
                        </Button>
                        
                        <Button 
                          variant="outline-success" 
                          size="sm"
                          className="me-2"
                          title="Generovat PDF"
                          onClick={() => generatePdf(writeOff.id)}
                        >
                          <FaFilePdf />
                        </Button>
                        
                        {user?.role === 'admin' && (
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            title="Smazat odpis"
                            onClick={() => deleteWriteOff(writeOff.id)}
                          >
                            <FaTrashAlt />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default WriteOffList;