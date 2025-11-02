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
import { User, Settings, Edit3, Mail, Calendar, MapPin, Phone, Key, UserCog, Bell, Shield, Eye } from 'lucide-react';

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
      console.log('Profile data:', profile);
      console.log('has_usable_password:', profile.has_usable_password);
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
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your account information and preferences
              </p>
            </div>
            <Link to="/settings">
              <Button variant="outline" className="flex items-center space-x-2">
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center pb-4">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage src={userProfile?.avatar} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {userProfile?.first_name?.[0]}{userProfile?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">
                  {userProfile?.first_name} {userProfile?.last_name}
                </CardTitle>
                <CardDescription className="text-sm">@{userProfile?.username}</CardDescription>
                <div className="flex justify-center gap-2 mt-3">
                  <Badge variant={userProfile?.role === 'builder' ? 'default' : 'secondary'}>
                    {userProfile?.role}
                  </Badge>
                  {userProfile?.is_staff && (
                    <Badge variant="outline" className="border-amber-500 text-amber-700">
                      Admin
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground truncate">{userProfile?.email}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground">
                      Joined {new Date(userProfile?.date_joined).toLocaleDateString()}
                    </span>
                  </div>
                  {userProfile?.phone && (
                    <div className="flex items-center space-x-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground">{userProfile.phone}</span>
                    </div>
                  )}
                  {userProfile?.address && (
                    <div className="flex items-start space-x-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{userProfile.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
                <TabsTrigger value="account" className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  <span className="hidden sm:inline">Account</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <span className="hidden sm:inline">Security</span>
                </TabsTrigger>
                <TabsTrigger value="preferences" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Preferences</span>
                </TabsTrigger>
                <TabsTrigger value="privacy" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Privacy</span>
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal information and bio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="first_name">First Name *</Label>
                          <Input
                            id="first_name"
                            value={profileForm.first_name}
                            onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last_name">Last Name *</Label>
                          <Input
                            id="last_name"
                            value={profileForm.last_name}
                            onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          placeholder="123 Main St, City, State, ZIP"
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="avatar">Avatar URL</Label>
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
                        <Label htmlFor="bio">Bio</Label>
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

                      <Button type="submit">Save Changes</Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Account Tab */}
              <TabsContent value="account">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your account credentials</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <form onSubmit={handleUpdateUsername} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={usernameForm.username}
                          onChange={(e) => setUsernameForm({ username: e.target.value })}
                          required
                          minLength={3}
                        />
                        <p className="text-xs text-muted-foreground">
                          Your username must be unique and at least 3 characters
                        </p>
                      </div>
                      <Button type="submit">Update Username</Button>
                    </form>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <div className="flex items-center gap-2">
                        <Input value={userProfile?.email} disabled />
                        <Badge variant="outline">Verified</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Contact support to change your email address
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Account Status</Label>
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
                  <CardHeader>
                    <CardTitle>
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
                    {/* Debug info - remove later */}
                    <div className="mb-4 p-2 bg-gray-100 text-xs">
                      Debug: has_usable_password = {String(userProfile?.has_usable_password)}
                    </div>
                    {userProfile?.has_usable_password ? (
                      // Change Password Form (for users who already have a password)
                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="old_password">Current Password *</Label>
                          <Input
                            id="old_password"
                            type="password"
                            value={passwordForm.old_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="new_password">New Password *</Label>
                          <Input
                            id="new_password"
                            type="password"
                            value={passwordForm.new_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                            required
                            minLength={8}
                          />
                          <p className="text-xs text-muted-foreground">
                            Must be at least 8 characters long
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="new_password_confirm">Confirm New Password *</Label>
                          <Input
                            id="new_password_confirm"
                            type="password"
                            value={passwordForm.new_password_confirm}
                            onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirm: e.target.value })}
                            required
                          />
                        </div>

                        <Button type="submit">Change Password</Button>
                      </form>
                    ) : (
                      // Set Initial Password Form (for OAuth users without a password)
                      <form onSubmit={handleSetInitialPassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="new_password">New Password *</Label>
                          <Input
                            id="new_password"
                            type="password"
                            value={passwordForm.new_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                            required
                            minLength={8}
                          />
                          <p className="text-xs text-muted-foreground">
                            Must be at least 8 characters long
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="new_password_confirm">Confirm New Password *</Label>
                          <Input
                            id="new_password_confirm"
                            type="password"
                            value={passwordForm.new_password_confirm}
                            onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirm: e.target.value })}
                            required
                          />
                        </div>

                        <Button type="submit">Set Password</Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences">
                <Card>
                  <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>Customize your experience</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdatePreferences} className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive email updates about your account activity
                            </p>
                          </div>
                          <Switch
                            checked={preferencesForm.email_notifications}
                            onCheckedChange={(checked) => 
                              setPreferencesForm({ ...preferencesForm, email_notifications: checked })
                            }
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive push notifications on your devices
                            </p>
                          </div>
                          <Switch
                            checked={preferencesForm.push_notifications}
                            onCheckedChange={(checked) => 
                              setPreferencesForm({ ...preferencesForm, push_notifications: checked })
                            }
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Marketing Emails</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive emails about new features and promotions
                            </p>
                          </div>
                          <Switch
                            checked={preferencesForm.marketing_emails}
                            onCheckedChange={(checked) => 
                              setPreferencesForm({ ...preferencesForm, marketing_emails: checked })
                            }
                          />
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label htmlFor="theme_preference">Theme Preference</Label>
                          <select
                            id="theme_preference"
                            className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            value={preferencesForm.theme_preference}
                            onChange={(e) => setPreferencesForm({ ...preferencesForm, theme_preference: e.target.value as 'light' | 'dark' })}
                          >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="language">Language</Label>
                          <select
                            id="language"
                            className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
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
                          <Label htmlFor="timezone">Timezone</Label>
                          <Input
                            id="timezone"
                            value={preferencesForm.timezone}
                            onChange={(e) => setPreferencesForm({ ...preferencesForm, timezone: e.target.value })}
                          />
                        </div>
                      </div>

                      <Button type="submit">Save Preferences</Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Privacy Tab */}
              <TabsContent value="privacy">
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                    <CardDescription>Control who can see your information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdatePrivacy} className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Profile Visibility</Label>
                            <p className="text-sm text-muted-foreground">
                              Make your profile visible to other users
                            </p>
                          </div>
                          <Switch
                            checked={privacyForm.profile_visibility}
                            onCheckedChange={(checked) => 
                              setPrivacyForm({ ...privacyForm, profile_visibility: checked })
                            }
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Show Activity Status</Label>
                            <p className="text-sm text-muted-foreground">
                              Let others see when you're online
                            </p>
                          </div>
                          <Switch
                            checked={privacyForm.show_activity_status}
                            onCheckedChange={(checked) => 
                              setPrivacyForm({ ...privacyForm, show_activity_status: checked })
                            }
                          />
                        </div>
                      </div>

                      <Button type="submit">Save Privacy Settings</Button>
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