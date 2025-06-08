"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Car, 
  ShoppingCart, 
  CreditCard, 
  MessageSquare, 
  Calendar 
} from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { OverviewChart, ListingStatusChart } from "@/components/dashboard/overview-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalUsers: number;
  activeListings: number;
  totalInquiries: number;
  totalOrders: number;
  pendingInquiries: number;
  thisMonthUsers: number;
  thisMonthListings: number;
  thisMonthOrders: number;
}

interface ChartData {
  month: string;
  users: number;
  listings: number;
  orders: number;
  revenue: number;
}

interface RecentActivity {
  id: string;
  user_name: string;
  user_email: string;
  action: string;
  target: string;
  created_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeListings: 0,
    totalInquiries: 0,
    totalOrders: 0,
    pendingInquiries: 0,
    thisMonthUsers: 0,
    thisMonthListings: 0,
    thisMonthOrders: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);

      // Get current date for this month comparisons
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Fetch comprehensive stats in parallel
      const [
        totalUsersResult,
        activeListingsResult,
        totalInquiriesResult,
        pendingInquiriesResult,
        totalOrdersResult,
        thisMonthUsersResult,
        thisMonthListingsResult,
        thisMonthOrdersResult,
      ] = await Promise.allSettled([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('inquiries').select('*', { count: 'exact', head: true }),
        supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth),
        supabase.from('cars').select('*', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth),
        supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth),
      ]);

      const getCount = (result: any) => 
        result.status === 'fulfilled' ? result.value.count || 0 : 0;

      setStats({
        totalUsers: getCount(totalUsersResult),
        activeListings: getCount(activeListingsResult),
        totalInquiries: getCount(totalInquiriesResult),
        totalOrders: getCount(totalOrdersResult),
        pendingInquiries: getCount(pendingInquiriesResult),
        thisMonthUsers: getCount(thisMonthUsersResult),
        thisMonthListings: getCount(thisMonthListingsResult),
        thisMonthOrders: getCount(thisMonthOrdersResult),
      });

      // Fetch chart data for the last 12 months
      await fetchChartData();
      
      // Fetch recent activities
      await fetchRecentActivities();

    } catch (error: any) {
      toast({
        title: "Error fetching dashboard data",
        description: error.message || "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        
        // Get counts for this month
        const [usersResult, listingsResult, ordersResult] = await Promise.allSettled([
          supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', firstDay.toISOString())
            .lte('created_at', lastDay.toISOString()),
          supabase
            .from('cars')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', firstDay.toISOString())
            .lte('created_at', lastDay.toISOString()),
          supabase
            .from('orders')
            .select('total_amount', { count: 'exact' })
            .gte('created_at', firstDay.toISOString())
            .lte('created_at', lastDay.toISOString()),
        ]);

        months.push({
          month: monthName,
          users: usersResult.status === 'fulfilled' ? usersResult.value.count || 0 : 0,
          listings: listingsResult.status === 'fulfilled' ? listingsResult.value.count || 0 : 0,
          orders: ordersResult.status === 'fulfilled' ? ordersResult.value.count || 0 : 0,
          revenue: ordersResult.status === 'fulfilled' && ordersResult.value.data 
            ? ordersResult.value.data.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0)
            : 0,
        });
      }
      
      setChartData(months);
    } catch (error) {
      console.warn('Failed to fetch chart data:', error);
      // Set default chart data if fetch fails
      setChartData([]);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      // Get recent activities from multiple sources
      const [usersData, carsData, inquiriesData, ordersData] = await Promise.allSettled([
        supabase
          .from('users')
          .select('id, username, email, created_at')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('cars')
          .select('id, make, model, seller_id, created_at, users!inner(username, email)')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('inquiries')
          .select('id, created_at, users!inner(username, email)')
          .order('created_at', { ascending: false })
          .limit(2),
        supabase
          .from('orders')
          .select('id, total_amount, created_at, users!inner(username, email)')
          .order('created_at', { ascending: false })
          .limit(2),
      ]);

      const activities: RecentActivity[] = [];

      // Add new user registrations
      if (usersData.status === 'fulfilled' && usersData.value.data) {
        usersData.value.data.forEach((user: any) => {
          activities.push({
            id: `user_${user.id}`,
            user_name: user.username || 'New User',
            user_email: user.email || '',
            action: 'registered as a new user',
            target: '',
            created_at: user.created_at,
          });
        });
      }

      // Add new car listings
      if (carsData.status === 'fulfilled' && carsData.value.data) {
        carsData.value.data.forEach((car: any) => {
          activities.push({
            id: `car_${car.id}`,
            user_name: car.users?.username || 'Unknown User',
            user_email: car.users?.email || '',
            action: 'created a new listing',
            target: `${car.make} ${car.model}`,
            created_at: car.created_at,
          });
        });
      }

      // Add new inquiries
      if (inquiriesData.status === 'fulfilled' && inquiriesData.value.data) {
        inquiriesData.value.data.forEach((inquiry: any) => {
          activities.push({
            id: `inquiry_${inquiry.id}`,
            user_name: inquiry.users?.username || 'Unknown User',
            user_email: inquiry.users?.email || '',
            action: 'submitted an inquiry',
            target: '',
            created_at: inquiry.created_at,
          });
        });
      }

      // Add new orders
      if (ordersData.status === 'fulfilled' && ordersData.value.data) {
        ordersData.value.data.forEach((order: any) => {
          activities.push({
            id: `order_${order.id}`,
            user_name: order.users?.username || 'Unknown User',
            user_email: order.users?.email || '',
            action: 'placed an order',
            target: `$${order.total_amount}`,
            created_at: order.created_at,
          });
        });
      }

      // Sort by date and take top 10
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentActivities(activities.slice(0, 10));

    } catch (error) {
      console.warn('Failed to fetch recent activities:', error);
      setRecentActivities([]);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your Mr Cars platform
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={isLoading ? "..." : stats.totalUsers.toLocaleString()}
          icon={<Users className="h-4 w-4" />}
          description="Total registered users"
          trend={{ 
            value: stats.thisMonthUsers, 
            isPositive: true
          }}
        />
        <StatCard
          title="Active Listings"
          value={isLoading ? "..." : stats.activeListings.toLocaleString()}
          icon={<Car className="h-4 w-4" />}
          description="Cars currently listed"
          trend={{ 
            value: stats.thisMonthListings, 
            isPositive: true
          }}
        />
        <StatCard
          title="Pending Inquiries"
          value={isLoading ? "..." : stats.pendingInquiries.toLocaleString()}
          icon={<MessageSquare className="h-4 w-4" />}
          description={`${stats.totalInquiries} total inquiries`}
          trend={{ 
            value: stats.pendingInquiries > 0 ? Math.round((stats.pendingInquiries / Math.max(stats.totalInquiries, 1)) * 100) : 0, 
            isPositive: false
          }}
        />
        <StatCard
          title="Total Orders"
          value={isLoading ? "..." : stats.totalOrders.toLocaleString()}
          icon={<ShoppingCart className="h-4 w-4" />}
          description="Orders from tire/battery shop"
          trend={{ 
            value: stats.thisMonthOrders, 
            isPositive: true
          }}
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-6">
        <OverviewChart data={chartData} isLoading={isLoading} />
        <div className="grid gap-6 md:col-span-2">
          <ListingStatusChart 
            activeCount={stats.activeListings} 
            inactiveCount={stats.totalUsers > 0 ? Math.max(0, stats.totalUsers - stats.activeListings) : 0}
            isLoading={isLoading}
          />
          <RecentActivity activities={recentActivities} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}