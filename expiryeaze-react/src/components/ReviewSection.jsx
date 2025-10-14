import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, MessageCircle, Edit, Trash2, Plus } from 'lucide-react';
import axios from 'axios';
import { config } from '../lib/config';
import ReviewModal from './ReviewModal';
import { useAuth } from '../contexts/AuthContext';

const ReviewSection = ({ vendorId, vendorName }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [ratingStats, setRatingStats] = useState({
    averageRating: 0,
    numReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const API_URL = config.API_URL;

  useEffect(() => {
    if (vendorId) {
      fetchReviews();
      if (user) {
        fetchMyReview();
      }
    }
  }, [vendorId, user]);

  const fetchReviews = async (page = 1) => {
    try {
      const response = await axios.get(
        `${API_URL}/reviews/vendor/${vendorId}?page=${page}&limit=5`
      );
      
      if (response.data.success) {
        const { reviews, ratingStats, pagination } = response.data.data;
        
        if (page === 1) {
          setReviews(reviews);
        } else {
          setReviews(prev => [...prev, ...reviews]);
        }
        
        setRatingStats(ratingStats);
        setHasMore(pagination.hasNext);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReview = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/reviews/vendor/${vendorId}/my-review`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setMyReview(response.data.data);
      }
    } catch (error) {
      // User hasn't reviewed this vendor yet
      setMyReview(null);
    }
  };

  const handleReviewSubmit = (newReview) => {
    if (myReview) {
      // Update existing review
      setReviews(prev => 
        prev.map(review => 
          review._id === newReview._id ? newReview : review
        )
      );
      setMyReview(newReview);
    } else {
      // Add new review
      setReviews(prev => [newReview, ...prev]);
      setMyReview(newReview);
      setRatingStats(prev => ({
        ...prev,
        numReviews: prev.numReviews + 1
      }));
    }
    
    // Refresh reviews to get updated stats
    fetchReviews();
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setReviews(prev => prev.filter(review => review._id !== reviewId));
      setMyReview(null);
      setRatingStats(prev => ({
        ...prev,
        numReviews: Math.max(0, prev.numReviews - 1)
      }));
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const handleMarkHelpful = async (reviewId, helpful) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/reviews/${reviewId}/helpful`,
        { helpful },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update the review in the list
      setReviews(prev => 
        prev.map(review => {
          if (review._id === reviewId) {
            const existingHelpful = review.helpful.find(h => h.user === user.id);
            if (existingHelpful) {
              existingHelpful.helpful = helpful;
            } else {
              review.helpful.push({ user: user.id, helpful });
            }
          }
          return review;
        })
      );
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  const loadMoreReviews = () => {
    fetchReviews(currentPage + 1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRatingText = (rating) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-3">
        <div className="spinner-border text-success" role="status" style={{ width: '1.5rem', height: '1.5rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted small">Loading reviews...</p>
      </div>
    );
  }

     return (
    <div className="bg-white text-dark rounded-lg shadow-sm border">
       {/* Header */}
       <div className="p-3 border-b">
         <div className="flex justify-between items-center">
           <div>
            <h4 className="mb-1 small fw-semibold">Reviews</h4>
            <div className="d-flex align-items-center gap-2">
               <div className="flex">
                 {[1, 2, 3, 4, 5].map((star) => (
                   <Star
                     key={star}
                     size={12}
                     fill={star <= ratingStats.averageRating ? '#fbbf24' : 'none'}
                     stroke={star <= ratingStats.averageRating ? '#fbbf24' : '#d1d5db'}
                   />
                 ))}
               </div>
               <span className="font-semibold text-xs">{ratingStats.averageRating.toFixed(1)}</span>
               <span className="text-gray-600 text-xs">({ratingStats.numReviews})</span>
             </div>
           </div>
           
            <button
              onClick={() => setShowReviewModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 font-medium shadow-sm"
            >
              <Plus size={10} />
              {myReview ? 'Edit' : 'Review'}
            </button>
         </div>

         {/* Rating Distribution - Compact */}
         {ratingStats.numReviews > 0 && (
           <div className="mt-2 space-y-0.5">
             {[5, 4, 3, 2, 1].map((rating) => {
               const count = ratingStats.ratingDistribution[rating] || 0;
               const percentage = ratingStats.numReviews > 0 
                 ? (count / ratingStats.numReviews) * 100 
                 : 0;
               
               return (
                <div key={rating} className="d-flex align-items-center gap-1">
                  <span className="small" style={{ width: '22px' }}>{rating}★</span>
                  <div className="flex-grow-1 bg-light rounded-pill" style={{ height: '4px' }}>
                     <div 
                      className="bg-warning rounded-pill"
                      style={{ width: `${percentage}%`, height: '4px' }}
                     ></div>
                   </div>
                  <span className="small text-muted" style={{ width: '24px' }}>{count}</span>
                 </div>
               );
             })}
           </div>
         )}
       </div>

      {/* Reviews List */}
      <div className="p-3 text-dark">
         {reviews.length === 0 ? (
           <div className="text-center py-3">
            <MessageCircle size={20} className="text-muted mx-auto mb-1" />
            <p className="text-muted small">No reviews yet</p>
             <div className="mt-2">
               <button
                 onClick={() => setShowReviewModal(true)}
                 className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 font-medium mx-auto shadow-sm"
               >
                 <Plus size={10} />
                 Give Review
               </button>
             </div>
           </div>
         ) : (
           <div className="space-y-3">
             {/* Give Review Button - Compact */}
             {!myReview && (
               <div className="text-center py-1 border-b border-gray-100">
                 <button
                   onClick={() => setShowReviewModal(true)}
                   className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 font-medium mx-auto shadow-sm"
                 >
                   <Plus size={10} />
                   Give Review
                 </button>
               </div>
             )}
             
             {reviews.map((review) => (
               <div key={review._id} className="border-b border-gray-100 pb-2 last:border-b-0">
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <div className="d-flex align-items-center gap-2">
                     <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                       <span className="text-white font-semibold text-xs">
                         {review.user.name.charAt(0).toUpperCase()}
                       </span>
                     </div>
                     <div>
                      <p className="fw-semibold small mb-0">{review.user.name}</p>
                      <small className="text-muted">{formatDate(review.createdAt)}</small>
                     </div>
                   </div>
                   
                   {user && review.user._id === user.id && (
                    <div className="d-flex gap-1">
                       <button
                         onClick={() => {
                           setMyReview(review);
                           setShowReviewModal(true);
                         }}
                         className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                         title="Edit review"
                       >
                         <Edit size={12} />
                       </button>
                       <button
                         onClick={() => handleDeleteReview(review._id)}
                         className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                         title="Delete review"
                       >
                         <Trash2 size={12} />
                       </button>
                     </div>
                   )}
                 </div>

                <div className="d-flex align-items-center gap-2 mb-1">
                  <div className="d-flex">
                     {[1, 2, 3, 4, 5].map((star) => (
                       <Star
                         key={star}
                         size={10}
                         fill={star <= review.rating ? '#fbbf24' : 'none'}
                         stroke={star <= review.rating ? '#fbbf24' : '#d1d5db'}
                       />
                     ))}
                   </div>
                  <span className="small text-muted">
                     {getRatingText(review.rating)}
                   </span>
                 </div>

                <h6 className="fw-semibold small mb-1">{review.title}</h6>
                <p className="small mb-1">{review.comment}</p>

                 {/* Review Images - Compact */}
                 {review.images && review.images.length > 0 && (
                  <div className="d-flex gap-1 mb-1 overflow-auto">
                     {review.images.map((image, index) => (
                       <img
                         key={index}
                         src={image}
                         alt={`Review ${index + 1}`}
                         className="w-12 h-12 object-cover rounded border"
                       />
                     ))}
                   </div>
                 )}

                 {/* Helpful Button - Compact */}
                 {user && (
                  <div className="d-flex align-items-center">
                     <button
                       onClick={() => {
                         const isHelpful = review.helpful.find(h => h.user === user.id)?.helpful;
                         handleMarkHelpful(review._id, !isHelpful);
                       }}
                       className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                         review.helpful.find(h => h.user === user.id)?.helpful
                           ? 'bg-green-100 text-green-700'
                           : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                       }`}
                     >
                       <ThumbsUp size={10} />
                       {review.helpful.filter(h => h.helpful).length}
                     </button>
                   </div>
                 )}
              </div>
            ))}

             {/* Load More Button - Compact */}
             {hasMore && (
              <div className="text-center pt-2">
                 <button
                   onClick={loadMoreReviews}
                  className="btn btn-light btn-sm"
                 >
                   Load More
                 </button>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setMyReview(null);
        }}
        vendorId={vendorId}
        vendorName={vendorName}
        onReviewSubmit={handleReviewSubmit}
        existingReview={myReview}
      />
    </div>
  );
};

export default ReviewSection;
