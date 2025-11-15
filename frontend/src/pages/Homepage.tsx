import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PropertyCard from '@/components/PropertyCard';
import LoginDialog from '@/components/LoginDialog';
import RegisterDialog from '@/components/RegisterDialog';
import { Shield, TrendingUp, Bot, Eye, Zap, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface Project {
  id: string;
  name: string;
  slug: string;
  developer_name: string;
  city: string;
  state: string;
  starting_price: string;
  status: string;
  project_type: string;
  cover_image: string;
  total_units: number;
  available_units: number;
  verified: boolean;
  verification_score: string;
  amenities: string[];
  expected_completion: string;
  views_count: number;
  interested_count: number;
  average_rating: number;
  total_reviews: number;
}

const Homepage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalValue: '500Cr+',
    investors: '10K+'
  });

  useEffect(() => {
    console.log('Homepage - isAuthenticated:', isAuthenticated);
    fetchFeaturedProjects();
    fetchStats();
  }, [isAuthenticated]); // Re-fetch when auth status changes

  const fetchFeaturedProjects = async () => {
    try {
      // For guests (not authenticated), show only top-reviewed properties
      // For authenticated users, show more projects based on views
      const ordering = isAuthenticated ? '-views_count' : 'popular';
      const pageSize = isAuthenticated ? '6' : '3';
      const url = `${API_BASE_URL}/api/projects/projects/?ordering=${ordering}&page_size=${pageSize}`;
      console.log('Fetching projects:', { isAuthenticated, ordering, pageSize, url });
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('API response:', data);
        
        // DRF pagination returns {count, next, previous, results}
        const projects = data.results || data;
        console.log(`Setting ${projects.length} projects`);
        setFeaturedProjects(projects);
      }
    } catch (error) {
      console.error('Error fetching featured projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/projects/`);
      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({
          ...prev,
          totalProjects: data.length
        }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthenticated) {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (propertyType !== 'all') params.append('type', propertyType);
      navigate(`/explore-projects?${params.toString()}`);
    } else {
      navigate('/login');
    }
  };

  const formatPrice = (price: string) => {
    const priceNum = parseFloat(price);
    if (priceNum >= 10000000) {
      return `₹${(priceNum / 10000000).toFixed(2)} Cr`;
    } else if (priceNum >= 100000) {
      return `₹${(priceNum / 100000).toFixed(2)} L`;
    }
    return `₹${priceNum.toLocaleString('en-IN')}`;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Muted Glassmorphism Style */}
      <section className="relative py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Heading */}
            <div className="space-y-3 flex flex-col items-center">
              <h1 className="text-3xl lg:text-5xl font-extrabold text-foreground leading-tight text-center">
                Find Your Dream Property with{' '}
                <span className="text-primary">Blockchain Verification</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-center">
                India's most transparent real estate platform with verified properties, 
                real-time tracking, and guaranteed authenticity
              </p>
            </div>

            {/* Search Box - Only show for authenticated users */}
            {isAuthenticated && (
              <form onSubmit={handleSearch} className="glass-card mt-8 mx-auto max-w-3xl">
                <div className="flex flex-col md:flex-row gap-3 justify-center items-center">
                  {/* Search Input */}
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      placeholder="Search by city, locality, builder or project..."
                      className="glass-input w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Property Type Dropdown */}
                  <div className="w-full md:w-48">
                    <select 
                      className="glass-input w-full"
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                    >
                      <option value="all">All Residential</option>
                      <option value="apartment">Apartment</option>
                      <option value="villa">Villa</option>
                      <option value="plot">Plot</option>
                    </select>
                  </div>

                  {/* Search Button */}
                  <Button type="submit" variant="cta" size="lg" className="h-12 px-8 text-base font-semibold w-full md:w-auto">
                    <Eye className="h-5 w-5 mr-2" />
                    Search
                  </Button>
                </div>

                {/* Quick Links */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground font-medium">Popular:</span>
                  {['Mumbai', 'Bangalore', 'Pune', 'Delhi', 'Hyderabad'].map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setSearchQuery(city);
                      }}
                      className="px-3 py-1 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </form>
            )}

            {/* CTA for non-authenticated users */}
            {!isAuthenticated && (
              <div className="glass-card mt-8 mx-auto max-w-2xl">
                <p className="text-lg text-muted-foreground mb-4 text-center">
                  Sign in to search and explore verified properties
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="cta" onClick={() => setLoginDialogOpen(true)}>
                    Sign In
                  </Button>
                  <Button variant="outline" onClick={() => setRegisterDialogOpen(true)}>
                    Create Account
                  </Button>
                </div>
              </div>
            )}

            {/* Trust Indicators - Using real data */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-3xl font-extrabold text-primary">{stats.totalProjects}+</div>
                <div className="text-sm text-muted-foreground mt-1">Verified Projects</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-extrabold text-primary">{stats.totalValue}</div>
                <div className="text-sm text-muted-foreground mt-1">Property Value</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-extrabold text-primary">{stats.investors}</div>
                <div className="text-sm text-muted-foreground mt-1">Happy Investors</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The ApnaGhar Difference Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl font-extrabold text-foreground text-center">
              Why Choose ApnaGhar?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-center">
              India's first blockchain-verified real estate platform with complete transparency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center max-w-5xl mx-auto">
            {/* Real-Time Verified Tracking */}
            <div className="glass-card hover:transform hover:-translate-y-1 transition-all w-full max-w-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 text-center">
                Real-Time Tracking
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Live construction updates with geo-tagged photos and blockchain-verified 
                progress reports for complete transparency.
              </p>
            </div>

            {/* Blockchain-Secured Contracts */}
            <div className="glass-card hover:transform hover:-translate-y-1 transition-all w-full max-w-sm">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Shield className="h-6 w-6 text-success" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 text-center">
                Blockchain Verified
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Every transaction recorded on blockchain for complete transparency 
                and fraud prevention. Your investment is secure.
              </p>
            </div>

            {/* AI-Powered Assistance */}
            <div className="glass-card hover:transform hover:-translate-y-1 transition-all w-full max-w-sm">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Bot className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 text-center">
                AI-Powered Insights
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Get intelligent market analysis, investment recommendations, 
                and personalized property suggestions from our AI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div className="text-center md:text-left w-full md:w-auto">
              <h2 className="text-2xl font-extrabold text-foreground">
                {isAuthenticated ? 'Featured Verified Properties' : 'Top Reviewed Properties'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isAuthenticated 
                  ? 'Handpicked properties with blockchain verification' 
                  : 'Highest rated properties by our verified customers'}
              </p>
            </div>
            {isAuthenticated && (
              <Button asChild variant="link" className="text-primary font-semibold">
                <Link to="/explore-projects">
                  View All Properties →
                </Link>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 justify-items-center">
            {loading ? (
              // Loading skeleton - show 3 for guests, 6 for authenticated
              [...Array(isAuthenticated ? 6 : 3)].map((_, i) => (
                <div key={i} className="glass-card p-4 animate-pulse">
                  <div className="bg-muted/50 h-48 rounded mb-4"></div>
                  <div className="bg-muted/50 h-6 rounded mb-2"></div>
                  <div className="bg-muted/50 h-4 rounded w-2/3"></div>
                </div>
              ))
            ) : featuredProjects.length > 0 ? (
              featuredProjects.map((project) => (
                <Link key={project.id} to={`/projects/${project.id}`} className="block w-full max-w-sm">
                  <div className="glass-card overflow-hidden h-full flex flex-col">
                    <div className="relative h-48">
                      <img 
                        src={project.cover_image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500'} 
                        alt={project.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {project.verified && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Verified
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-lg mb-1 text-center md:text-left">{project.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2 text-center md:text-left">{project.city}, {project.state}</p>
                      
                      {/* Rating display */}
                      {project.average_rating > 0 && (
                        <div className="flex items-center justify-center md:justify-start gap-1 mb-2">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm font-semibold">{project.average_rating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">({project.total_reviews} reviews)</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-auto">
                        <span className="text-primary font-bold">{formatPrice(project.starting_price)}</span>
                        <span className="text-xs text-muted-foreground capitalize">{project.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No featured projects available</p>
              </div>
            )}
          </div>

          <div className="text-center md:hidden">
            <Button asChild className="w-full sm:w-auto">
              <Link to="/explore-projects">
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
              {isAuthenticated ? (
                <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-100 font-semibold shadow-xl">
                  <Link to="/explore-projects">
                    <Eye className="h-5 w-5 mr-2" />
                    Browse Properties
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" onClick={() => setLoginDialogOpen(true)} className="bg-white text-primary hover:bg-gray-100 font-semibold shadow-xl">
                    <Eye className="h-5 w-5 mr-2" />
                    Sign In to Browse
                  </Button>
                  <Button size="lg" onClick={() => setRegisterDialogOpen(true)} variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary font-semibold shadow-lg">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Register Now
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Auth Dialogs */}
      <LoginDialog 
        open={loginDialogOpen} 
        onOpenChange={setLoginDialogOpen}
        onSwitchToRegister={() => {
          setLoginDialogOpen(false);
          setRegisterDialogOpen(true);
        }}
      />
      <RegisterDialog 
        open={registerDialogOpen} 
        onOpenChange={setRegisterDialogOpen}
        onSwitchToLogin={() => {
          setRegisterDialogOpen(false);
          setLoginDialogOpen(true);
        }}
      />
    </div>
  );
};

export default Homepage;