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
    <div className="property-card hover-lift">
      {/* Image Container */}
      <div className="relative h-52 overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
        />
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {verified && (
            <span className="verified-badge shadow-sm">
              <Shield className="h-3 w-3" />
              Verified
            </span>
          )}
          {roi && parseInt(roi) > 12 && (
            <span className="premium-badge shadow-sm">
              <TrendingUp className="h-3 w-3" />
              High ROI
            </span>
          )}
        </div>

        {/* Bottom Price Overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-white/80 text-xs font-medium mb-0.5">Starting from</div>
              <div className="text-white text-2xl font-bold">{price}</div>
            </div>
            {completionStatus && (
              <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded">
                <div className="text-xs font-medium text-muted-foreground">Progress</div>
                <div className="text-sm font-bold text-foreground">{completionStatus}%</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-bold text-lg text-foreground mb-1.5 line-clamp-1 hover:text-primary transition-colors cursor-pointer">
          {title}
        </h3>
        
        {/* Location */}
        <div className="flex items-center text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="text-sm line-clamp-1">{location}</span>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
          {pricePerShare && (
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-0.5">Per Share</div>
              <div className="text-sm font-semibold text-foreground">{pricePerShare}</div>
            </div>
          )}
          {roi && (
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-0.5">Expected ROI</div>
              <div className="text-sm font-semibold text-success">{roi}%</div>
            </div>
          )}
        </div>

        {/* Last Updated */}
        <div className="flex items-center text-xs text-muted-foreground mb-3">
          <Clock className="h-3 w-3 mr-1" />
          <span>Updated {lastUpdated}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button asChild className="flex-1 bg-primary hover:bg-primary-hover" size="sm">
            <Link to={`/projects/${id}`}>
              View Details
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="btn-contact flex-1 border-success text-success hover:bg-success hover:text-white"
          >
            Contact Builder
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;