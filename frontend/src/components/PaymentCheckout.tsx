import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { paymentAPI, Payment, VerifyPaymentRequest } from "@/services/paymentAPI";
import { Loader2, CreditCard, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentCheckoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  amount: string | number;
  currency?: string;
  description?: string;
  onSuccess?: (payment: Payment) => void;
  onFailure?: (error: string) => void;
}

export default function PaymentCheckout({
  open,
  onOpenChange,
  bookingId,
  amount,
  currency = "INR",
  description,
  onSuccess,
  onFailure,
}: PaymentCheckoutProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load Razorpay script
  useEffect(() => {
    if (!window.Razorpay && open) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onerror = () => {
        setError("Failed to load Razorpay checkout script");
      };
      document.body.appendChild(script);
    }
  }, [open]);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create payment record
      const paymentData = await paymentAPI.create({
        booking_id: bookingId,
        amount: typeof amount === "string" ? parseFloat(amount) : amount,
        currency,
        payment_method: "razorpay",
        payment_type: "booking_token",
        description: description || "Booking token amount",
      });

      setPayment(paymentData);

      // If payment has gateway_order_id, proceed with Razorpay checkout
      if (paymentData.gateway_order_id && window.Razorpay) {
        // Get Razorpay key from environment or use placeholder
        const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || "";

        if (!RAZORPAY_KEY) {
          throw new Error("Razorpay key is not configured. Please contact support.");
        }

        // Convert amount to paise (Razorpay uses smallest currency unit)
        // The backend already created the order with amount in paise, so we need to match it
        // Payment.amount is stored in rupees, but the order was created with rupees * 100
        const amountInPaise = typeof amount === "string" 
          ? Math.round(parseFloat(amount) * 100)
          : Math.round(amount * 100);
        
        const options = {
          key: RAZORPAY_KEY,
          amount: amountInPaise, // Amount in paise - must match the order amount
          currency: paymentData.currency || "INR",
          name: "ApnaGhar",
          description: paymentData.description || "Booking Payment",
          order_id: paymentData.gateway_order_id,
          handler: async function (response: any) {
            // Handle successful payment
            try {
              const verifyData: VerifyPaymentRequest = {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              };

              const verifiedPayment = await paymentAPI.verify(paymentData.id, verifyData);

              toast({
                title: "Payment Successful",
                description: "Your payment has been processed successfully",
              });

              onOpenChange(false);
              if (onSuccess) {
                onSuccess(verifiedPayment.payment);
              }
            } catch (error: any) {
              toast({
                title: "Payment Verification Failed",
                description: error.message || "Failed to verify payment",
                variant: "destructive",
              });
              if (onFailure) {
                onFailure(error.message || "Payment verification failed");
              }
            }
          },
          prefill: {
            // Pre-fill customer details if available
            email: "",
            contact: "",
          },
          theme: {
            color: "#0066cc",
          },
          modal: {
            ondismiss: function () {
              // User closed the checkout form
              setLoading(false);
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on("payment.failed", function (response: any) {
          toast({
            title: "Payment Failed",
            description: response.error.description || "Payment could not be processed",
            variant: "destructive",
          });
          setLoading(false);
          if (onFailure) {
            onFailure(response.error.description || "Payment failed");
          }
        });

        razorpay.open();
      } else {
        throw new Error("Payment gateway order could not be created");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setError(error.message || "Failed to initiate payment");
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
      if (onFailure) {
        onFailure(error.message || "Failed to initiate payment");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Complete Payment
          </DialogTitle>
          <DialogDescription>
            Proceed with payment to confirm your booking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Amount */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount to Pay</span>
              <span className="text-2xl font-bold text-primary">
                ₹{typeof amount === "string" ? parseFloat(amount).toLocaleString("en-IN") : amount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Payment Info */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Secure payment powered by Razorpay</p>
            <p>• Your payment information is encrypted and secure</p>
            <p>• You will be redirected to Razorpay checkout</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={loading || !!error}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

