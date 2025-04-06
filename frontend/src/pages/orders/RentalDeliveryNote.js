import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Alert, Table, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPrint, FaDownload, FaArrowLeft } from 'react-icons/fa';
import axios from '../../axios-config';
import { API_URL, formatDate, formatCurrency } from '../../config';
import { useReactToPrint } from 'react-to-print';

const RentalDeliveryNote = () => {
  const { rental_id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deliveryNote, setDeliveryNote] = useState(null);
  
  // Načtení dat pro dodací list výpůjčky
  useEffect(() => {
    const fetchDeliveryNote = async () => {
      try {
        const response = await axios.get(`/api/orders/rentals/${rental_id}/delivery-note`);
        setDeliveryNote(response.data.deliveryNote);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání dodacího listu výpůjčky:', error);
        setError('Nepodařilo se načíst dodací list. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchDeliveryNote();
  }, [rental_id]);
  
  // Nastavení funkce pro tisk
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Dodaci-list-vypujcky-${deliveryNote?.rental?.id || ''}`,
  });
  
  // Zpět na detail zakázky
  const handleBack = () => {
    if (deliveryNote?.rental?.order_id) {
      navigate(`/orders/${deliveryNote.rental.order_id}`);
    } else {
      navigate(`/orders`);
    }
  };
  
  if (loading) {
    return (
      <Container className="my-4 text-center">
        <Spinner animation="border" />
        <p>Načítání dodacího listu výpůjčky...</p>
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
        <Alert variant="warning">Dodací list výpůjčky nebyl nalezen.</Alert>
        <Button variant="secondary" onClick={handleBack}>
          <FaArrowLeft className="me-2" /> Zpět
        </Button>
      </Container>
    );
  }
  
  const rental = deliveryNote.rental;
  
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
          <Button variant="success">
            <FaDownload className="me-2" /> Stáhnout PDF
          </Button>
        </div>
      </div>
      
      {/* Samotný dodací list pro tisk */}
      <Card ref={printRef} className="mb-4 p-4">
        <div className="delivery-note-content">
          {/* Záhlaví dodacího listu */}
          <div className="text-center mb-4">
            <h1>DODACÍ LIST VÝPŮJČKY</h1>
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
                <p><strong>Datum vydání:</strong> {formatDate(rental.issue_date)}</p>
              </Col>
            </Row>
          </div>
          
          {/* Seznam vypůjčených položek */}
          <div className="mb-4">
            <h5>Vydané položky</h5>
            <Table bordered>
              <thead>
                <tr>
                  <th>Název</th>
                  <th>Inventární č.</th>
                  <th>Množství</th>
                  <th>Plánované vrácení</th>
                  <th>Denní sazba</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{rental.equipment_name}</td>
                  <td>{rental.inventory_number}</td>
                  <td>{rental.quantity || 1} ks</td>
                  <td>{formatDate(rental.planned_return_date) || 'Neurčeno'}</td>
                  <td>{formatCurrency(rental.daily_rate)}/den</td>
                </tr>
              </tbody>
            </Table>
          </div>
          
          {/* Poznámky */}
          <div className="mb-4">
            <h5>Poznámky</h5>
            <p>{rental.note || 'Bez poznámek'}</p>
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

export default RentalDeliveryNote;