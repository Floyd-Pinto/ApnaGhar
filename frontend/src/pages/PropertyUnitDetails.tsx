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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  QrCode,
  Smartphone,
  ChevronDown,
  FileText,
  ExternalLink,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/services/api";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import SecureUpload from "@/components/SecureUpload";
import BlockchainDocumentUpload from "@/components/BlockchainDocumentUpload";

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
  qr_code_data: string | null;
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
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressData, setProgressData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadPhase, setUploadPhase] = useState("");
  const [uploadProgressPercent, setUploadProgressPercent] = useState<number | undefined>(undefined);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [booking, setBooking] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showSecureUploadDialog, setShowSecureUploadDialog] = useState(false);
  const [showDocumentUploadDialog, setShowDocumentUploadDialog] = useState(false);
  const [blockchainDocuments, setBlockchainDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  useEffect(() => {
    fetchPropertyDetails();
    // fetch progress separately (will be permission-protected)
    fetchProgress();
    // Fetch blockchain documents for this property
    if (propertyId && (user?.role === "builder" || user?.role === "buyer")) {
      fetchBlockchainDocuments();
    }
  }, [propertyId, user]);

  const fetchPropertyDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/projects/properties/${propertyId}/`, { headers });
      
      if (response.status === 403) {
        toast({
          title: "Access Denied",
          description: "This property is private. Only the owner and builder can view it.",
          variant: "destructive",
        });
        setTimeout(() => navigate("/explore-projects"), 2000);
        return;
      }
      
      if (!response.ok) throw new Error("Failed to fetch property");
      const data = await response.json();
      
      // Block sold properties from buyers (unless they are the buyer)
      if (user && user.role === 'buyer' && data.status === 'sold') {
        // Check if current user is the buyer of this property
        if (!data.buyer || data.buyer.id !== user.id) {
          toast({
            title: "Property Sold",
            description: "This property has been sold and is no longer available.",
            variant: "destructive",
          });
          setTimeout(() => navigate("/explore-projects"), 2000);
          return;
        }
      }
      
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

  const fetchProgress = async () => {
    if (!propertyId) return;
    setProgressLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const headers: HeadersInit = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/projects/properties/${propertyId}/progress/`, { headers });
      if (res.status === 403) {
        // not allowed to view progress; ignore silently
        setProgressData(null);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch progress");
      const data = await res.json();
      setProgressData(data);
    } catch (err) {
      console.error("Error fetching progress:", err);
    } finally {
      setProgressLoading(false);
    }
  };

  const fetchBlockchainDocuments = async () => {
    if (!propertyId) return;
    setLoadingDocuments(true);
    try {
      const token = localStorage.getItem("access_token");
      const headers: HeadersInit = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      // Fetch documents filtered by property_id
      const res = await fetch(`${API_BASE_URL}/api/blockchain/documents/?property_id=${propertyId}`, { headers });
      if (!res.ok) throw new Error("Failed to fetch blockchain documents");
      const data = await res.json();
      setBlockchainDocuments(data.results || data || []);
    } catch (err) {
      console.error("Error fetching blockchain documents:", err);
      setBlockchainDocuments([]);
    } finally {
      setLoadingDocuments(false);
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

      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Mobile: Quick Actions Accordion - Only visible on mobile */}
        <div className="lg:hidden mb-4">
          <Card className="shadow-md">
            <Accordion type="single" collapsible className="w-full" defaultValue="booking">
              <AccordionItem value="booking" className="border-0">
                <AccordionTrigger className="px-3 py-3 hover:no-underline hover:bg-muted/50 rounded-t-lg transition-colors">
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex items-center gap-2 flex-1">
                      <Home className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="font-semibold text-sm">Property Actions & Info</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 pt-1">
                  <div className="space-y-3">
                    {/* Booking Section */}
                    <div className="space-y-2.5">
                      <div className="text-center space-y-1.5">
                        <h4 className="font-semibold text-sm">Book This Property</h4>
                        <p className="text-xs text-muted-foreground">{property.project.name}</p>
                        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{property.project.city}, {property.project.state}</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-muted/60 rounded-lg space-y-1.5 text-xs">
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
                              className="w-full h-11"
                              size="default"
                              onClick={() => setShowBookingDialog(true)}
                              disabled={!isAuthenticated}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              {isAuthenticated ? "Book Now" : "Login to Book"}
                            </Button>
                          ) : (
                            <div className="p-2.5 bg-muted/60 rounded-lg text-center">
                              <p className="text-xs text-muted-foreground">
                                Only buyers can book properties
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="p-2.5 bg-muted/60 rounded-lg text-center">
                          <p className="text-xs font-medium">This property is {property.status}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 h-10" size="sm">
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="flex-1 h-10" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <div className="space-y-2.5">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-xs">Developer</span>
                            {property.project.developer.verified && (
                              <Badge className="bg-green-600 text-[10px] px-1.5 py-0.5 h-5">
                                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs font-medium">
                            {property.project.developer.company_name}
                          </p>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <MapPinned className="h-3.5 w-3.5 text-primary" />
                            <span className="font-semibold text-xs">Location</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{property.project.address}</p>
                          <p className="text-xs text-muted-foreground">
                            {property.project.city}, {property.project.state}
                          </p>
                        </div>

                        <Link to={`/projects/${property.project.id}`} className="block">
                          <Button variant="outline" className="w-full h-10 text-xs" size="sm">
                            View Full Project
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </div>

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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                  <div className="flex items-center gap-3 p-3 md:p-4 bg-muted rounded-lg">
                    <Bed className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                    <div>
                      <div className="text-xl md:text-2xl font-bold">{property.bedrooms}</div>
                      <div className="text-xs md:text-sm text-muted-foreground">Bedrooms</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 md:p-4 bg-muted rounded-lg">
                    <Bath className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                    <div>
                      <div className="text-xl md:text-2xl font-bold">{property.bathrooms}</div>
                      <div className="text-xs md:text-sm text-muted-foreground">Bathrooms</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 md:p-4 bg-muted rounded-lg">
                    <Maximize className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                    <div>
                      <div className="text-xl md:text-2xl font-bold">
                        {parseFloat(property.carpet_area).toFixed(0)}
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground">Sq. Ft</div>
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

            {/* QR Code Display - Builders Only */}
            {user?.role === "builder" && property.qr_code_data && (
              <Card>
                <CardHeader>
                  <CardTitle>Property QR Code</CardTitle>
                  <CardDescription>
                    Scan this QR code for secure uploads
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QRCodeDisplay
                    entityType="property"
                    entityId={property.id}
                    projectName={property.project.name}
                    unitNumber={property.unit_number}
                    qrCodeData={property.qr_code_data}
                  />
                </CardContent>
              </Card>
            )}

            {/* Secure Upload Card - Builders Only */}
            {user?.role === "builder" && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload Construction Updates</CardTitle>
                  <CardDescription>
                    Secure, QR-verified uploads from mobile devices only
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Mobile-Only Secure Upload
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          For security and authenticity, construction updates must be uploaded from a mobile device using QR code verification.
                        </p>
                      </div>
                    </div>

                    <Button 
                      onClick={() => setShowSecureUploadDialog(true)} 
                      className="w-full min-h-[44px]"
                      size="lg"
                    >
                      <QrCode className="h-5 w-5 mr-2" />
                      Start Secure Upload
                    </Button>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Scan the QR code at the property site</p>
                      <p>• Use mobile device camera only</p>
                      <p>• Gallery uploads are blocked for authenticity</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Blockchain Documents - Visible to Buyers and Builders */}
            {(user?.role === "builder" || user?.role === "buyer") && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Blockchain Documents
                      </CardTitle>
                      <CardDescription>
                        Legal documents, contracts, certificates, and permits stored on IPFS and blockchain
                      </CardDescription>
                    </div>
                    {user?.role === "builder" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDocumentUploadDialog(true)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingDocuments ? (
                    <div className="text-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      <p className="text-sm text-muted-foreground mt-2">Loading documents...</p>
                    </div>
                  ) : blockchainDocuments.length > 0 ? (
                    <div className="space-y-3">
                      {blockchainDocuments.map((doc: any) => (
                        <div
                          key={doc.id}
                          className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                                <h4 className="font-semibold">{doc.document_name}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  {doc.document_type}
                                </Badge>
                                {doc.blockchain_tx_id && (
                                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>Uploaded by: {doc.uploaded_by_username || 'Unknown'}</p>
                                <p>Date: {new Date(doc.created_at).toLocaleDateString()}</p>
                                {doc.ipfs_hash && (
                                  <p className="font-mono text-xs break-all">
                                    IPFS Hash: {doc.ipfs_hash.substring(0, 20)}...
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              {doc.ipfs_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(doc.ipfs_url, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground mb-2">
                        No documents uploaded yet for this property
                      </p>
                      {user?.role === "builder" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDocumentUploadDialog(true)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Upload First Document
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Document Upload Card - Builders Only */}
            {user?.role === "builder" && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload Documents to IPFS</CardTitle>
                  <CardDescription>
                    Upload legal documents, contracts, certificates, and permits. Documents are stored on IPFS and hashes are recorded on blockchain.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <FileText className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                          Blockchain-Verified Documents
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Upload documents like contracts, permits, certificates, and agreements. Files are stored on IPFS (decentralized storage) and their hashes are immutably recorded on blockchain.
                        </p>
                      </div>
                    </div>

                    <Button 
                      onClick={() => setShowDocumentUploadDialog(true)} 
                      className="w-full min-h-[44px]"
                      size="lg"
                      variant="outline"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      Upload Document to IPFS
                    </Button>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Documents are stored on IPFS (decentralized storage)</p>
                      <p>• Document hash is recorded on blockchain</p>
                      <p>• Immutable and tamper-proof record</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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

            {/* Unit Progress (photos/videos/updates) */}
            <Card>
              <CardHeader>
                <CardTitle>Unit Progress</CardTitle>
                <CardDescription>Photos, videos and progress updates</CardDescription>
              </CardHeader>
              <CardContent>
                {progressLoading ? (
                  <div className="text-center py-6">Loading progress...</div>
                ) : progressData ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Progress</div>
                        <div className="font-semibold text-lg">{progressData.unit_progress_percentage}%</div>
                      </div>
                      {user?.role === "builder" && property.qr_code_data && (
                        <Button 
                          onClick={() => setShowSecureUploadDialog(true)}
                          size="default"
                          variant="outline"
                          className="w-full sm:w-auto min-h-[44px]"
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          Upload Update
                        </Button>
                      )}
                    </div>

                    {/* Photos */}
                    {progressData.unit_photos && progressData.unit_photos.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Photos</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {progressData.unit_photos.map((p: any, idx: number) => (
                            <img key={idx} src={p.url} alt={p.description || `photo-${idx}`} className="w-full h-32 object-cover rounded" />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Videos */}
                    {progressData.unit_videos && progressData.unit_videos.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Videos</h4>
                        <div className="space-y-2">
                          {progressData.unit_videos.map((v: any, idx: number) => (
                            <video key={idx} controls className="w-full h-48 bg-black rounded">
                              <source src={v.url} />
                              Your browser does not support the video tag.
                            </video>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Updates */}
                    {progressData.unit_progress_updates && progressData.unit_progress_updates.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Updates</h4>
                        <div className="space-y-2">
                          {progressData.unit_progress_updates.map((u: any, idx: number) => (
                            <div key={idx} className="p-3 bg-muted rounded">
                              <div className="text-sm text-muted-foreground">{u.date ? new Date(u.date).toLocaleString() : ''} • {u.phase}</div>
                              <div className="mt-1">{u.description}</div>
                              <div className="text-xs text-muted-foreground mt-1">Progress: {u.progress}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!progressData.unit_photos?.length && !progressData.unit_videos?.length && (!progressData.unit_progress_updates || progressData.unit_progress_updates.length === 0) && (
                      <div className="text-sm text-muted-foreground">No progress updates yet.</div>
                    )}

                    {/* Builder Upload Information */}
                    {user?.role === "builder" && property.qr_code_data && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div className="flex-1 text-sm">
                            <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                              Upload Progress Updates Securely
                            </p>
                            <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                              <li>• Click "Upload Update" button above</li>
                              <li>• Scan the property QR code from your mobile device</li>
                              <li>• Capture photos/videos using camera only</li>
                              <li>• Gallery uploads are blocked for authenticity</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Progress is private or not available.</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Hidden on mobile, visible on desktop */}
          <div className="hidden lg:block space-y-6 lg:sticky lg:top-20">
            {/* Booking Card */}
            <Card>
              <CardHeader className="text-center space-y-2">
                <CardTitle className="text-center">Book This Property</CardTitle>
                <CardDescription className="text-center">{property.project.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex flex-col items-center">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground w-full">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {property.project.city}, {property.project.state}
                  </span>
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2 w-full">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Property Price</span>
                    <span className="font-bold">{formatPrice(property.price)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Status</span>
                    <Badge className={getStatusColor(property.status)}>
                      {property.status}
                    </Badge>
                  </div>
                  {property.project.expected_completion && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Possession</span>
                      <span className="font-medium text-sm">
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
                <CardTitle className="text-lg text-center">Developer</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center space-y-3">
                <div className="flex flex-col items-center gap-2 mb-1 w-full">
                  <span className="font-semibold text-center">
                    {property.project.developer.company_name}
                  </span>
                  {property.project.developer.verified && (
                    <Badge className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {property.project.address}
                </p>
                <Link to={`/projects/${property.project.id}`} className="w-full">
                  <Button variant="outline" className="w-full" size="sm">
                    View Full Project
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-center gap-2">
                  <MapPinned className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <p className="text-sm">{property.project.address}</p>
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

      {/* Secure Upload Dialog */}
      <Dialog 
        open={showSecureUploadDialog} 
        onOpenChange={(open) => {
          // Only allow closing via X button or explicit close
          if (!open) {
            // User clicked X or explicitly closed
            setShowSecureUploadDialog(false);
          }
        }}
      >
        <DialogContent 
          className="max-w-4xl max-h-[90vh] !translate-x-[-50%] !translate-y-[-50%]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Secure Upload - Construction Updates</DialogTitle>
            <DialogDescription>
              Upload construction progress photos/videos with QR code verification
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <SecureUpload
              onSuccess={() => {
                toast({
                  title: 'Upload Successful',
                  description: 'Construction updates uploaded successfully',
                });
                fetchProgress(); // Refresh progress data
              }}
              onClose={() => {
                setShowSecureUploadDialog(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Upload Dialog */}
      <Dialog 
        open={showDocumentUploadDialog} 
        onOpenChange={(open) => {
          if (!open) {
            setShowDocumentUploadDialog(false);
          }
        }}
      >
        <DialogContent 
          className="max-w-2xl max-h-[90vh] !translate-x-[-50%] !translate-y-[-50%]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Upload Document to IPFS</DialogTitle>
            <DialogDescription>
              Upload legal documents, contracts, certificates, or permits. Files are stored on IPFS and hashes are recorded on blockchain.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            {property && (
              <BlockchainDocumentUpload
                projectId={property.project.id}
                propertyId={property.id}
                onSuccess={() => {
                  toast({
                    title: 'Upload Successful',
                    description: 'Document uploaded to IPFS and blockchain successfully',
                  });
                  setShowDocumentUploadDialog(false);
                  fetchBlockchainDocuments(); // Refresh documents list
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
