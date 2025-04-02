import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Alert, Table, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPrint, FaDownload, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import { API_URL, formatDate, formatCurrency } from '../../config';
import { useReactToPrint } from 'react-to-print';
import { generateBatchReturnNotePdf } from '../../util/pdfUtils';

const BatchReturnNote = () => {
  const { batch_id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [returnNote, setReturnNote] = useState(null);
  
  // Načtení dat pro hromadný dodací list vratek
  useEffect(() => {
    const fetchReturnNote = async () => {
      try {
        const response = await axios.get(`${API_URL}/orders/batch-returns/${batch_id}/delivery-note`);
        setReturnNote(response.data.returnNote);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání hromadného dodacího listu vratek:', error);
        setError('Nepodařilo se načíst dodací list vratek. Zkuste to prosím později.');
        setLoading(false);
      }
    };
    
    fetchReturnNote();
  }, [batch_id]);
  
  // Nastavení funkce pro tisk
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Dodaci-list-vratky-${returnNote?.return_note_number || 'zakazky'}`,
  });
  
  // Funkce pro generování a stažení PDF
  const handleDownloadPdf = async () => {
    try {
      setLoading(true);
      
      // Použijeme upravenou utilitu pro generování PDF
      const pdf = await generateBatchReturnNotePdf(returnNote);
      
      // Uložení PDF
      pdf.save(`Dodaci-list-vratky-${returnNote?.return_note_number || 'zakazky'}.pdf`);
      
      setLoading(false);
    } catch (error) {
      console.error('Chyba při generování PDF:', error);
      setError(`Nepodařilo se vygenerovat PDF: ${error.message || 'Neznámá chyba'}`);
      setLoading(false);
    }
  };
  
  // Zpět na detail zakázky
  const handleBack = () => {
    // Pokud existuje order_id v první vratce, použijeme ho pro navigaci
    if (returnNote?.returns?.length > 0 && returnNote.returns[0].order_id) {
      navigate(`/orders/${returnNote.returns[0].order_id}`);
    } else {
      navigate(`/orders`);
    }
  };
  
  if (loading) {
    return (
      <Container className="my-4 text-center">
        <Spinner animation="border" />
        <p>Načítání hromadného dodacího listu vratek...</p>
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
  
  if (!returnNote) {
    return (
      <Container className="my-4">
        <Alert variant="warning">Hromadný dodací list vratek nebyl nalezen.</Alert>
        <Button variant="secondary" onClick={handleBack}>
          <FaArrowLeft className="me-2" /> Zpět
        </Button>
      </Container>
    );
  }
  
  return (
    <Container className="my-4">
      {/* Tlačítka pro akce nad dodacím listem vratek */}
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
      
      {/* Samotný dodací list vratek pro tisk */}
      <Card ref={printRef} className="mb-4 p-4">
        <div className="return-note-content">
          {/* Záhlaví dodacího listu vratek */}
          <div className="text-center mb-4">
            <h1>DODACÍ LIST VRATEK</h1>
            <h4>č. {returnNote.return_note_number}</h4>
            <p>Datum vystavení: {formatDate(returnNote.created_at)}</p>
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
                  <strong>{returnNote.customer_name}</strong><br />
                  {returnNote.customer_address || 'Adresa neuvedena'}<br />
                  {returnNote.customer_ico ? `IČO: ${returnNote.customer_ico}` : ''}{returnNote.customer_ico && returnNote.customer_dic ? <br /> : ''}{returnNote.customer_dic ? `DIČ: ${returnNote.customer_dic}` : ''}{(returnNote.customer_ico || returnNote.customer_dic) ? <br /> : ''}
                  {returnNote.customer_phone ? `Tel: ${returnNote.customer_phone}` : ''}{returnNote.customer_phone ? <br /> : ''}
                  {returnNote.customer_email || ''}
                </p>
              </div>
            </Col>
          </Row>
          
          {/* Seznam vrácených položek */}
          <div className="mb-4">
            <h5>Seznam vrácených položek</h5>
            <Table bordered>
              <thead>
                <tr>
                  <th>Pořadí</th>
                  <th>Název</th>
                  <th>Inventární č.</th>
                  <th>Množství</th>
                  <th>Datum vrácení</th>
                  <th>Stav</th>
                  <th>Dodatečné poplatky</th>
                </tr>
              </thead>
              <tbody>
                {returnNote.returns.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.equipment_name}</td>
                    <td>{item.inventory_number}</td>
                    <td>{item.quantity || 1} ks</td>
                    <td>{formatDate(item.return_date)}</td>
                    <td>{item.condition === 'ok' ? 'V pořádku' : 
                         item.condition === 'damaged' ? 'Poškozeno' : 
                         item.condition === 'missing' ? 'Chybí' : item.condition}</td>
                    <td>{formatCurrency(item.additional_charges || 0)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="text-end"><strong>Celkem položek:</strong></td>
                  <td><strong>{returnNote.total_items} ks</strong></td>
                  <td colSpan="2" className="text-end"><strong>Celkem dodatečné poplatky:</strong></td>
                  <td>
                    <strong>
                      {formatCurrency(
                        returnNote.returns.reduce((sum, item) => sum + (parseFloat(item.additional_charges) || 0), 0)
                      )}
                    </strong>
                  </td>
                </tr>
              </tfoot>
            </Table>
          </div>
          
          {/* Sekce pro poškozené položky a poznámky */}
          {returnNote.returns.some(item => item.condition !== 'ok' && item.damage_description) && (
            <div className="mb-4">
              <h5>Popis poškození</h5>
              <Table bordered>
                <thead>
                  <tr>
                    <th>Položka</th>
                    <th>Popis poškození</th>
                  </tr>
                </thead>
                <tbody>
                  {returnNote.returns
                    .filter(item => item.condition !== 'ok' && item.damage_description)
                    .map(item => (
                      <tr key={`damage-${item.id}`}>
                        <td>{item.equipment_name} ({item.inventory_number})</td>
                        <td>{item.damage_description}</td>
                      </tr>
                    ))}
                </tbody>
              </Table>
            </div>
          )}
          
          {/* Poznámky */}
          <div className="mb-4">
            <h5>Poznámky</h5>
            <p>{returnNote.returns[0]?.notes || 'Bez poznámek'}</p>
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

export default BatchReturnNote;