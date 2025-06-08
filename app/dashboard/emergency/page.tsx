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
  AlertTriangle,
  RefreshCw,
  MapPin,
  Phone,
  Car,
  Clock,
  User,
  MessageSquare,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Eye
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface EmergencyRequest {
  id: string;
  user_id: string;
  vehicle_name: string;
  vehicle_year: number | null;
  fuel_type: string | null;
  issue_description: string;
  status: string;
  location_lat: number | null;
  location_lng: number | null;
  location_text: string | null;
  helper_id: string | null;
  helper_notes: string | null;
  admin_response: string | null;
  priority: string | null;
  estimated_arrival: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
  username?: string;
  user_phone?: string;
  user_name?: string;
  user_email?: string;
}

export default function EmergencyPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EmergencyRequest | null>(null);
  const [responseText, setResponseText] = useState("");
  const [estimatedArrival, setEstimatedArrival] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [requestToDelete, setRequestToDelete] = useState<EmergencyRequest | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [detailsRequest, setDetailsRequest] = useState<EmergencyRequest | null>(null);
  const { toast } = useToast();

  const fetchEmergencyRequests = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      
      // First fetch emergency requests
      const { data: emergencyData, error: emergencyError } = await supabase
        .from('emergency_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (emergencyError) {
        console.error('Error fetching emergency requests:', emergencyError);
        setFetchError(emergencyError.message);
        throw emergencyError;
      }

      // If we have emergency data, fetch user profiles
      if (emergencyData && emergencyData.length > 0) {
        const userIds = Array.from(new Set(emergencyData.map(req => req.user_id)));
        
        // Try to fetch from profiles table
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, name, phone')
          .in('id', userIds);

        // If profiles exist, merge them with emergency data
        if (profilesData && !profilesError) {
          const profilesMap = new Map(profilesData.map(p => [p.id, p]));
          emergencyData.forEach(req => {
            const profile = profilesMap.get(req.user_id);
            if (profile) {
              req.username = profile.username;
              req.user_name = profile.name;
              req.user_phone = profile.phone;
            }
          });
        }
      }

      setEmergencyRequests(emergencyData || []);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to load emergency requests";
      setFetchError(errorMessage);
      toast({
        title: "Error fetching emergency requests",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch data immediately
    fetchEmergencyRequests();
    
    return () => {
      // Cleanup
    };
  }, []);

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('emergency_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Emergency request status changed to ${newStatus}`,
      });

      fetchEmergencyRequests();
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleResponse = async () => {
    if (!selectedRequest) return;

    try {
      const updates: any = {
        admin_response: responseText,
        updated_at: new Date().toISOString()
      };

      if (estimatedArrival) {
        updates.estimated_arrival = estimatedArrival;
      }

      if (contactPhone) {
        updates.contact_phone = contactPhone;
      }

      // If responding for the first time, set status to accepted
      if (selectedRequest.status === 'pending') {
        updates.status = 'accepted';
      }

      const { error } = await supabase
        .from('emergency_requests')
        .update(updates)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast({
        title: "Response sent",
        description: "Your response has been sent to the user",
      });

      setShowResponseDialog(false);
      setResponseText("");
      setEstimatedArrival("");
      setContactPhone("");
      setSelectedRequest(null);
      fetchEmergencyRequests();
    } catch (error: any) {
      toast({
        title: "Error sending response",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!requestToDelete) return;

    try {
      const { error } = await supabase
        .from('emergency_requests')
        .delete()
        .eq('id', requestToDelete.id);

      if (error) throw error;

      toast({
        title: "Request deleted",
        description: "Emergency request has been removed",
      });

      setShowDeleteDialog(false);
      setRequestToDelete(null);
      fetchEmergencyRequests();
    } catch (error: any) {
      toast({
        title: "Error deleting request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openResponseDialog = (request: EmergencyRequest) => {
    setSelectedRequest(request);
    setResponseText(request.admin_response || "");
    setEstimatedArrival(request.estimated_arrival || "");
    setContactPhone(request.contact_phone || "");
    setShowResponseDialog(true);
  };

  const openDeleteDialog = (request: EmergencyRequest) => {
    setRequestToDelete(request);
    setShowDeleteDialog(true);
  };

  const openDetailsDialog = (request: EmergencyRequest) => {
    setDetailsRequest(request);
    setShowDetailsDialog(true);
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'accepted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'in_progress': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const columns: ColumnDef<EmergencyRequest>[] = React.useMemo(() => [
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
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.getValue("priority") as string | null;
        return (
          <Badge variant="outline" className={getPriorityColor(priority)}>
            {(priority || 'medium').toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "user_profile",
      header: "User",
      cell: ({ row }) => {
        const request = row.original;
        return (
          <div>
            <div className="font-medium">
              {request.user_name || request.username || 'Unknown User'}
            </div>
            {request.user_phone && (
              <div className="text-sm text-muted-foreground">{request.user_phone}</div>
            )}
            {!request.user_name && !request.username && (
              <div className="text-xs text-muted-foreground" title={request.user_id}>
                ID: {request.user_id.slice(0, 8)}...
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "vehicle_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Vehicle
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const request = row.original;
        return (
          <div>
            <div className="font-medium">{request.vehicle_name}</div>
            <div className="text-sm text-muted-foreground">
              {request.vehicle_year} • {request.fuel_type}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "issue_description",
      header: "Issue",
      cell: ({ row }) => {
        const description = row.getValue("issue_description") as string;
        return (
          <div className="max-w-[300px]">
            <div className="truncate" title={description}>
              {description}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "location_text",
      header: "Location",
      cell: ({ row }) => {
        const request = row.original;
        return (
          <div className="max-w-[200px]">
            {request.location_text ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate text-sm" title={request.location_text}>
                    {request.location_text}
                  </span>
                </div>
                {request.location_lat && request.location_lng && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      window.open(
                        `https://www.google.com/maps?q=${request.location_lat},${request.location_lng}`,
                        '_blank'
                      );
                    }}
                  >
                    View on Map
                  </Button>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">No location</span>
            )}
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
            {status.replace('_', ' ').toUpperCase()}
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
            Created
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
        const request = row.original;

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
              <DropdownMenuItem onClick={() => openDetailsDialog(request)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openResponseDialog(request)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Respond to User
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {request.status === 'pending' && (
                <DropdownMenuItem onClick={() => handleStatusUpdate(request.id, 'accepted')}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept Request
                </DropdownMenuItem>
              )}
              {request.status === 'accepted' && (
                <DropdownMenuItem onClick={() => handleStatusUpdate(request.id, 'in_progress')}>
                  <Play className="mr-2 h-4 w-4" />
                  Mark In Progress
                </DropdownMenuItem>
              )}
              {request.status === 'in_progress' && (
                <DropdownMenuItem onClick={() => handleStatusUpdate(request.id, 'completed')}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Completed
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => openDeleteDialog(request)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Delete Request
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [handleStatusUpdate, openResponseDialog, openDeleteDialog, openDetailsDialog]);

  const filteredRequests = React.useMemo(() => {
    return emergencyRequests.filter(request => {
      if (activeTab === "all") return true;
      return request.status === activeTab;
    });
  }, [emergencyRequests, activeTab]);

  const table = useReactTable({
    data: isLoading ? [] : filteredRequests,
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

  const getTabCount = (status: string) => {
    if (status === "all") return emergencyRequests.length;
    return emergencyRequests.filter(r => r.status === status).length;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Emergency Requests</h1>
          <p className="text-muted-foreground">
            Manage breakdown assistance and emergency requests
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchEmergencyRequests}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="font-medium">Error loading emergency requests</p>
          <p className="text-sm mt-1">{fetchError}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({getTabCount("all")})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({getTabCount("pending")})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({getTabCount("accepted")})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({getTabCount("in_progress")})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({getTabCount("completed")})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <div className="rounded-md border">
            <div className="flex items-center justify-between p-4">
              <Input
                placeholder="Search requests..."
                value={(table.getColumn("issue_description")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("issue_description")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <div className="flex items-center gap-2">
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
                      Loading emergency requests...
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
                      No emergency requests found.
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

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Emergency Request</DialogTitle>
            <DialogDescription>
              Send a response to the user with assistance details and next steps.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <strong>User:</strong> {selectedRequest.user_name || selectedRequest.username || 'Unknown'}
                </div>
                <div>
                  <strong>Vehicle:</strong> {selectedRequest.vehicle_name} ({selectedRequest.vehicle_year})
                </div>
                <div className="col-span-2">
                  <strong>Issue:</strong> {selectedRequest.issue_description}
                </div>
                {selectedRequest.location_text && (
                  <div className="col-span-2">
                    <strong>Location:</strong> {selectedRequest.location_text}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="response">Response Message</Label>
                  <Textarea
                    id="response"
                    placeholder="Enter your response to the user..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="arrival">Estimated Arrival Time</Label>
                    <Input
                      id="arrival"
                      placeholder="e.g., 30 minutes, 1 hour"
                      value={estimatedArrival}
                      onChange={(e) => setEstimatedArrival(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact">Contact Phone</Label>
                    <Input
                      id="contact"
                      placeholder="Emergency contact number"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResponse} disabled={!responseText.trim()}>
              Send Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Emergency Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this emergency request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRequestToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Emergency Request Details</DialogTitle>
            <DialogDescription>
              Complete information about this emergency request
            </DialogDescription>
          </DialogHeader>
          
          {detailsRequest && (
            <div className="space-y-6">
              {/* Status and Priority */}
              <div className="flex items-center gap-4">
                <Badge variant="outline" className={getStatusColor(detailsRequest.status)}>
                  {detailsRequest.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge variant="outline" className={getPriorityColor(detailsRequest.priority)}>
                  Priority: {(detailsRequest.priority || 'medium').toUpperCase()}
                </Badge>
              </div>

              {/* User Information */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">User Information</h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{detailsRequest.user_name || detailsRequest.username || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{detailsRequest.user_phone || 'Not provided'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="font-mono text-xs">{detailsRequest.user_id}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Vehicle Information</h3>
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle</p>
                    <p className="font-medium">{detailsRequest.vehicle_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Year</p>
                    <p className="font-medium">{detailsRequest.vehicle_year || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fuel Type</p>
                    <p className="font-medium">{detailsRequest.fuel_type || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Issue Description */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Issue Description</h3>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="whitespace-pre-wrap">{detailsRequest.issue_description}</p>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Location</h3>
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  {detailsRequest.location_text && (
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{detailsRequest.location_text}</p>
                    </div>
                  )}
                  {detailsRequest.location_lat && detailsRequest.location_lng && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Latitude</p>
                          <p className="font-mono text-sm">{detailsRequest.location_lat}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Longitude</p>
                          <p className="font-mono text-sm">{detailsRequest.location_lng}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          window.open(
                            `https://www.google.com/maps?q=${detailsRequest.location_lat},${detailsRequest.location_lng}`,
                            '_blank'
                          );
                        }}
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        View on Google Maps
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Admin Response */}
              {detailsRequest.admin_response && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Admin Response</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap">{detailsRequest.admin_response}</p>
                    {detailsRequest.estimated_arrival && (
                      <p className="mt-2 text-sm">
                        <span className="text-muted-foreground">Estimated arrival:</span> {detailsRequest.estimated_arrival}
                      </p>
                    )}
                    {detailsRequest.contact_phone && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Contact:</span> {detailsRequest.contact_phone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Timeline</h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Created At</p>
                    <p className="font-medium">
                      {new Date(detailsRequest.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {new Date(detailsRequest.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            {detailsRequest && (
              <Button onClick={() => {
                setShowDetailsDialog(false);
                openResponseDialog(detailsRequest);
              }}>
                Respond to User
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}