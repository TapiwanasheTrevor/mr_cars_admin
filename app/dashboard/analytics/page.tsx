"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  Eye,
  MousePointerClick,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

interface PlatformAnalytics {
  id: string;
  date: string;
  total_views: number;
  total_unique_visitors: number;
  total_listings_viewed: number;
  total_searches: number;
  total_inquiries: number;
  total_new_users: number;
  total_new_listings: number;
  metadata: any;
  created_at: string;
}

interface SectionAnalytics {
  id: string;
  section_name: string;
  date: string;
  views: number;
  unique_visitors: number;
  time_spent_avg: number;
  bounce_rate: number | null;
  conversion_rate: number | null;
  created_at: string;
}

interface ItemAnalytics {
  id: string;
  item_type: string;
  item_id: string;
  date: string;
  views: number;
  unique_visitors: number;
  inquiries: number;
  favorites: number;
  shares: number;
  created_at: string;
}

interface TopItem {
  item_id: string;
  item_type: string;
  total_views: number;
  total_inquiries: number;
  total_shares: number;
}

export default function AnalyticsPage() {
  const [platformData, setPlatformData] = useState<PlatformAnalytics[]>([]);
  const [sectionData, setSectionData] = useState<SectionAnalytics[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7"); // days
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const daysAgo = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Fetch platform analytics
      const { data: platformAnalytics, error: platformError } = await supabase
        .from('platform_analytics')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (platformError) throw platformError;
      setPlatformData(platformAnalytics || []);

      // Fetch section analytics
      const { data: sectionAnalytics, error: sectionError } = await supabase
        .from('section_analytics')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (sectionError) throw sectionError;
      setSectionData(sectionAnalytics || []);

      // Fetch top items
      const { data: itemAnalytics, error: itemError } = await supabase
        .from('item_analytics')
        .select('item_id, item_type, views, inquiries, shares')
        .gte('date', startDate.toISOString().split('T')[0]);

      if (itemError) throw itemError;

      // Aggregate top items
      const itemMap = new Map<string, TopItem>();
      itemAnalytics?.forEach(item => {
        const key = `${item.item_type}-${item.item_id}`;
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            item_id: item.item_id,
            item_type: item.item_type,
            total_views: 0,
            total_inquiries: 0,
            total_shares: 0,
          });
        }
        const current = itemMap.get(key)!;
        current.total_views += item.views;
        current.total_inquiries += item.inquiries;
        current.total_shares += item.shares;
      });

      const topItemsArray = Array.from(itemMap.values())
        .sort((a, b) => b.total_views - a.total_views)
        .slice(0, 10);

      setTopItems(topItemsArray);

    } catch (error: any) {
      toast({
        title: "Error fetching analytics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  // Calculate summary stats
  const stats = {
    totalViews: platformData.reduce((sum, d) => sum + d.total_views, 0),
    totalVisitors: platformData.reduce((sum, d) => sum + d.total_unique_visitors, 0),
    totalInquiries: platformData.reduce((sum, d) => sum + d.total_inquiries, 0),
    totalNewUsers: platformData.reduce((sum, d) => sum + d.total_new_users, 0),
    avgViewsPerDay: platformData.length > 0
      ? Math.round(platformData.reduce((sum, d) => sum + d.total_views, 0) / platformData.length)
      : 0,
  };

  // Growth calculation (comparing last period to previous)
  const getGrowth = (data: number[]) => {
    if (data.length < 2) return 0;
    const current = data[data.length - 1];
    const previous = data[data.length - 2];
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const viewsGrowth = getGrowth(platformData.map(d => d.total_views));

  // Prepare chart data
  const platformChartData = platformData.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views: d.total_views,
    visitors: d.total_unique_visitors,
    inquiries: d.total_inquiries,
  }));

  // Section breakdown for pie chart
  const sectionBreakdown = sectionData.reduce((acc: Record<string, number>, curr) => {
    acc[curr.section_name] = (acc[curr.section_name] || 0) + curr.views;
    return {};
  }, {});

  const sectionPieData = Object.entries(sectionBreakdown).map(([name, views]) => ({
    name: name.replace('_', ' ').toUpperCase(),
    value: views,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const exportData = () => {
    const csvData = [
      ['Date', 'Total Views', 'Unique Visitors', 'Inquiries', 'New Users'],
      ...platformData.map(d => [
        d.date,
        d.total_views,
        d.total_unique_visitors,
        d.total_inquiries,
        d.total_new_users,
      ]),
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: "Analytics data has been exported",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track platform performance and user engagement
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchAnalytics} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {viewsGrowth >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={viewsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(viewsGrowth).toFixed(1)}%
              </span>
              <span className="ml-1">from previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Unique users tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInquiries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">User engagement actions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNewUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registered in period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Views</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgViewsPerDay.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Average per day</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="top-items">Top Items</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Traffic Trend</CardTitle>
              <CardDescription>
                Views, unique visitors, and inquiries over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={platformChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="Views"
                  />
                  <Line
                    type="monotone"
                    dataKey="visitors"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="Unique Visitors"
                  />
                  <Line
                    type="monotone"
                    dataKey="inquiries"
                    stroke="#ffc658"
                    strokeWidth={2}
                    name="Inquiries"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={platformChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="visitors" fill="#8884d8" name="New Users" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Section Distribution</CardTitle>
                <CardDescription>Traffic by platform section</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={sectionPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sectionPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sections Tab */}
        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <CardTitle>Section Performance</CardTitle>
              <CardDescription>
                Detailed metrics for each platform section
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead>Total Views</TableHead>
                    <TableHead>Unique Visitors</TableHead>
                    <TableHead>Avg Time (sec)</TableHead>
                    <TableHead>Bounce Rate</TableHead>
                    <TableHead>Conversion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(
                    sectionData.reduce((acc: Record<string, SectionAnalytics[]>, curr) => {
                      if (!acc[curr.section_name]) acc[curr.section_name] = [];
                      acc[curr.section_name].push(curr);
                      return acc;
                    }, {})
                  ).map(([sectionName, data]) => {
                    const totalViews = data.reduce((sum, d) => sum + d.views, 0);
                    const totalVisitors = data.reduce((sum, d) => sum + d.unique_visitors, 0);
                    const avgTime = Math.round(
                      data.reduce((sum, d) => sum + d.time_spent_avg, 0) / data.length
                    );
                    const bounceRate = data.reduce((sum, d) => sum + (d.bounce_rate || 0), 0) / data.length;
                    const conversionRate = data.reduce((sum, d) => sum + (d.conversion_rate || 0), 0) / data.length;

                    return (
                      <TableRow key={sectionName}>
                        <TableCell className="font-medium">
                          {sectionName.replace('_', ' ').toUpperCase()}
                        </TableCell>
                        <TableCell>{totalViews.toLocaleString()}</TableCell>
                        <TableCell>{totalVisitors.toLocaleString()}</TableCell>
                        <TableCell>{avgTime}s</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {bounceRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            {conversionRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Items Tab */}
        <TabsContent value="top-items">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Items</CardTitle>
              <CardDescription>
                Most viewed listings, products, and content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Item Type</TableHead>
                    <TableHead>Item ID</TableHead>
                    <TableHead>Total Views</TableHead>
                    <TableHead>Inquiries</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Engagement Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topItems.map((item, index) => {
                    const engagementRate = item.total_views > 0
                      ? ((item.total_inquiries + item.total_shares) / item.total_views) * 100
                      : 0;

                    return (
                      <TableRow key={`${item.item_type}-${item.item_id}`}>
                        <TableCell className="font-medium">#{index + 1}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.item_type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {item.item_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>{item.total_views.toLocaleString()}</TableCell>
                        <TableCell>{item.total_inquiries.toLocaleString()}</TableCell>
                        <TableCell>{item.total_shares.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              engagementRate > 10
                                ? 'bg-green-100 text-green-800'
                                : engagementRate > 5
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {engagementRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
