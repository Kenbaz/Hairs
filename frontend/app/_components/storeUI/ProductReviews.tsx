'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, StarHalf } from "lucide-react";
import { Button } from "../UI/Button";
import { Pagination } from "../UI/Pagination";
import { ReviewForm } from "./ReviewForm";
import { useAuth } from "@/src/libs/customHooks/useAuth";
import { showToast } from "../_providers/ToastProvider";
import Link from "next/link";
import { productService } from "@/src/libs/services/customerServices/productService";


interface ReviewsSectionProps {
    productId: number;
}


export function ReviewsSection({ productId }: ReviewsSectionProps) { 
    const [page, setPage] = useState(1);
    const [isWritingReview, setIsWritingReview] = useState(false);
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();


    // Fetch reviews
    const { data: reviewsData, isLoading } = useQuery({
        queryKey: ['product-reviews', productId, page],
        queryFn: () => productService.getProductReviews(productId, page)
    });


    // Submit review
    const submitReview = useMutation({
        mutationFn: ({ rating, comment }: { rating: number, comment: string }) => productService.submitReview(productId, rating, comment),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['product-reviews', productId],
            });
            setIsWritingReview(false);
            showToast.success('Review submitted successfully');
        },
        onError: () => {
            showToast.error('Failed to submit review');
        }
    });


    const handleSubmitReview = async (rating: number, comment: string) => {
        await submitReview.mutateAsync({ rating, comment });
    };


    // Function to render star rating
    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <Star
                    key={`full-${i}`}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                />
            );
        };

        if (hasHalfStar) {
            stars.push(
                <StarHalf
                    key="half"
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                />
            );
        };

        const remainingStars = 5 - Math.ceil(rating);
        for (let i = 0; i < remainingStars; i++) {
            stars.push(
                <Star key={`empty-${i}`} className="h-5 w-5 text-gray-300" />
            );
        }

        return stars;
    };

    if (isLoading) {
      return <div>Loading reviews...</div>;
    };


    if (!reviewsData) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No reviews available</p>
        </div>
      );
    }


    const { reviews, total_reviews, average_rating } = reviewsData;

    return (
      <div className="mt-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Customer Reviews ({total_reviews})
          </h2>
          {isAuthenticated ? (
            <Button
              onClick={() => setIsWritingReview(true)}
              disabled={isWritingReview}
            >
              Write a Review
            </Button>
          ) : (
            <Link href="/auth/login">
              <Button>Login to Write a Review</Button>
            </Link>
          )}
        </div>

        {/* Average Rating */}
        {total_reviews > 0 && (
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center">
              {renderStars(average_rating)}
            </div>
            <p className="text-lg font-medium">
              {average_rating.toFixed(1)} out of 5
            </p>
          </div>
        )}

        {/* Review Form */}
        {isWritingReview && (
          <div className="mb-8">
            <ReviewForm
              onSubmit={handleSubmitReview}
              onCancel={() => setIsWritingReview(false)}
              isSubmitting={submitReview.isPending}
            />
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          <div className="space-y-8">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      {renderStars(review.rating)}
                    </div>
                    <p className="font-medium text-gray-900">{`${review.user.first_name} ${review.user.last_name}`}</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-gray-600">{review.comment}</p>
                {review.verified_purchase && (
                  <p className="mt-2 text-sm text-green-600">
                    Verified Purchase
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total_reviews > 10 && (
          <div className="mt-8">
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total_reviews / 10)}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    );
}


