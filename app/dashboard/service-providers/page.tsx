"use client";

import React, { useState, useEffect } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
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
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Star,
  Wrench,
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
  DropdownMenuCheckboxItem
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

interface ServiceProvider {
  id: string;
  user_id: string | null;
  business_name: string;
  service_type: 'mechanic' | 'breakdown' | 'towing' | 'detailing' | 'inspection' | 'other';
  description: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  service_radius: number;
  operating_hours: any;
  services_offered: string[];
  pricing_info: any;
  rating: number;
  total_reviews: number;
  total_jobs_completed: number;
  is_verified: boolean;
  is_active: boolean;
  verification_documents: string[];
  license_number: string | null;
  insurance_info: any;
  images: string[];
  created_at: string;
  updated_at: string;
}

export default function ServiceProvidersPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [providerToDelete, setProviderToDelete] = useState<ServiceProvider | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [verificationAction, setVerificationAction] = useState<'approve' | 'reject'>('approve');
  const { toast } = useToast();

  const fetchProviders = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);

      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching service providers:', error);
        setFetchError(error.message);
        throw error;
      }

      setProviders(data || []);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to load service providers";
      setFetchError(errorMessage);
      toast({
        title: "Error fetching service providers",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleVerifyToggle = async (providerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('service_providers')
        .update({
          is_verified: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', providerId);

      if (error) throw error;

      toast({
        title: "Verification status updated",
        description: `Provider ${!currentStatus ? 'verified' : 'unverified'} successfully`,
      });

      fetchProviders();
    } catch (error: any) {
      toast({
        title: "Error updating verification status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleActiveToggle = async (providerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('service_providers')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', providerId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Provider ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });

      fetchProviders();
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!providerToDelete) return;

    try {
      const { error } = await supabase
        .from('service_providers')
        .delete()
        .eq('id', providerToDelete.id);

      if (error) throw error;

      toast({
        title: "Provider deleted",
        description: "Service provider has been removed",
      });

      setShowDeleteDialog(false);
      setProviderToDelete(null);
      fetchProviders();
    } catch (error: any) {
      toast({
        title: "Error deleting provider",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleVerification = async () => {
    if (!selectedProvider) return;

    try {
      const isApproving = verificationAction === 'approve';

      const { error } = await supabase
        .from('service_providers')
        .update({
          is_verified: isApproving,
          is_active: isApproving,
          verification_documents: {
            verified_at: new Date().toISOString(),
            verified_by: 'admin',
            status: verificationAction,
            notes: verificationNotes,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedProvider.id);

      if (error) throw error;

      toast({
        title: isApproving ? "Provider verified" : "Provider rejected",
        description: isApproving
          ? "Service provider has been verified and activated"
          : "Service provider verification has been rejected",
      });

      setShowVerificationDialog(false);
      setVerificationNotes("");
      setSelectedProvider(null);
      fetchProviders();
    } catch (error: any) {
      toast({
        title: "Error processing verification",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openVerificationDialog = (provider: ServiceProvider, action: 'approve' | 'reject') => {
    setSelectedProvider(provider);
    setVerificationAction(action);
    setShowVerificationDialog(true);
  };

  const openDetailsDialog = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setShowDetailsDialog(true);
  };

  const openDeleteDialog = (provider: ServiceProvider) => {
    setProviderToDelete(provider);
    setShowDeleteDialog(true);
  };

  const getServiceTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      mechanic: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      breakdown: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      towing: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      detailing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      inspection: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    };
    return colors[type] || colors.other;
  };

  const columns: ColumnDef<ServiceProvider>[] = React.useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "business_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Business Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const provider = row.original;
        return (
          <div>
            <div className="font-medium">{provider.business_name}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" /> {provider.phone}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "service_type",
      header: "Service Type",
      cell: ({ row }) => {
        const type = row.getValue("service_type") as string;
        return (
          <Badge variant="outline" className={getServiceTypeColor(type)}>
            {type.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "rating",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Rating
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const provider = row.original;
        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="ml-1 font-medium">{provider.rating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              ({provider.total_reviews} reviews)
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "total_jobs_completed",
      header: "Jobs Completed",
      cell: ({ row }) => {
        return <div className="font-medium">{row.getValue("total_jobs_completed")}</div>;
      },
    },
    {
      accessorKey: "is_verified",
      header: "Verified",
      cell: ({ row }) => {
        const isVerified = row.getValue("is_verified") as boolean;
        return isVerified ? (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            <XCircle className="h-3 w-3 mr-1" />
            Not Verified
          </Badge>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean;
        return isActive ? (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Inactive
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Joined
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return (
          <div>
            <div>{date.toLocaleDateString()}</div>
            <div className="text-sm text-muted-foreground">
              {date.toLocaleTimeString()}
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const provider = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openDetailsDialog(provider)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Verification</DropdownMenuLabel>
              {!provider.is_verified ? (
                <>
                  <DropdownMenuItem
                    onClick={() => openVerificationDialog(provider, 'approve')}
                    className="text-green-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve & Verify
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => openVerificationDialog(provider, 'reject')}
                    className="text-red-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Application
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  onClick={() => handleVerifyToggle(provider.id, provider.is_verified)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Revoke Verification
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleActiveToggle(provider.id, provider.is_active)}
              >
                {provider.is_active ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => openDeleteDialog(provider)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Delete Provider
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [handleVerifyToggle, handleActiveToggle, openDetailsDialog, openDeleteDialog]);

  const filteredProviders = React.useMemo(() => {
    return providers.filter(provider => {
      if (activeTab === "all") return true;
      if (activeTab === "verified") return provider.is_verified;
      if (activeTab === "unverified") return !provider.is_verified;
      if (activeTab === "active") return provider.is_active;
      if (activeTab === "inactive") return !provider.is_active;
      return provider.service_type === activeTab;
    });
  }, [providers, activeTab]);

  const table = useReactTable({
    data: isLoading ? [] : filteredProviders,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const getTabCount = (filter: string) => {
    if (filter === "all") return providers.length;
    if (filter === "verified") return providers.filter(p => p.is_verified).length;
    if (filter === "unverified") return providers.filter(p => !p.is_verified).length;
    if (filter === "active") return providers.filter(p => p.is_active).length;
    if (filter === "inactive") return providers.filter(p => !p.is_active).length;
    return providers.filter(p => p.service_type === filter).length;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Providers</h1>
          <p className="text-muted-foreground">
            Manage mechanics, breakdown services, and other automotive service providers
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchProviders}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Providers</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{providers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTabCount("verified")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTabCount("active")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {providers.length > 0
                ? (providers.reduce((sum, p) => sum + p.rating, 0) / providers.length).toFixed(1)
                : '0.0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="font-medium">Error loading service providers</p>
          <p className="text-sm mt-1">{fetchError}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({getTabCount("all")})</TabsTrigger>
          <TabsTrigger value="verified">Verified ({getTabCount("verified")})</TabsTrigger>
          <TabsTrigger value="unverified">Unverified ({getTabCount("unverified")})</TabsTrigger>
          <TabsTrigger value="mechanic">Mechanics ({getTabCount("mechanic")})</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown ({getTabCount("breakdown")})</TabsTrigger>
          <TabsTrigger value="towing">Towing ({getTabCount("towing")})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <div className="rounded-md border">
            <div className="flex items-center justify-between p-4">
              <Input
                placeholder="Search providers..."
                value={(table.getColumn("business_name")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("business_name")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Columns</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Loading service providers...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No service providers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-2 p-4">
              <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Service Provider Details</DialogTitle>
            <DialogDescription>
              Complete information about this service provider
            </DialogDescription>
          </DialogHeader>

          {selectedProvider && (
            <div className="space-y-6">
              {/* Status Badges */}
              <div className="flex items-center gap-4">
                <Badge variant="outline" className={getServiceTypeColor(selectedProvider.service_type)}>
                  {selectedProvider.service_type.toUpperCase()}
                </Badge>
                {selectedProvider.is_verified && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                <Badge className={selectedProvider.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {selectedProvider.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Business Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Business Information</h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Business Name</p>
                    <p className="font-medium">{selectedProvider.business_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedProvider.phone}</p>
                  </div>
                  {selectedProvider.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedProvider.email}</p>
                    </div>
                  )}
                  {selectedProvider.license_number && (
                    <div>
                      <p className="text-sm text-muted-foreground">License Number</p>
                      <p className="font-medium">{selectedProvider.license_number}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Service Radius</p>
                    <p className="font-medium">{selectedProvider.service_radius} km</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-medium">{selectedProvider.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground ml-1">
                        ({selectedProvider.total_reviews} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedProvider.description && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Description</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedProvider.description}</p>
                  </div>
                </div>
              )}

              {/* Services Offered */}
              {selectedProvider.services_offered && selectedProvider.services_offered.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Services Offered</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProvider.services_offered.map((service, index) => (
                      <Badge key={index} variant="outline">{service}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance Stats */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Performance</h3>
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Jobs Completed</p>
                    <p className="text-2xl font-bold">{selectedProvider.total_jobs_completed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Reviews</p>
                    <p className="text-2xl font-bold">{selectedProvider.total_reviews}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                    <p className="text-2xl font-bold">{selectedProvider.rating.toFixed(1)}</p>
                  </div>
                </div>
              </div>

              {/* Location */}
              {selectedProvider.address && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Location</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-medium">{selectedProvider.address}</p>
                    {selectedProvider.location_lat && selectedProvider.location_lng && (
                      <Button
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => {
                          window.open(
                            `https://www.google.com/maps?q=${selectedProvider.location_lat},${selectedProvider.location_lng}`,
                            '_blank'
                          );
                        }}
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        View on Google Maps
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Provider</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service provider? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProviderToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Provider
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verification Dialog */}
      <AlertDialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {verificationAction === 'approve' ? 'Approve Service Provider' : 'Reject Service Provider'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {verificationAction === 'approve'
                ? 'This will verify and activate the service provider account. They will appear in the mobile app.'
                : 'This will reject the service provider application. Provide a reason for rejection.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {selectedProvider && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedProvider.business_name}</p>
                <p className="text-sm text-muted-foreground">{selectedProvider.service_type.toUpperCase()}</p>
                <p className="text-sm text-muted-foreground">{selectedProvider.phone}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="verification-notes">
                {verificationAction === 'approve' ? 'Verification Notes (Optional)' : 'Rejection Reason *'}
              </Label>
              <Textarea
                id="verification-notes"
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder={
                  verificationAction === 'approve'
                    ? 'Add any internal notes about the verification...'
                    : 'Explain why this provider is being rejected...'
                }
                rows={4}
                required={verificationAction === 'reject'}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowVerificationDialog(false);
              setVerificationNotes("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVerification}
              disabled={verificationAction === 'reject' && !verificationNotes.trim()}
              className={
                verificationAction === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {verificationAction === 'approve' ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve & Verify
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Application
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
