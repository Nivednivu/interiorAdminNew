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
  const [uploadProgress, setUploadProgress] = useState(0);
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

  // Use environment variable or fallback
  // const ApiUrl = 'http://localhost:5000';
  const ApiUrl = '  https://interiorservermongo.onrender.com';


  // Cloudinary URLs are already full URLs
  const getFullFileUrl = (url) => {
    if (!url) return '';
    return url;
  };

  const categories = ['Electronics', 'Footwear', 'Clothing', 'Home', 'Sports', 'Books', 'Other'];
  const brands = ['AudioTech', 'TechWear', 'SportFit', 'HomeEssentials', 'BookWorld', 'Other'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      console.log("🔄 Fetching products from:", `${ApiUrl}/api/products`);
      const response = await axios.get(`${ApiUrl}/api/products`, {
        timeout: 10000
      });
      
      let productsData = [];
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
      } else {
        console.error("Unexpected response structure:", response.data);
        productsData = [];
      }
      
      const productsWithIds = productsData.map((product, index) => {
        const id = product._id || product.id || `product-${index}-${Date.now()}`;
        return {
          ...product,
          id: id
        };
      });
      
      setProducts(productsWithIds);
      
      console.log("=== CLOUDINARY PRODUCTS LOADED ===");
      console.log(`Total products: ${productsWithIds.length}`);
      productsWithIds.forEach((product, index) => {
        console.log(`${index + 1}. ${product.product_name}`);
        if (product.image_url) console.log(`   Image: ${product.image_url.substring(0, 60)}...`);
        if (product.video_url) console.log(`   Video: ${product.video_url.substring(0, 60)}...`);
      });
      
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      alert(`Failed to load products: ${error.message}`);
      setProducts([]);
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

    // Validate file size
    if (file.size > 50 * 1024 * 1024) {
      alert('File size too large. Maximum size is 50MB.');
      return;
    }

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/x-matroska'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload images (JPEG, PNG, GIF) or videos (MP4, MOV, AVI, WEBM).');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    const uploadData = new FormData();
    
    // Create a clean filename to avoid Unicode issues
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop().toLowerCase().substring(0, 5);
    const cleanFileName = `${type}-${timestamp}-${randomString}.${fileExtension}`;
    
    // Use the cleaned filename
    uploadData.append('file', file, cleanFileName);

    try {
      console.log("🔼 Uploading to Cloudinary:", {
        originalName: file.name,
        cleanName: cleanFileName,
        type: file.type,
        size: (file.size / (1024 * 1024)).toFixed(2) + 'MB'
      });
      
      const response = await axios.post(`${ApiUrl}/api/upload`, uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout for large files
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        }
      });
      
      console.log("✅ Cloudinary response:", response.data);
      
      if (response.data.success && response.data.filePath) {
        setFormData(prev => ({
          ...prev,
          [type === 'image' ? 'image_url' : 'video_url']: response.data.filePath
        }));
        alert(`✅ ${type} uploaded to Cloudinary successfully!\nURL: ${response.data.filePath.substring(0, 80)}...`);
      } else {
        throw new Error(response.data.error || 'Upload failed - no file path returned');
      }
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      
      let errorMessage = 'Upload failed. ';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage += 'Request timeout. Try a smaller file or check your connection.';
      } else if (error.response) {
        // Server responded with error status
        errorMessage += `Server error (${error.response.status}): `;
        if (error.response.data?.error) {
          errorMessage += error.response.data.error;
          if (error.response.data.details) {
            errorMessage += `\nDetails: ${error.response.data.details.substring(0, 200)}`;
          }
        } else {
          errorMessage += error.response.statusText;
        }
      } else if (error.request) {
        errorMessage += 'No response from server. Check if backend is running.';
        errorMessage += `\nMake sure ${ApiUrl}/api/upload is accessible.`;
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = ''; // Reset file input
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.product_name || !formData.price_new || !formData.brand || !formData.category) {
      alert('Please fill in all required fields: Product Name, Price, Brand, and Category');
      return;
    }
    
    try {
      const submitData = {
        ...formData,
        price_new: parseFloat(formData.price_new)
      };

      if (editingProduct) {
        console.log("📝 Updating product:", editingProduct.id);
        const response = await axios.put(`${ApiUrl}/api/products/${editingProduct.id}`, submitData, {
          timeout: 10000
        });
        console.log("✅ Update response:", response.data);
        alert('✅ Product updated successfully!');
      } else {
        console.log("➕ Creating new product");
        const response = await axios.post(`${ApiUrl}/api/products`, submitData, {
          timeout: 10000
        });
        console.log("✅ Create response:", response.data);
        alert('✅ Product added successfully!');
      }
      
      fetchProducts();
      resetForm();
    } catch (error) {
      console.error('❌ Error saving product:', error);
      let errorMessage = 'Error saving product: ';
      
      if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      product_name: product.product_name || '',
      price_new: product.price_new || '',
      brand: product.brand || '',
      category: product.category || '',
      description: product.description || '',
      image_url: product.image_url || '',
      video_url: product.video_url || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (productId) => {
    if (!productId || productId === 'undefined') {
      alert('Cannot delete product: Invalid product ID');
      return;
    }
    
    const confirmDelete = window.confirm('Are you sure you want to delete this product? This will also delete associated files from Cloudinary.');
    
    if (confirmDelete) {
      try {
        console.log("🗑️ Deleting product:", productId);
        await axios.delete(`${ApiUrl}/api/products/${productId}`, {
          timeout: 10000
        });
        fetchProducts();
        alert('✅ Product deleted successfully!');
      } catch (error) {
        console.error('❌ Error deleting product:', error);
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
    setUploadProgress(0);
  };

  const playVideo = (productId, videoUrl) => {
    if (activeVideo === productId) {
      setActiveVideo(null);
    } else {
      setActiveVideo(productId);
    }
  };

  const generateProductKey = (product, index) => {
    if (product.id && product.id !== 'undefined') {
      return product.id;
    }
    
    if (product.product_name && product.image_url) {
      return `${product.product_name}-${product.image_url.substring(0, 20)}-${index}`;
    }
    
    return `product-${index}-${Date.now()}`;
  };

  const testCloudinaryConnection = async () => {
    try {
      const response = await axios.get(`${ApiUrl}/api/upload/test`, {
        timeout: 5000
      });
      if (response.data.success) {
        alert('✅ Cloudinary connection successful!');
      } else {
        alert('⚠️ Cloudinary test failed: ' + response.data.error);
      }
    } catch (error) {
      alert('❌ Cloudinary test failed: ' + error.message);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <div className="header-content">
            <h1>Admin Dashboard</h1>
            <p className="subtitle">Manage your products with Cloudinary storage</p>
          </div>
          <div className="header-controls">
            <div className="storage-info">
              <span className="cloudinary-badge" onClick={testCloudinaryConnection} title="Click to test connection">
                ☁️ Cloudinary Storage
              </span>
              <span className="api-url">API: {ApiUrl}</span>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Add New Product'}
            </button>
          </div>
        </div>

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              >
                {uploadProgress}%
              </div>
            </div>
            <p className="progress-text">
              Uploading to Cloudinary... {uploadProgress}%
            </p>
          </div>
        )}

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
                <button className="close-btn" onClick={resetForm} disabled={uploading}>
                  ×
                </button>
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
                      disabled={uploading}
                      placeholder="Enter product name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Price ($) *</label>
                    <input
                      type="number"
                      name="price_new"
                      value={formData.price_new}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                      disabled={uploading}
                      placeholder="0.00"
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
                      disabled={uploading}
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
                      disabled={uploading}
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
                    disabled={uploading}
                    maxLength="1000"
                  />
                  <div className="char-count">
                    {formData.description.length}/1000 characters
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Image</label>
                    <div className="file-upload-wrapper">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'image')}
                        className="file-input"
                        id="image-upload"
                        disabled={uploading}
                      />
                      <label htmlFor="image-upload" className={`file-label ${uploading ? 'disabled' : ''}`}>
                        {uploading ? 'Uploading...' : 'Choose Image'}
                      </label>
                      <small className="file-hint">Max 50MB, JPG/PNG/GIF</small>
                    </div>
                    {formData.image_url && (
                      <div className="image-preview">
                        <img 
                          src={formData.image_url} 
                          alt="Preview" 
                          onError={(e) => {
                            console.error('Cloudinary image failed to load:', formData.image_url);
                            e.target.src = 'https://via.placeholder.com/300x200?text=Image+Error';
                          }}
                        />
                        <small>✓ Cloudinary Image</small>
                        <button 
                          type="button" 
                          className="btn-clear"
                          onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                          disabled={uploading}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label>Video</label>
                    <div className="file-upload-wrapper">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleFileUpload(e, 'video')}
                        className="file-input"
                        id="video-upload"
                        disabled={uploading}
                      />
                      <label htmlFor="video-upload" className={`file-label ${uploading ? 'disabled' : ''}`}>
                        {uploading ? 'Uploading...' : 'Choose Video'}
                      </label>
                      <small className="file-hint">Max 50MB, MP4/MOV/AVI</small>
                    </div>
                    {formData.video_url && (
                      <div className="video-preview">
                        <p>✓ Cloudinary Video</p>
                        <video 
                          controls 
                          style={{ maxWidth: '200px', maxHeight: '150px' }}
                          preload="metadata"
                        >
                          <source src={formData.video_url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                        <button 
                          type="button" 
                          className="btn-clear"
                          onClick={() => setFormData(prev => ({ ...prev, video_url: '' }))}
                          disabled={uploading}
                        >
                          Remove
                        </button>
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
                    {uploading ? 'Uploading...' : (editingProduct ? 'Update Product' : 'Create Product')}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={resetForm}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Products List */}
        <div className="products-section">
          <div className="section-header">
            <h2>Products ({products.length})</h2>
            <button 
              className="btn btn-refresh"
              onClick={fetchProducts}
              disabled={loading}
            >
              {loading ? 'Loading...' : '🔄 Refresh'}
            </button>
          </div>
          
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading products from Cloudinary...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="no-products">
              <div className="empty-state">
                <p>📭 No products found</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  Add Your First Product
                </button>
              </div>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product, index) => {
                const uniqueKey = generateProductKey(product, index);
                
                return (
                  <motion.div 
                    key={uniqueKey}
                    className="admin-product-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    layout
                  >
                    <div className="product-media">
                      {product.video_url && activeVideo === uniqueKey ? (
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
                            onError={(e) => {
                              console.error('Failed to load Cloudinary image for:', product.product_name);
                              e.target.src = 'https://via.placeholder.com/300x200?text=Image+Error';
                              e.target.alt = 'Image not available';
                            }}
                          />
                          {product.video_url && (
                            <button 
                              className="btn btn-primary btn-small video-play-btn"
                              onClick={() => playVideo(uniqueKey, product.video_url)}
                            >
                              ▶ Play Video
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="no-media">
                          <div className="no-image">📷 No Image</div>
                          {product.video_url ? (
                            <button 
                              className="btn btn-primary btn-small"
                              onClick={() => playVideo(uniqueKey, product.video_url)}
                              style={{ marginTop: '10px' }}
                            >
                              ▶ Play Video
                            </button>
                          ) : (
                            <div className="no-video">No Media</div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="product-info">
                      <h3>{product.product_name}</h3>
                      <div className="product-meta">
                        <span className="product-brand">Brand: {product.brand}</span>
                        <span className="product-category">Category: {product.category}</span>
                      </div>
                      <p className="product-price">${parseFloat(product.price_new).toFixed(2)}</p>
                      
                      {product.description && (
                        <p className="product-description">
                          {product.description.length > 100 
                            ? `${product.description.substring(0, 100)}...` 
                            : product.description}
                        </p>
                      )}
                      
                      <div className="product-urls">
                        {product.image_url && (
                          <small title={product.image_url}>
                            Image: {product.image_url.substring(0, 40)}...
                          </small>
                        )}
                        {product.video_url && (
                          <small title={product.video_url}>
                            Video: {product.video_url.substring(0, 40)}...
                          </small>
                        )}
                      </div>
                    </div>
                    
                    <div className="product-actions">
                      <button 
                        className="btn btn-edit"
                        onClick={() => handleEdit(product)}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="btn btn-delete"
                        onClick={() => handleDelete(product.id)}
                        disabled={!product.id || product.id === 'undefined'}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Debug Info (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-info">
            <details>
              <summary>Debug Information</summary>
              <pre>
                API URL: {ApiUrl}
                Total Products: {products.length}
                Uploading: {uploading ? 'Yes' : 'No'}
                Show Form: {showForm ? 'Yes' : 'No'}
                Editing: {editingProduct ? editingProduct.id : 'None'}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
