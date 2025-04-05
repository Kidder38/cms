import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from '../../axios-config';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const ExternalEquipmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const supplierId = queryParams.get('supplier');
  
  const { user } = useAuth();
  const isEditing = !!id;
  
  // Kontrola oprávnění
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(supplierId || '');
  
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    inventory_number: '',
    article_number: '',
    product_designation: '',
    purchase_price: '',
    material_value: '',
    daily_rate: '',
    monthly_rate: '',
    weight_per_piece: '',
    square_meters_per_piece: '',
    total_stock: '',
    total_square_meters: '',
    status: 'available',
    location: '',
    description: '',
    is_external: true,
    supplier_id: supplierId || '',
    external_rental_cost: '',
    rental_start_date: '',
    rental_end_date: '',
    external_reference: ''
  });
  
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Načtení kategorií a dodavatelů
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, suppliersResponse] = await Promise.all([
          axios.get('/api/categories'),
          axios.get('/api/suppliers')
        ]);
        
        setCategories(categoriesResponse.data.categories);
        setSuppliers(suppliersResponse.data.suppliers);
      } catch (error) {
        console.error('Chyba při načítání dat:', error);
        setError('Nepodařilo se načíst potřebná data. Zkuste to prosím později.');
      }
    };
    
    fetchData();
  }, []);
  
  // Načtení dat při editaci
  useEffect(() => {
    if (isEditing) {
      const fetchEquipment = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`/api/equipment/${id}`);
          const equipmentData = response.data.equipment;
          
          // Přenastavení dat formuláře
          setFormData({
            name: equipmentData.name || '',
            category_id: equipmentData.category_id || '',
            inventory_number: equipmentData.inventory_number || '',
            article_number: equipmentData.article_number || '',
            product_designation: equipmentData.product_designation || '',
            purchase_price: equipmentData.purchase_price || '',
            material_value: equipmentData.material_value || '',
            daily_rate: equipmentData.daily_rate || '',
            monthly_rate: equipmentData.monthly_rate || '',
            weight_per_piece: equipmentData.weight_per_piece || '',
            square_meters_per_piece: equipmentData.square_meters_per_piece || '',
            total_stock: equipmentData.total_stock || '',
            total_square_meters: equipmentData.total_square_meters || '',
            status: equipmentData.status || 'available',
            location: equipmentData.location || '',
            description: equipmentData.description || '',
            is_external: equipmentData.is_external || true,
            supplier_id: equipmentData.supplier_id || supplierId || '',
            external_rental_cost: equipmentData.external_rental_cost || '',
            rental_start_date: equipmentData.rental_start_date || '',
            rental_end_date: equipmentData.rental_end_date || '',
            external_reference: equipmentData.external_reference || ''
          });
          
          // Nastavení dodavatele
          setSelectedSupplier(equipmentData.supplier_id || '');
          
          // Nastavení náhledu fotky
          if (equipmentData.photo_url) {
            setPhotoPreview(equipmentData.photo_url);
          }
        } catch (error) {
          console.error('Chyba při načítání vybavení:', error);
          setError('Nepodařilo se načíst vybavení. Zkuste to prosím později.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchEquipment();
    }
  }, [id, isEditing, supplierId]);
  
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Speciální zpracování pro numerické hodnoty
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : parseFloat(value)
      }));
    } else if (name === 'supplier_id') {
      setSelectedSupplier(value);
      setFormData(prev => ({
        ...prev,
        supplier_id: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Automatický výpočet celkové plochy
    if (name === 'square_meters_per_piece' || name === 'total_stock') {
      const sqmPerPiece = name === 'square_meters_per_piece' 
        ? parseFloat(value) || 0 
        : parseFloat(formData.square_meters_per_piece) || 0;
      
      const totalStock = name === 'total_stock' 
        ? parseFloat(value) || 0 
        : parseFloat(formData.total_stock) || 0;
      
      if (sqmPerPiece && totalStock) {
        setFormData(prev => ({
          ...prev,
          total_square_meters: (sqmPerPiece * totalStock).toFixed(2)
        }));
      }
    }
  };
  
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      
      // Vytvoření URL pro náhled vybrané fotografie
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validace formuláře
    if (!formData.name.trim()) {
      setError('Název vybavení je povinný.');
      return;
    }
    
    if (!formData.inventory_number.trim()) {
      setError('Inventární číslo je povinné.');
      return;
    }
    
    if (!formData.daily_rate) {
      setError('Denní sazba je povinná.');
      return;
    }
    
    if (!formData.supplier_id) {
      setError('Vyberte dodavatele externího vybavení.');
      return;
    }
    
    if (!formData.external_rental_cost) {
      setError('Zadejte náklady na půjčení.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Příprava dat pro odeslání
      const formDataToSend = new FormData();
      
      // Přidání všech polí z formData
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Přidání fotografie, pokud byla vybrána
      if (photo) {
        formDataToSend.append('photo', photo);
      }
      
      let response;
      
      if (isEditing) {
        // Aktualizace existujícího vybavení
        response = await axios.put(`${API_URL}/api/equipment/${id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Vytvoření nového vybavení
        response = await axios.post(`${API_URL}/api/equipment`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      setSuccess(true);
      
      // Přesměrování na detail vybavení po úspěšném uložení
      setTimeout(() => {
        navigate(`/equipment/${response.data.equipment.id}`);
      }, 1500);
    } catch (error) {
      console.error('Chyba při ukládání vybavení:', error);
      setError(error.response?.data?.message || 'Při ukládání vybavení došlo k chybě. Zkuste to prosím později.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !formData.name) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Načítání...</span>
          </Spinner>
          <p className="mt-2">Načítání dat vybavení...</p>
        </div>
      </Container>
    );
  }
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>{isEditing ? 'Upravit externí vybavení' : 'Nové externí vybavení'}</h1>
        </Col>
        <Col xs="auto">
          <Button 
            as={Link} 
            to={selectedSupplier ? `/suppliers/${selectedSupplier}` : "/equipment"}
            variant="outline-secondary"
          >
            Zpět
          </Button>
        </Col>
      </Row>
      
      {error && (
        <Alert variant="danger" className="mb-4">{error}</Alert>
      )}
      
      {success && (
        <Alert variant="success" className="mb-4">
          Vybavení bylo úspěšně {isEditing ? 'aktualizováno' : 'vytvořeno'}.
        </Alert>
      )}
      
      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <h5 className="mb-3">Základní údaje</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>Název vybavení *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Název vybavení"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Kategorie</Form.Label>
                  <Form.Select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                  >
                    <option value="">Vyberte kategorii</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Inventární číslo *</Form.Label>
                  <Form.Control
                    type="text"
                    name="inventory_number"
                    value={formData.inventory_number}
                    onChange={handleChange}
                    placeholder="Inventární číslo"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Číslo artiklu</Form.Label>
                  <Form.Control
                    type="text"
                    name="article_number"
                    value={formData.article_number}
                    onChange={handleChange}
                    placeholder="Číslo artiklu"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Označení výrobku</Form.Label>
                  <Form.Control
                    type="text"
                    name="product_designation"
                    value={formData.product_designation}
                    onChange={handleChange}
                    placeholder="Označení výrobku"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Umístění</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Umístění"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Popis</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Popis vybavení"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <h5 className="mb-3">Údaje o externím vybavení</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>Dodavatel *</Form.Label>
                  <Form.Select
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Vyberte dodavatele</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Náklady na půjčení *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="external_rental_cost"
                    value={formData.external_rental_cost}
                    onChange={handleChange}
                    placeholder="Náklady na půjčení"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Datum začátku půjčky</Form.Label>
                  <Form.Control
                    type="date"
                    name="rental_start_date"
                    value={formData.rental_start_date}
                    onChange={handleChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Datum konce půjčky</Form.Label>
                  <Form.Control
                    type="date"
                    name="rental_end_date"
                    value={formData.rental_end_date}
                    onChange={handleChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Externí reference</Form.Label>
                  <Form.Control
                    type="text"
                    name="external_reference"
                    value={formData.external_reference}
                    onChange={handleChange}
                    placeholder="Číslo smlouvy / objednávky"
                  />
                </Form.Group>
                
                <h5 className="mb-3 mt-4">Finanční údaje</h5>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Denní sazba *</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="daily_rate"
                        value={formData.daily_rate}
                        onChange={handleChange}
                        placeholder="Denní sazba"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Měsíční sazba</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="monthly_rate"
                        value={formData.monthly_rate}
                        onChange={handleChange}
                        placeholder="Měsíční sazba"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <h5 className="mb-3 mt-4">Množství a rozměry</h5>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Počet kusů *</Form.Label>
                      <Form.Control
                        type="number"
                        step="1"
                        name="total_stock"
                        value={formData.total_stock}
                        onChange={handleChange}
                        placeholder="Počet kusů"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Hmotnost/kus (kg)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="weight_per_piece"
                        value={formData.weight_per_piece}
                        onChange={handleChange}
                        placeholder="Hmotnost/kus"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>m²/ks</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="square_meters_per_piece"
                        value={formData.square_meters_per_piece}
                        onChange={handleChange}
                        placeholder="m²/ks"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>m²/celkem</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="total_square_meters"
                        value={formData.total_square_meters}
                        onChange={handleChange}
                        placeholder="m²/celkem"
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Fotografie</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  <Form.Text className="text-muted">
                    Maximální velikost souboru je 5 MB. Povolené formáty: JPG, PNG, GIF.
                  </Form.Text>
                </Form.Group>
                
                {photoPreview && (
                  <div className="mt-3 mb-4">
                    <h6>Náhled fotografie:</h6>
                    <img 
                      src={photoPreview} 
                      alt="Náhled" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '200px', 
                        objectFit: 'contain',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '5px'
                      }}
                    />
                  </div>
                )}
              </Col>
            </Row>
            
            <div className="d-flex justify-content-between mt-4">
              <Button 
                variant="secondary" 
                as={Link} 
                to={selectedSupplier ? `/suppliers/${selectedSupplier}` : "/equipment"}
              >
                Zrušit
              </Button>
              
              <Button 
                type="submit" 
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Ukládám...' : (isEditing ? 'Uložit změny' : 'Vytvořit vybavení')}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ExternalEquipmentForm;