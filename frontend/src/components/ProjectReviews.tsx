import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, ThumbsUp, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface Review {
  id: string;
  user_name: string;
  rating: number;
  title: string;
  comment: string;
  location_rating: number | null;
  amenities_rating: number | null;
  value_rating: number | null;
  helpful_count: number;
  verified_buyer: boolean;
  created_at: string;
}

interface ProjectReviewsProps {
  projectId: string;
  reviews: Review[];
  averageRating: string;
  onReviewAdded: () => void;
}

export default function ProjectReviews({
  projectId,
  reviews,
  averageRating,
  onReviewAdded,
}: ProjectReviewsProps) {
  const { user, isAuthenticated } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [locationRating, setLocationRating] = useState(5);
  const [amenitiesRating, setAmenitiesRating] = useState(5);
  const [valueRating, setValueRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      alert("Please login to write a review");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE_URL}/api/projects/reviews/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project: projectId,
          rating,
          title,
          comment,
          location_rating: locationRating,
          amenities_rating: amenitiesRating,
          value_rating: valueRating,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to submit review");
      }

      // Reset form
      setTitle("");
      setComment("");
      setRating(5);
      setLocationRating(5);
      setAmenitiesRating(5);
      setValueRating(5);
      setShowReviewForm(false);
      onReviewAdded();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      alert(error.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    if (!isAuthenticated) {
      alert("Please login to mark reviews as helpful");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${API_BASE_URL}/api/projects/reviews/${reviewId}/mark_helpful/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      onReviewAdded(); // Refresh reviews
    } catch (error) {
      console.error("Error marking review as helpful:", error);
    }
  };

  const StarRating = ({
    value,
    onChange,
    readonly = false,
  }: {
    value: number;
    onChange?: (value: number) => void;
    readonly?: boolean;
  }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            } ${!readonly && "cursor-pointer hover:scale-110 transition-transform"}`}
            onClick={() => !readonly && onChange && onChange(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overall Rating */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold">{parseFloat(averageRating).toFixed(1)}</div>
              <StarRating value={Math.round(parseFloat(averageRating))} readonly />
              <div className="text-sm text-muted-foreground mt-2">
                {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
              </div>
            </div>

            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviews.filter((r) => r.rating === stars).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-sm w-12">{stars} star</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Write Review Button */}
      {isAuthenticated && !showReviewForm && (
        <Button onClick={() => setShowReviewForm(true)} className="w-full">
          Write a Review
        </Button>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Write Your Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Overall Rating</Label>
              <StarRating value={rating} onChange={setRating} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm">Location</Label>
                <StarRating value={locationRating} onChange={setLocationRating} />
              </div>
              <div>
                <Label className="text-sm">Amenities</Label>
                <StarRating value={amenitiesRating} onChange={setAmenitiesRating} />
              </div>
              <div>
                <Label className="text-sm">Value</Label>
                <StarRating value={valueRating} onChange={setValueRating} />
              </div>
            </div>

            <div>
              <Label>Review Title</Label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <Label>Your Review</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this project..."
                rows={5}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmitReview} disabled={submitting || !title || !comment}>
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReviewForm(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No reviews yet. Be the first to review this project!
              </p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {review.user_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{review.user_name}</span>
                      {review.verified_buyer && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified Buyer
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <StarRating value={review.rating} readonly />

                    <h4 className="font-semibold mt-2">{review.title}</h4>
                    <p className="text-muted-foreground mt-1">{review.comment}</p>

                    {/* Category Ratings */}
                    {(review.location_rating || review.amenities_rating || review.value_rating) && (
                      <div className="flex gap-4 mt-3 text-sm">
                        {review.location_rating && (
                          <div>
                            <span className="text-muted-foreground">Location: </span>
                            <span className="font-medium">{review.location_rating}/5</span>
                          </div>
                        )}
                        {review.amenities_rating && (
                          <div>
                            <span className="text-muted-foreground">Amenities: </span>
                            <span className="font-medium">{review.amenities_rating}/5</span>
                          </div>
                        )}
                        {review.value_rating && (
                          <div>
                            <span className="text-muted-foreground">Value: </span>
                            <span className="font-medium">{review.value_rating}/5</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Helpful Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3"
                      onClick={() => handleMarkHelpful(review.id)}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Helpful ({review.helpful_count})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
