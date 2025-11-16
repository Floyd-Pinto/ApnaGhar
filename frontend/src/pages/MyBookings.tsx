import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Calendar,
  DollarSign,
  Home,
  MapPin,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { bookingAPI, Booking } from "@/services/api";

export default function MyBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all"); // all, active, pending, confirmed, completed, cancelled

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user, filter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let data: Booking[] = [];
      
      if (filter === "all") {
        data = await bookingAPI.getMyBookings();
      } else if (filter === "active") {
        data = await bookingAPI.getActiveBookings();
      } else {
        data = await bookingAPI.getAll({ status: filter });
      }
      
      setBookings(data);
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any } } = {
      pending: { label: "Pending", variant: "outline", icon: Clock },
      token_paid: { label: "Token Paid", variant: "secondary", icon: CheckCircle2 },
      confirmed: { label: "Confirmed", variant: "default", icon: CheckCircle2 },
      agreement_pending: { label: "Agreement Pending", variant: "outline", icon: FileText },
      agreement_signed: { label: "Agreement Signed", variant: "default", icon: FileText },
      payment_in_progress: { label: "Payment In Progress", variant: "secondary", icon: Clock },
      completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
      cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
      refund_pending: { label: "Refund Pending", variant: "outline", icon: Clock },
      refunded: { label: "Refunded", variant: "secondary", icon: XCircle },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" as const, icon: Clock };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} L`;
    }
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground">Manage all your property bookings</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "active", "pending", "confirmed", "completed", "cancelled"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Bookings Found</h3>
              <p className="text-muted-foreground mb-4">
                {filter === "all"
                  ? "You don't have any bookings yet."
                  : `No ${filter} bookings found.`}
              </p>
              <Link to="/explore-projects">
                <Button>
                  <Home className="h-4 w-4 mr-2" />
                  Explore Properties
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <CardTitle className="text-lg">
                        {booking.property_details.unit_number}
                      </CardTitle>
                      <CardDescription>{booking.project_name}</CardDescription>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Booking #: {booking.booking_number}
                    </p>
                    <p className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      {formatPrice(booking.total_amount)}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Financial Info */}
                    <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Token Amount:</span>
                        <span className="font-medium">{formatPrice(booking.token_amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Amount Paid:</span>
                        <span className="font-medium">{formatPrice(booking.amount_paid)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold border-t pt-1">
                        <span>Amount Due:</span>
                        <span>{formatPrice(booking.amount_due)}</span>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        Booked: {formatDate(booking.booking_date)}
                      </p>
                      {booking.confirmation_date && (
                        <p className="text-muted-foreground">
                          Confirmed: {formatDate(booking.confirmation_date)}
                        </p>
                      )}
                      {booking.expected_possession_date && (
                        <p className="text-muted-foreground">
                          Possession: {formatDate(booking.expected_possession_date)}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                    >
                      View Details
                      <ArrowRight className="h-4 w-4 mr-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

