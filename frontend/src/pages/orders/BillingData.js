import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Alert, Table, Form, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPrint, FaDownload, FaArrowLeft, FaCalculator } from 'react-icons/fa';
import axios from 'axios';
import { API_URL, formatDate, formatCurrency, ORDER_STATUS } from '../../config';
import { useReactToPrint } from 'react-to-print';
import { generateBillingPdf } from '../../util/pdfUtilsAlternative';

const BillingData = () => {
  const { order_id, billing_id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [billingData, setBillingData] = useState(null);
  const [order, setOrder] = useState(null);
  
  // Generování podkladů pro fakturaci - nastavení
  const [billingOptions, setBillingOptions] = useState({
    billing_date: new Date().toISOString().split('T')[0],
    include_returned_only: false,
    is_final_billing: false,
    period_from: '',  // Nový parametr pro začátek období
    period_to: '',    // Nový parametr pro konec období
    use_custom_period: false // Přepínač pro volbu mezi automatickým a manuálním obdobím
  });
  
  // Načtení základních informací o zakázce
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/orders/${order_id}`);
        setOrder(response.data.order);
        
        // Pokud máme billing_id, načteme konkrétní fakturační podklad
        if (billing_id) {
          const billingResponse = await axios.get(`${API_URL}/orders/${order_id}/billing-data/${billing_id}`);
          // Zkontrolujeme, že data obsahují očekávanou strukturu
          if (billingResponse.data && billingResponse.data.billingData) {
            // Pokud v datech chybí odkaz na order, přidáme ho z již načteného objektu order
            if (!billingResponse.data.billingData.order) {
              billingResponse.data.billingData.order = response.data.order;
            }
            setBillingData(billingResponse.data.billingData);
          } else {
            setError('Nepodařilo se načíst fakturační podklad - neplatná data z API.');
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání zakázky:', error);
        setError('Nepodařilo se načíst zakázku. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchOrderData();
  }, [order_id, billing_id]);
  
  // Změna hodnot v nastavení fakturace
  const handleOptionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBillingOptions({
      ...billingOptions,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Generování podkladů pro fakturaci
  const generateBillingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validace formuláře - pokud používáme vlastní období, musí být obě data vyplněna
      if (billingOptions.use_custom_period) {
        if (!billingOptions.period_from || !billingOptions.period_to) {
          setError('Pokud používáte vlastní období, musíte vyplnit obě data (od-do).');
          setLoading(false);
          return;
        }
        
        // Kontrola, že období od je před obdobím do
        const fromDate = new Date(billingOptions.period_from);
        const toDate = new Date(billingOptions.period_to);
        if (fromDate > toDate) {
          setError('Datum "období od" musí být před datem "období do".');
          setLoading(false);
          return;
        }
      }
      
      // Připravíme parametry pro API - posíláme jen období, pokud je aktivní vlastní období
      const requestOptions = {
        ...billingOptions,
        // Pokud nepoužíváme vlastní období, vymažeme tyto parametry
        period_from: billingOptions.use_custom_period ? billingOptions.period_from : undefined,
        period_to: billingOptions.use_custom_period ? billingOptions.period_to : undefined
      };
      
      // Odebrat "use_custom_period" - toto backend neočekává
      delete requestOptions.use_custom_period;
      
      const response = await axios.post(`${API_URL}/orders/${order_id}/billing-data`, requestOptions);
      
      // Zkontrolujeme, že billingData existuje a má očekávanou strukturu
      if (response.data && response.data.billingData) {
        // Pokud v odpovědi chybí odkaz na order, přidáme ho z již načteného objektu order
        if (!response.data.billingData.order && order) {
          response.data.billingData.order = order;
        }
        setBillingData(response.data.billingData);
      } else {
        setError('Generování fakturačních podkladů vrátilo neplatná data.');
      }
      
      // Pokud je to konečná fakturace a zakázka má být uzavřena
      if (billingOptions.is_final_billing && order?.status !== 'completed') {
        // Aktualizace stavu zakázky na 'completed'
        await axios.put(`${API_URL}/orders/${order_id}`, {
          ...order,
          status: 'completed'
        });
        
        // Aktualizace lokální kopie zakázky
        setOrder({
          ...order,
          status: 'completed'
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Chyba při generování fakturačních podkladů:', error);
      
      // Speciální zpracování chyby o duplicitním období
      if (error.response?.status === 400 && error.response?.data?.existingBilling) {
        const existingBilling = error.response.data.existingBilling;
        const reqPeriod = error.response.data.requestedPeriod;
        
        setError(
          <div>
            <p>Nelze vytvořit fakturační podklad, protože se překrývá s existujícím:</p>
            <ul>
              <li><strong>Existující faktura:</strong> {existingBilling.invoice_number}</li>
              <li><strong>Datum vystavení:</strong> {formatDate(existingBilling.billing_date)}</li>
              <li><strong>Období:</strong> {formatDate(existingBilling.billing_period_from)} - {formatDate(existingBilling.billing_period_to)}</li>
            </ul>
            <p>Požadované období ({formatDate(reqPeriod.from)} - {formatDate(reqPeriod.to)}) se překrývá s výše uvedeným obdobím.</p>
            <p>Zvolte prosím jiné období pro fakturaci.</p>
          </div>
        );
      } else if (error.response?.status === 400 && error.response?.data?.message.includes('nejsou k dispozici žádné položky')) {
        // Speciální zpracování chyby o nedostupných položkách pro fakturaci
        const reqPeriod = error.response.data.requestedPeriod;
        
        setError(
          <div>
            <p>Pro zadané období nejsou k dispozici žádné položky k fakturaci.</p>
            <p>Období: {formatDate(reqPeriod.from)} - {formatDate(reqPeriod.to)}</p>
            <p>Zkuste prosím zvolit jiné období nebo ověřte, že v tomto období existují výpůjčky.</p>
          </div>
        );
      } else {
        setError('Nepodařilo se vygenerovat fakturační podklad. ' + (error.response?.data?.message || 'Zkuste to prosím později.'));
      }
      
      setLoading(false);
    }
  };
  
  // Nastavení funkce pro tisk
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Fakturační-podklad-${billingData?.invoice_number || 'zakázky'}`,
  });
  
  // Funkce pro stažení PDF
  const handleDownloadPDF = async () => {
    if (!billingData) {
      setError('Pro generování PDF je potřeba nejdříve vygenerovat fakturační podklad.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Použijeme alternativní utilitu, která rovnou stahuje PDF
      await generateBillingPdf(billingData);
      
      setLoading(false);
    } catch (error) {
      console.error('Chyba při generování PDF:', error);
      setError(`Nepodařilo se vygenerovat PDF: ${error.message || 'Neznámá chyba'}`);
      setLoading(false);
    }
  };
  
  // Zpět na detail zakázky
  const handleBack = () => {
    navigate(`/orders/${order_id}`);
  };
  
  // Nastavení datumu na poslední den aktuálního měsíce
  const setLastDayOfMonth = () => {
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setBillingOptions({
      ...billingOptions,
      billing_date: lastDayOfMonth.toISOString().split('T')[0]
    });
  };
  
  if (loading && !billingData && !order) {
    return (
      <Container className="my-4 text-center">
        <Spinner animation="border" />
        <p>Načítání dat...</p>
      </Container>
    );
  }
  
  if (error && !billingData && !order) {
    return (
      <Container className="my-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={handleBack}>
          <FaArrowLeft className="me-2" /> Zpět na zakázku
        </Button>
      </Container>
    );
  }
  
  return (
    <Container className="my-4">
      {/* Tlačítka pro navigaci */}
      <div className="mb-4 d-flex justify-content-between">
        <Button variant="secondary" onClick={handleBack}>
          <FaArrowLeft className="me-2" /> Zpět na zakázku
        </Button>
        <h1>Fakturační podklad</h1>
        <div></div> {/* Pro zarovnání pomocí flex */}
      </div>
      
      {!billingData && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Nastavení fakturace</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Datum fakturace</Form.Label>
                  <div className="d-flex">
                    <Form.Control
                      type="date"
                      name="billing_date"
                      value={billingOptions.billing_date}
                      onChange={handleOptionChange}
                      className="me-2"
                    />
                    <Button 
                      variant="outline-secondary" 
                      onClick={setLastDayOfMonth}
                      title="Nastavit na poslední den měsíce"
                    >
                      Konec měsíce
                    </Button>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="use-custom-period"
                    name="use_custom_period"
                    label="Nastavit vlastní fakturační období"
                    checked={billingOptions.use_custom_period}
                    onChange={handleOptionChange}
                  />
                </Form.Group>
                
                {billingOptions.use_custom_period && (
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Období od</Form.Label>
                        <Form.Control
                          type="date"
                          name="period_from"
                          value={billingOptions.period_from}
                          onChange={handleOptionChange}
                          required={billingOptions.use_custom_period}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Období do</Form.Label>
                        <Form.Control
                          type="date"
                          name="period_to"
                          value={billingOptions.period_to}
                          onChange={handleOptionChange}
                          required={billingOptions.use_custom_period}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                )}

                <Form.Text className="text-muted mb-3 d-block">
                  {billingOptions.use_custom_period 
                    ? "Fakturace bude ohraničena zadaným obdobím."
                    : "Fakturační období (od-do) bude automaticky určeno na základě dat výpůjček."}
                  Systém zabrání vytvoření duplicitního podkladu pro již fakturované období.
                </Form.Text>
              </Col>
              <Col md={6}>
                <Alert variant="info" className="mb-3">
                  <strong>Poznámka:</strong> Systém automaticky kontroluje, zda pro dané období již neexistuje
                  fakturační podklad. Pokud se budou období překrývat, vytvoření nového podkladu bude zamítnuto,
                  aby nedošlo k dvojí fakturaci stejných položek.
                </Alert>
                
                {billingOptions.use_custom_period && (
                  <Alert variant="warning" className="mb-3">
                    <strong>Vlastní období:</strong> Zvolili jste vlastní fakturační období
                    {billingOptions.period_from && billingOptions.period_to && (
                      <> od <strong>{formatDate(billingOptions.period_from)}</strong> do <strong>{formatDate(billingOptions.period_to)}</strong></>
                    )}.
                    Budou zahrnuty pouze výpůjčky, které spadají alespoň částečně do tohoto období.
                  </Alert>
                )}
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="include-returned-only"
                    name="include_returned_only"
                    label="Zahrnout pouze vrácené položky"
                    checked={billingOptions.include_returned_only}
                    onChange={handleOptionChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="final-billing"
                    name="is_final_billing"
                    label="Konečná fakturace (uzavřít zakázku)"
                    checked={billingOptions.is_final_billing}
                    onChange={handleOptionChange}
                    disabled={order?.status === 'completed'}
                  />
                  {order?.status === 'completed' && (
                    <Form.Text className="text-muted">
                      Zakázka je již uzavřena.
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end">
              <Button
                variant="primary"
                onClick={generateBillingData}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Generuji...
                  </>
                ) : (
                  <>
                    <FaCalculator className="me-2" /> Generovat podklad pro fakturaci
                  </>
                )}
              </Button>
            </div>
            
            {error && (
              <Alert variant="danger" className="mt-3">
                {error}
              </Alert>
            )}
          </Card.Body>
        </Card>
      )}
      
      {billingData && (
        <>
          {/* Tlačítka pro akce nad vygenerovaným podkladem */}
          <div className="mb-4 d-flex justify-content-between">
            <Button variant="warning" onClick={() => setBillingData(null)}>
              Změnit nastavení
            </Button>
            <div>
              <Button variant="primary" className="me-2" onClick={handlePrint}>
                <FaPrint className="me-2" /> Tisknout
              </Button>
              <Button 
                variant="success" 
                onClick={handleDownloadPDF}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Stahuji...
                  </>
                ) : (
                  <>
                    <FaDownload className="me-2" /> Stáhnout PDF
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Samotný fakturační podklad pro tisk */}
          <Card ref={printRef} className="mb-4 p-4">
            <div className="billing-data-content">
              {/* Záhlaví fakturačního podkladu */}
              <div className="text-center mb-4">
                <h1>FAKTURAČNÍ PODKLAD</h1>
                <h4>č. {billingData?.invoice_number || 'Neznámé'}</h4>
                <p>Datum vystavení: {billingData?.billing_date ? formatDate(billingData.billing_date) : 'Neuvedeno'}</p>
                {(billingOptions.is_final_billing || billingData?.is_final_billing) && (
                  <div className="badge bg-danger text-white p-2 my-2">KONEČNÁ FAKTURACE</div>
                )}
              </div>
              
              {/* Informace o dodavateli a odběrateli */}
              <Row className="mb-4">
                <Col md={6}>
                  <div className="border p-3">
                    <h5>Dodavatel:</h5>
                    <p>
                      <strong>Půjčovna Stavebnin s.r.o.</strong><br />
                      Stavební 123<br />
                      123 45 Město<br />
                      IČO: 12345678<br />
                      DIČ: CZ12345678<br />
                      Tel: +420 123 456 789<br />
                      Email: info@pujcovna-stavebnin.cz
                    </p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="border p-3">
                    <h5>Odběratel:</h5>
                    <p>
                      <strong>{billingData?.order?.customer_name || 'Zákazník nenalezen'}</strong><br />
                      {billingData?.order?.customer_address || 'Adresa neuvedena'}<br />
                      {billingData?.order?.ico ? `IČO: ${billingData.order.ico}` : ''}{billingData?.order?.ico && billingData?.order?.dic ? <br /> : ''}{billingData?.order?.dic ? `DIČ: ${billingData.order.dic}` : ''}{(billingData?.order?.ico || billingData?.order?.dic) ? <br /> : ''}
                      {billingData?.order?.customer_phone ? `Tel: ${billingData.order.customer_phone}` : ''}{billingData?.order?.customer_phone ? <br /> : ''}
                      {billingData?.order?.customer_email || ''}
                    </p>
                  </div>
                </Col>
              </Row>
              
              {/* Informace o zakázce */}
              <div className="mb-4">
                <Row>
                  <Col md={4}>
                    <p><strong>Číslo zakázky:</strong> {billingData?.order?.order_number || 'Neznámé'}</p>
                  </Col>
                  <Col md={4}>
                    <p><strong>Datum vytvoření zakázky:</strong> {billingData?.order?.creation_date ? formatDate(billingData.order.creation_date) : 'Neuvedeno'}</p>
                  </Col>
                  <Col md={4}>
                    <p>
                      <strong>Stav zakázky:</strong>{' '}
                      {billingData?.order?.status ? (
                        <span className={`badge bg-${ORDER_STATUS[billingData.order.status]?.color || 'secondary'}`}>
                          {ORDER_STATUS[billingData.order.status]?.label || billingData.order.status}
                        </span>
                      ) : (
                        'Neuvedeno'
                      )}
                    </p>
                  </Col>
                </Row>
              </div>
              
              {/* Seznam fakturačních položek */}
              <div className="mb-4">
                <h5>Seznam položek</h5>
                <Table bordered className="mt-3">
                  <thead className="bg-light">
                    <tr>
                      <th>Název</th>
                      <th>Inv. č.</th>
                      <th>Od</th>
                      <th>Do</th>
                      <th>Dny</th>
                      <th>Ks</th>
                      <th>Sazba/den</th>
                      <th>Celkem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingData?.items?.map((item, index) => (
                      <tr key={index}>
                        <td>{item.equipment_name || item.description || 'Neuvedeno'}</td>
                        <td>{item.inventory_number || '-'}</td>
                        <td>{item.issue_date ? formatDate(item.issue_date) : '-'}</td>
                        <td>
                          {item.return_date ? formatDate(item.return_date) : 
                           item.planned_return_date ? formatDate(item.planned_return_date) : 
                           billingData?.billing_date ? formatDate(billingData.billing_date) : '-'}
                        </td>
                        <td className="text-center">{item.days || '-'}</td>
                        <td className="text-center">{item.quantity || 1}</td>
                        <td className="text-end">{formatCurrency(item.daily_rate || item.price_per_day || 0)}</td>
                        <td className="text-end">{formatCurrency(item.total_price || 0)}</td>
                      </tr>
                    ))}
                    {(!billingData?.items || billingData.items.length === 0) && (
                      <tr>
                        <td colSpan="8" className="text-center">Žádné položky k fakturaci</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="7" className="text-end"><strong>Celkem k fakturaci:</strong></td>
                      <td className="text-end"><strong>{formatCurrency(billingData?.total_amount || 0)}</strong></td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
              
              {/* Poznámky */}
              <div className="mb-4">
                <h5>Poznámky</h5>
                <p>{billingData?.note || billingData?.order?.notes || 'Bez poznámek'}</p>
              </div>
              
              {/* Informace o fakturačním období */}
              <div className="mb-4">
                <Row>
                  <Col md={4}>
                    <p><strong>Datum vystavení:</strong> {billingData?.billing_date ? formatDate(billingData.billing_date) : 'Neuvedeno'}</p>
                  </Col>
                  <Col md={4}>
                    <p><strong>Fakturační období:</strong>{' '}
                      {billingData?.billing_period_from && billingData?.billing_period_to ? (
                        `${formatDate(billingData.billing_period_from)} - ${formatDate(billingData.billing_period_to)}`
                      ) : billingData?.period_from && billingData?.period_to ? (
                        `${formatDate(billingData.period_from)} - ${formatDate(billingData.period_to)}`
                      ) : (
                        'Neuvedeno'
                      )}
                    </p>
                  </Col>
                  <Col md={4}>
                    <p><strong>Datum splatnosti:</strong> {billingData?.billing_date ? formatDate(new Date(new Date(billingData.billing_date).getTime() + 14 * 24 * 60 * 60 * 1000)) : 'Neuvedeno'}</p>
                  </Col>
                </Row>
              </div>
              
              {/* Podpisy */}
              <Row className="mt-5">
                <Col md={6} className="border-top pt-3">
                  <p className="text-center">Vystavil</p>
                </Col>
                <Col md={6} className="border-top pt-3">
                  <p className="text-center">Schválil</p>
                </Col>
              </Row>
              
              {/* Patička */}
              <div className="mt-5 text-center">
                <p className="small">
                  Půjčovna Stavebnin s.r.o. | Stavební 123, 123 45 Město | IČO: 12345678 | DIČ: CZ12345678<br />
                  Tel: +420 123 456 789 | Email: info@pujcovna-stavebnin.cz | www.pujcovna-stavebnin.cz
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </Container>
  );
};

export default BillingData;