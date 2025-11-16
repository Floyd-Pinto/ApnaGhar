import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '@/services/analyticsAPI';

/**
 * Hook to track page views automatically
 */
export function usePageView() {
  const location = useLocation();

  useEffect(() => {
    // Track page view
    trackEvent('page_view', {
      metadata: {
        path: location.pathname,
        search: location.search,
      },
    });
  }, [location.pathname, location.search]);
}

/**
 * Hook to track specific events
 */
export function useTrackEvent(
  eventType: string,
  data?: {
    related_object_type?: string;
    related_object_id?: string;
    metadata?: any;
    properties?: any;
  },
  deps: any[] = []
) {
  useEffect(() => {
    trackEvent(eventType, data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

