import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { bookingAPI, CreateBookingRequest } from "@/services/api";
import { Payment } from "@/services/paymentAPI";
import { Loader2, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PaymentCheckout from "@/components/PaymentCheckout";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyPrice: string;
  propertyUnitNumber: string;
  onSuccess?: () => void;
}

export default function BookingDialog({
  open,
  onOpenChange,
  propertyId,
  propertyPrice,
  propertyUnitNumber,
  onSuccess,
}: BookingDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tokenAmount, setTokenAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [expectedPossessionDate, setExpectedPossessionDate] = useState<string>("");
  const [specialConditions, setSpecialConditions] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  // Calculate default token amount (5% of property price)
  const defaultTokenAmount = (parseFloat(propertyPrice) * 0.05).toFixed(2);
  const displayTokenAmount = tokenAmount || defaultTokenAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to proceed",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const bookingData: CreateBookingRequest = {
        property_id: propertyId,
        terms_accepted: true,
        ...(tokenAmount && { token_amount: parseFloat(tokenAmount) }),
        ...(paymentMethod && { payment_method: paymentMethod }),
        ...(expectedPossessionDate && { expected_possession_date: expectedPossessionDate }),
        ...(specialConditions && { special_conditions: specialConditions }),
        ...(notes && { notes }),
      };

      const booking = await bookingAPI.create(bookingData);

      toast({
        title: "Booking Created",
        description: `Booking ${booking.booking_number} created successfully. Please proceed with payment.`,
      });

      // Store booking ID and open payment dialog
      setCreatedBookingId(booking.id);
      
      // Reset form
      setTokenAmount("");
      setPaymentMethod("");
      setExpectedPossessionDate("");
      setSpecialConditions("");
      setNotes("");
      setTermsAccepted(false);

      // Close booking dialog and open payment dialog
      onOpenChange(false);
      setShowPaymentDialog(true);
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Property - Unit {propertyUnitNumber}</DialogTitle>
          <DialogDescription>
            Create a booking for this property. You'll be required to pay a token amount to confirm.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Price Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Property Price</span>
              <span className="text-lg font-semibold">
                ₹{parseFloat(propertyPrice).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Token Amount */}
          <div className="space-y-2">
            <Label htmlFor="tokenAmount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Token Amount (Recommended: 5% of property price)
            </Label>
            <Input
              id="tokenAmount"
              type="number"
              placeholder={defaultTokenAmount}
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              min="0"
              step="0.01"
            />
            <p className="text-xs text-muted-foreground">
              Default: ₹{defaultTokenAmount} (5% of property price)
            </p>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method (Optional)</Label>
            <Input
              id="paymentMethod"
              type="text"
              placeholder="e.g., Online Transfer, Cheque, Cash"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
          </div>

          {/* Expected Possession Date */}
          <div className="space-y-2">
            <Label htmlFor="possessionDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Expected Possession Date (Optional)
            </Label>
            <Input
              id="possessionDate"
              type="date"
              value={expectedPossessionDate}
              onChange={(e) => setExpectedPossessionDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Special Conditions */}
          <div className="space-y-2">
            <Label htmlFor="specialConditions">Special Conditions (Optional)</Label>
            <Textarea
              id="specialConditions"
              placeholder="Any special terms or conditions..."
              value={specialConditions}
              onChange={(e) => setSpecialConditions(e.target.value)}
              rows={3}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Terms and Conditions:</p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Token amount is non-refundable unless cancellation is due to builder's fault</li>
                    <li>Booking will be confirmed after builder's approval</li>
                    <li>Payment schedule will be provided upon confirmation</li>
                    <li>Property status will be updated to "Booked" after confirmation</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              />
              <Label
                htmlFor="terms"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I accept the terms and conditions and understand that the token amount is non-refundable
                unless cancellation is due to builder's fault.
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !termsAccepted}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      
      {/* Payment Checkout Dialog */}
      {createdBookingId && (
        <PaymentCheckout
          open={showPaymentDialog}
          onOpenChange={(open) => {
            setShowPaymentDialog(open);
            if (!open && onSuccess) {
              onSuccess();
            }
          }}
          bookingId={createdBookingId}
          amount={displayTokenAmount}
          description={`Token amount for booking - Unit ${propertyUnitNumber}`}
          onSuccess={(payment: Payment) => {
            toast({
              title: "Payment Successful",
              description: "Your booking has been confirmed with payment",
            });
            setShowPaymentDialog(false);
            if (onSuccess) {
              onSuccess();
            }
          }}
          onFailure={(error: string) => {
            // Payment failed but booking is created
            // User can retry payment later
            setShowPaymentDialog(false);
          }}
        />
      )}
    </Dialog>
  );
}

