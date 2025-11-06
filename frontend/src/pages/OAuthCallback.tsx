import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import RoleSelectionDialog from '../components/RoleSelectionDialog';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshToken, updateRole, refreshUserProfile } = useAuth();
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      const access = searchParams.get('access');
      const refresh = searchParams.get('refresh');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/login?error=oauth_failed');
        return;
      }

      if (access && refresh) {
        // Store tokens
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);

        try {
          // Fetch user profile directly (tokens are already fresh from OAuth)
          const profile = await authAPI.getProfile();
          console.log('OAuth login successful, user profile:', profile);
          
          // Check if user has completed role selection
          const hasCompletedRoleSelection = localStorage.getItem(`role_selected_${profile.id}`);
          
          // Show role dialog for:
          // 1. New OAuth users (no password AND no localStorage flag)
          // 2. ANY user who still has default 'buyer' role (for existing users added before this feature)
          const shouldShowRoleDialog = (!profile.has_usable_password && !hasCompletedRoleSelection);
          
          console.log('Role check:', { 
            has_usable_password: profile.has_usable_password, 
            hasCompletedRoleSelection, 
            currentRole: profile.role,
            shouldShowRoleDialog 
          });
          
          if (shouldShowRoleDialog) {
            setIsNewUser(true);
            setShowRoleDialog(true);
            // Refresh user profile to update context
            await refreshUserProfile();
          } else {
            // Existing user or has completed role selection, redirect to dashboard
            const dashboardPath = profile.role === 'builder' ? '/dashboard/builder' : '/dashboard';
            window.location.href = dashboardPath;
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          navigate('/login?error=profile_fetch_failed');
        }
      } else {
        navigate('/login?error=missing_tokens');
      }
    };

    handleCallback();
  }, [searchParams, navigate, refreshToken, refreshUserProfile]);

  const handleRoleSelect = async (role: 'buyer' | 'builder') => {
    try {
      await updateRole(role);
      
      // Mark that user has completed role selection
      const profile = await authAPI.getProfile();
      localStorage.setItem(`role_selected_${profile.id}`, 'true');
      
      setShowRoleDialog(false);
      
      // Redirect based on role
      if (role === 'builder') {
        window.location.href = '/dashboard/builder';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Error updating role:', error);
      // Still redirect on error, user can change role later
      window.location.href = '/dashboard';
    }
  };

  return (
    <>
      <RoleSelectionDialog
        open={showRoleDialog}
        onRoleSelect={handleRoleSelect}
      />
      
      {!showRoleDialog && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Completing sign in...</h2>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        </div>
      )}
    </>
  );
};

export default OAuthCallback;
