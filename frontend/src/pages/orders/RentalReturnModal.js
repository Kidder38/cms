import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaFileAlt } from 'react-icons/fa';

const RentalReturnModal = ({ show, onHide, rental, onReturn }) => {
  const [formData, setFormData] = useState({
    actual_return_date: new Date().toISOString().split('T')[0],
    condition: 'ok',
    damage_description: '',
    additional_charges: 0,
    return_quantity: rental ? rental.quantity : 1,
    notes: '',
    // Přidáno pole pro batch_id
    batch_id: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [returnedData, setReturnedData] = useState(null);
  
  // Aktualizace hodnot při změně vybrané výpůjčky
  useEffect(() => {
    if (rental) {
      setFormData(prev => ({
        ...prev,
        return_quantity: rental.quantity || 1,
        // Generování batch_id pro vratku
        batch_id: `RETURN-${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}-${Math.floor(Math.random() * 1000)}`
      }));
    }
  }, [rental]);
  
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await onReturn(rental.id, formData);
      
      // Uložíme celá vrácená data včetně batch_id pro zobrazení hromadného dodacího listu
      if (response) {
        setReturnedData(response);
      } else {
        onHide();
      }
    } catch (error) {
      console.error('Chyba při vracení výpůjčky:', error);
      setError(error.response?.data?.message || 'Chyba při vracení výpůjčky.');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset stavu při zavření modálního okna
  const handleClose = () => {
    setReturnedData(null);
    setError(null);
    onHide();
  };
  
  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Vrácení výpůjčky</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {rental && !returnedData && (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Vybavení</label>
              <input
                type="text"
                className="form-control"
                value={`${rental.equipment_name} (${rental.inventory_number})`}
                disabled
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Datum vrácení</label>
              <input
                type="date"
                className="form-control"
                name="actual_return_date"
                value={formData.actual_return_date}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Množství k vrácení</label>
              <input
                type="number"
                className="form-control"
                name="return_quantity"
                value={formData.return_quantity}
                onChange={handleChange}
                min="1"
                max={rental.quantity}
                required
              />
              <div className="form-text">Původně vypůjčeno: {rental.quantity} ks</div>
            </div>
            
            <div className="mb-3">
              <label className="form-label">Stav</label>
              <select
                className="form-select"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
              >
                <option value="ok">V pořádku</option>
                <option value="damaged">Poškozeno</option>
                <option value="missing">Chybí</option>
              </select>
            </div>
            
            {formData.condition !== 'ok' && (
              <div className="mb-3">
                <label className="form-label">Popis poškození</label>
                <textarea
                  className="form-control"
                  name="damage_description"
                  value={formData.damage_description}
                  onChange={handleChange}
                  rows="3"
                  required={formData.condition !== 'ok'}
                ></textarea>
              </div>
            )}
            
            <div className="mb-3">
              <label className="form-label">Dodatečné poplatky (Kč)</label>
              <input
                type="number"
                className="form-control"
                name="additional_charges"
                value={formData.additional_charges}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Poznámky</label>
              <textarea
                className="form-control"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="2"
              ></textarea>
            </div>
            
            {/* Skryté pole pro batch_id - není nutné ho zobrazovat uživateli */}
            <input type="hidden" name="batch_id" value={formData.batch_id} />
          </form>
        )}
        
        {returnedData && (
          <Alert variant="success">
            <p>Výpůjčka byla úspěšně vrácena.</p>
            <p>Můžete zobrazit dodací list vratky nebo přidat další vratky do této dávky.</p>
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        {returnedData ? (
          <>
            <Button 
              as={Link} 
              to={`/orders/batch-returns/${returnedData.batch_id}/delivery-note`}
              variant="info"
            >
              <FaFileAlt className="me-2" /> Zobrazit dodací list vratky
            </Button>
            <Button variant="secondary" onClick={handleClose}>
              Zavřít
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={handleClose} disabled={loading}>
              Zrušit
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Zpracování...' : 'Potvrdit vrácení'}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default RentalReturnModal;