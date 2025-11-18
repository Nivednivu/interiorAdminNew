import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);
  const [formData, setFormData] = useState({
    product_name: '',
    price_new: '',
    brand: '',
    category: '',
    description: '',
    image_url: '',
    video_url: ''
  });

    const ApiUrl = 'https://interiorserverfinal.onrender.com'

  // const ApiUrl = 'http://localhost:5000';

  const categories = ['Electronics', 'Footwear', 'Clothing', 'Home', 'Sports', 'Books', 'Other'];
  const brands = ['AudioTech', 'TechWear', 'SportFit', 'HomeEssentials', 'BookWorld', 'Other'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${ApiUrl}/api/products`);
      setProducts(response.data.data);
      
      console.log("=== ALL PRODUCTS ===");
      response.data.data.forEach((product, index) => {
        console.log(`${index + 1}. ID: ${product.id}, Name: ${product.product_name}`);
      });
      
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

const handleFileUpload = async (e, type) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 50 * 1024 * 1024) {
    alert('File size too large. Maximum size is 50MB.');
    return;
  }

  setUploading(true);
  const uploadData = new FormData();
  uploadData.append('file', file);

  try {
    console.log("🔼 Starting file upload...", file.name);
    
    // FIX: Use ApiUrl variable instead of hardcoded localhost
    const response = await axios.post(`${ApiUrl}/api/upload`, uploadData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });
    
    console.log("✅ Upload response:", response.data);
    
    if (response.data.success) {
      setFormData(prev => ({
        ...prev,
        [type === 'image' ? 'image_url' : 'video_url']: response.data.filePath
      }));
      alert('File uploaded successfully!');
    } else {
      throw new Error(response.data.error || 'Upload failed');
    }
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    alert(`Upload error: ${error.response?.data?.error || error.message}`);
  } finally {
    setUploading(false);
    e.target.value = '';
  }
};
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        // FIX: Use editingProduct.id instead of product_id
        await axios.put(`${ApiUrl}/api/products/${editingProduct.id}`, formData);
      } else {
        await axios.post(`${ApiUrl}/api/products`, formData);
      }
      fetchProducts();
      resetForm();
      alert(editingProduct ? 'Product updated successfully!' : 'Product added successfully!');
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      product_name: product.product_name,
      price_new: product.price_new,
      brand: product.brand,
      category: product.category,
      description: product.description || '',
      image_url: product.image_url || '',
      video_url: product.video_url || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        // FIX: Use product.id directly
        await axios.delete(`${ApiUrl}/api/products/${productId}`);
        fetchProducts();
        alert('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      product_name: '',
      price_new: '',
      brand: '',
      category: '',
      description: '',
      image_url: '',
      video_url: ''
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const playVideo = (productId, videoUrl) => {
    if (activeVideo === productId) {
      setActiveVideo(null);
    } else {
      setActiveVideo(productId);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            Add New Product
          </button>
        </div>

        {/* Product Form Modal */}
        {showForm && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={resetForm}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button className="close-btn" onClick={resetForm}>×</button>
              </div>
              
              <form onSubmit={handleSubmit} className="product-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      name="product_name"
                      value={formData.product_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Price *</label>
                    <input
                      type="number"
                      name="price_new"
                      value={formData.price_new}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Brand *</label>
                    <select
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Brand</option>
                      {brands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Enter product description..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Image URL</label>
                    <input
                      type="text"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      placeholder="Or upload image below"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'image')}
                      className="file-input"
                    />
                    {formData.image_url && (
                      <div className="image-preview">
                        <img src={formData.image_url} alt="Preview" />
                      </div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label>Video URL</label>
                    <input
                      type="text"
                      name="video_url"
                      value={formData.video_url}
                      onChange={handleInputChange}
                      placeholder="Or upload video below"
                    />
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileUpload(e, 'video')}
                      className="file-input"
                    />
                    {formData.video_url && (
                      <div className="video-preview">
                        <p>Video URL: {formData.video_url}</p>
                        <video 
                          controls 
                          style={{ maxWidth: '200px', maxHeight: '150px' }}
                        >
                          <source src={formData.video_url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : (editingProduct ? 'Update' : 'Create')} Product
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Products List */}
        <div className="products-section">
          <h2>Products ({products.length})</h2>
          {loading ? (
            <div className="loading">Loading products...</div>
          ) : (
            <div className="products-grid">
              {products.map(product => (
                <motion.div 
                  key={product.id} 
                  className="admin-product-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="product-media">
                    {product.video_url && activeVideo === product.id ? (
                      <div className="video-container">
                        <video 
                          controls 
                          autoPlay
                          style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                        >
                          <source src={product.video_url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                        <button 
                          className="btn btn-secondary btn-small"
                          onClick={() => setActiveVideo(null)}
                          style={{ marginTop: '10px' }}
                        >
                          Stop Video
                        </button>
                      </div>
                    ) : product.image_url ? (
                      <div className="image-container">
                        <img 
                          src={product.image_url} 
                          alt={product.product_name}
                          className="product-image"
                        />
                        {product.video_url && (
                          <button 
                            className="btn btn-primary btn-small video-play-btn"
                            onClick={() => playVideo(product.id, product.video_url)}
                          >
                            ▶ Play Video
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="no-media">
                        <div className="no-image">No Image</div>
                        {product.video_url && (
                          <button 
                            className="btn btn-primary btn-small"
                            onClick={() => playVideo(product.id, product.video_url)}
                            style={{ marginTop: '10px' }}
                          >
                            ▶ Play Video
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="product-info">
                    <h3>{product.product_name}</h3>
                    <p className="product-brand">{product.brand}</p>
                    <p className="product-category">{product.category}</p>
                    <p className="product-price">${product.price_new}</p>
                    <p className="product-id">ID: {product.id}</p>
                    
                    {product.video_url && (
                      <div className="video-info">
                        <small>Video Available</small>
                      </div>
                    )}
                    
                    {product.description && (
                      <p className="product-description">{product.description}</p>
                    )}
                  </div>
                  
                  <div className="product-actions">
                    <button 
                      className="btn btn-edit"
                      onClick={() => handleEdit(product)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-delete"
                      onClick={() => handleDelete(product.id)}
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;