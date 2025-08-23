import React, { useState, useEffect } from 'react';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[85vh] overflow-y-auto">
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold">
              {existingReview ? 'Edit Review' : 'Write a Review'}
            </h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-3">
            <p className="text-sm text-gray-600 mb-1">Reviewing:</p>
            <p className="font-semibold text-sm">{vendorName}</p>
          </div>

          {error && (
            <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Rating */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Rating *</label>
              <div className="flex gap-1">
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
                      size={24}
                      fill={star <= (hoveredRating || rating) ? '#fbbf24' : 'none'}
                      stroke={star <= (hoveredRating || rating) ? '#fbbf24' : '#d1d5db'}
                      className="cursor-pointer"
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
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
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Review Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Summarize your experience"
                maxLength={100}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
            </div>

            {/* Comment */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Review Comment *</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                rows={3}
                placeholder="Share your detailed experience with this vendor..."
                maxLength={500}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{comment.length}/500</p>
            </div>

            {/* Image Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Add Photos (Optional)</label>
              <div className="grid grid-cols-5 gap-1 mb-1">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Review ${index + 1}`}
                      className="w-full h-16 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="w-full h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-gray-400">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Upload size={16} className="text-gray-400" />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500">Upload up to 5 photos</p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : (existingReview ? 'Update Review' : 'Submit Review')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
