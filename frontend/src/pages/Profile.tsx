import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { authAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { User, Settings, Edit3, Mail, Calendar, MapPin, Phone, Key, UserCog, Bell, Shield, Eye, Building2 } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    bio: '',
    avatar: '',
  });

  const [usernameForm, setUsernameForm] = useState({
    username: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });

  const [preferencesForm, setPreferencesForm] = useState<{
    theme_preference: 'light' | 'dark';
    language: string;
    timezone: string;
    email_notifications: boolean;
    push_notifications: boolean;
    marketing_emails: boolean;
  }>({
    theme_preference: 'light',
    language: 'en',
    timezone: 'UTC',
    email_notifications: true,
    push_notifications: false,
    marketing_emails: false,
  });

  const [privacyForm, setPrivacyForm] = useState({
    profile_visibility: true,
    show_activity_status: true,
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const profile = await authAPI.getProfile();
      setUserProfile(profile);
      setProfileForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        bio: profile.bio || '',
        avatar: profile.avatar || '',
      });
      setUsernameForm({
        username: profile.username || '',
      });
      setPreferencesForm({
        theme_preference: profile.theme_preference || 'light',
        language: profile.language || 'en',
        timezone: profile.timezone || 'UTC',
        email_notifications: profile.email_notifications ?? true,
        push_notifications: profile.push_notifications ?? false,
        marketing_emails: profile.marketing_emails ?? false,
      });
      setPrivacyForm({
        profile_visibility: profile.profile_visibility ?? true,
        show_activity_status: profile.show_activity_status ?? true,
      });
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const response = await authAPI.updateProfile(profileForm);
      setUserProfile(response.user);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const response = await authAPI.updateUsername(usernameForm.username);
      setSuccess(response.message);
      await fetchUserProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update username');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      await authAPI.changePassword(
        passwordForm.old_password,
        passwordForm.new_password,
        passwordForm.new_password_confirm
      );
      setSuccess('Password changed successfully!');
      setPasswordForm({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const response = await authAPI.updateProfile(preferencesForm);
      setUserProfile(response.user);
      setSuccess('Preferences updated successfully!');
      
      // Apply theme immediately using theme context
      if (preferencesForm.theme_preference !== userProfile?.theme_preference) {
        setTheme(preferencesForm.theme_preference);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    }
  };

  const handleUpdatePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const response = await authAPI.updateProfile(privacyForm);
      setUserProfile(response.user);
      setSuccess('Privacy settings updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update privacy settings');
    }
  };

  const handleSetInitialPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      await authAPI.setInitialPassword(
        passwordForm.new_password,
        passwordForm.new_password_confirm
      );
      setSuccess('Password set successfully! You can now use it to login.');
      setPasswordForm({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      });
      // Refresh profile to update has_usable_password
      await fetchUserProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set password');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 sm:py-8 w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">My Profile</h1>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground break-words">
                Manage your account information and preferences
              </p>
            </div>
            <Link to="/settings" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto flex items-center justify-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-green-500 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Profile Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-20">
              <CardHeader className="text-center pb-4">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 mx-auto mb-3 sm:mb-4">
                  <AvatarImage src={userProfile?.avatar} />
                  <AvatarFallback className="text-xl sm:text-2xl bg-primary text-primary-foreground">
                    {userProfile?.first_name?.[0]}{userProfile?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg sm:text-xl break-words">
                  {userProfile?.first_name} {userProfile?.last_name}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm break-words">@{userProfile?.username}</CardDescription>
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  <Badge variant={userProfile?.role === 'builder' ? 'default' : 'secondary'} className="text-xs">
                    {userProfile?.role}
                  </Badge>
                  {userProfile?.is_staff && (
                    <Badge variant="outline" className="border-amber-500 text-amber-700 text-xs">
                      Admin
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 sm:pt-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start gap-3 text-xs sm:text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-foreground truncate flex-1 min-w-0">{userProfile?.email}</span>
                  </div>
                  <div className="flex items-start gap-3 text-xs sm:text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-foreground flex-1">
                      Joined {new Date(userProfile?.date_joined).toLocaleDateString()}
                    </span>
                  </div>
                  {userProfile?.phone && (
                    <div className="flex items-start gap-3 text-xs sm:text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-foreground flex-1">{userProfile.phone}</span>
                    </div>
                  )}
                  {userProfile?.address && (
                    <div className="flex items-start gap-3 text-xs sm:text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-foreground flex-1 leading-relaxed">{userProfile.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="profile" className="w-full">
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mb-6">
                <TabsList className="inline-flex md:grid w-auto md:w-full grid-cols-5 min-w-max md:min-w-0">
                  <TabsTrigger value="profile" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
                    <User className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Profile</span>
                    <span className="sm:hidden">Profile</span>
                  </TabsTrigger>
                  <TabsTrigger value="account" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
                    <UserCog className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Account</span>
                    <span className="sm:hidden">Account</span>
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
                    <Key className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Security</span>
                    <span className="sm:hidden">Security</span>
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
                    <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Preferences</span>
                    <span className="sm:hidden">Prefs</span>
                  </TabsTrigger>
                  <TabsTrigger value="privacy" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Privacy</span>
                    <span className="sm:hidden">Privacy</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader className="space-y-1 pb-6">
                    <CardTitle className="text-xl">Profile Information</CardTitle>
                    <CardDescription>Update your personal information and bio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="first_name" className="text-sm font-medium">First Name *</Label>
                          <Input
                            id="first_name"
                            value={profileForm.first_name}
                            onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last_name" className="text-sm font-medium">Last Name *</Label>
                          <Input
                            id="last_name"
                            value={profileForm.last_name}
                            onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                        <Input
                          id="address"
                          placeholder="123 Main St, City, State, ZIP"
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="avatar" className="text-sm font-medium">Avatar URL</Label>
                        <Input
                          id="avatar"
                          type="url"
                          placeholder="https://example.com/avatar.jpg"
                          value={profileForm.avatar}
                          onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Paste a URL to your profile picture</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
                        <Textarea
                          id="bio"
                          rows={4}
                          placeholder="Tell us about yourself..."
                          maxLength={500}
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          {profileForm.bio.length}/500 characters
                        </p>
                      </div>

                      <div className="flex justify-center sm:justify-start pt-4">
                        <Button type="submit" className="w-full sm:w-auto">Save Changes</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Account Tab */}
              <TabsContent value="account">
                <Card>
                  <CardHeader className="space-y-1 pb-6">
                    <CardTitle className="text-xl">Account Settings</CardTitle>
                    <CardDescription>Manage your account credentials</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Role Selector */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium">Account Type</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Switch between buyer and builder roles. The page will reload automatically.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          variant={userProfile?.role === 'buyer' ? 'default' : 'outline'}
                          className="w-full flex items-center justify-center gap-2"
                          onClick={async () => {
                            if (userProfile?.role !== 'buyer') {
                              try {
                                setError('');
                                setSuccess('');
                                await authAPI.updateRole('buyer');
                                setSuccess('Switching to Buyer account...');
                                setTimeout(() => {
                                  window.location.href = '/dashboard/buyer';
                                }, 1000);
                              } catch (err) {
                                setError('Failed to switch role');
                              }
                            }
                          }}
                        >
                          <UserCog className="h-4 w-4 flex-shrink-0" />
                          <span>Buyer</span>
                        </Button>
                        <Button
                          variant={userProfile?.role === 'builder' ? 'default' : 'outline'}
                          className="w-full flex items-center justify-center gap-2"
                          onClick={async () => {
                            if (userProfile?.role !== 'builder') {
                              try {
                                setError('');
                                setSuccess('');
                                await authAPI.updateRole('builder');
                                setSuccess('Switching to Builder account...');
                                setTimeout(() => {
                                  window.location.href = '/dashboard/builder';
                                }, 1000);
                              } catch (err) {
                                setError('Failed to switch role');
                              }
                            }
                          }}
                        >
                          <Building2 className="h-4 w-4 flex-shrink-0" />
                          <span>Builder</span>
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <form onSubmit={handleUpdateUsername} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-base font-medium">Username</Label>
                        <Input
                          id="username"
                          value={usernameForm.username}
                          onChange={(e) => setUsernameForm({ username: e.target.value })}
                          required
                          minLength={3}
                        />
                        <p className="text-sm text-muted-foreground">
                          Your username must be unique and at least 3 characters
                        </p>
                      </div>
                      <div className="flex justify-center sm:justify-start pt-2">
                        <Button type="submit" className="w-full sm:w-auto">Update Username</Button>
                      </div>
                    </form>

                    <Separator />

                    <div className="space-y-2">
                      <Label className="text-base font-medium">Email Address</Label>
                      <div className="flex items-center gap-2">
                        <Input value={userProfile?.email} disabled />
                        <Badge variant="outline">Verified</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Contact support to change your email address
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label className="text-base font-medium">Account Status</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant={userProfile?.is_active ? "default" : "destructive"}>
                          {userProfile?.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {userProfile?.is_staff && (
                          <Badge variant="outline" className="border-amber-500 text-amber-700">
                            Administrator
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <Card>
                  <CardHeader className="space-y-1 pb-6">
                    <CardTitle className="text-xl">
                      {userProfile?.has_usable_password ? 'Change Password' : 'Set Your Password'}
                    </CardTitle>
                    <CardDescription>
                      {userProfile?.has_usable_password 
                        ? 'Update your password to keep your account secure'
                        : 'Set a password to secure your account. You signed in with Google, so you can now create a password for direct login.'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userProfile?.has_usable_password ? (
                      // Change Password Form (for users who already have a password)
                      <form onSubmit={handleChangePassword} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="old_password" className="text-sm font-medium">Current Password *</Label>
                          <Input
                            id="old_password"
                            type="password"
                            value={passwordForm.old_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="new_password" className="text-sm font-medium">New Password *</Label>
                          <Input
                            id="new_password"
                            type="password"
                            value={passwordForm.new_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                            required
                            minLength={8}
                          />
                          <p className="text-sm text-muted-foreground">
                            Must be at least 8 characters long
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="new_password_confirm" className="text-sm font-medium">Confirm New Password *</Label>
                          <Input
                            id="new_password_confirm"
                            type="password"
                            value={passwordForm.new_password_confirm}
                            onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirm: e.target.value })}
                            required
                          />
                        </div>

                        <div className="flex justify-center sm:justify-start pt-4">
                          <Button type="submit" className="w-full sm:w-auto">Change Password</Button>
                        </div>
                      </form>
                    ) : (
                      // Set Initial Password Form (for OAuth users without a password)
                      <form onSubmit={handleSetInitialPassword} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="new_password" className="text-sm font-medium">New Password *</Label>
                          <Input
                            id="new_password"
                            type="password"
                            value={passwordForm.new_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                            required
                            minLength={8}
                          />
                          <p className="text-sm text-muted-foreground">
                            Must be at least 8 characters long
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="new_password_confirm" className="text-sm font-medium">Confirm New Password *</Label>
                          <Input
                            id="new_password_confirm"
                            type="password"
                            value={passwordForm.new_password_confirm}
                            onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirm: e.target.value })}
                            required
                          />
                        </div>

                        <div className="flex justify-center sm:justify-start pt-4">
                          <Button type="submit" className="w-full sm:w-auto">Set Password</Button>
                        </div>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences">
                <Card>
                  <CardHeader className="space-y-1 pb-6">
                    <CardTitle className="text-xl">Preferences</CardTitle>
                    <CardDescription>Customize your experience</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdatePreferences} className="space-y-6">
                      <div className="space-y-6">
                        <div className="flex items-start justify-between gap-6">
                          <div className="space-y-1 flex-1">
                            <Label className="text-base font-medium">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive email updates about your account activity
                            </p>
                          </div>
                          <div className="pt-1">
                            <Switch
                              checked={preferencesForm.email_notifications}
                              onCheckedChange={(checked) => 
                                setPreferencesForm({ ...preferencesForm, email_notifications: checked })
                              }
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="flex items-start justify-between gap-6">
                          <div className="space-y-1 flex-1">
                            <Label className="text-base font-medium">Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive push notifications on your devices
                            </p>
                          </div>
                          <div className="pt-1">
                            <Switch
                              checked={preferencesForm.push_notifications}
                              onCheckedChange={(checked) => 
                                setPreferencesForm({ ...preferencesForm, push_notifications: checked })
                              }
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="flex items-start justify-between gap-6">
                          <div className="space-y-1 flex-1">
                            <Label className="text-base font-medium">Marketing Emails</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive emails about new features and promotions
                            </p>
                          </div>
                          <div className="pt-1">
                            <Switch
                              checked={preferencesForm.marketing_emails}
                              onCheckedChange={(checked) => 
                                setPreferencesForm({ ...preferencesForm, marketing_emails: checked })
                              }
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label htmlFor="theme_preference" className="text-base font-medium">Theme Preference</Label>
                          <select
                            id="theme_preference"
                            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                            value={preferencesForm.theme_preference}
                            onChange={(e) => setPreferencesForm({ ...preferencesForm, theme_preference: e.target.value as 'light' | 'dark' })}
                          >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="language" className="text-base font-medium">Language</Label>
                          <select
                            id="language"
                            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                            value={preferencesForm.language}
                            onChange={(e) => setPreferencesForm({ ...preferencesForm, language: e.target.value })}
                          >
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="timezone" className="text-base font-medium">Timezone</Label>
                          <Input
                            id="timezone"
                            value={preferencesForm.timezone}
                            onChange={(e) => setPreferencesForm({ ...preferencesForm, timezone: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex justify-center sm:justify-start pt-4">
                        <Button type="submit" className="w-full sm:w-auto">Save Preferences</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Privacy Tab */}
              <TabsContent value="privacy">
                <Card>
                  <CardHeader className="space-y-1 pb-6">
                    <CardTitle className="text-xl">Privacy & Security</CardTitle>
                    <CardDescription>Manage your privacy and security preferences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdatePrivacy} className="space-y-6">
                      <div className="space-y-6">
                        <div className="flex items-start justify-between gap-6">
                          <div className="space-y-1 flex-1">
                            <Label className="text-base font-medium">Profile Visibility</Label>
                            <p className="text-sm text-muted-foreground">
                              Make your profile visible to other users
                            </p>
                          </div>
                          <div className="pt-1">
                            <Switch
                              checked={privacyForm.profile_visibility}
                              onCheckedChange={(checked) => 
                                setPrivacyForm({ ...privacyForm, profile_visibility: checked })
                              }
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="flex items-start justify-between gap-6">
                          <div className="space-y-1 flex-1">
                            <Label className="text-base font-medium">Activity Status</Label>
                            <p className="text-sm text-muted-foreground">
                              Show when you're active on the platform
                            </p>
                          </div>
                          <div className="pt-1">
                            <Switch
                              checked={privacyForm.show_activity_status}
                              onCheckedChange={(checked) => 
                                setPrivacyForm({ ...privacyForm, show_activity_status: checked })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center sm:justify-start pt-4">
                        <Button type="submit" className="w-full sm:w-auto">Save Privacy Settings</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;