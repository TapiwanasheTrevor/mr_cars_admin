"use client";

import { useState, useEffect } from "react";
import { Save, Shield, Bell, Database, Users, Car, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

interface AdminSettings {
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  maxListingsPerUser: number;
  enableUserRegistration: boolean;
  enableCarListings: boolean;
  enableRentalListings: boolean;
  enableEmergencyServices: boolean;
  enableForum: boolean;
  autoApproveListings: boolean;
  enableEmailNotifications: boolean;
  enablePushNotifications: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>({
    siteName: "Mr Cars Admin",
    siteDescription: "Comprehensive automotive marketplace administration",
    supportEmail: "admin@mrcars.com",
    maxListingsPerUser: 10,
    enableUserRegistration: true,
    enableCarListings: true,
    enableRentalListings: true,
    enableEmergencyServices: true,
    enableForum: true,
    autoApproveListings: false,
    enableEmailNotifications: true,
    enablePushNotifications: true,
    maintenanceMode: false,
    maintenanceMessage: "We're currently performing scheduled maintenance. Please check back shortly.",
  });

  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const { toast } = useToast();

  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    totalOrders: 0,
    systemUptime: "99.9%",
    databaseSize: "245 MB",
    activeConnections: 12,
  });

  useEffect(() => {
    loadSettings();
    loadSystemStats();
    
    // Refresh system stats every 30 seconds
    const interval = setInterval(loadSystemStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSettings = async () => {
    try {
      // Load settings from database
      const { data: settingsData, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value, setting_type');

      if (error) {
        console.error("Error loading settings:", error);
        // Keep default settings if there's an error
        return;
      }

      if (settingsData && settingsData.length > 0) {
        const settingsMap: Record<string, any> = {};
        
        settingsData.forEach((setting: any) => {
          const key = setting.setting_key;
          let value = setting.setting_value;
          
          // setting_value is already parsed as JSONB, so we don't need to JSON.parse it
          settingsMap[key] = value;
        });

        // Update settings state with database values
        setSettings(prev => ({
          ...prev,
          siteName: settingsMap.site_name || prev.siteName,
          siteDescription: settingsMap.site_description || prev.siteDescription,
          supportEmail: settingsMap.support_email || prev.supportEmail,
          maxListingsPerUser: settingsMap.max_listings_per_user || prev.maxListingsPerUser,
          enableUserRegistration: settingsMap.enable_user_registration ?? prev.enableUserRegistration,
          enableCarListings: settingsMap.enable_car_listings ?? prev.enableCarListings,
          enableRentalListings: settingsMap.enable_rental_listings ?? prev.enableRentalListings,
          enableEmergencyServices: settingsMap.enable_emergency_services ?? prev.enableEmergencyServices,
          enableForum: settingsMap.enable_forum ?? prev.enableForum,
          autoApproveListings: settingsMap.auto_approve_listings ?? prev.autoApproveListings,
          enableEmailNotifications: settingsMap.enable_email_notifications ?? prev.enableEmailNotifications,
          enablePushNotifications: settingsMap.enable_push_notifications ?? prev.enablePushNotifications,
          maintenanceMode: settingsMap.maintenance_mode ?? prev.maintenanceMode,
          maintenanceMessage: settingsMap.maintenance_message || prev.maintenanceMessage,
        }));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    }
  };

  const loadSystemStats = async () => {
    try {
      // Load real stats from database with graceful fallback
      let usersCount = 0;
      let carsCount = 0;
      let ordersCount = 0;

      // Try to get users count
      try {
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        usersCount = count || 0;
      } catch (error) {
        console.warn('Failed to load users count:', error);
      }

      // Try to get cars count
      try {
        const { count } = await supabase
          .from('cars')
          .select('*', { count: 'exact', head: true });
        carsCount = count || 0;
      } catch (error) {
        console.warn('Failed to load cars count:', error);
      }

      // Try to get orders count with fallback
      try {
        const { count, error } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.warn('Orders table access error:', error.message);
          // Set a placeholder value or leave as 0
          ordersCount = 0;
        } else {
          ordersCount = count || 0;
        }
      } catch (error) {
        console.warn('Failed to load orders count:', error);
        ordersCount = 0;
      }

      setSystemStats({
        totalUsers: usersCount,
        totalListings: carsCount,
        totalOrders: ordersCount,
        systemUptime: "99.9%", // This would come from monitoring service
        databaseSize: "245 MB", // This would come from database metrics
        activeConnections: 12, // This would come from connection pool metrics
      });
    } catch (error) {
      console.error("Error loading system stats:", error);
      // Set fallback values on complete failure
      setSystemStats({
        totalUsers: 0,
        totalListings: 0,
        totalOrders: 0,
        systemUptime: "99.9%",
        databaseSize: "245 MB",
        activeConnections: 12,
      });
    }
  };

  const saveSettings = async () => {
    if (!validateSettings()) {
      return;
    }

    try {
      setLoading(true);
      
      // Prepare settings for database update - values will be stored as JSONB
      const settingsToUpdate = [
        { setting_key: 'site_name', setting_value: settings.siteName, setting_type: 'string' },
        { setting_key: 'site_description', setting_value: settings.siteDescription, setting_type: 'string' },
        { setting_key: 'support_email', setting_value: settings.supportEmail, setting_type: 'string' },
        { setting_key: 'max_listings_per_user', setting_value: settings.maxListingsPerUser, setting_type: 'number' },
        { setting_key: 'enable_user_registration', setting_value: settings.enableUserRegistration, setting_type: 'boolean' },
        { setting_key: 'enable_car_listings', setting_value: settings.enableCarListings, setting_type: 'boolean' },
        { setting_key: 'enable_rental_listings', setting_value: settings.enableRentalListings, setting_type: 'boolean' },
        { setting_key: 'enable_emergency_services', setting_value: settings.enableEmergencyServices, setting_type: 'boolean' },
        { setting_key: 'enable_forum', setting_value: settings.enableForum, setting_type: 'boolean' },
        { setting_key: 'auto_approve_listings', setting_value: settings.autoApproveListings, setting_type: 'boolean' },
        { setting_key: 'enable_email_notifications', setting_value: settings.enableEmailNotifications, setting_type: 'boolean' },
        { setting_key: 'enable_push_notifications', setting_value: settings.enablePushNotifications, setting_type: 'boolean' },
        { setting_key: 'maintenance_mode', setting_value: settings.maintenanceMode, setting_type: 'boolean' },
        { setting_key: 'maintenance_message', setting_value: settings.maintenanceMessage, setting_type: 'string' },
      ];

      // Update each setting in the database
      for (const setting of settingsToUpdate) {
        const { error } = await supabase
          .from('admin_settings')
          .upsert({
            setting_key: setting.setting_key,
            setting_value: setting.setting_value,
            setting_type: setting.setting_type,
          }, {
            onConflict: 'setting_key'
          });

        if (error) {
          console.error(`Error updating setting ${setting.setting_key}:`, error);
          throw error;
        }
      }
      
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof AdminSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const exportData = async () => {
    try {
      setLoading(true);
      
      // Get all data from various tables
      const promises = [
        supabase.from('users').select('*'),
        supabase.from('cars').select('*'),
        supabase.from('rental_listings').select('*'),
        supabase.from('admin_settings').select('*'),
      ];

      const results = await Promise.allSettled(promises);
      const exportData = {
        users: results[0].status === 'fulfilled' ? results[0].value.data : [],
        cars: results[1].status === 'fulfilled' ? results[1].value.data : [],
        rentals: results[2].status === 'fulfilled' ? results[2].value.data : [],
        settings: results[3].status === 'fulfilled' ? results[3].value.data : [],
        exportedAt: new Date().toISOString(),
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mr-cars-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Data has been exported and downloaded",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      setLoading(true);
      
      // Clear browser caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage  
      sessionStorage.clear();
      
      toast({
        title: "Success", 
        description: "System cache cleared successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cache",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateSettings = (): boolean => {
    if (!settings.siteName.trim()) {
      toast({
        title: "Validation Error",
        description: "Site name is required",
        variant: "destructive",
      });
      return false;
    }

    if (!settings.supportEmail.trim() || !settings.supportEmail.includes('@')) {
      toast({
        title: "Validation Error", 
        description: "Valid support email is required",
        variant: "destructive",
      });
      return false;
    }

    if (settings.maxListingsPerUser < 1 || settings.maxListingsPerUser > 100) {
      toast({
        title: "Validation Error",
        description: "Max listings per user must be between 1 and 100",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your application settings and configuration
          </p>
        </div>
        <Button onClick={saveSettings} disabled={loading} className="gap-2">
          <Save className="h-4 w-4" />
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Site Configuration</CardTitle>
              <CardDescription>
                Basic information about your Mr Cars platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => handleSettingChange('siteName', e.target.value)}
                    placeholder="Mr Cars Admin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
                    placeholder="admin@mrcars.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                  placeholder="Describe your automotive marketplace"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxListings">Max Listings Per User</Label>
                <Input
                  id="maxListings"
                  type="number"
                  value={settings.maxListingsPerUser}
                  onChange={(e) => handleSettingChange('maxListingsPerUser', parseInt(e.target.value))}
                  min="1"
                  max="100"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance Mode</CardTitle>
              <CardDescription>
                Enable maintenance mode to temporarily disable the site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
                />
                <Label htmlFor="maintenanceMode">Enable Maintenance Mode</Label>
                {settings.maintenanceMode && (
                  <Badge variant="destructive">ACTIVE</Badge>
                )}
              </div>
              
              {settings.maintenanceMode && (
                <div className="space-y-2">
                  <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                  <Textarea
                    id="maintenanceMessage"
                    value={settings.maintenanceMessage}
                    onChange={(e) => handleSettingChange('maintenanceMessage', e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Settings */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Platform Features
              </CardTitle>
              <CardDescription>
                Enable or disable specific features of your platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableUserRegistration">User Registration</Label>
                    <p className="text-sm text-muted-foreground">Allow new users to register</p>
                  </div>
                  <Switch
                    id="enableUserRegistration"
                    checked={settings.enableUserRegistration}
                    onCheckedChange={(checked) => handleSettingChange('enableUserRegistration', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableCarListings">Car Listings</Label>
                    <p className="text-sm text-muted-foreground">Allow car sale listings</p>
                  </div>
                  <Switch
                    id="enableCarListings"
                    checked={settings.enableCarListings}
                    onCheckedChange={(checked) => handleSettingChange('enableCarListings', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableRentalListings">Rental Listings</Label>
                    <p className="text-sm text-muted-foreground">Allow car rental listings</p>
                  </div>
                  <Switch
                    id="enableRentalListings"
                    checked={settings.enableRentalListings}
                    onCheckedChange={(checked) => handleSettingChange('enableRentalListings', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableEmergencyServices">Emergency Services</Label>
                    <p className="text-sm text-muted-foreground">Enable emergency assistance</p>
                  </div>
                  <Switch
                    id="enableEmergencyServices"
                    checked={settings.enableEmergencyServices}
                    onCheckedChange={(checked) => handleSettingChange('enableEmergencyServices', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableForum">Community Forum</Label>
                    <p className="text-sm text-muted-foreground">Enable forum discussions</p>
                  </div>
                  <Switch
                    id="enableForum"
                    checked={settings.enableForum}
                    onCheckedChange={(checked) => handleSettingChange('enableForum', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoApproveListings">Auto-approve Listings</Label>
                    <p className="text-sm text-muted-foreground">Automatically approve new listings</p>
                  </div>
                  <Switch
                    id="autoApproveListings"
                    checked={settings.autoApproveListings}
                    onCheckedChange={(checked) => handleSettingChange('autoApproveListings', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how and when notifications are sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableEmailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send notifications via email</p>
                  </div>
                  <Switch
                    id="enableEmailNotifications"
                    checked={settings.enableEmailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('enableEmailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enablePushNotifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send push notifications to mobile apps</p>
                  </div>
                  <Switch
                    id="enablePushNotifications"
                    checked={settings.enablePushNotifications}
                    onCheckedChange={(checked) => handleSettingChange('enablePushNotifications', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Configuration
              </CardTitle>
              <CardDescription>
                Manage security settings and API access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Supabase API Key</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      readOnly
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your Supabase anonymous key for API access
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Admin Access Level</Label>
                  <Select defaultValue="full">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Access</SelectItem>
                      <SelectItem value="limited">Limited Access</SelectItem>
                      <SelectItem value="readonly">Read Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Information
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSystemStats}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                Monitor system health and performance (Auto-refreshes every 30s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Total Users</p>
                  <p className="text-2xl font-bold">{systemStats.totalUsers.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Total Listings</p>
                  <p className="text-2xl font-bold">{systemStats.totalListings.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Total Orders</p>
                  <p className="text-2xl font-bold">{systemStats.totalOrders.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">System Uptime</p>
                  <p className="text-2xl font-bold text-green-600">{systemStats.systemUptime}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Database Size</p>
                  <p className="text-2xl font-bold">{systemStats.databaseSize}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Active Connections</p>
                  <p className="text-2xl font-bold">{systemStats.activeConnections}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Operations</CardTitle>
              <CardDescription>
                Perform system maintenance operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={exportData} variant="outline">
                  Export Data
                </Button>
                <Button onClick={clearCache} variant="outline" disabled={loading}>
                  Clear Cache
                </Button>
                <Button onClick={exportData} variant="outline" disabled={loading}>
                  Backup Database
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}