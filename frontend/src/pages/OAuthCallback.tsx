import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshToken } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const access = searchParams.get('access');
      const refresh = searchParams.get('refresh');
      const user_id = searchParams.get('user_id');
      const error = searchParams.get('error');

      // Check if we're in a popup window
      const isPopup = window.opener && !window.opener.closed;

      if (error) {
        console.error('OAuth error:', error);
        if (isPopup) {
          // Send error to parent window
          window.opener.postMessage(
            { type: 'oauth_error', error: error },
            window.location.origin
          );
          window.close();
        } else {
          navigate('/login?error=oauth_failed');
        }
        return;
      }

      if (access && refresh) {
        if (isPopup) {
          // Send tokens to parent window
          window.opener.postMessage(
            { 
              type: 'oauth_success', 
              access, 
              refresh,
              user_id 
            },
            window.location.origin
          );
          window.close();
        } else {
          // Store tokens and redirect (fallback for direct navigation)
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);

          try {
            // Use refreshToken to update user state
            await refreshToken();
            navigate('/dashboard');
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
            navigate('/login?error=profile_fetch_failed');
          }
        }
      } else {
        if (isPopup) {
          window.opener.postMessage(
            { type: 'oauth_error', error: 'missing_tokens' },
            window.location.origin
          );
          window.close();
        } else {
          navigate('/login?error=missing_tokens');
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate, refreshToken]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Completing sign in...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
};

export default OAuthCallback;
