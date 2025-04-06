import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from '../../axios-config';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../config';
import { FaPlus, FaEdit, FaSearch, FaFileInvoice, FaFilePdf, FaFilter } from 'react-icons/fa';

const SaleList = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    customer: ''
  });
  const [customers, setCustomers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [salesRes, customersRes] = await Promise.all([
          axios.get('/api/sales'),
          axios.get('/api/customers')
        ]);
        
        // Kontrola, že data existují a mají očekávanou strukturu
        if (salesRes.data && Array.isArray(salesRes.data.sales)) {
          setSales(salesRes.data.sales);
          setFilteredSales(salesRes.data.sales);
        } else {
          console.error('Neočekávaná struktura dat z API:', salesRes.data);
          setSales([]);
          setFilteredSales([]);
        }
        
        // Kontrola, že data zákazníků existují
        if (customersRes.data && Array.isArray(customersRes.data.customers)) {
          setCustomers(customersRes.data.customers);
        } else {
          setCustomers([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání prodejů:', error);
        setError('Nepodařilo se načíst seznam prodejů. Zkuste to prosím později.');
        setSales([]);
        setFilteredSales([]);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filtrování prodejů podle vyhledávacího řetězce a filtrů
  useEffect(() => {
    // Ověříme, že sales existuje jako pole
    let filtered = Array.isArray(sales) ? sales : [];
    
    // Aplikace vyhledávání
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(sale => 
        sale && (
          (sale.invoice_number && sale.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (sale.customer_name && sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (sale.notes && sale.notes.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    }
    
    // Aplikace filtru podle data od
    if (filters.dateFrom) {
      filtered = filtered.filter(sale => 
        sale && sale.sale_date && new Date(sale.sale_date) >= new Date(filters.dateFrom)
      );
    }
    
    // Aplikace filtru podle data do
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Nastavit na konec dne
      filtered = filtered.filter(sale => 
        sale && sale.sale_date && new Date(sale.sale_date) <= toDate
      );
    }
    
    // Aplikace filtru podle zákazníka
    if (filters.customer) {
      filtered = filtered.filter(sale => 
        sale && sale.customer_id === parseInt(filters.customer)
      );
    }
    
    setFilteredSales(filtered || []);
  }, [sales, searchTerm, filters]);
  
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
      customer: ''
    });
    setSearchTerm('');
  };
  
  const generatePdf = async (saleId) => {
    try {
      // Získání prodeje se všemi daty
      const saleDataResponse = await axios.get(`/api/sales/${saleId}`);
      
      // Import PDF utility s lepší podporou češtiny
      const { generateSaleInvoicePdf } = await import('../../util/pdfUtilsAlternative');
      
      // Generování PDF a zobrazení
      const pdf = await generateSaleInvoicePdf(saleDataResponse.data.sale);
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
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
          <p className="mt-2">Načítání seznamu prodejů...</p>
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
            <FaFileInvoice className="me-2" />
            Prodeje
          </h1>
        </Col>
        <Col xs="auto">
          {user?.role === 'admin' && (
            <Button 
              as={Link} 
              to="/sales/new" 
              variant="success"
            >
              <FaPlus className="me-1" /> Nový prodej
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
                  placeholder="Hledat podle čísla faktury, zákazníka nebo poznámek..."
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
              
              {(searchTerm || filters.dateFrom || filters.dateTo || filters.customer) && (
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
                  <Form.Label>Zákazník</Form.Label>
                  <Form.Select
                    name="customer"
                    value={filters.customer}
                    onChange={handleFilterChange}
                  >
                    <option value="">Všichni zákazníci</option>
                    <option value="0">Hotovostní prodej</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Body>
          {!Array.isArray(filteredSales) || filteredSales.length === 0 ? (
            <Alert variant="info">
              {searchTerm || filters.dateFrom || filters.dateTo || filters.customer
                ? 'Žádný prodej neodpovídá zadaným filtračním podmínkám.'
                : 'Zatím nejsou evidovány žádné prodeje.'}
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Č. faktury</th>
                    <th>Zákazník</th>
                    <th>Platba</th>
                    <th>Položek</th>
                    <th>Celkem</th>
                    <th className="text-center">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(filteredSales) && filteredSales.map(sale => 
                    sale && (
                      <tr key={sale.id || `sale-${Math.random()}`}>
                        <td>{sale.sale_date ? formatDate(sale.sale_date) : '-'}</td>
                        <td>{sale.invoice_number || '-'}</td>
                        <td>
                          {sale.customer_id ? (
                            <Link to={`/customers/${sale.customer_id}`}>
                              {sale.customer_name || `Zákazník ID: ${sale.customer_id}`}
                            </Link>
                          ) : (
                            <span>Hotovostní prodej</span>
                          )}
                        </td>
                        <td>
                          <Badge bg="info">
                            {sale.payment_method === 'cash' && 'Hotovost'}
                            {sale.payment_method === 'card' && 'Platební karta'}
                            {sale.payment_method === 'bank_transfer' && 'Bankovní převod'}
                            {sale.payment_method === 'invoice' && 'Faktura'}
                            {!sale.payment_method && 'Neuvedeno'}
                          </Badge>
                        </td>
                        <td>{sale.item_count || 0}</td>
                        <td>{sale.total_amount !== undefined ? formatCurrency(sale.total_amount) : '-'}</td>
                        <td className="text-center">
                          {sale.id && (
                            <>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-2"
                                title="Zobrazit detaily"
                                as={Link}
                                to={`/sales/${sale.id}`}
                              >
                                <FaEdit />
                              </Button>
                              
                              <Button 
                                variant="outline-success" 
                                size="sm"
                                title="Generovat PDF"
                                onClick={() => generatePdf(sale.id)}
                              >
                                <FaFilePdf />
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SaleList;