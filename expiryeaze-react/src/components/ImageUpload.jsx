import React, { useState, useRef } from 'react';

const ImageUpload = ({
  onImagesChange,
  onExpiryPhotoChange,
  existingImages = [],
  existingExpiryPhoto
}) => {
  const [productImages, setProductImages] = useState(existingImages);
  const [expiryPhoto, setExpiryPhoto] = useState(existingExpiryPhoto || '');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const expiryFileInputRef = useRef(null);

  const handleFileUpload = (files, type) => {
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const imageUrl = e.target?.result;
          
          if (type === 'product') {
            const newImage = {
              id: Date.now().toString() + Math.random(),
              url: imageUrl,
              type: 'product',
              alt: `Product image - ${file.name}`
            };
            const updatedImages = [...productImages, newImage];
            setProductImages(updatedImages);
            onImagesChange(updatedImages);
          } else if (type === 'expiry') {
            // Standard Expiry Photo Upload (No AI Scanning!)
            setExpiryPhoto(imageUrl);
            onExpiryPhotoChange?.(imageUrl);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (imageId) => {
    const updatedImages = productImages.filter(img => img.id !== imageId);
    setProductImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const removeExpiryPhoto = () => {
    setExpiryPhoto('');
    onExpiryPhotoChange?.('');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files, type);
    }
  };

  return (
    <div className="row g-3">
      {/* Product Images Upload */}
      <div className="col-12">
        <label className="form-label fw-semibold">Product Images *</label>
        <div
          className={`border-2 border-dashed rounded p-4 text-center ${
            dragActive ? 'border-success bg-success-light' : 'border-muted'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={(e) => handleDrop(e, 'product')}
        >
          <i className="fas fa-cloud-upload-alt fs-1 text-muted mb-3"></i>
          <p className="mb-2">Drag and drop product images here, or</p>
          <button
            type="button"
            className="btn btn-outline-success"
            onClick={() => fileInputRef.current?.click()}
          >
            <i className="fas fa-upload me-2"></i>
            Choose Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="d-none"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'product')}
          />
          <p className="text-muted small mt-2">You can upload multiple images</p>
        </div>
      </div>

      {/* Display Product Images */}
      {productImages.length > 0 && (
        <div className="col-12">
          <h6 className="fw-semibold mb-2">Uploaded Product Images:</h6>
          <div className="row g-2">
            {productImages.map((image) => (
              <div key={image.id} className="col-md-3 col-sm-4 col-6">
                <div className="position-relative">
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="img-fluid rounded border"
                    style={{ height: '120px', width: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                    onClick={() => removeImage(image.id)}
                    style={{ width: '24px', height: '24px', padding: '0' }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standard Expiry Date Photo Upload */}
      <div className="col-12">
        <label className="form-label fw-semibold">Expiry Date Photo *</label>
        <div
          className={`border-2 border-dashed rounded p-4 text-center ${
            dragActive ? 'border-warning bg-warning-light' : 'border-muted'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={(e) => handleDrop(e, 'expiry')}
        >
          <i className="fas fa-calendar-check fs-1 text-muted mb-3"></i>
          <p className="mb-2">Upload a clear photo showing the Expiry Date (For verification)</p>
          <button
            type="button"
            className="btn btn-outline-warning text-dark"
            onClick={() => expiryFileInputRef.current?.click()}
          >
            <i className="fas fa-camera me-2"></i>
            Upload Expiry Photo
          </button>
          <input
            ref={expiryFileInputRef}
            type="file"
            accept="image/*"
            className="d-none"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'expiry')}
          />
        </div>
      </div>

      {/* Display Expiry Photo */}
      {expiryPhoto && (
        <div className="col-12">
          <h6 className="fw-semibold mb-2">Uploaded Expiry Date Photo:</h6>
          <div className="position-relative d-inline-block">
            <img
              src={expiryPhoto}
              alt="Expiry date"
              className="img-fluid rounded border"
              style={{ maxHeight: '200px', maxWidth: '300px' }}
            />
            <button
              type="button"
              className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
              onClick={removeExpiryPhoto}
              style={{ width: '24px', height: '24px', padding: '0' }}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;