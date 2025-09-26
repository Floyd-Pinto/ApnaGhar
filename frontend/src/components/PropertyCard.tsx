import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, TrendingUp, Shield, Clock } from 'lucide-react';

interface PropertyCardProps {
  id: string;
  title: string;
  location: string;
  price: string;
  pricePerShare?: string;
  image: string;
  verified: boolean;
  lastUpdated: string;
  roi?: string;
  completionStatus?: string;
}

const PropertyCard = ({ 
  id, 
  title, 
  location, 
  price, 
  pricePerShare, 
  image, 
  verified, 
  lastUpdated,
  roi,
  completionStatus
}: PropertyCardProps) => {
  return (
    <div className="card-elevated p-0 overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
      <div className="relative">
        <img 
          src={image} 
          alt={title}
          className="w-full h-48 object-cover"
        />
        
        {verified && (
          <div className="absolute top-4 left-4">
            <Badge className="verified-badge">
              <Shield className="h-3 w-3" />
              ApnaGhar Verified
            </Badge>
          </div>
        )}
        
        {completionStatus && (
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-background/90 text-foreground">
              {completionStatus}% Complete
            </Badge>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          {roi && (
            <Badge variant="outline" className="text-success border-success/30 bg-success/5">
              <TrendingUp className="h-3 w-3 mr-1" />
              {roi}% ROI
            </Badge>
          )}
        </div>
        
        <div className="flex items-center text-muted-foreground mb-4">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{location}</span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Price</span>
            <span className="font-semibold text-foreground">{price}</span>
          </div>
          
          {pricePerShare && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Per Share</span>
              <span className="font-medium text-primary">{pricePerShare}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Last updated: {lastUpdated}
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild className="flex-1" size="sm">
            <Link to={`/projects/${id}`}>
              View Details
            </Link>
          </Button>
          {pricePerShare && (
            <Button variant="outline" size="sm" className="btn-accent flex-1">
              Invest Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;