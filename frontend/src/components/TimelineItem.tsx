import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Home, ExternalLink } from 'lucide-react';

interface TimelineItemProps {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  image: string;
  geotag: string;
  flatNumber: string;
  verified: boolean;
}

const TimelineItem = ({ 
  id, 
  title, 
  description, 
  timestamp, 
  image, 
  geotag, 
  flatNumber, 
  verified 
}: TimelineItemProps) => {
  return (
    <div className="flex gap-4 p-4 bg-card rounded-lg border border-border hover:shadow-card transition-shadow">
      {/* Timeline Indicator */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${verified ? 'bg-success' : 'bg-muted'} mt-2`} />
        <div className="w-px h-full bg-border mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Image */}
          <div className="lg:w-32 lg:h-24 w-full h-32 flex-shrink-0">
            <img 
              src={image} 
              alt={title}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-foreground">{title}</h4>
              {verified && (
                <Badge variant="outline" className="text-success border-success/30 bg-success/5 ml-2">
                  Verified
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground mb-3">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {timestamp}
              </div>
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {geotag}
              </div>
              <div className="flex items-center">
                <Home className="h-3 w-3 mr-1" />
                {flatNumber}
              </div>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs hover:bg-primary hover:text-primary-foreground"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Verify on Chain
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineItem;