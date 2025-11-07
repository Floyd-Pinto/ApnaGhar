import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Calendar,
  FileText,
  TrendingUp,
  MapPin,
  Building2,
  Eye,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface SavedProject {
  id: string;
  name: string;
  city: string;
  starting_price: string;
  cover_image: string;
  status: string;
  verified: boolean;
}

interface PurchasedProperty {
  id: string;
  unit_number: string;
  property_type: string;
  price: string;
  status: string;
  project: {
    id: string;
    name: string;
    city: string;
    cover_image: string;
    expected_completion: string;
  };
}

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<SavedProject[]>([]);
  const [purchasedProperties, setPurchasedProperties] = useState<PurchasedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Fetch purchased properties
      const propertiesRes = await fetch(
        `${API_BASE_URL}/api/projects/user/properties/my_properties/`,
        { headers }
      );
      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json();
        setPurchasedProperties(propertiesData);
      }

      // Fetch saved projects
      const savedRes = await fetch(
        `${API_BASE_URL}/api/projects/user/projects/saved_projects/`,
        { headers }
      );
      if (savedRes.ok) {
        const savedData = await savedRes.json();
        setSavedProjects(savedData);
      }

      // Fetch recently viewed projects
      const viewedRes = await fetch(
        `${API_BASE_URL}/api/projects/user/projects/recently_viewed/`,
        { headers }
      );
      if (viewedRes.ok) {
        const viewedData = await viewedRes.json();
        setRecentlyViewed(viewedData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
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

  const stats = [
    {
      title: "My Properties",
      value: loading ? "..." : purchasedProperties.length.toString(),
      icon: Building2,
      description: "Properties you own",
    },
    {
      title: "Saved Projects",
      value: loading ? "..." : savedProjects.length.toString(),
      icon: Heart,
      description: "Projects you've favorited",
    },
    {
      title: "Recently Viewed",
      value: loading ? "..." : recentlyViewed.length.toString(),
      icon: Eye,
      description: "Projects you viewed",
    },
    {
      title: "Total Investment",
      value: loading
        ? "..."
        : purchasedProperties.length > 0
        ? formatPrice(
            purchasedProperties
              .reduce((sum, p) => sum + parseFloat(p.price), 0)
              .toString()
          )
        : "₹0",
      icon: TrendingUp,
      description: "Total property value",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
          <p className="text-lg opacity-90">
            Welcome back, {user?.first_name || "Buyer"}!
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-8 w-8 text-primary" />
                  <span className="text-3xl font-bold">{stat.value}</span>
                </div>
                <h3 className="font-semibold">{stat.title}</h3>
                <p className="text-sm text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="properties" className="w-full">
          <TabsList>
            <TabsTrigger value="properties">
              <Building2 className="h-4 w-4 mr-2" />
              My Properties
            </TabsTrigger>
            <TabsTrigger value="saved">
              <Heart className="h-4 w-4 mr-2" />
              Saved Projects
            </TabsTrigger>
            <TabsTrigger value="viewed">
              <Eye className="h-4 w-4 mr-2" />
              Recently Viewed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Properties</CardTitle>
                <CardDescription>
                  Properties you've purchased or booked
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  </div>
                ) : purchasedProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      No properties yet
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Start exploring and book your dream property
                    </p>
                    <Link to="/explore-projects">
                      <Button>Explore Projects</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {purchasedProperties.map((property) => (
                      <Card key={property.id} className="overflow-hidden">
                        <div className="relative">
                          <img
                            src={property.project.cover_image}
                            alt={property.project.name}
                            className="w-full h-40 object-cover"
                          />
                          <Badge className="absolute top-2 right-2 bg-green-600">
                            {property.status}
                          </Badge>
                        </div>
                        <CardContent className="pt-4">
                          <h3 className="font-semibold mb-1">
                            {property.project.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {property.project.city}
                          </p>
                          <div className="mb-3">
                            <span className="text-xs text-muted-foreground">Unit {property.unit_number}</span>
                            <span className="text-xs text-muted-foreground"> • </span>
                            <span className="text-xs text-muted-foreground">
                              {getPropertyTypeDisplay(property.property_type)}
                            </span>
                          </div>
                          <div className="text-lg font-bold text-primary mb-3">
                            {formatPrice(property.price)}
                          </div>
                          <Link to={`/property/${property.id}`}>
                            <Button variant="outline" className="w-full" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Saved Projects</CardTitle>
                <CardDescription>
                  Projects you've marked as favorites
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  </div>
                ) : savedProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      No saved projects yet
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Start exploring and save projects you like
                    </p>
                    <Link to="/explore-projects">
                      <Button>Explore Projects</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedProjects.map((project) => (
                      <Card key={project.id} className="overflow-hidden">
                        <div className="relative">
                          <img
                            src={project.cover_image}
                            alt={project.name}
                            className="w-full h-40 object-cover"
                          />
                          {project.verified && (
                            <Badge className="absolute top-2 left-2 bg-green-600">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <CardContent className="pt-4">
                          <h3 className="font-semibold mb-1">{project.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {project.city}
                          </p>
                          <div className="text-lg font-bold text-primary mb-3">
                            {formatPrice(project.starting_price)}
                          </div>
                          <Link to={`/projects/${project.id}`}>
                            <Button variant="outline" className="w-full" size="sm">
                              View Project
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="viewed" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recently Viewed</CardTitle>
                <CardDescription>
                  Projects you've recently looked at
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  </div>
                ) : recentlyViewed.length === 0 ? (
                  <div className="text-center py-12">
                    <Eye className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      No viewing history yet
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Your recently viewed projects will appear here
                    </p>
                    <Link to="/explore-projects">
                      <Button>Start Exploring</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentlyViewed.map((project) => (
                      <Card key={project.id} className="overflow-hidden">
                        <div className="relative">
                          <img
                            src={project.cover_image}
                            alt={project.name}
                            className="w-full h-40 object-cover"
                          />
                          {project.verified && (
                            <Badge className="absolute top-2 left-2 bg-green-600">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <CardContent className="pt-4">
                          <h3 className="font-semibold mb-1">{project.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {project.city}
                          </p>
                          <div className="text-lg font-bold text-primary mb-3">
                            {formatPrice(project.starting_price)}
                          </div>
                          <Link to={`/projects/${project.id}`}>
                            <Button variant="outline" className="w-full" size="sm">
                              View Again
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/explore-projects">
                <Button variant="outline" className="w-full h-20">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="h-6 w-6" />
                    <span>Browse Projects</span>
                  </div>
                </Button>
              </Link>
              <Button variant="outline" className="w-full h-20" disabled>
                <div className="flex flex-col items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  <span>Schedule Visit</span>
                </div>
              </Button>
              <Button variant="outline" className="w-full h-20" disabled>
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Download Brochures</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
