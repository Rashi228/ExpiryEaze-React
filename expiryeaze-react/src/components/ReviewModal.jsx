import React, { useState, useEffect, useRef } from 'react';
import { Star, X, Upload, Trash2 } from 'lucide-react';
import axios from 'axios';
import { config } from '../lib/config';

const ReviewModal = ({ isOpen, onClose, vendorId, vendorName, onReviewSubmit, existingReview = null }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [images, setImages] = useState(existingReview?.images || []);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const API_URL = config.API_URL;
  const modalBoxRef = useRef(null);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setTitle(existingReview.title);
      setComment(existingReview.comment);
      setImages(existingReview.images || []);
    }
  }, [existingReview]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...newImages].slice(0, 5)); // Max 5 images
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Debug: always run when modal opens to confirm compact styling applied
  useEffect(() => {
    if (isOpen && modalBoxRef.current) {
      const cs = window.getComputedStyle(modalBoxRef.current);
      // eslint-disable-next-line no-console
      console.log('[ReviewModal debug] padding:', cs.padding, 'boxShadow:', cs.boxShadow, 'border:', cs.border);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a review title');
      return;
    }

    if (!comment.trim()) {
      setError('Please enter a review comment');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const reviewData = {
        vendorId,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        images
      };

      let response;
      if (existingReview) {
        // Update existing review
        response = await axios.put(
          `${API_URL}/reviews/${existingReview._id}`,
          reviewData,
          config
        );
      } else {
        // Create new review
        response = await axios.post(
          `${API_URL}/reviews`,
          reviewData,
          config
        );
      }

      if (response.data.success) {
        // Call the callback to update the parent component
        onReviewSubmit(response.data.data);
        // Close the modal
        onClose();
        // Reset form
        setRating(0);
        setTitle('');
        setComment('');
        setImages([]);
        setError('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0);
      setTitle('');
      setComment('');
      setImages([]);
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div ref={modalBoxRef} className="bg-white text-dark" style={{ maxWidth: 420, width: '100%', maxHeight: '80vh', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: 8, boxShadow: 'none' }}>
        <div className="p-2">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h2 className="text-sm fw-bold mb-0">
              {existingReview ? 'Edit Review' : 'Write Review'}
            </h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={14} />
            </button>
          </div>

          <div className="mb-2">
            <p className="text-xs text-muted mb-0">Reviewing: <span className="fw-semibold">{vendorName}</span></p>
          </div>

          {error && (
            <div className="mb-2 text-danger small">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Rating */}
            <div className="mb-2">
              <label className="block text-xs fw-medium mb-1">Rating *</label>
              <div className="d-flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-colors"
                  >
                    <Star
                      size={16}
                      fill={star <= (hoveredRating || rating) ? '#fbbf24' : 'none'}
                      stroke={star <= (hoveredRating || rating) ? '#fbbf24' : '#d1d5db'}
                      className="cursor-pointer"
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted mt-1 mb-0">
                {rating > 0 && (
                  <>
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </>
                )}
              </p>
            </div>

            {/* Title */}
            <div className="mb-2">
              <label className="block text-xs fw-medium mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-xs"
                placeholder="Summarize your experience"
                maxLength={100}
                required
              />
              <p className="text-xs text-muted mt-1 mb-0">{title.length}/100</p>
            </div>

            {/* Comment */}
            <div className="mb-2">
              <label className="block text-xs fw-medium mb-1">Comment *</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-xs"
                rows={2}
                placeholder="Share your experience..."
                maxLength={500}
                required
              />
              <p className="text-xs text-muted mt-1 mb-0">{comment.length}/500</p>
            </div>

            {/* Image Upload - Compact */}
            <div className="mb-2">
              <label className="block text-xs fw-medium mb-1">Photos (Optional)</label>
              <div className="grid grid-cols-4 gap-1 mb-1">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Review ${index + 1}`}
                      className="w-full h-12 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <Trash2 size={8} />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="w-full h-12 border border-gray-300 rounded d-flex align-items-center justify-content-center cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Upload size={12} className="text-gray-400" />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted mb-0">Max 5 photos</p>
            </div>

            {/* Submit Button - Compact */}
            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : (existingReview ? 'Update' : 'Submit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
