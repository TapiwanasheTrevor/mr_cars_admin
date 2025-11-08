"use client";

import React, { useState, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  MoreHorizontal,
  ArrowUpDown,
  RefreshCw,
  DollarSign,
  Users,
  TrendingUp,
  Award,
  Eye,
  XCircle,
  CheckCircle,
  Edit,
  Crown,
  Plus
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_period: 'monthly' | 'quarterly' | 'yearly';
  features: any;
  max_listings: number;
  priority_support: boolean;
  featured_listings: boolean;
  analytics_access: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string | null;
  status: 'active' | 'cancelled' | 'expired' | 'pending' | 'paused';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  payment_method: string | null;
  transaction_id: string | null;
  amount_paid: number | null;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
  user?: {
    username: string;
    email: string;
  };
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("subscriptions");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showManualSubscriptionDialog, setShowManualSubscriptionDialog] = useState(false);
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [newPlanId, setNewPlanId] = useState<string>("");
  const [manualSubForm, setManualSubForm] = useState({
    user_id: '',
    plan_id: '',
    duration_months: 1,
    notes: '',
  });
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch subscriptions with user and plan data
      const { data: subsData, error: subsError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      // Fetch user data for subscriptions
      if (subsData && subsData.length > 0) {
        const userIds = Array.from(new Set(subsData.map(s => s.user_id)));
        const { data: usersData } = await supabase
          .from('users')
          .select('id, username, email')
          .in('id', userIds);

        if (usersData) {
          const usersMap = new Map(usersData.map(u => [u.id, u]));
          subsData.forEach(sub => {
            sub.user = usersMap.get(sub.user_id);
          });
        }
      }

      setSubscriptions(subsData || []);

      // Fetch plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (plansError) throw plansError;
      setPlans(plansData || []);

    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusUpdate = async (subscriptionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: "Subscription updated",
        description: `Status changed to ${newStatus}`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error updating subscription",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePlanToggle = async (planId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({
          is_active: !isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Plan updated",
        description: `Plan ${!isActive ? 'activated' : 'deactivated'}`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error updating plan",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleManualSubscription = async () => {
    try {
      if (!manualSubForm.user_id || !manualSubForm.plan_id) {
        toast({
          title: "Missing information",
          description: "Please select both user and plan",
          variant: "destructive",
        });
        return;
      }

      const selectedPlan = plans.find(p => p.id === manualSubForm.plan_id);
      if (!selectedPlan) return;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + manualSubForm.duration_months);

      const { error } = await supabase
        .from('user_subscriptions')
        .insert([{
          user_id: manualSubForm.user_id,
          plan_id: manualSubForm.plan_id,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          auto_renew: false,
          payment_method: 'admin_granted',
          amount_paid: 0,
        }]);

      if (error) throw error;

      toast({
        title: "Subscription created",
        description: `${selectedPlan.name} subscription granted for ${manualSubForm.duration_months} month(s)`,
      });

      setShowManualSubscriptionDialog(false);
      setManualSubForm({
        user_id: '',
        plan_id: '',
        duration_months: 1,
        notes: '',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error creating subscription",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleChangePlan = async () => {
    try {
      if (!selectedSubscription || !newPlanId) return;

      const newPlan = plans.find(p => p.id === newPlanId);
      if (!newPlan) return;

      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          plan_id: newPlanId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedSubscription.id);

      if (error) throw error;

      toast({
        title: "Plan changed",
        description: `Subscription updated to ${newPlan.name}`,
      });

      setShowChangePlanDialog(false);
      setNewPlanId("");
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error changing plan",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExtendSubscription = async (subscriptionId: string, months: number) => {
    try {
      const sub = subscriptions.find(s => s.id === subscriptionId);
      if (!sub) return;

      const currentEndDate = new Date(sub.end_date);
      currentEndDate.setMonth(currentEndDate.getMonth() + months);

      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          end_date: currentEndDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: "Subscription extended",
        description: `Extended by ${months} month(s)`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error extending subscription",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      paused: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    };
    return colors[status] || colors.pending;
  };

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes('premium')) return <Crown className="h-4 w-4 text-purple-600" />;
    if (planName.toLowerCase().includes('gold')) return <Award className="h-4 w-4 text-yellow-600" />;
    return <Users className="h-4 w-4 text-gray-600" />;
  };

  const subscriptionColumns: ColumnDef<UserSubscription>[] = React.useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
    },
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => {
        const sub = row.original;
        return (
          <div>
            <div className="font-medium">{sub.user?.username || 'Unknown'}</div>
            <div className="text-sm text-muted-foreground">{sub.user?.email || sub.user_id.slice(0, 8) + '...'}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "plan",
      header: "Plan",
      cell: ({ row }) => {
        const sub = row.original;
        return (
          <div className="flex items-center gap-2">
            {getPlanIcon(sub.plan?.name || '')}
            <div>
              <div className="font-medium">{sub.plan?.name || 'Unknown Plan'}</div>
              <div className="text-sm text-muted-foreground">${sub.plan?.price || 0}/{sub.plan?.billing_period || 'month'}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant="outline" className={getStatusColor(status)}>
            {status.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "start_date",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Start Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => new Date(row.getValue("start_date")).toLocaleDateString(),
    },
    {
      accessorKey: "end_date",
      header: "End Date",
      cell: ({ row }) => new Date(row.getValue("end_date")).toLocaleDateString(),
    },
    {
      accessorKey: "auto_renew",
      header: "Auto-Renew",
      cell: ({ row }) => (
        <Badge variant={row.getValue("auto_renew") ? "default" : "outline"}>
          {row.getValue("auto_renew") ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      accessorKey: "amount_paid",
      header: "Amount",
      cell: ({ row }) => `$${(row.getValue("amount_paid") as number || 0).toFixed(2)}`,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const sub = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                setSelectedSubscription(sub);
                setShowDetailsDialog(true);
              }}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Admin Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                setSelectedSubscription(sub);
                setNewPlanId(sub.plan_id || '');
                setShowChangePlanDialog(true);
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Change Plan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExtendSubscription(sub.id, 1)}>
                Extend +1 Month
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExtendSubscription(sub.id, 3)}>
                Extend +3 Months
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {sub.status === 'pending' && (
                <DropdownMenuItem onClick={() => handleStatusUpdate(sub.id, 'active')}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Activate
                </DropdownMenuItem>
              )}
              {sub.status === 'active' && (
                <>
                  <DropdownMenuItem onClick={() => handleStatusUpdate(sub.id, 'paused')}>
                    Pause Subscription
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusUpdate(sub.id, 'cancelled')}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel
                  </DropdownMenuItem>
                </>
              )}
              {sub.status === 'paused' && (
                <DropdownMenuItem onClick={() => handleStatusUpdate(sub.id, 'active')}>
                  Resume Subscription
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  const planColumns: ColumnDef<SubscriptionPlan>[] = React.useMemo(() => [
    {
      accessorKey: "name",
      header: "Plan Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getPlanIcon(row.original.name)}
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">${row.original.price.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">per {row.original.billing_period}</div>
        </div>
      ),
    },
    {
      accessorKey: "max_listings",
      header: "Max Listings",
      cell: ({ row }) => row.original.max_listings === 9999 ? '∞' : row.original.max_listings,
    },
    {
      accessorKey: "features",
      header: "Features",
      cell: ({ row }) => {
        const features = [];
        if (row.original.priority_support) features.push('Priority Support');
        if (row.original.featured_listings) features.push('Featured Listings');
        if (row.original.analytics_access) features.push('Analytics');
        return (
          <div className="flex flex-wrap gap-1">
            {features.map((f, i) => (
              <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "outline"}>
          {row.original.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const plan = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                setSelectedPlan(plan);
                setIsEditingPlan(true);
                setShowPlanDialog(true);
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Plan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handlePlanToggle(plan.id, plan.is_active)}>
                {plan.is_active ? 'Deactivate' : 'Activate'} Plan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  const subscriptionTable = useReactTable({
    data: subscriptions,
    columns: subscriptionColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const planTable = useReactTable({
    data: plans,
    columns: planColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Calculate stats
  const stats = {
    totalRevenue: subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (s.amount_paid || 0), 0),
    activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
    goldPlusCount: subscriptions.filter(s =>
      s.status === 'active' && s.plan?.name.toLowerCase().includes('gold')
    ).length,
    monthlyRecurring: subscriptions
      .filter(s => s.status === 'active' && s.auto_renew)
      .reduce((sum, s) => sum + (s.plan?.price || 0), 0),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions & Plans</h1>
          <p className="text-muted-foreground">
            Manage user subscriptions and Gold Plus features
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowManualSubscriptionDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Grant Subscription
          </Button>
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From active subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gold Plus Members</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.goldPlusCount}</div>
            <p className="text-xs text-muted-foreground">Premium tier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRecurring.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Auto-renewal active</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="subscriptions">User Subscriptions ({subscriptions.length})</TabsTrigger>
          <TabsTrigger value="plans">Subscription Plans ({plans.length})</TabsTrigger>
        </TabsList>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions">
          <div className="rounded-md border">
            <div className="p-4">
              <Input
                placeholder="Search by user..."
                className="max-w-sm"
              />
            </div>
            <Table>
              <TableHeader>
                {subscriptionTable.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={subscriptionColumns.length} className="h-24 text-center">
                      Loading subscriptions...
                    </TableCell>
                  </TableRow>
                ) : subscriptionTable.getRowModel().rows?.length ? (
                  subscriptionTable.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={subscriptionColumns.length} className="h-24 text-center">
                      No subscriptions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-2 p-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => subscriptionTable.previousPage()}
                disabled={!subscriptionTable.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => subscriptionTable.nextPage()}
                disabled={!subscriptionTable.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {planTable.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={planColumns.length} className="h-24 text-center">
                      Loading plans...
                    </TableCell>
                  </TableRow>
                ) : planTable.getRowModel().rows?.length ? (
                  planTable.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={planColumns.length} className="h-24 text-center">
                      No plans found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Subscription Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{selectedSubscription.user?.username || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-medium">{selectedSubscription.plan?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedSubscription.status)}>
                    {selectedSubscription.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Paid</p>
                  <p className="font-medium">${selectedSubscription.amount_paid?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{new Date(selectedSubscription.start_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{new Date(selectedSubscription.end_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Auto-Renew</p>
                  <p className="font-medium">{selectedSubscription.auto_renew ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{selectedSubscription.payment_method || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Subscription Dialog */}
      <Dialog open={showManualSubscriptionDialog} onOpenChange={setShowManualSubscriptionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Grant Subscription</DialogTitle>
            <DialogDescription>
              Manually assign a subscription to a user (admin override)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-id">User ID *</Label>
              <Input
                id="user-id"
                value={manualSubForm.user_id}
                onChange={(e) => setManualSubForm({ ...manualSubForm, user_id: e.target.value })}
                placeholder="Enter user ID"
              />
              <p className="text-xs text-muted-foreground">
                Get the user ID from the Users page
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-select">Subscription Plan *</Label>
              <Select
                value={manualSubForm.plan_id}
                onValueChange={(value) => setManualSubForm({ ...manualSubForm, plan_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ${plan.price}/{plan.billing_period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (Months) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="12"
                value={manualSubForm.duration_months}
                onChange={(e) => setManualSubForm({ ...manualSubForm, duration_months: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Admin Notes</Label>
              <Textarea
                id="notes"
                value={manualSubForm.notes}
                onChange={(e) => setManualSubForm({ ...manualSubForm, notes: e.target.value })}
                placeholder="Reason for granting subscription..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualSubscriptionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleManualSubscription}>
              Grant Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog open={showChangePlanDialog} onOpenChange={setShowChangePlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <DialogDescription>
              Update the user's subscription to a different plan
            </DialogDescription>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="font-medium text-lg">{selectedSubscription.plan?.name}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-plan">New Plan</Label>
                <Select value={newPlanId} onValueChange={setNewPlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.filter(p => p.id !== selectedSubscription.plan_id).map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - ${plan.price}/{plan.billing_period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePlanDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePlan} disabled={!newPlanId}>
              Change Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
