import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import TimelineItem from '@/components/TimelineItem';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Share2, 
  Heart, 
  MessageCircle,
  Building,
  Users,
  DollarSign,
  Shield,
  Clock,
  Eye
} from 'lucide-react';
import propertyExample1 from '@/assets/property-example-1.jpg';
import constructionUpdate1 from '@/assets/construction-update-1.jpg';

const PropertyDetails = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock property data
  const property = {
    id: id || '1',
    title: 'Skyline Residences',
    location: 'Bandra West, Mumbai, Maharashtra',
    price: '₹2.5 Cr',
    pricePerShare: '₹25,000',
    totalShares: 1000,
    availableShares: 342,
    roi: '12.5',
    completionStatus: 65,
    expectedCompletion: 'December 2025',
    builder: 'Prestige Group',
    images: [propertyExample1, propertyExample1, propertyExample1],
    verified: true,
    lastUpdated: '2 hours ago'
  };

  // Mock timeline data
  const timelineUpdates = [
    {
      id: '1',
      title: 'Foundation Work Completed',
      description: 'All foundation work has been completed as per schedule. Structural reinforcement verified by third-party engineers.',
      timestamp: 'Sep 25, 2024, 2:30 PM',
      image: constructionUpdate1,
      geotag: 'Lat: 19.0596, Long: 72.8295',
      flatNumber: 'Tower A - All Floors',
      verified: true
    },
    {
      id: '2',
      title: '15th Floor Slab Casting',
      description: 'Concrete pouring completed for the 15th floor. Quality checks passed successfully.',
      timestamp: 'Sep 23, 2024, 10:15 AM',
      image: constructionUpdate1,
      geotag: 'Lat: 19.0596, Long: 72.8295',
      flatNumber: 'Tower A - Floor 15',
      verified: true
    },
    {
      id: '3',
      title: 'Plumbing Installation Progress',
      description: 'Plumbing work initiated on floors 10-14. High-grade materials being used as per specifications.',
      timestamp: 'Sep 20, 2024, 4:45 PM',
      image: constructionUpdate1,
      geotag: 'Lat: 19.0596, Long: 72.8295',
      flatNumber: 'Tower A - Floors 10-14',
      verified: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link to="/projects">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Projects
                </Link>
              </Button>
              <div className="hidden md:block h-6 w-px bg-border" />
              <div className="hidden md:flex items-center space-x-2">
                {property.verified && (
                  <Badge className="verified-badge">
                    <Shield className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  Last updated: {property.lastUpdated}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Property Information */}
          <div className="xl:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative">
                <img 
                  src={property.images[0]} 
                  alt={property.title}
                  className="w-full h-96 object-cover rounded-xl"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="verified-badge">
                    <Shield className="h-3 w-3" />
                    ApnaGhar Verified
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-background/90 text-foreground">
                    {property.completionStatus}% Complete
                  </Badge>
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  {property.title}
                </h1>
                <div className="flex items-center text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{property.location}</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <DollarSign className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">{property.price}</div>
                    <div className="text-sm text-muted-foreground">Total Value</div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-success mx-auto mb-2" />
                    <div className="text-2xl font-bold text-success">{property.roi}%</div>
                    <div className="text-sm text-muted-foreground">Expected ROI</div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Building className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">{property.completionStatus}%</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-lg font-bold text-foreground">Dec '25</div>
                    <div className="text-sm text-muted-foreground">Expected</div>
                  </div>
                </div>
              </div>

              {/* Tabs for additional information */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="floor-plans">Floor Plans</TabsTrigger>
                  <TabsTrigger value="amenities">Amenities</TabsTrigger>
                  <TabsTrigger value="location">Location</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="card-elevated p-6">
                    <h3 className="font-semibold text-lg mb-4">Property Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Builder:</span> {property.builder}</div>
                      <div><span className="text-muted-foreground">Property Type:</span> Residential Apartment</div>
                      <div><span className="text-muted-foreground">Total Floors:</span> 25</div>
                      <div><span className="text-muted-foreground">Units per Floor:</span> 4</div>
                      <div><span className="text-muted-foreground">Carpet Area:</span> 1200-1800 sq ft</div>
                      <div><span className="text-muted-foreground">Possession:</span> {property.expectedCompletion}</div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="floor-plans">
                  <div className="card-elevated p-6">
                    <h3 className="font-semibold text-lg mb-4">Floor Plans</h3>
                    <p className="text-muted-foreground">Floor plans will be displayed here.</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="amenities">
                  <div className="card-elevated p-6">
                    <h3 className="font-semibold text-lg mb-4">Amenities</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>• Swimming Pool</div>
                      <div>• Gymnasium</div>
                      <div>• Children's Play Area</div>
                      <div>• Club House</div>
                      <div>• 24/7 Security</div>
                      <div>• Power Backup</div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="location">
                  <div className="card-elevated p-6">
                    <h3 className="font-semibold text-lg mb-4">Location Advantages</h3>
                    <p className="text-muted-foreground">Map and location details will be displayed here.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Column - Live Dashboard */}
          <div className="space-y-6">
            {/* Live Progress Tracker */}
            <div className="card-dashboard sticky top-32">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-primary" />
                  Live Progress Tracker
                </h2>
                <Badge variant="outline" className="text-success border-success/30 bg-success/5">
                  <Clock className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Construction Progress</span>
                  <span className="font-medium">{property.completionStatus}%</span>
                </div>
                <Progress value={property.completionStatus} className="h-2" />
              </div>

              {/* Timeline Feed */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {timelineUpdates.map((update) => (
                  <TimelineItem key={update.id} {...update} />
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <Button variant="outline" className="w-full" size="sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  View All Updates
                </Button>
              </div>
            </div>

            {/* Fractional Ownership Module */}
            <div className="card-dashboard">
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-accent" />
                Invest in this Property
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{property.pricePerShare}</div>
                    <div className="text-sm text-muted-foreground">Per Share</div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{property.availableShares}</div>
                    <div className="text-sm text-muted-foreground">Available</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shares Sold</span>
                    <span className="font-medium">{property.totalShares - property.availableShares}/{property.totalShares}</span>
                  </div>
                  <Progress value={(property.totalShares - property.availableShares) / property.totalShares * 100} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expected ROI</span>
                    <span className="font-semibold text-success">{property.roi}% annually</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Min Investment</span>
                    <span className="font-medium">{property.pricePerShare} (1 share)</span>
                  </div>
                </div>

                <Button className="w-full btn-hero">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Invest Now
                </Button>
                
                <Button variant="outline" className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Schedule Site Visit
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button size="lg" className="rounded-full bg-gradient-primary shadow-floating hover:shadow-elevated hover:scale-110 transition-all">
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default PropertyDetails;