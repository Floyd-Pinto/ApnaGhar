import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  MapPin,
  Building2,
  Calendar,
  CheckCircle2,
  Home,
  Bed,
  Bath,
  Maximize,
  TrendingUp,
  ArrowLeft,
  Phone,
  Mail,
  Heart,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ProjectReviews from "@/components/ProjectReviews";
import ProgressTracker from "@/components/ProgressTracker";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface Developer {
  id: string;
  company_name: string;
  rera_number: string;
  verified: boolean;
  trust_score: string;
  description: string;
  established_year: number;
  total_projects: number;
  completed_projects: number;
}

interface Property {
  id: string;
  unit_number: string;
  property_type: string;
  floor_number: number;
  tower: string;
  carpet_area: string;
  built_up_area: string;
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  price: string;
  price_per_sqft: string;
  status: string;
  features: string[];
  floor_plan_image: string;
  unit_photos: Array<{
    url: string;
    description: string;
    uploaded_at: string;
  }>;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  phase_number: number;
  status: string;
  progress_percentage: string;
  target_date: string;
  completion_date: string;
  verified: boolean;
  images: Array<{
    sha256?: string;
    url: string;
    uploaded_at?: string;
    description?: string;
  }>;
  videos: Array<{
    sha256?: string;
    url: string;
    uploaded_at?: string;
    description?: string;
  }>;
}

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

interface Project {
  id: string;
  name: string;
  slug: string;
  developer: Developer;
  description: string;
  project_type: string;
  status: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: string;
  longitude: string;
  starting_price: string;
  total_units: number;
  available_units: number;
  cover_image: string;
  gallery_images: string[];
  video_url: string;
  launch_date: string;
  expected_completion: string;
  total_floors: number;
  total_area_sqft: string;
  amenities: string[];
  verified: boolean;
  verification_score: string;
  properties: Property[];
  milestones: Milestone[];
  reviews: Review[];
  average_rating: string;
}

export default function ProjectOverview() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savingProject, setSavingProject] = useState(false);

  useEffect(() => {
    // Fetch project details (critical - blocks page load)
    fetchProjectDetails();
    
    // These are non-critical, run in background without blocking
    checkIfSaved().catch(err => console.error("checkIfSaved failed:", err));
    trackProjectView().catch(err => console.error("trackProjectView failed:", err));
  }, [id]);

  const fetchProjectDetails = async () => {
    setLoading(true);
    const apiUrl = `${API_BASE_URL}/api/projects/projects/${id}/`;
    console.log(`ProjectOverview: Fetching from URL: ${apiUrl}`);
    console.log(`ProjectOverview: Project ID: ${id}`);
    
    // Timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error("ProjectOverview: Fetch timeout after 10 seconds");
      setLoading(false);
      toast({
        title: "Connection Timeout",
        description: "Server is not responding. Please check if backend is running.",
        variant: "destructive",
      });
    }, 10000);
    
    try {
      const response = await fetch(apiUrl);
      clearTimeout(timeoutId);
      console.log(`ProjectOverview: Response received - Status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ProjectOverview: Error response:`, errorText);
        throw new Error(`Failed to fetch project: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("ProjectOverview: Project data loaded successfully:", data.name);
      setProject(data);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("ProjectOverview: Error fetching project:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load project details",
        variant: "destructive",
      });
    } finally {
      clearTimeout(timeoutId);
      console.log("ProjectOverview: Setting loading to false");
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      
      const response = await fetch(
        `${API_BASE_URL}/api/projects/user/projects/saved_projects/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const savedProjects = await response.json();
        setIsSaved(savedProjects.some((p: any) => p.id === id));
      }
    } catch (error) {
      console.error("Error checking if saved:", error);
      // Fail silently - this is not critical
    }
  };

  const trackProjectView = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("access_token");
      await fetch(
        `${API_BASE_URL}/api/projects/user/projects/track-view/${id}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  const handleSaveToggle = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save projects",
        variant: "destructive",
      });
      return;
    }

    setSavingProject(true);
    try {
      const token = localStorage.getItem("access_token");
      const endpoint = isSaved ? "unsave" : "save";
      const response = await fetch(
        `${API_BASE_URL}/api/projects/user/projects/${endpoint}/${id}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const newSavedState = !isSaved;
        setIsSaved(newSavedState);
        toast({
          title: newSavedState ? "Project saved" : "Project removed",
          description: newSavedState
            ? "Added to your saved projects"
            : "Removed from your saved projects",
        });
        
        // Refetch to confirm state
        await checkIfSaved();
      } else {
        toast({
          title: "Error",
          description: "Failed to update saved projects",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      toast({
        title: "Error",
        description: "Failed to update saved projects",
        variant: "destructive",
      });
    } finally {
      setSavingProject(false);
    }
  };

  const formatPrice = (price: string) => {
    const priceNum = parseFloat(price);
    if (priceNum >= 10000000) {
      return `₹${(priceNum / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(priceNum / 100000).toFixed(2)} L`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "upcoming":
        return "bg-yellow-500";
      case "available":
        return "bg-green-500";
      case "booked":
        return "bg-orange-500";
      case "sold":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The project you're looking for doesn't exist or has been removed.
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
      {/* Back Button */}
      <div className="bg-muted/50 border-b">
        <div className="container mx-auto px-4 py-3">
          <Link to="/explore-projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-96">
        <img
          src={project.cover_image}
          alt={project.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <div className="flex items-start justify-between">
              <div className="text-white">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold">{project.name}</h1>
                  {project.verified && (
                    <Badge className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
                <p className="text-lg opacity-90 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {project.address}, {project.city}, {project.state} - {project.pincode}
                </p>
              </div>
              {user && (
                <Button
                  onClick={handleSaveToggle}
                  disabled={savingProject}
                  variant={isSaved ? "default" : "secondary"}
                  size="lg"
                  className="mt-2"
                >
                  <Heart
                    className={`h-5 w-5 mr-2 ${isSaved ? "fill-current" : ""}`}
                  />
                  {isSaved ? "Saved" : "Save Project"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {formatPrice(project.starting_price)}
                  </div>
                  <div className="text-sm text-muted-foreground">Starting Price</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold">{project.total_units}</div>
                  <div className="text-sm text-muted-foreground">Total Units</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {project.available_units}
                  </div>
                  <div className="text-sm text-muted-foreground">Available</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold">{project.total_floors}</div>
                  <div className="text-sm text-muted-foreground">Floors</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="properties">
                  Properties ({project.properties?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="progress">
                  Progress ({project.milestones?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                <TabsTrigger value="reviews">
                  Reviews ({project.reviews?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Project</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{project.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Property Type</div>
                        <div className="font-medium capitalize">{project.project_type}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Launch Date</div>
                        <div className="font-medium">
                          {new Date(project.launch_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Expected Completion</div>
                        <div className="font-medium">
                          {new Date(project.expected_completion).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Total Area</div>
                        <div className="font-medium">
                          {parseFloat(project.total_area_sqft).toLocaleString()} sq.ft
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Developer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>About Developer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{project.developer.company_name}</h3>
                        {project.developer.rera_number && (
                          <p className="text-sm text-muted-foreground">
                            RERA: {project.developer.rera_number}
                          </p>
                        )}
                      </div>
                      {project.developer.verified && (
                        <Badge className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{project.developer.description}</p>
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div>
                        <div className="text-sm text-muted-foreground">Trust Score</div>
                        <div className="font-bold text-lg">
                          {parseFloat(project.developer.trust_score).toFixed(1)}/5.0
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Total Projects</div>
                        <div className="font-bold text-lg">{project.developer.total_projects}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Completed</div>
                        <div className="font-bold text-lg">
                          {project.developer.completed_projects}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="properties" className="mt-6 space-y-4">
                {project.properties && project.properties.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.properties.map((property) => (
                      <Card
                        key={property.id}
                        className={`group overflow-hidden transition-all duration-300 hover:shadow-xl ${
                          selectedProperty?.id === property.id ? "ring-2 ring-primary shadow-lg" : ""
                        }`}
                      >
                        {/* Property Image/Floor Plan Thumbnail */}
                        <div className="relative h-48 overflow-hidden bg-muted">
                          {property.unit_photos && property.unit_photos.length > 0 ? (
                            <img
                              src={property.unit_photos[0].url}
                              alt={`Unit ${property.unit_number}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                // Fallback to floor plan if unit photo fails to load
                                if (property.floor_plan_image) {
                                  e.currentTarget.src = property.floor_plan_image;
                                }
                              }}
                            />
                          ) : property.floor_plan_image ? (
                            <img
                              src={property.floor_plan_image}
                              alt={`Unit ${property.unit_number} Floor Plan`}
                              className="w-full h-full object-contain bg-muted/50 group-hover:scale-105 transition-transform duration-300 p-4"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                              <Home className="h-16 w-16 text-muted-foreground/30" />
                            </div>
                          )}
                          
                          {/* Status Badge Overlay */}
                          <div className="absolute top-3 right-3">
                            <Badge className={getStatusColor(property.status)}>
                              {property.status}
                            </Badge>
                          </div>
                          
                          {/* Property Type Badge */}
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                              {getPropertyTypeDisplay(property.property_type)}
                            </Badge>
                          </div>
                        </div>

                        <CardHeader className="pb-3">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-bold truncate">
                              Unit {property.unit_number}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1 truncate">
                              {property.tower && `Tower ${property.tower}`}
                              {property.tower && property.floor_number && ' • '}
                              {property.floor_number && `Floor ${property.floor_number}`}
                            </CardDescription>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-3 pt-0">
                          {/* Price */}
                          <div className="border-b pb-3">
                            <div className="text-xl font-bold text-primary truncate">
                              {formatPrice(property.price)}
                            </div>
                            {property.price_per_sqft && (
                              <div className="text-xs text-muted-foreground mt-1">
                                ₹{parseFloat(property.price_per_sqft).toLocaleString()}/sq.ft
                              </div>
                            )}
                          </div>
                          
                          {/* Property Details Grid */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-2 bg-muted/50 rounded-lg">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Bed className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                              <div className="text-sm font-semibold">{property.bedrooms}</div>
                              <div className="text-[10px] text-muted-foreground">Beds</div>
                            </div>
                            <div className="text-center p-2 bg-muted/50 rounded-lg">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Bath className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                              <div className="text-sm font-semibold">{property.bathrooms}</div>
                              <div className="text-[10px] text-muted-foreground">Baths</div>
                            </div>
                            <div className="text-center p-2 bg-muted/50 rounded-lg">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Maximize className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                              <div className="text-xs font-semibold leading-tight">
                                {parseFloat(property.carpet_area).toLocaleString()}
                              </div>
                              <div className="text-[10px] text-muted-foreground">sq.ft</div>
                            </div>
                          </div>

                          {/* Features */}
                          {property.features && property.features.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {property.features.slice(0, 2).map((feature, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                              {property.features.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{property.features.length - 2} more
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Action Button */}
                          <Link to={`/property/${property.id}`} className="block w-full">
                            <Button 
                              className="w-full group-hover:shadow-md transition-shadow" 
                              size="sm"
                              variant={property.status === "available" ? "default" : "outline"}
                              disabled={property.status === "sold"}
                            >
                              {property.status === "available" ? "View Details" : 
                               property.status === "booked" ? "View Booking" : "Sold Out"}
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Property details will be available soon
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="progress" className="mt-6">
                <ProgressTracker
                  milestones={project.milestones || []}
                  projectName={project.name}
                  projectId={project.id}
                  overallProgress={
                    project.milestones && project.milestones.length > 0
                      ? project.milestones.reduce(
                          (sum, m) => sum + parseFloat(m.progress_percentage),
                          0
                        ) / project.milestones.length
                      : 0
                  }
                  onMilestoneUpdate={fetchProjectDetails}
                />
              </TabsContent>

              <TabsContent value="amenities" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Amenities & Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.amenities && project.amenities.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {project.amenities.map((amenity, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-3 bg-muted rounded-lg"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Amenity information will be updated soon
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <ProjectReviews
                  projectId={project.id}
                  reviews={project.reviews || []}
                  averageRating={project.average_rating}
                  onReviewAdded={fetchProjectDetails}
                />
              </TabsContent>

              <TabsContent value="location" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Location</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="font-medium">{project.address}</p>
                      <p className="text-muted-foreground">
                        {project.city}, {project.state} - {project.pincode}
                      </p>
                    </div>
                    
                    {/* Placeholder for Google Maps - will integrate later */}
                    <div className="bg-muted rounded-lg h-64 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Interactive map will be available soon
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Lat: {project.latitude}, Lng: {project.longitude}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Buy/Contact Card for Buyers */}
            {user?.role === "buyer" || !user ? (
              <Card>
                <CardHeader>
                  <CardTitle>Interested in This Property?</CardTitle>
                  <CardDescription>
                    Contact us to schedule a site visit or get more information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="cta" className="w-full" size="lg">
                    <Phone className="h-4 w-4 mr-2" />
                    Schedule Site Visit
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Get Brochure
                  </Button>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-3">Quick Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price Range</span>
                        <span className="font-medium">
                          {formatPrice(project.starting_price)}+
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Available Units</span>
                        <span className="font-medium">{project.available_units}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Possession</span>
                        <span className="font-medium">
                          {new Date(project.expected_completion).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Construction Progress Tracker - Placeholder for Cloudinary */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Live Progress Tracker</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    Coming Soon
                  </Badge>
                </div>
                <CardDescription>Real-time construction updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 bg-muted rounded-lg">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Construction tracking coming soon
                    </p>
                    <p className="text-xs text-muted-foreground">
                      We'll show real-time photos and videos from Cloudinary
                    </p>
                  </div>
                  
                  {/* Milestone placeholder */}
                  {project.milestones && project.milestones.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Upcoming Milestones</h4>
                      {project.milestones.slice(0, 3).map((milestone) => (
                        <div
                          key={milestone.id}
                          className="p-3 bg-muted rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium">{milestone.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Phase {milestone.phase_number}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {parseFloat(milestone.progress_percentage).toFixed(0)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Gallery Preview */}
            {project.gallery_images && project.gallery_images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {project.gallery_images.slice(0, 4).map((image, idx) => (
                      <img
                        key={idx}
                        src={image}
                        alt={`${project.name} ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                  {project.gallery_images.length > 4 && (
                    <Button variant="outline" className="w-full mt-3" size="sm">
                      View All {project.gallery_images.length} Photos
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
