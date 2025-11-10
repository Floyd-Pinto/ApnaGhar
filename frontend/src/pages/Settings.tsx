import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, Moon, Sun, Bell, Shield, Globe, Palette } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false,
  });
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('UTC');

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link to="/profile">
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Profile</span>
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your account preferences and application settings
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Appearance Settings */}
          <Card>
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Palette className="h-5 w-5" />
                <span>Appearance</span>
              </CardTitle>
              <CardDescription>
                Customize how the application looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-1 flex-1">
                  <Label className="text-base font-medium">Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose between light and dark mode
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Sun className="h-4 w-4" />
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                  />
                  <Moon className="h-4 w-4" />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-1 flex-1">
                  <Label className="text-base font-medium">Theme Preference</Label>
                  <p className="text-sm text-muted-foreground">
                    Set your preferred theme mode
                  </p>
                </div>
                <div className="pt-1">
                  <Select value={theme} onValueChange={(value: 'light' | 'dark') => setTheme(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-1 flex-1">
                  <Label className="text-base font-medium">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <div className="pt-1">
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={() => handleNotificationChange('email')}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-1 flex-1">
                  <Label className="text-base font-medium">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications in your browser
                  </p>
                </div>
                <div className="pt-1">
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={() => handleNotificationChange('push')}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-1 flex-1">
                  <Label className="text-base font-medium">Marketing Communications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about new features and promotions
                  </p>
                </div>
                <div className="pt-1">
                  <Switch
                    checked={notifications.marketing}
                    onCheckedChange={() => handleNotificationChange('marketing')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Localization Settings */}
          <Card>
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Globe className="h-5 w-5" />
                <span>Localization</span>
              </CardTitle>
              <CardDescription>
                Set your language and regional preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-1 flex-1">
                  <Label className="text-base font-medium">Language</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred language
                  </p>
                </div>
                <div className="pt-1">
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="hi">हिंदी</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-1 flex-1">
                  <Label className="text-base font-medium">Timezone</Label>
                  <p className="text-sm text-muted-foreground">
                    Set your local timezone
                  </p>
                </div>
                <div className="pt-1">
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Asia/Kolkata">India Standard Time</SelectItem>
                      <SelectItem value="Europe/London">Greenwich Mean Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shield className="h-5 w-5" />
                <span>Privacy & Security</span>
              </CardTitle>
              <CardDescription>
                Manage your privacy and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-1 flex-1">
                  <Label className="text-base font-medium">Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    Make your profile visible to other users
                  </p>
                </div>
                <div className="pt-1">
                  <Switch defaultChecked />
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
                  <Switch defaultChecked />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Account Actions</Label>
                  <p className="text-sm text-muted-foreground">
                    Manage your account settings
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" className="w-full sm:w-auto">Change Password</Button>
                  <Button variant="outline" className="w-full sm:w-auto">Download Data</Button>
                  <Button variant="destructive" className="w-full sm:w-auto">Delete Account</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;