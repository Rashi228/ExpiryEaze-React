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
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading reviews...</p>
      </div>
    );
  }

     return (
     <div className="bg-white rounded-lg shadow-sm border">
       {/* Header */}
       <div className="p-4 border-b">
         <div className="flex justify-between items-start">
           <div>
             <h4 className="text-base font-semibold mb-1">Customer Reviews</h4>
             <div className="flex items-center gap-3">
               <div className="flex items-center gap-1">
                 <div className="flex">
                   {[1, 2, 3, 4, 5].map((star) => (
                     <Star
                       key={star}
                       size={16}
                       fill={star <= ratingStats.averageRating ? '#fbbf24' : 'none'}
                       stroke={star <= ratingStats.averageRating ? '#fbbf24' : '#d1d5db'}
                     />
                   ))}
                 </div>
                 <span className="font-semibold text-sm">{ratingStats.averageRating.toFixed(1)}</span>
               </div>
               <span className="text-gray-600 text-sm">({ratingStats.numReviews} reviews)</span>
             </div>
           </div>
           
                       {/* Always show the review button for debugging */}
            <button
              onClick={() => setShowReviewModal(true)}
              className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 font-medium shadow-sm"
            >
              <Plus size={12} />
              {myReview ? 'Edit' : 'Review'}
            </button>
         </div>

                 {/* Rating Distribution */}
         {ratingStats.numReviews > 0 && (
           <div className="mt-3 space-y-1">
             {[5, 4, 3, 2, 1].map((rating) => {
               const count = ratingStats.ratingDistribution[rating] || 0;
               const percentage = ratingStats.numReviews > 0 
                 ? (count / ratingStats.numReviews) * 100 
                 : 0;
               
               return (
                 <div key={rating} className="flex items-center gap-2">
                   <span className="text-xs w-6">{rating}★</span>
                   <div className="flex-1 bg-gray-200 rounded-full h-1">
                     <div 
                       className="bg-yellow-400 h-1 rounded-full"
                       style={{ width: `${percentage}%` }}
                     ></div>
                   </div>
                   <span className="text-xs text-gray-600 w-8">{count}</span>
                 </div>
               );
             })}
           </div>
         )}
       </div>

       {/* Reviews List */}
       <div className="p-4">
                 {reviews.length === 0 ? (
           <div className="text-center py-4">
             <MessageCircle size={32} className="text-gray-300 mx-auto mb-2" />
             <p className="text-gray-600 text-sm">No reviews yet</p>
                           {/* Always show the Give Review button when no reviews */}
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Be the first to review this vendor!</p>
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded text-xs hover:bg-green-600 font-medium mx-auto shadow-sm"
                >
                  <Plus size={12} />
                  Give Review
                </button>
              </div>
           </div>
         ) : (
           <div className="space-y-4">
             {/* Give Review Button at the top when reviews exist */}
                           {/* Always show the Give Review button when reviews exist */}
              {!myReview && (
                <div className="text-center py-2 border-b border-gray-100">
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded text-xs hover:bg-green-600 font-medium mx-auto shadow-sm"
                  >
                    <Plus size={12} />
                    Give Review
                  </button>
                </div>
              )}
             
             {reviews.map((review) => (
               <div key={review._id} className="border-b border-gray-100 pb-4 last:border-b-0">
                 <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-2">
                     <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                       <span className="text-green-600 font-semibold text-sm">
                         {review.user.name.charAt(0).toUpperCase()}
                       </span>
                     </div>
                     <div>
                       <p className="font-semibold text-sm">{review.user.name}</p>
                       <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                     </div>
                   </div>
                   
                   {user && review.user._id === user.id && (
                     <div className="flex gap-1">
                       <button
                         onClick={() => {
                           setMyReview(review);
                           setShowReviewModal(true);
                         }}
                         className="text-blue-600 hover:text-blue-800"
                       >
                         <Edit size={14} />
                       </button>
                       <button
                         onClick={() => handleDeleteReview(review._id)}
                         className="text-red-600 hover:text-red-800"
                       >
                         <Trash2 size={14} />
                       </button>
                     </div>
                   )}
                 </div>

                                 <div className="flex items-center gap-2 mb-1">
                   <div className="flex">
                     {[1, 2, 3, 4, 5].map((star) => (
                       <Star
                         key={star}
                         size={14}
                         fill={star <= review.rating ? '#fbbf24' : 'none'}
                         stroke={star <= review.rating ? '#fbbf24' : '#d1d5db'}
                       />
                     ))}
                   </div>
                   <span className="text-xs text-gray-600">
                     {getRatingText(review.rating)}
                   </span>
                 </div>

                 <h5 className="font-semibold text-sm mb-1">{review.title}</h5>
                 <p className="text-gray-700 text-sm mb-2">{review.comment}</p>

                                 {/* Review Images */}
                 {review.images && review.images.length > 0 && (
                   <div className="flex gap-1 mb-2 overflow-x-auto">
                     {review.images.map((image, index) => (
                       <img
                         key={index}
                         src={image}
                         alt={`Review ${index + 1}`}
                         className="w-16 h-16 object-cover rounded border"
                       />
                     ))}
                   </div>
                 )}

                 {/* Helpful Button */}
                 {user && (
                   <div className="flex items-center gap-2">
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
                       <ThumbsUp size={12} />
                       Helpful ({review.helpful.filter(h => h.helpful).length})
                     </button>
                   </div>
                 )}
              </div>
            ))}

                         {/* Load More Button */}
             {hasMore && (
               <div className="text-center pt-3">
                 <button
                   onClick={loadMoreReviews}
                   className="px-4 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
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
