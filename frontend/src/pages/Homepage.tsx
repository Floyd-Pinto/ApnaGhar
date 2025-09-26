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
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-background to-muted py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="verified-badge w-fit">
                  <Shield className="h-3 w-3" />
                  Blockchain Verified Platform
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  Real Estate,{' '}
                  <span className="gradient-text">Redefined with Trust</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-xl">
                  Track your property investment with blockchain-verified updates 
                  and invest with absolute confidence in India's most transparent real estate platform.
                </p>
              </div>
              
              {/* Dual CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="btn-hero">
                  <Link to="/projects">
                    <Eye className="h-5 w-5 mr-2" />
                    Explore Verified Projects
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  <Link to="/dashboard">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Access Your Dashboard
                  </Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">50+</div>
                  <div className="text-sm text-muted-foreground">Verified Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">₹500Cr+</div>
                  <div className="text-sm text-muted-foreground">Assets Tracked</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">10K+</div>
                  <div className="text-sm text-muted-foreground">Investors</div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl transform rotate-3" />
              <img 
                src={heroImage} 
                alt="ApnaGhar Platform Dashboard"
                className="relative w-full rounded-2xl shadow-floating"
              />
            </div>
          </div>
        </div>
      </section>

      {/* The ApnaGhar Difference Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              The ApnaGhar Difference
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're not just another property listing site. We're your trusted investment tracking dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Real-Time Verified Tracking */}
            <div className="card-elevated p-8 text-center group hover:shadow-floating transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Eye className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Real-Time Verified Tracking
              </h3>
              <p className="text-muted-foreground">
                Watch your investment grow with live construction updates, 
                geo-tagged photos, and blockchain-verified progress reports.
              </p>
            </div>

            {/* Blockchain-Secured Contracts */}
            <div className="card-elevated p-8 text-center group hover:shadow-floating transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-accent rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Blockchain-Secured Contracts
              </h3>
              <p className="text-muted-foreground">
                Every transaction and update is recorded on the blockchain, 
                ensuring complete transparency and fraud prevention.
              </p>
            </div>

            {/* AI-Powered Assistance */}
            <div className="card-elevated p-8 text-center group hover:shadow-floating transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                AI-Powered Assistance
              </h3>
              <p className="text-muted-foreground">
                Get intelligent insights, market analysis, and personalized 
                investment recommendations from our AI assistant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Featured Verified Projects
              </h2>
              <p className="text-xl text-muted-foreground">
                Discover high-potential properties with complete transparency
              </p>
            </div>
            <Button asChild variant="outline" className="hidden md:flex">
              <Link to="/projects">
                View All Projects
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-8">
            {featuredProperties.map((property) => (
              <PropertyCard key={property.id} {...property} />
            ))}
          </div>

          <div className="text-center md:hidden">
            <Button asChild className="w-full sm:w-auto">
              <Link to="/projects">
                View All Projects
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary-hover text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Ready to Transform Your Real Estate Investment?
            </h2>
            <p className="text-xl opacity-90">
              Join thousands of smart investors who trust ApnaGhar for transparent, 
              secure, and profitable real estate investments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary">
                <Link to="/projects">
                  <Zap className="h-5 w-5 mr-2" />
                  Start Investing Today
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                <Link to="/dashboard">
                  <Clock className="h-5 w-5 mr-2" />
                  Schedule a Demo
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