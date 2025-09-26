import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PropertyCard from '@/components/PropertyCard';
import { Search, Filter, MapPin, TrendingUp } from 'lucide-react';
import propertyExample1 from '@/assets/property-example-1.jpg';
import propertyExample2 from '@/assets/property-example-2.jpg';

const Projects = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [filterBy, setFilterBy] = useState('all');

  // Mock properties data
  const properties = [
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
    },
    {
      id: '3',
      title: 'Ocean View Apartments',
      location: 'Worli, Mumbai',
      price: '₹3.2 Cr',
      pricePerShare: '₹32,000',
      image: propertyExample1,
      verified: true,
      lastUpdated: '1 day ago',
      roi: '10',
      completionStatus: '80'
    },
    {
      id: '4',
      title: 'Metro Heights',
      location: 'Ghatkopar, Mumbai',
      price: '₹1.2 Cr',
      pricePerShare: '₹12,000',
      image: propertyExample2,
      verified: true,
      lastUpdated: '3 hours ago',
      roi: '18',
      completionStatus: '30'
    }
  ];

  const stats = {
    totalProjects: properties.length,
    avgROI: '14.2',
    totalValue: '₹8.7 Cr',
    verifiedProjects: properties.filter(p => p.verified).length
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
            Verified <span className="gradient-text">Properties</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover blockchain-verified real estate opportunities with complete transparency and live progress tracking.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card-elevated p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalProjects}</div>
            <div className="text-sm text-muted-foreground">Total Projects</div>
          </div>
          <div className="card-elevated p-4 text-center">
            <div className="text-2xl font-bold text-success">{stats.avgROI}%</div>
            <div className="text-sm text-muted-foreground">Average ROI</div>
          </div>
          <div className="card-elevated p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalValue}</div>
            <div className="text-sm text-muted-foreground">Total Value</div>
          </div>
          <div className="card-elevated p-4 text-center">
            <div className="text-2xl font-bold text-accent">{stats.verifiedProjects}</div>
            <div className="text-sm text-muted-foreground">Verified</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card-elevated p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest Updates</SelectItem>
                <SelectItem value="roi">Highest ROI</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="completion">Completion %</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="verified">Verified Only</SelectItem>
                <SelectItem value="under-construction">Under Construction</SelectItem>
                <SelectItem value="ready">Ready to Move</SelectItem>
                <SelectItem value="high-roi">High ROI (&gt;15%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-muted-foreground">
                {properties.length} properties found
              </Badge>
              {filterBy !== 'all' && (
                <Badge className="verified-badge">
                  Filter: {filterBy}
                </Badge>
              )}
            </div>
            
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property) => (
            <PropertyCard key={property.id} {...property} />
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Load More Properties
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Showing {properties.length} of 50+ verified properties
          </p>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center space-y-6 p-8 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
            Don't See What You're Looking For?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Set up alerts for specific locations, price ranges, or ROI targets. 
            We'll notify you when matching verified properties become available.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="btn-hero">
              <MapPin className="h-4 w-4 mr-2" />
              Set Location Alert
            </Button>
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Set ROI Alert
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;