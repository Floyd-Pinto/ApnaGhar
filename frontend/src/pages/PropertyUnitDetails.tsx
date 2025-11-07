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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  MapPin,
  Building2,
  CheckCircle2,
  Home,
  Bed,
  Bath,
  Maximize,
  ArrowLeft,
  Heart,
  Share2,
  DollarSign,
  MapPinned,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface Property {
  id: string;
  unit_number: string;
  property_type: string;
  floor_number: number;
  tower: string;
  carpet_area: string;
  built_up_area: string;
  super_built_up_area: string;
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  price: string;
  price_per_sqft: string;
  status: string;
  features: string[];
  floor_plan_image: string;
  buyer: any;
  project: {
    id: string;
    name: string;
    city: string;
    state: string;
    address: string;
    developer: {
      company_name: string;
      verified: boolean;
    };
    cover_image: string;
    amenities: string[];
    expected_completion: string;
  };
}

export default function PropertyUnitDetails() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchPropertyDetails();
  }, [propertyId]);

  const fetchPropertyDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/properties/${propertyId}/`);
      if (!response.ok) throw new Error("Failed to fetch property");
      const data = await response.json();
      setProperty(data);
    } catch (error) {
      console.error("Error fetching property:", error);
      toast({
        title: "Error",
        description: "Failed to load property details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookProperty = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to book a property",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (user?.role !== "buyer") {
      toast({
        title: "Access Denied",
        description: "Only buyers can book properties",
        variant: "destructive",
      });
      return;
    }

    setBooking(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_BASE_URL}/api/projects/user/properties/book/${propertyId}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to book property");
      }

      const data = await response.json();
      toast({
        title: "Success!",
        description: "Property booked successfully",
      });

      setShowBookingDialog(false);
      fetchPropertyDetails(); // Refresh to show updated status
      
      // Redirect to buyer dashboard
      setTimeout(() => {
        navigate("/dashboard/buyer");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book property",
        variant: "destructive",
      });
    } finally {
      setBooking(false);
    }
  };

  const formatPrice = (price: string) => {
    const priceNum = parseFloat(price);
    if (priceNum >= 10000000) {
      return `₹${(priceNum / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(priceNum / 100000).toFixed(2)} L`;
  };

  const getPropertyTypeDisplay = (type: string) => {
    const typeMap: { [key: string]: string } = {
      "1bhk": "1 BHK",
      "2bhk": "2 BHK",
      "3bhk": "3 BHK",
      "4bhk": "4 BHK",
      "5bhk+": "5+ BHK",
      "studio": "Studio",
      "penthouse": "Penthouse",
      "villa": "Villa",
      "plot": "Plot",
    };
    return typeMap[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "booked":
        return "bg-orange-500";
      case "sold":
        return "bg-red-500";
      case "blocked":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The property you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/explore-projects">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/50 border-b">
        <div className="container mx-auto px-4 py-3">
          <Link to={`/projects/${property.project.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Image */}
            {property.floor_plan_image ? (
              <Card>
                <CardContent className="p-0">
                  <img
                    src={property.floor_plan_image}
                    alt={`Unit ${property.unit_number} Floor Plan`}
                    className="w-full h-96 object-contain bg-muted"
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center bg-muted">
                  <Building2 className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Floor plan coming soon</p>
                </CardContent>
              </Card>
            )}

            {/* Property Details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      Unit {property.unit_number}
                    </CardTitle>
                    <CardDescription className="text-lg mt-1">
                      {getPropertyTypeDisplay(property.property_type)}
                      {property.tower && ` • Tower ${property.tower}`}
                      {property.floor_number && ` • Floor ${property.floor_number}`}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(property.status)}>
                    {property.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-primary">
                    {formatPrice(property.price)}
                  </span>
                  {property.price_per_sqft && (
                    <span className="text-muted-foreground">
                      @ ₹{parseFloat(property.price_per_sqft).toLocaleString()}/sq.ft
                    </span>
                  )}
                </div>

                {/* Key Features */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Bed className="h-8 w-8 text-primary" />
                    <div>
                      <div className="text-2xl font-bold">{property.bedrooms}</div>
                      <div className="text-sm text-muted-foreground">Bedrooms</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Bath className="h-8 w-8 text-primary" />
                    <div>
                      <div className="text-2xl font-bold">{property.bathrooms}</div>
                      <div className="text-sm text-muted-foreground">Bathrooms</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Maximize className="h-8 w-8 text-primary" />
                    <div>
                      <div className="text-2xl font-bold">
                        {parseFloat(property.carpet_area).toFixed(0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Sq. Ft</div>
                    </div>
                  </div>
                </div>

                {/* Area Details */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Carpet Area</div>
                    <div className="font-medium">
                      {parseFloat(property.carpet_area).toLocaleString()} sq.ft
                    </div>
                  </div>
                  {property.built_up_area && (
                    <div>
                      <div className="text-sm text-muted-foreground">Built-up Area</div>
                      <div className="font-medium">
                        {parseFloat(property.built_up_area).toLocaleString()} sq.ft
                      </div>
                    </div>
                  )}
                  {property.super_built_up_area && (
                    <div>
                      <div className="text-sm text-muted-foreground">Super Built-up</div>
                      <div className="font-medium">
                        {parseFloat(property.super_built_up_area).toLocaleString()} sq.ft
                      </div>
                    </div>
                  )}
                  {property.balconies > 0 && (
                    <div>
                      <div className="text-sm text-muted-foreground">Balconies</div>
                      <div className="font-medium">{property.balconies}</div>
                    </div>
                  )}
                </div>

                {/* Features */}
                {property.features && property.features.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Unit Features</h3>
                    <div className="flex flex-wrap gap-2">
                      {property.features.map((feature, idx) => (
                        <Badge key={idx} variant="secondary">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Amenities */}
            {property.project.amenities && property.project.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Project Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.project.amenities.map((amenity, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-3 bg-muted rounded-lg"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card>
              <CardHeader>
                <CardTitle>Book This Property</CardTitle>
                <CardDescription>{property.project.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {property.project.city}, {property.project.state}
                  </span>
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Property Price</span>
                    <span className="font-bold">{formatPrice(property.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={getStatusColor(property.status)}>
                      {property.status}
                    </Badge>
                  </div>
                  {property.project.expected_completion && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Possession</span>
                      <span className="font-medium">
                        {new Date(property.project.expected_completion).toLocaleDateString(
                          "en-US",
                          { month: "short", year: "numeric" }
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {property.status === "available" ? (
                  <>
                    {user?.role === "buyer" || !user ? (
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => setShowBookingDialog(true)}
                        disabled={!isAuthenticated}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        {isAuthenticated ? "Book Now" : "Login to Book"}
                      </Button>
                    ) : (
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                          Only buyers can book properties
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm font-medium">This property is {property.status}</p>
                    {property.status === "booked" && property.buyer && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Currently reserved
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" size="sm">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="flex-1" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Developer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Developer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold">
                    {property.project.developer.company_name}
                  </span>
                  {property.project.developer.verified && (
                    <Badge className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {property.project.address}
                </p>
                <Link to={`/projects/${property.project.id}`}>
                  <Button variant="outline" className="w-full" size="sm">
                    View Full Project
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPinned className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">{property.project.address}</p>
                <p className="text-sm text-muted-foreground">
                  {property.project.city}, {property.project.state}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Confirmation Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to book Unit {property.unit_number}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Property</span>
                <span className="font-medium">Unit {property.unit_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">
                  {getPropertyTypeDisplay(property.property_type)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-bold text-primary">
                  {formatPrice(property.price)}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              By booking this property, you agree to our terms and conditions. The
              property will be marked as booked and you'll be able to view it in your
              dashboard.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBookingDialog(false)}
              disabled={booking}
            >
              Cancel
            </Button>
            <Button onClick={handleBookProperty} disabled={booking}>
              {booking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Booking
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
