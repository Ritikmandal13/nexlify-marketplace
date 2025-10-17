import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { StarRating } from '@/components/ui/star-rating';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Star, Loader2 } from 'lucide-react';

interface AddReviewDialogProps {
  listingId: string;
  sellerId: string;
  onReviewAdded?: () => void;
  trigger?: React.ReactNode;
}

export const AddReviewDialog: React.FC<AddReviewDialogProps> = ({
  listingId,
  sellerId,
  onReviewAdded,
  trigger
}) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a rating before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be signed in to leave a review');
      }

      // Check if user is trying to review their own listing
      if (user.id === sellerId) {
        throw new Error('You cannot review your own listing');
      }

      // Insert the review
      const { error } = await supabase.from('reviews').insert({
        listing_id: listingId,
        reviewer_id: user.id,
        seller_id: sellerId,
        rating: rating,
        review_text: reviewText.trim() || null,
        is_verified_purchase: false, // Could be updated based on actual purchase
      });

      if (error) {
        if (error.code === '23505') {
          throw new Error('You have already reviewed this listing');
        }
        throw error;
      }

      toast({
        title: 'Review Submitted!',
        description: 'Thank you for your feedback.',
      });

      setOpen(false);
      setRating(0);
      setReviewText('');
      
      if (onReviewAdded) {
        onReviewAdded();
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Star size={16} className="mr-2" />
            Write a Review
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>
            Share your experience with this item and help others make informed decisions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label>Your Rating *</Label>
            <div className="flex items-center gap-2">
              <StarRating
                rating={rating}
                size={32}
                interactive
                onRatingChange={setRating}
              />
              {rating > 0 && (
                <span className="text-sm text-gray-600 font-medium">
                  {rating} {rating === 1 ? 'star' : 'stars'}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-text">Your Review (Optional)</Label>
            <Textarea
              id="review-text"
              placeholder="Tell us about your experience with this item..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Be honest and helpful. Avoid profanity or personal information.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

