'use client';

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "../UI/Button";


interface ReviewFormProps { 
    onSubmit: (rating: number, comment: string) => void;
    onCancel: () => void;
    isSubmitting: boolean;
}


export function ReviewForm({ onSubmit, onCancel, isSubmitting }: ReviewFormProps) { 
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (rating === 0) {
        return; // Add validation message if needed
      }
      onSubmit(rating, comment);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Rating</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 -m-1"
              >
                <Star
                  className={`h-8 w-8 ${
                    (hoverRating || rating) >= star
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Review Text */}
        <div>
          <label
            htmlFor="comment"
            className="block text-sm font-medium text-gray-700"
          >
            Your Review
          </label>
          <textarea
            id="comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="What did you like or dislike about this product?"
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={rating === 0}
          >
            Submit Review
          </Button>
        </div>
      </form>
    );
}