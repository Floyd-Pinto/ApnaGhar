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

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<SavedProject[]>([]);

  const formatPrice = (price: string) => {
    const priceNum = parseFloat(price);
    if (priceNum >= 10000000) {
      return `₹${(priceNum / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(priceNum / 100000).toFixed(2)} L`;
  };

  const stats = [
    {
      title: "Saved Projects",
      value: "0",
      icon: Heart,
      description: "Projects you've favorited",
    },
    {
      title: "Site Visits",
      value: "0",
      icon: Calendar,
      description: "Scheduled visits",
    },
    {
      title: "Documents",
      value: "0",
      icon: FileText,
      description: "Downloaded brochures",
    },
    {
      title: "Interests",
      value: "0",
      icon: TrendingUp,
      description: "Properties marked interested",
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
        <Tabs defaultValue="saved" className="w-full">
          <TabsList>
            <TabsTrigger value="saved">
              <Heart className="h-4 w-4 mr-2" />
              Saved Projects
            </TabsTrigger>
            <TabsTrigger value="viewed">
              <Eye className="h-4 w-4 mr-2" />
              Recently Viewed
            </TabsTrigger>
            <TabsTrigger value="visits">
              <Calendar className="h-4 w-4 mr-2" />
              Site Visits
            </TabsTrigger>
            <TabsTrigger value="interests">
              <TrendingUp className="h-4 w-4 mr-2" />
              Interests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Saved Projects</CardTitle>
                <CardDescription>
                  Projects you've marked as favorites
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedProjects.length === 0 ? (
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
                    {/* Projects will be listed here */}
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visits" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Site Visits</CardTitle>
                <CardDescription>
                  Manage your upcoming property visits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    No site visits scheduled
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Schedule a visit to see properties in person
                  </p>
                  <Link to="/explore-projects">
                    <Button>Find Properties</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interests" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Properties You're Interested In</CardTitle>
                <CardDescription>
                  Track properties you've expressed interest in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    No interested properties
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Mark properties you're interested in to track them here
                  </p>
                  <Link to="/explore-projects">
                    <Button>Browse Properties</Button>
                  </Link>
                </div>
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
