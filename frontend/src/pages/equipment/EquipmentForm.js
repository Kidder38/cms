import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from '../../axios-config';
import { useAuth } from '../../context/AuthContext';

const EquipmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;

  // Kontrola oprávnění
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  const [categories, setCategories] = useState([]);
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
    description: ''
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Načtení kategorií
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`/api/categories`);
        setCategories(response.data.categories);
      } catch (error) {
        console.error('Chyba při načítání kategorií:', error);
        setError('Nepodařilo se načíst kategorie. Zkuste to prosím později.');
      }
    };

    fetchCategories();
  }, []);

  // Načtení dat při editaci
  useEffect(() => {
    if (isEditing) {
      const fetchEquipment = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`/api/equipment/${id}`);
          const equipmentData = response.data.equipment;

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
            description: equipmentData.description || ''
          });

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
  }, [id, isEditing]);

  // Změna hodnot v formuláři
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Výpočet hodnoty materiálu (sleva 15% z nového)
    if (name === 'purchase_price') {
      const purchasePrice = parseFloat(value) || 0;
      const materialValue = purchasePrice * 0.85;
      setFormData(prev => ({ ...prev, material_value: materialValue.toFixed(2) }));
    }

    // Výpočet m2/celkem
    if (name === 'square_meters_per_piece' || name === 'total_stock') {
      const m2PerPiece = parseFloat(formData.square_meters_per_piece) || 0;
      const totalStock = parseInt(formData.total_stock) || 0;
      const updatedM2PerPiece = name === 'square_meters_per_piece' ? (parseFloat(value) || 0) : m2PerPiece;
      const updatedTotalStock = name === 'total_stock' ? (parseInt(value) || 0) : totalStock;
      
      const totalSquareMeters = updatedM2PerPiece * updatedTotalStock;
      setFormData(prev => ({ ...prev, total_square_meters: totalSquareMeters.toFixed(2) }));
    }
  };

  // Zpracování fotografie
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Odeslání formuláře
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Vytvoření formData objektu pro nahrání souboru
      const formDataObj = new FormData();
      
      // Přidání všech polí - důležité je, aby se přidala všechna pole, i ta, která jsou prázdná
      Object.keys(formData).forEach(key => {
        // Toto zajistí, že místo undefined se pošle prázdný řetězec
        formDataObj.append(key, formData[key] === undefined ? '' : formData[key]);
      });

      // Pro ladění
      console.log('FormData hodnoty:');
      for (const pair of formDataObj.entries()) {
        console.log(pair[0], pair[1]);
      }

      // Přidání fotografie, pokud byla vybrána
      if (photo) {
        formDataObj.append('photo', photo);
      }

      let response;
      if (isEditing) {
        response = await axios.put(`/api/equipment/${id}`, formDataObj, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        response = await axios.post(`/api/equipment`, formDataObj, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setSuccess(true);
      setTimeout(() => {
        navigate(`/equipment/${response.data.equipment.id}`);
      }, 1500);
    } catch (error) {
      console.error('Chyba při ukládání vybavení:', error);
      setError(error.response?.data?.message || 'Chyba při ukládání vybavení. Zkuste to prosím později.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null; // Skryje obsah, když probíhá přesměrování
  }

  return (
    <Container>
      <h1 className="mb-4">{isEditing ? 'Upravit vybavení' : 'Přidat nové vybavení'}</h1>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">Vybavení bylo úspěšně uloženo.</Alert>}

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Název *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="Zadejte název vybavení"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kategorie *</Form.Label>
                  <Form.Select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Vyberte kategorii</option>
                    {categories?.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Inventární číslo *</Form.Label>
                  <Form.Control
                    type="text"
                    name="inventory_number"
                    value={formData.inventory_number}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="Zadejte inventární číslo"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Číslo artiklu</Form.Label>
                  <Form.Control
                    type="text"
                    name="article_number"
                    value={formData.article_number}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Zadejte číslo artiklu"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Označení výrobku</Form.Label>
                  <Form.Control
                    type="text"
                    name="product_designation"
                    value={formData.product_designation}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Zadejte označení výrobku"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Pořizovací cena</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="purchase_price"
                    value={formData.purchase_price}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Zadejte pořizovací cenu"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Hodnota materiálu (sleva 15%)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="material_value"
                    value={formData.material_value}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Hodnota materiálu"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Stav</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="available">Dostupné</option>
                    <option value="borrowed">Vypůjčeno</option>
                    <option value="maintenance">V servisu</option>
                    <option value="retired">Vyřazeno</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Nájem/den/kus *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="daily_rate"
                    value={formData.daily_rate}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="Zadejte denní sazbu"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Nájem/měsíc/kus</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="monthly_rate"
                    value={formData.monthly_rate}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Zadejte měsíční sazbu"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Umístění</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Zadejte umístění"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Hmotnost/kus/kg</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="weight_per_piece"
                    value={formData.weight_per_piece}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Zadejte hmotnost v kg"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>m2/ks</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="square_meters_per_piece"
                    value={formData.square_meters_per_piece}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Zadejte m2 na kus"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Sklad celkem</Form.Label>
                  <Form.Control
                    type="number"
                    name="total_stock"
                    value={formData.total_stock}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Zadejte počet kusů"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>m2/celkem</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="total_square_meters"
                    value={formData.total_square_meters}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Celkové m2"
                    readOnly
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Popis</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Zadejte popis vybavení"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fotografie</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={loading}
                  />
                  <Form.Text className="text-muted">
                    Podporované formáty: JPG, PNG, GIF. Max. velikost: 5MB.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                {photoPreview && (
                  <div className="text-center">
                    <img
                      src={photoPreview}
                      alt="Náhled"
                      className="img-thumbnail"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                )}
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button
                as={Link}
                to={isEditing ? `/equipment/${id}` : '/equipment'}
                variant="outline-secondary"
                disabled={loading}
              >
                Zrušit
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Ukládání...
                  </>
                ) : (
                  'Uložit'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EquipmentForm;