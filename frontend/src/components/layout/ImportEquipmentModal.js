import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner, Table } from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../../config';

const ImportEquipmentModal = ({ show, onHide, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await axios.get(`${API_URL}/import/equipment/excel/template`, {
        responseType: 'blob'
      });
      
      // Vytvoření odkazu pro stažení
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'vzorovy_import_vybaveni.xlsx');
      
      // Simulace kliknutí pro stažení
      document.body.appendChild(link);
      link.click();
      
      // Úklid
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Chyba při stahování vzorového souboru:', error);
      setError('Chyba při stahování vzorového souboru. Zkuste to prosím později.');
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Prosím vyberte soubor pro import.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_URL}/import/equipment/excel`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResults(response.data.results);
      
      // Pokud import proběhl v pořádku, informujeme nadřazenou komponentu
      if (response.data.results.success > 0) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Chyba při importu:', error);
      setError(error.response?.data?.message || 'Chyba při importu. Zkuste to prosím později.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setResults(null);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Import vybavení z Excel souboru</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {!results && (
          <>
            <p>
              Importujte vybavení z Excel souboru. Soubor musí mít správný formát se sloupci 
              pro název, inventární číslo, kategorii, pořizovací cenu, denní sazbu, stav, umístění a popis.
            </p>
            
            <div className="d-flex mb-3">
              <Button 
                variant="outline-primary" 
                onClick={downloadTemplate}
              >
                Stáhnout vzorový Excel
              </Button>
            </div>
            
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Label>Vyberte Excel soubor (.xlsx)</Form.Label>
              <Form.Control 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleFileChange}
                disabled={loading}
              />
              <Form.Text className="text-muted">
                Maximální velikost souboru je 5MB.
              </Form.Text>
            </Form.Group>
          </>
        )}

        {results && (
          <div>
            <Alert variant={results.errors.length > 0 ? 'warning' : 'success'}>
              Import dokončen. Úspěšně importováno: {results.success} položek z {results.totalItems}.
              {results.errors.length > 0 && ` Počet chyb: ${results.errors.length}.`}
            </Alert>
            
            {results.errors.length > 0 && (
              <>
                <h5>Seznam chyb při importu:</h5>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Řádek</th>
                      <th>Chyba</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.errors.map((error, index) => (
                      <tr key={index}>
                        <td>{error.row}</td>
                        <td>{error.message}</td>
                        <td>
                          <pre className="mb-0" style={{ fontSize: '0.8rem' }}>
                            {JSON.stringify(error.data, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        {loading ? (
          <Button variant="primary" disabled>
            <Spinner animation="border" size="sm" className="me-2" />
            Importuji...
          </Button>
        ) : results ? (
          <Button variant="primary" onClick={handleClose}>
            Zavřít
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={handleClose}>
              Zrušit
            </Button>
            <Button variant="primary" onClick={handleImport} disabled={!file}>
              Importovat
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ImportEquipmentModal;