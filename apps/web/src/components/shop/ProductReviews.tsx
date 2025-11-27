'use client';

/**
 * Product Reviews Section Component
 * Displays reviews and allows users to submit new reviews
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { catalogApi, Review, ReviewsResponse } from '@/lib/catalog-api';
import { StarRating } from './StarRating';

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const queryClient = useQueryClient();
  const { isAuthenticated, accessToken } = useAuthStore();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Fetch reviews
  const { data: reviewsData, isLoading } = useQuery<ReviewsResponse>({
    queryKey: ['reviews', productId, page, sort],
    queryFn: () => catalogApi.getProductReviews(productId, { page, perPage: 5, sort }),
  });

  // Fetch user's existing review
  const { data: myReview } = useQuery<Review | null>({
    queryKey: ['myReview', productId],
    queryFn: () => accessToken ? catalogApi.getMyReview(productId, accessToken) : null,
    enabled: isAuthenticated && !!accessToken,
  });

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: (data: { rating: number; title?: string; content?: string }) =>
      catalogApi.createReview({ productId, ...data }, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['myReview', productId] });
      setShowReviewForm(false);
    },
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: string) => catalogApi.deleteReview(reviewId, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['myReview', productId] });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>

      {/* Rating Summary */}
      {reviewsData && reviewsData.pagination.total > 0 && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Rating Distribution */}
            <div className="flex-1">
              <h3 className="font-semibold mb-3">Rating Distribution</h3>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = reviewsData.ratingDistribution[rating] || 0;
                const total = reviewsData.pagination.total;
                const percentage = total > 0 ? (count / total) * 100 : 0;

                return (
                  <div key={rating} className="flex items-center gap-2 mb-1">
                    <span className="w-8 text-sm">{rating} ⭐</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-sm text-gray-600">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Write Review Button */}
            <div className="text-center">
              {isAuthenticated ? (
                myReview ? (
                  <div className="text-sm text-gray-600">
                    You&apos;ve already reviewed this product
                  </div>
                ) : (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full font-semibold transition-colors"
                  >
                    Write a Review
                  </button>
                )
              ) : (
                <p className="text-sm text-gray-600">
                  <a href="/login" className="text-purple-600 hover:underline">
                    Log in
                  </a>{' '}
                  to write a review
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm
          productName={productName}
          onSubmit={(data) => createReviewMutation.mutate(data)}
          onCancel={() => setShowReviewForm(false)}
          isLoading={createReviewMutation.isPending}
          error={createReviewMutation.error?.message}
        />
      )}

      {/* Sort Controls */}
      {reviewsData && reviewsData.reviews.length > 0 && (
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">
            {reviewsData.pagination.total} review{reviewsData.pagination.total !== 1 ? 's' : ''}
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      {isLoading && (
        <div className="text-center py-8 text-gray-600">Loading reviews...</div>
      )}

      {reviewsData && reviewsData.reviews.length === 0 && !showReviewForm && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No reviews yet. Be the first to review!</p>
          {isAuthenticated && !myReview && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full font-semibold transition-colors"
            >
              Write a Review
            </button>
          )}
        </div>
      )}

      {reviewsData && reviewsData.reviews.length > 0 && (
        <div className="space-y-4">
          {reviewsData.reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isOwn={review.userId === myReview?.userId}
              onDelete={() => {
                if (confirm('Are you sure you want to delete your review?')) {
                  deleteReviewMutation.mutate(review.id);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {reviewsData && reviewsData.pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {page} of {reviewsData.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(reviewsData.pagination.totalPages, p + 1))}
            disabled={page === reviewsData.pagination.totalPages}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// Review Form Sub-component
interface ReviewFormProps {
  productName: string;
  onSubmit: (data: { rating: number; title?: string; content?: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
  error?: string;
}

function ReviewForm({ productName, onSubmit, onCancel, isLoading, error }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    onSubmit({
      rating,
      title: title || undefined,
      content: content || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6 mb-6">
      <h3 className="font-semibold text-lg mb-4">Review {productName}</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Rating *
        </label>
        <StarRating rating={rating} size="lg" interactive onChange={setRating} />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Review Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={200}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Review
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What did you like or dislike about this product?"
          rows={4}
          maxLength={2000}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading || rating === 0}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-full font-semibold transition-colors"
        >
          {isLoading ? 'Submitting...' : 'Submit Review'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 rounded-full font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Review Card Sub-component
interface ReviewCardProps {
  review: Review;
  isOwn: boolean;
  onDelete?: () => void;
}

function ReviewCard({ review, isOwn, onDelete }: ReviewCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StarRating rating={review.rating} size="sm" />
            {review.isVerified && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                ✓ Verified Purchase
              </span>
            )}
          </div>
          {review.title && (
            <h4 className="font-semibold text-gray-900">{review.title}</h4>
          )}
        </div>
        {isOwn && onDelete && (
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Delete
          </button>
        )}
      </div>

      {review.content && (
        <p className="text-gray-700 mb-3">{review.content}</p>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>{review.user.username}</span>
        <span>•</span>
        <span>{new Date(review.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}</span>
      </div>
    </div>
  );
}
