import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Alert, Table, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPrint, FaDownload, FaArrowLeft } from 'react-icons/fa';
import axios from '../../axios-config';
import { formatDate, formatCurrency } from '../../config';
import { useReactToPrint } from 'react-to-print';
// Použití alternativní PDF knihovny s lepší podporou češtiny
import { generateBatchDeliveryNotePdf } from '../../util/pdfUtilsAlternative';

const BatchDeliveryNote = () => {
  const { batch_id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deliveryNote, setDeliveryNote] = useState(null);
  
  // Načtení dat pro hromadný dodací list
  useEffect(() => {
    const fetchDeliveryNote = async () => {
      try {
        const response = await axios.get(`/api/orders/batch-rentals/${batch_id}/delivery-note`);
        setDeliveryNote(response.data.deliveryNote);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání hromadného dodacího listu:', error);
        setError('Nepodařilo se načíst dodací list. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchDeliveryNote();
  }, [batch_id]);
  
  // Nastavení funkce pro tisk
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Dodaci-list-${deliveryNote?.order_number || 'zakazky'}`,
  });
  
  // Funkce pro generování a stažení PDF s využitím pdfMake
  const handleDownloadPdf = async () => {
    try {
      setLoading(true);
      
      // S novou implementací se přímo generuje a stahuje PDF
      // Název souboru je již definován v samotné funkci
      await generateBatchDeliveryNotePdf(deliveryNote);
      
      setLoading(false);
    } catch (error) {
      console.error('Chyba při generování PDF:', error);
      setError(`Nepodařilo se vygenerovat PDF: ${error.message || 'Neznámá chyba'}`);
      setLoading(false);
    }
  };
  
  // Zpět na detail zakázky
  const handleBack = () => {
    if (deliveryNote?.order_id) {
      navigate(`/orders/${deliveryNote.order_id}`);
    } else {
      navigate(`/orders`);
    }
  };
  
  if (loading) {
    return (
      <Container className="my-4 text-center">
        <Spinner animation="border" />
        <p>Načítání hromadného dodacího listu...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="my-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={handleBack}>
          <FaArrowLeft className="me-2" /> Zpět
        </Button>
      </Container>
    );
  }
  
  if (!deliveryNote) {
    return (
      <Container className="my-4">
        <Alert variant="warning">Hromadný dodací list nebyl nalezen.</Alert>
        <Button variant="secondary" onClick={handleBack}>
          <FaArrowLeft className="me-2" /> Zpět
        </Button>
      </Container>
    );
  }
  
  return (
    <Container className="my-4">
      {/* Tlačítka pro akce nad dodacím listem */}
      <div className="mb-4 d-flex justify-content-between">
        <Button variant="secondary" onClick={handleBack}>
          <FaArrowLeft className="me-2" /> Zpět na zakázku
        </Button>
        <div>
          <Button variant="primary" className="me-2" onClick={handlePrint}>
            <FaPrint className="me-2" /> Tisknout
          </Button>
          <Button variant="success" onClick={handleDownloadPdf}>
            <FaDownload className="me-2" /> Stáhnout PDF
          </Button>
        </div>
      </div>
      
      {/* Samotný dodací list pro tisk */}
      <Card ref={printRef} className="mb-4 p-4">
        <div className="delivery-note-content">
          {/* Záhlaví dodacího listu */}
          <div className="text-center mb-4">
            <h1>DODACÍ LIST</h1>
            <h4>č. {deliveryNote.delivery_note_number}</h4>
            <p>Datum vystavení: {formatDate(deliveryNote.created_at)}</p>
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
                  <strong>{deliveryNote.customer_name}</strong><br />
                  {deliveryNote.customer_address || 'Adresa neuvedena'}<br />
                  {deliveryNote.customer_ico ? `IČO: ${deliveryNote.customer_ico}` : ''}{deliveryNote.customer_ico && deliveryNote.customer_dic ? <br /> : ''}{deliveryNote.customer_dic ? `DIČ: ${deliveryNote.customer_dic}` : ''}{(deliveryNote.customer_ico || deliveryNote.customer_dic) ? <br /> : ''}
                  {deliveryNote.customer_phone ? `Tel: ${deliveryNote.customer_phone}` : ''}{deliveryNote.customer_phone ? <br /> : ''}
                  {deliveryNote.customer_email || ''}
                </p>
              </div>
            </Col>
          </Row>
          
          {/* Informace o zakázce */}
          <div className="mb-4">
            <Row>
              <Col md={6}>
                <p><strong>Číslo zakázky:</strong> {deliveryNote.order_number}</p>
              </Col>
              <Col md={6}>
                <p><strong>Datum vydání:</strong> {formatDate(deliveryNote.rentals[0]?.issue_date) || 'Neuvedeno'}</p>
              </Col>
            </Row>
          </div>
          
          {/* Seznam vypůjčených položek */}
          <div className="mb-4">
            <h5>Seznam položek</h5>
            <Table bordered>
              <thead>
                <tr>
                  <th>Pořadí</th>
                  <th>Název</th>
                  <th>Inventární č.</th>
                  <th>Množství</th>
                  <th>Plánované vrácení</th>
                  <th>Denní sazba</th>
                </tr>
              </thead>
              <tbody>
                {deliveryNote.rentals.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.equipment_name}</td>
                    <td>{item.inventory_number}</td>
                    <td>{item.quantity || 1} ks</td>
                    <td>{formatDate(item.planned_return_date) || 'Neurčeno'}</td>
                    <td>{formatCurrency(item.daily_rate)}/den</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="text-end"><strong>Celkem položek:</strong></td>
                  <td><strong>{deliveryNote.total_items} ks</strong></td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </Table>
          </div>
          
          {/* Poznámky */}
          <div className="mb-4">
            <h5>Poznámky</h5>
            <p>{deliveryNote.rentals[0]?.note || 'Bez poznámek'}</p>
          </div>
          
          {/* Podpisy */}
          <Row className="mt-5">
            <Col md={6} className="border-top pt-3">
              <p className="text-center">Za dodavatele</p>
            </Col>
            <Col md={6} className="border-top pt-3">
              <p className="text-center">Za odběratele</p>
            </Col>
          </Row>
          
          {/* Patička dodacího listu */}
          <div className="mt-5 text-center">
            <p className="small">
              Půjčovna Stavebnin s.r.o. | Stavební 123, 123 45 Město | IČO: 12345678 | DIČ: CZ12345678<br />
              Tel: +420 123 456 789 | Email: info@pujcovna-stavebnin.cz | www.pujcovna-stavebnin.cz
            </p>
          </div>
        </div>
      </Card>
    </Container>
  );
};

export default BatchDeliveryNote;