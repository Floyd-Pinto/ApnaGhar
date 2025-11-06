import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PropertyCard from '@/components/PropertyCard';
import { Shield, TrendingUp, Bot, Eye, Zap, Clock } from 'lucide-react';
import heroImage from '@/assets/hero-image.jpg';
import propertyExample1 from '@/assets/property-example-1.jpg';
import propertyExample2 from '@/assets/property-example-2.jpg';

const Homepage = () => {
  // Mock data for featured properties
  const featuredProperties = [
    {
      id: '1',
      title: 'Skyline Residences',
      location: 'Bandra West, Mumbai',
      price: '₹2.5 Cr',
      pricePerShare: '₹25,000',
      image: propertyExample1,
      verified: true,
      lastUpdated: '2 hours ago',
      roi: '12',
      completionStatus: '65'
    },
    {
      id: '2',
      title: 'Green Valley Towers',
      location: 'Powai, Mumbai',
      price: '₹1.8 Cr',
      pricePerShare: '₹18,000',
      image: propertyExample2,
      verified: true,
      lastUpdated: '5 hours ago',
      roi: '15',
      completionStatus: '45'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section - 99acres Style */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Heading */}
            <div className="space-y-3">
              <h1 className="text-3xl lg:text-5xl font-extrabold text-foreground leading-tight">
                Find Your Dream Property with{' '}
                <span className="text-primary">Blockchain Verification</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                India's most transparent real estate platform with verified properties, 
                real-time tracking, and guaranteed authenticity
              </p>
            </div>

            {/* Search Box - 99acres Style */}
            <div className="bg-white dark:bg-card shadow-elevated rounded-lg p-6 mt-8">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search Input */}
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by city, locality, builder or project..."
                    className="w-full px-4 py-3 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                </div>

                {/* Property Type Dropdown */}
                <div className="w-full md:w-48">
                  <select className="w-full px-4 py-3 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-background">
                    <option>All Residential</option>
                    <option>Apartment</option>
                    <option>Villa</option>
                    <option>Plot</option>
                  </select>
                </div>

                {/* Search Button */}
                <Link to="/explore-projects">
                  <Button className="bg-primary hover:bg-primary-hover h-12 px-8 text-base font-semibold">
                    <Eye className="h-5 w-5 mr-2" />
                    Search
                  </Button>
                </Link>
              </div>

              {/* Quick Links */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground mr-2">Popular:</span>
                {['Mumbai', 'Bangalore', 'Pune', 'Delhi NCR', 'Hyderabad'].map((city) => (
                  <button
                    key={city}
                    className="px-3 py-1 text-sm font-medium text-primary hover:bg-primary/10 rounded transition-colors"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-3xl font-extrabold text-primary">50+</div>
                <div className="text-sm text-muted-foreground mt-1">Verified Projects</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-extrabold text-primary">₹500Cr+</div>
                <div className="text-sm text-muted-foreground mt-1">Property Value</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-extrabold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground mt-1">Happy Investors</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The ApnaGhar Difference Section */}
      <section className="py-16 bg-white dark:bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl font-extrabold text-foreground">
              Why Choose ApnaGhar?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              India's first blockchain-verified real estate platform with complete transparency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Real-Time Verified Tracking */}
            <div className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                Real-Time Tracking
              </h3>
              <p className="text-sm text-muted-foreground">
                Live construction updates with geo-tagged photos and blockchain-verified 
                progress reports for complete transparency.
              </p>
            </div>

            {/* Blockchain-Secured Contracts */}
            <div className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-success" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                Blockchain Verified
              </h3>
              <p className="text-sm text-muted-foreground">
                Every transaction recorded on blockchain for complete transparency 
                and fraud prevention. Your investment is secure.
              </p>
            </div>

            {/* AI-Powered Assistance */}
            <div className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Bot className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                AI-Powered Insights
              </h3>
              <p className="text-sm text-muted-foreground">
                Get intelligent market analysis, investment recommendations, 
                and personalized property suggestions from our AI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-foreground">
                Featured Verified Properties
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Handpicked properties with blockchain verification
              </p>
            </div>
            <Button asChild variant="link" className="hidden md:flex text-primary font-semibold">
              <Link to="/projects">
                View All Properties →
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {featuredProperties.map((property) => (
              <PropertyCard key={property.id} {...property} />
            ))}
            {/* Add one more placeholder */}
            <PropertyCard 
              id="3"
              title="Luxury Heights"
              location="Andheri East, Mumbai"
              price="₹3.2 Cr"
              pricePerShare="₹32,000"
              image={propertyExample1}
              verified={true}
              lastUpdated="1 day ago"
              roi="10"
              completionStatus="80"
            />
          </div>

          <div className="text-center md:hidden">
            <Button asChild className="w-full sm:w-auto bg-primary hover:bg-primary-hover">
              <Link to="/projects">
                View All Properties
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-extrabold">
              Start Your Real Estate Journey Today
            </h2>
            <p className="text-lg opacity-95">
              Join 10,000+ investors who trust ApnaGhar for verified, transparent, 
              and secure real estate investments
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-100 font-semibold">
                <Link to="/projects">
                  <Eye className="h-5 w-5 mr-2" />
                  Browse Properties
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary font-semibold">
                <Link to="/register">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Register Now
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;