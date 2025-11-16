import { useState, useEffect } from "react";
import { usePageView } from "@/hooks/useAnalytics";
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
  TrendingUp,
  MapPin,
  Building2,
  Eye,
  Loader2,
  AlertCircle,
  Calendar,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { bookingAPI, Booking } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { investmentAPI, Portfolio } from "@/services/investmentAPI";

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
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  usePageView(); // Track page view
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<SavedProject[]>([]);
  const [purchasedProperties, setPurchasedProperties] = useState<PurchasedProperty[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load when auth is complete and user exists
    if (!authLoading && user) {
      fetchUserData();
    }
  }, [authLoading, user]);

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Fetch purchased properties
      try {
        const propertiesRes = await fetch(
          `${API_BASE_URL}/api/projects/user/properties/my_properties/`,
          { headers }
        );
        if (propertiesRes.ok) {
          const propertiesData = await propertiesRes.json().catch(() => []);
          setPurchasedProperties(Array.isArray(propertiesData) ? propertiesData : []);
        } else {
          setPurchasedProperties([]);
        }
      } catch (error: any) {
        setPurchasedProperties([]);
      }

      // Fetch saved projects
      try {
        const savedRes = await fetch(
          `${API_BASE_URL}/api/projects/user/projects/saved_projects/`,
          { headers }
        );
        if (savedRes.ok) {
          const savedData = await savedRes.json().catch(() => []);
          setSavedProjects(Array.isArray(savedData) ? savedData : []);
        } else {
          setSavedProjects([]);
        }
      } catch (error: any) {
        setSavedProjects([]);
      }

      // Fetch recently viewed projects
      try {
        const viewedRes = await fetch(
          `${API_BASE_URL}/api/projects/user/projects/recently_viewed/`,
          { headers }
        );
        if (viewedRes.ok) {
          const viewedData = await viewedRes.json().catch(() => []);
          setRecentlyViewed(Array.isArray(viewedData) ? viewedData : []);
        } else {
          setRecentlyViewed([]);
        }
      } catch (error: any) {
        setRecentlyViewed([]);
      }

      // Fetch bookings
      try {
        const bookingsData = await bookingAPI.getMyBookings();
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      } catch (error: any) {
        setBookings([]);
      }
      
      // Fetch investment portfolio
      try {
        const portfolioData = await investmentAPI.getPortfolio();
        setPortfolio(portfolioData);
      } catch (error: any) {
        // Fail silently for investments
        console.error("Error fetching portfolio:", error);
      }
    } catch (error: any) {
      setError(error.message || "Failed to load dashboard data");
      setPurchasedProperties([]);
      setSavedProjects([]);
      setRecentlyViewed([]);
    } finally {
      setLoading(false);
    }
  };

  const clearRecentlyViewed = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_BASE_URL}/api/projects/user/projects/clear_recently_viewed/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        setRecentlyViewed([]);
      }
    } catch (error) {
      // Silent fail
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
    {
      title: "Active Bookings",
      value: loading ? "..." : bookings.filter(b => 
        ['pending', 'token_paid', 'confirmed', 'agreement_pending', 'agreement_signed', 'payment_in_progress'].includes(b.status)
      ).length.toString(),
      icon: Calendar,
      description: "Bookings in progress",
    },
    ...(portfolio && portfolio.total_investments > 0 ? [{
      title: "Total Investments",
      value: portfolio.total_investments.toString(),
      icon: TrendingUp,
      description: "Tokenized properties",
    }] : []),
  ];

  // Show loading only during auth or data loading - single condition
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              Error Loading Dashboard
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={fetchUserData} className="w-full">
              Retry Loading
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main dashboard content - only render when everything is ready
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 break-words">My Dashboard</h1>
          <p className="text-sm sm:text-base md:text-lg opacity-90 break-words">
            Welcome back, {user?.first_name || "Buyer"}!
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8 w-full">
          {stats.map((stat) => (
            <Card key={stat.title} className="w-full max-w-full">
              <CardContent className="pt-4 sm:pt-6 flex flex-col items-center text-center">
                <div className="flex flex-col items-center gap-2 mb-3 w-full">
                  <stat.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  <span className="text-xl sm:text-2xl md:text-3xl font-bold">{stat.value}</span>
                </div>
                <h3 className="font-semibold text-xs sm:text-sm md:text-base">{stat.title}</h3>
                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="properties" className="w-full">
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="inline-flex md:grid w-auto md:w-full grid-cols-5 min-w-max md:min-w-0">
              <TabsTrigger value="properties" className="text-xs sm:text-sm whitespace-nowrap">
                <Building2 className="h-4 w-4 mr-2" />
                My Properties
              </TabsTrigger>
              <TabsTrigger value="bookings" className="text-xs sm:text-sm whitespace-nowrap">
                <Calendar className="h-4 w-4 mr-2" />
                My Bookings
              </TabsTrigger>
              <TabsTrigger value="saved" className="text-xs sm:text-sm whitespace-nowrap">
                <Heart className="h-4 w-4 mr-2" />
                Saved Projects
              </TabsTrigger>
              <TabsTrigger value="viewed" className="text-xs sm:text-sm whitespace-nowrap">
                <Eye className="h-4 w-4 mr-2" />
                Recently Viewed
              </TabsTrigger>
              <TabsTrigger value="investments" className="text-xs sm:text-sm whitespace-nowrap">
                <TrendingUp className="h-4 w-4 mr-2" />
                Investments
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="properties" className="mt-6">
            <Card>
              <CardHeader className="text-center space-y-2">
                <CardTitle>My Properties</CardTitle>
                <CardDescription>Properties you've purchased or booked</CardDescription>
              </CardHeader>
              <CardContent>
                {purchasedProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No properties yet</h3>
                    <p className="text-muted-foreground mb-6">Start exploring and book your dream property</p>
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
                            loading="lazy"
                          />
                          <Badge className="absolute top-2 right-2 bg-green-600">
                            {property.status}
                          </Badge>
                        </div>
                        <CardContent className="pt-4">
                          <h3 className="font-semibold mb-1">{property.project.name}</h3>
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

          <TabsContent value="bookings" className="mt-6">
            <Card>
              <CardHeader className="text-center space-y-2">
                <CardTitle>My Bookings</CardTitle>
                <CardDescription>Track all your property bookings</CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
                    <p className="text-muted-foreground mb-6">Start exploring and book your dream property</p>
                    <Link to="/explore-projects">
                      <Button>Explore Projects</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.slice(0, 6).map((booking) => {
                      const getStatusColor = (status: string) => {
                        if (['pending', 'token_paid'].includes(status)) return 'bg-yellow-500';
                        if (['confirmed', 'agreement_signed', 'payment_in_progress'].includes(status)) return 'bg-blue-500';
                        if (status === 'completed') return 'bg-green-500';
                        if (['cancelled', 'refunded'].includes(status)) return 'bg-red-500';
                        return 'bg-gray-500';
                      };

                      const formatPrice = (price: string) => {
                        const num = parseFloat(price);
                        if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
                        if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
                        return `₹${num.toLocaleString("en-IN")}`;
                      };

                      return (
                        <Card key={booking.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg">{booking.project_name}</h3>
                                  <Badge className={getStatusColor(booking.status)}>
                                    {booking.status.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  Unit {booking.property_unit_number} • {booking.property_type}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Booking #{booking.booking_number}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                                <p className="font-semibold">{formatPrice(booking.total_amount)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Amount Paid</p>
                                <p className="font-semibold text-green-600">{formatPrice(booking.amount_paid)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Amount Due</p>
                                <p className="font-semibold text-red-600">{formatPrice(booking.amount_due)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Booking Date</p>
                                <p className="font-semibold text-sm">
                                  {new Date(booking.booking_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => navigate(`/bookings/${booking.id}`)}
                              >
                                View Details
                                <ArrowRight className="h-4 w-4 mr-2" />
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => navigate(`/property/${booking.property_details.id}`)}
                              >
                                View Property
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {bookings.length > 6 && (
                      <div className="text-center pt-4">
                        <Button variant="outline" onClick={() => navigate("/bookings")}>
                          View All Bookings ({bookings.length})
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            <Card>
              <CardHeader className="text-center space-y-2">
                <CardTitle>Saved Projects</CardTitle>
                <CardDescription>Projects you've marked as favorites</CardDescription>
              </CardHeader>
              <CardContent>
                {savedProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No saved projects yet</h3>
                    <p className="text-muted-foreground mb-6">Start exploring and save projects you like</p>
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
                            loading="lazy"
                          />
                          {project.verified && (
                            <Badge className="absolute top-2 left-2 bg-green-600">Verified</Badge>
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
              <CardHeader className="text-center space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                  <div className="w-full sm:w-auto text-center sm:text-left">
                    <CardTitle className="text-center sm:text-left">Recently Viewed</CardTitle>
                    <CardDescription className="text-center sm:text-left">
                      Projects you've recently looked at
                    </CardDescription>
                  </div>
                  {recentlyViewed.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={clearRecentlyViewed}
                      className="w-full sm:w-auto"
                    >
                      Clear History
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {recentlyViewed.length === 0 ? (
                  <div className="text-center py-12">
                    <Eye className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No viewing history yet</h3>
                    <p className="text-muted-foreground mb-6">Your recently viewed projects will appear here</p>
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
                            loading="lazy"
                          />
                          {project.verified && (
                            <Badge className="absolute top-2 left-2 bg-green-600">Verified</Badge>
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

          {/* Investments Tab */}
          <TabsContent value="investments" className="mt-6">
            <Card>
              <CardHeader className="text-center space-y-2">
                <CardTitle className="flex items-center justify-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Investment Portfolio
                </CardTitle>
                <CardDescription>Track your tokenized property investments and returns</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : portfolio && portfolio.total_investments > 0 ? (
                  <div className="space-y-6">
                    {/* Portfolio Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-sm font-medium text-muted-foreground mb-1">Total Invested</div>
                          <div className="text-2xl font-bold">₹{portfolio.total_invested.toLocaleString()}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-sm font-medium text-muted-foreground mb-1">Current Value</div>
                          <div className="text-2xl font-bold">₹{portfolio.total_current_value.toLocaleString()}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-sm font-medium text-muted-foreground mb-1">Total Dividends</div>
                          <div className="text-2xl font-bold">₹{portfolio.total_dividends.toLocaleString()}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-sm font-medium text-muted-foreground mb-1">Total Return</div>
                          <div className={`text-2xl font-bold ${portfolio.total_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{portfolio.total_return.toLocaleString()}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Investments List */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">My Investments</h3>
                      <div className="space-y-4">
                        {portfolio.investments.map((investment) => (
                          <Card key={investment.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold mb-1">
                                    {investment.investment_property_details.property_unit_number}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {investment.investment_property_details.project_name}
                                  </p>
                                  <div className="flex items-center gap-4 text-sm">
                                    <span>
                                      <span className="font-medium">{investment.tokens}</span> tokens
                                    </span>
                                    <span>
                                      Invested: <span className="font-medium">₹{parseFloat(investment.total_amount).toLocaleString()}</span>
                                    </span>
                                    <Badge variant={investment.status === 'active' ? 'default' : 'secondary'}>
                                      {investment.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-muted-foreground mb-1">Current Value</div>
                                  <div className="text-lg font-bold">
                                    ₹{investment.current_value ? parseFloat(investment.current_value).toLocaleString() : parseFloat(investment.total_amount).toLocaleString()}
                                  </div>
                                  {parseFloat(investment.return_percentage) !== 0 && (
                                    <div className={`text-sm ${parseFloat(investment.return_percentage) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {parseFloat(investment.return_percentage).toFixed(2)}%
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No investments yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start investing in tokenized properties to build your portfolio
                    </p>
                    <Button onClick={() => navigate('/explore-projects')}>
                      Explore Investment Opportunities
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

