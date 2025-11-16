import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Building2,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { bookingAPI, Booking } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showUpdatePaymentDialog, setShowUpdatePaymentDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [processing, setProcessing] = useState(false);
  const [bookingPayments, setBookingPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBooking();
    }
  }, [id]);

  useEffect(() => {
    if (booking) {
      fetchBookingPayments();
    }
  }, [booking]);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const data = await bookingAPI.get(id!);
      setBooking(data);
    } catch (error: any) {
      console.error("Error fetching booking:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load booking",
        variant: "destructive",
      });
      navigate("/bookings");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingPayments = async () => {
    if (!booking) return;
    setLoadingPayments(true);
    try {
      const payments = await paymentAPI.getBookingPayments(booking.id);
      setBookingPayments(payments);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      setBookingPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    
    setProcessing(true);
    try {
      await bookingAPI.cancel(booking.id, cancellationReason);
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully",
      });
      setShowCancelDialog(false);
      setCancellationReason("");
      fetchBooking();
    } catch (error: any) {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel booking",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!booking || !user) return;
    
    if ((user as any).role !== "builder") {
      toast({
        title: "Access Denied",
        description: "Only builders can confirm bookings",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      await bookingAPI.confirm(booking.id);
      toast({
        title: "Booking Confirmed",
        description: "Booking has been confirmed successfully",
      });
      fetchBooking();
    } catch (error: any) {
      toast({
        title: "Confirmation Failed",
        description: error.message || "Failed to confirm booking",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdatePayment = async () => {
    if (!booking) return;
    
    setProcessing(true);
    try {
      await bookingAPI.updatePayment(booking.id, {
        amount_paid: amountPaid ? parseFloat(amountPaid) : undefined,
        payment_method: paymentMethod || undefined,
        payment_reference: paymentReference || undefined,
      });
      toast({
        title: "Payment Updated",
        description: "Payment information has been updated successfully",
      });
      setShowUpdatePaymentDialog(false);
      setAmountPaid("");
      setPaymentMethod("");
      setPaymentReference("");
      fetchBooking();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update payment",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
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
      <Badge variant={config.variant} className="flex items-center gap-1 text-base px-3 py-1">
        <Icon className="h-4 w-4" />
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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Booking Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The booking you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/bookings">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Button>
        </Link>
      </div>
    );
  }

  const canCancel = booking.status !== "cancelled" && booking.status !== "completed" && booking.status !== "refunded";
  const canConfirm = user && (user as any).role === "builder" && (booking.status === "pending" || booking.status === "token_paid");
  const canUpdatePayment = booking.status !== "cancelled" && booking.status !== "completed" && booking.status !== "refunded";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/bookings">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Booking Details</h1>
              <p className="text-muted-foreground">Booking #{booking.booking_number}</p>
            </div>
            {getStatusBadge(booking.status)}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - Property & Financial Info */}
          <div className="space-y-6">
            {/* Property Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-semibold text-lg">{booking.project_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unit Number</p>
                  <p className="font-semibold">{booking.property_unit_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Property Type</p>
                  <p className="font-semibold">{booking.property_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Carpet Area</p>
                  <p className="font-semibold">{booking.property_details.carpet_area} sq.ft</p>
                </div>
                <Link to={`/property/${booking.property_details.id}`}>
                  <Button variant="outline" className="w-full">
                    View Property Details
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Financial Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property Price</span>
                  <span className="font-semibold">{formatPrice(booking.property_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token Amount</span>
                  <span className="font-semibold">{formatPrice(booking.token_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-semibold text-lg">{formatPrice(booking.total_amount)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="font-semibold text-green-600">{formatPrice(booking.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Due</span>
                    <span className="font-semibold text-red-600">{formatPrice(booking.amount_due)}</span>
                  </div>
                </div>
                {booking.payment_method && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                    <p className="font-semibold">{booking.payment_method}</p>
                    {booking.payment_reference && (
                      <>
                        <p className="text-sm text-muted-foreground mt-2 mb-1">Payment Reference</p>
                        <p className="font-mono text-sm">{booking.payment_reference}</p>
                      </>
                    )}
                  </div>
                )}
                {canUpdatePayment && (
                  <>
                    <Button
                      variant="default"
                      className="w-full mt-4"
                      onClick={() => setShowPaymentDialog(true)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay Now
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => {
                        setAmountPaid(booking.amount_paid);
                        setPaymentMethod(booking.payment_method || "");
                        setPaymentReference(booking.payment_reference || "");
                        setShowUpdatePaymentDialog(true);
                      }}
                    >
                      Update Payment Info
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Timeline & Actions */}
          <div className="space-y-6">
            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Booking Date</p>
                  <p className="font-semibold">{formatDate(booking.booking_date)}</p>
                </div>
                {booking.token_payment_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Token Payment Date</p>
                    <p className="font-semibold">{formatDate(booking.token_payment_date)}</p>
                  </div>
                )}
                {booking.confirmation_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Confirmation Date</p>
                    <p className="font-semibold">{formatDate(booking.confirmation_date)}</p>
                  </div>
                )}
                {booking.agreement_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Agreement Date</p>
                    <p className="font-semibold">{formatDate(booking.agreement_date)}</p>
                  </div>
                )}
                {booking.expected_possession_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Possession</p>
                    <p className="font-semibold">{formatDate(booking.expected_possession_date)}</p>
                  </div>
                )}
                {booking.completion_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Completion Date</p>
                    <p className="font-semibold">{formatDate(booking.completion_date)}</p>
                  </div>
                )}
                {booking.cancellation_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cancellation Date</p>
                    <p className="font-semibold">{formatDate(booking.cancellation_date)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {(canCancel || canConfirm) && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {canConfirm && (
                    <Button
                      className="w-full"
                      onClick={handleConfirm}
                      disabled={processing}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Confirm Booking
                        </>
                      )}
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setShowCancelDialog(true)}
                      disabled={processing}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Booking
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Cancellation Info */}
            {booking.status === "cancelled" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Cancellation Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {booking.cancellation_reason && (
                    <div>
                      <p className="text-sm text-muted-foreground">Reason</p>
                      <p className="font-semibold">{booking.cancellation_reason}</p>
                    </div>
                  )}
                  {booking.cancellation_initiated_by && (
                    <div>
                      <p className="text-sm text-muted-foreground">Cancelled By</p>
                      <p className="font-semibold capitalize">{booking.cancellation_initiated_by}</p>
                    </div>
                  )}
                  {booking.refund_amount && (
                    <div>
                      <p className="text-sm text-muted-foreground">Refund Amount</p>
                      <p className="font-semibold">{formatPrice(booking.refund_amount)}</p>
                    </div>
                  )}
                  {booking.refund_status && (
                    <div>
                      <p className="text-sm text-muted-foreground">Refund Status</p>
                      <Badge variant="outline">{booking.refund_status}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Buyer Info */}
            {user && (user as any).role === "builder" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Buyer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-semibold">{booking.buyer_name}</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{booking.buyer_email}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Cancellation Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for cancellation..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
              />
            </div>
            {booking && booking.token_amount && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Refund Amount: <span className="font-semibold">{formatPrice(booking.token_amount)}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Refund will be processed according to cancellation policy.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={processing}>
              Keep Booking
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Cancel Booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Checkout Dialog */}
      {booking && booking.status !== "cancelled" && booking.status !== "completed" && (
        <PaymentCheckout
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          bookingId={booking.id}
          amount={booking.amount_due}
          description={`Payment for booking ${booking.booking_number} - Unit ${booking.property_unit_number}`}
          onSuccess={(payment: Payment) => {
            toast({
              title: "Payment Successful",
              description: "Your payment has been processed successfully",
            });
            setShowPaymentDialog(false);
            fetchBooking();
            fetchBookingPayments();
          }}
          onFailure={(error: string) => {
            // Payment failed - user can retry later
          }}
        />
      )}

      {/* Update Payment Dialog */}
      <Dialog open={showUpdatePaymentDialog} onOpenChange={setShowUpdatePaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment</DialogTitle>
            <DialogDescription>
              Update payment information for this booking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amountPaid">Amount Paid</Label>
              <Input
                id="amountPaid"
                type="number"
                placeholder={booking?.amount_paid}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Input
                id="paymentMethod"
                type="text"
                placeholder="e.g., Online Transfer, Cheque, Cash"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="paymentReference">Payment Reference/Transaction ID</Label>
              <Input
                id="paymentReference"
                type="text"
                placeholder="Transaction ID or reference number"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdatePaymentDialog(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePayment} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment History */}
      {booking && bookingPayments.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPayments ? (
              <div className="text-center py-6">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground mt-2">Loading payments...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookingPayments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">Transaction #{payment.transaction_id}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.initiated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={
                        payment.status === 'completed' ? 'default' :
                        payment.status === 'failed' ? 'destructive' :
                        payment.status === 'refunded' ? 'secondary' :
                        'outline'
                      }>
                        {payment.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="font-semibold">₹{parseFloat(payment.amount).toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Method</p>
                        <p className="font-semibold capitalize">{payment.payment_method}</p>
                      </div>
                    </div>
                    {payment.completed_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Completed: {new Date(payment.completed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

