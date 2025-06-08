"use client";

import { useState, useEffect } from "react";
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
  Check, 
  X,
  UserPlus,
  RefreshCw,
  Download,
  Trash2,
  Edit,
  Eye,
  UserX,
  UserCheck,
  Mail,
  Shield
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  phone: string | null;
  profile_picture_url: string | null;
  created_at: string;
  updated_at: string;
  role: string;
  is_active: boolean;
}

const addUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(2, "Username must be at least 2 characters"),
  phone: z.string().optional(),
  role: z.enum(["user", "admin", "moderator"]),
  is_active: z.boolean().default(true),
});

const editUserSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  phone: z.string().optional(),
  role: z.enum(["user", "admin", "moderator"]),
  is_active: z.boolean(),
});

type AddUserForm = z.infer<typeof addUserSchema>;
type EditUserForm = z.infer<typeof editUserSchema>;

export default function UsersPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showListingsDialog, setShowListingsDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userListings, setUserListings] = useState<any[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteListingDialog, setShowDeleteListingDialog] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<{listing: any, type: 'car' | 'rental'} | null>(null);
  const { toast } = useToast();

  const addForm = useForm<AddUserForm>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      email: "",
      username: "",
      phone: "",
      role: "user",
      is_active: true,
    },
  });

  const editForm = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      username: "",
      phone: "",
      role: "user",
      is_active: true,
    },
  });

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // First try to get users with profiles
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        // If users table doesn't exist, try profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (profilesError) {
          throw profilesError;
        }

        // Transform profiles data to match our interface
        const transformedProfiles = (profilesData || []).map(profile => ({
          id: profile.id,
          email: profile.email || 'N/A',
          username: profile.username || profile.name || 'N/A',
          phone: profile.phone || 'N/A',
          profile_picture_url: profile.profile_picture_url || null,
          created_at: profile.created_at,
          updated_at: profile.updated_at || profile.created_at,
          role: 'user', // Default role since profiles don't have roles
          is_active: true // Assume active since we can't determine from profiles
        }));

        setUsers(transformedProfiles);
      } else {
        // Transform users data
        const transformedUsers = (usersData || []).map(user => ({
          id: user.id,
          email: user.email || 'N/A',
          username: user.username || 'N/A',
          phone: user.phone || 'N/A',
          profile_picture_url: user.profile_picture_url || null,
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at,
          role: user.role || 'user',
          is_active: user.is_active !== false
        }));

        setUsers(transformedUsers);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching users",
        description: error.message || "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserListings = async (userId: string, user?: UserProfile) => {
    try {
      setIsLoadingListings(true);
      
      // Use passed user or fallback to selectedUser
      const targetUser = user || selectedUser;
      console.log('Fetching listings for user:', { userId, email: targetUser?.email, username: targetUser?.username });
      
      // Debug: Check what's actually in the cars table
      const { data: allCars, error: carsError } = await supabase
        .from('cars')
        .select('id, seller_id, seller_name, make, model, date_added')
        .limit(10);
      console.log('Sample cars in database:', allCars);
      if (carsError) {
        console.error('Error fetching sample cars:', carsError);
      }
      
      // Debug: Check what's in the rental_listings table
      const { data: allRentals } = await supabase
        .from('rental_listings')
        .select('id, owner_id, make, model, created_at')
        .limit(10);
      console.log('Sample rentals in database:', allRentals);
      
      // Debug: Show the user we're looking for
      console.log('Looking for listings by user:', {
        id: userId,
        email: targetUser?.email,
        username: targetUser?.username,
        full_user: targetUser
      });
      
      // If basic cars query failed, try simple approaches
      let allCarListings = [];
      
      if (carsError) {
        console.log('Cars table access failed, skipping car listings');
      } else {
        // Try multiple approaches to find listings
        
        // Method 1: Direct user ID match
        try {
          const { data: carsByUserId, error: carsByUserIdError } = await supabase
            .from('cars')
            .select('*')
            .eq('seller_id', userId)
            .order('date_added', { ascending: false });
          
          console.log('Cars by user ID result:', { data: carsByUserId, error: carsByUserIdError });
          if (carsByUserId) allCarListings.push(...carsByUserId);
        } catch (e) {
          console.error('Cars by user ID failed:', e);
        }
        
        // Method 2: Try with email if available
        if (targetUser?.email) {
          try {
            const { data: carsByEmail, error: carsByEmailError } = await supabase
              .from('cars')
              .select('*')
              .eq('seller_name', targetUser.email)
              .order('date_added', { ascending: false });
            
            console.log('Cars by email result:', { data: carsByEmail, error: carsByEmailError });
            if (carsByEmail) allCarListings.push(...carsByEmail);
          } catch (e) {
            console.error('Cars by email failed:', e);
          }
        }
        
        // Method 3: Try with username if available  
        if (targetUser?.username) {
          try {
            const { data: carsByUsername, error: carsByUsernameError } = await supabase
              .from('cars')
              .select('*')
              .eq('seller_name', targetUser.username)
              .order('date_added', { ascending: false });
            
            console.log('Cars by username result:', { data: carsByUsername, error: carsByUsernameError });
            if (carsByUsername) allCarListings.push(...carsByUsername);
          } catch (e) {
            console.error('Cars by username failed:', e);
          }
        }
      }
      
      // Try rental listings
      let allRentalListings = [];
      
      try {
        const { data: rentalsByUserId, error: rentalsByUserIdError } = await supabase
          .from('rental_listings')
          .select('*')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false });
        
        console.log('Rentals by user ID result:', { data: rentalsByUserId, error: rentalsByUserIdError });
        if (rentalsByUserId) allRentalListings.push(...rentalsByUserId);
      } catch (e) {
        console.error('Rentals by user ID failed:', e);
      }

      const allListings = [
        ...allCarListings.map(listing => ({ ...listing, type: 'car' })),
        ...allRentalListings.map(listing => ({ ...listing, type: 'rental' }))
      ];

      // Remove duplicates based on ID and type
      const uniqueListings = allListings.filter((listing, index, self) => 
        index === self.findIndex(l => l.id === listing.id && l.type === listing.type)
      );

      // Sort all listings by date (use appropriate date field for each type)
      uniqueListings.sort((a, b) => {
        const dateA = a.type === 'car' ? new Date(a.date_added || a.created_at) : new Date(a.created_at);
        const dateB = b.type === 'car' ? new Date(b.date_added || b.created_at) : new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

      console.log('Final unique listings found:', uniqueListings.length, uniqueListings);
      
      // If we still have no listings, add some debug info
      if (uniqueListings.length === 0) {
        console.log('No listings found. Debug info:');
        console.log('- User ID used for search:', userId);
        console.log('- User email:', targetUser?.email);
        console.log('- User username:', targetUser?.username);
        console.log('- Cars error:', carsError);
        console.log('- Total car listings found:', allCarListings.length);
        console.log('- Total rental listings found:', allRentalListings.length);
      }
      
      setUserListings(uniqueListings);
    } catch (error: any) {
      console.error('Error fetching listings:', error);
      toast({
        title: "Error fetching listings",
        description: error.message || "Failed to load user listings",
        variant: "destructive",
      });
    } finally {
      setIsLoadingListings(false);
    }
  };

  const openListingsDialog = async (user: UserProfile) => {
    setSelectedUser(user);
    setShowListingsDialog(true);
    // Pass the user object directly instead of relying on state
    await fetchUserListings(user.id, user);
  };

  const handleToggleListingStatus = async (listing: any, listingType: 'car' | 'rental') => {
    try {
      const table = listingType === 'car' ? 'cars' : 'rental_listings';
      const statusField = listingType === 'car' ? 'status' : 'availability_status';
      const currentStatus = listing[statusField];
      
      let newStatus;
      if (listingType === 'car') {
        newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      } else {
        newStatus = currentStatus === 'available' ? 'inactive' : 'available';
      }

      const { error } = await supabase
        .from(table)
        .update({ [statusField]: newStatus })
        .eq('id', listing.id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Listing is now ${newStatus}`,
      });

      // Refresh the listings
      if (selectedUser) {
        await fetchUserListings(selectedUser.id, selectedUser);
      }
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteListing = async () => {
    if (!listingToDelete) return;

    try {
      const { listing, type: listingType } = listingToDelete;
      const table = listingType === 'car' ? 'cars' : 'rental_listings';

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', listing.id);

      if (error) throw error;

      toast({
        title: "Listing deleted",
        description: "Listing has been removed successfully",
      });

      // Refresh the listings
      if (selectedUser) {
        await fetchUserListings(selectedUser.id, selectedUser);
      }

      setShowDeleteListingDialog(false);
      setListingToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error deleting listing",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openDeleteListingDialog = (listing: any, listingType: 'car' | 'rental') => {
    setListingToDelete({ listing, type: listingType });
    setShowDeleteListingDialog(true);
  };

  const handleViewListingDetails = (listing: any, listingType: 'car' | 'rental') => {
    // Navigate to the specific listing page
    const basePath = listingType === 'car' ? '/dashboard/listings' : '/dashboard/rentals';
    window.open(`${basePath}?id=${listing.id}`, '_blank');
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (data: AddUserForm) => {
    try {
      setIsSubmitting(true);

      // Create user in auth.users (this would typically be done via Supabase Auth)
      // For now, we'll add directly to the users table
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([
          {
            email: data.email,
            username: data.username,
            phone: data.phone || null,
            role: data.role,
            is_active: data.is_active,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "User created successfully",
      });

      setShowAddDialog(false);
      addForm.reset();
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (data: EditUserForm) => {
    if (!selectedUser) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('users')
        .update({
          username: data.username,
          phone: data.phone || null,
          role: data.role,
          is_active: data.is_active,
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setShowEditDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleToggleUserStatus = async (user: UserProfile) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${!user.is_active ? 'activated' : 'suspended'} successfully`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const handleBulkAction = async (action: 'activate' | 'suspend' | 'delete') => {
    const selectedRowIds = Object.keys(rowSelection);
    const selectedUsers = users.filter((_, index) => selectedRowIds.includes(index.toString()));

    if (selectedUsers.length === 0) {
      toast({
        title: "No selection",
        description: "Please select users to perform bulk action",
        variant: "destructive",
      });
      return;
    }

    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('users')
          .delete()
          .in('id', selectedUsers.map(u => u.id));

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('users')
          .update({ is_active: action === 'activate' })
          .in('id', selectedUsers.map(u => u.id));

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `${selectedUsers.length} users ${action}d successfully`,
      });

      setRowSelection({});
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} users`,
        variant: "destructive",
      });
    }
  };

  const handleExportUsers = () => {
    const csvHeaders = ['ID', 'Email', 'Username', 'Phone', 'Role', 'Status', 'Created At'];
    const csvData = users.map(user => [
      user.id,
      user.email,
      user.username || '',
      user.phone || '',
      user.role,
      user.is_active ? 'Active' : 'Inactive',
      new Date(user.created_at).toLocaleDateString()
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: "Users exported successfully",
    });
  };

  const openEditDialog = (user: UserProfile) => {
    setSelectedUser(user);
    editForm.reset({
      username: user.username || '',
      phone: user.phone || '',
      role: user.role as "user" | "admin" | "moderator",
      is_active: user.is_active,
    });
    setShowEditDialog(true);
  };

  const openDetailsDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
  };

  const columns: ColumnDef<UserProfile>[] = [
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
      accessorKey: "username",
      header: "Name",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.profile_picture_url || undefined} alt={user.username || user.email} />
              <AvatarFallback>{(user.username || user.email).charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.username || 'N/A'}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Role
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return (
          <Badge
            variant="outline"
            className={
              role === "admin"
                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            }
          >
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => {
        const phone = row.getValue("phone") as string;
        return <div>{phone || 'N/A'}</div>;
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean;
        return (
          <div className="flex items-center">
            <div
              className={`mr-2 h-2 w-2 rounded-full ${
                isActive ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="capitalize">{isActive ? "active" : "inactive"}</span>
          </div>
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
            Created At
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return <div>{date.toLocaleDateString()}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;

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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                <Mail className="mr-2 h-4 w-4" />
                Copy user ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openDetailsDialog(user)}>
                <Eye className="mr-2 h-4 w-4" />
                View user details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit user
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openListingsDialog(user)}>
                <Shield className="mr-2 h-4 w-4" />
                View listings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}>
                {user.is_active ? (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    Suspend user
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Activate user
                  </>
                )}
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete user
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the user account for {user.username || user.email}. 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteUser(user.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: users,
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>
      
      <div className="rounded-md border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Filter users..."
              value={(table.getColumn("username")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("username")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            {Object.keys(rowSelection).length > 0 && (
              <div className="flex items-center gap-2">
                <Separator orientation="vertical" className="h-6" />
                <span className="text-sm text-muted-foreground">
                  {Object.keys(rowSelection).length} selected
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Bulk Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Activate Users
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('suspend')}>
                      <UserX className="mr-2 h-4 w-4" />
                      Suspend Users
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleBulkAction('delete')}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Users
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
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
            <Button variant="outline" onClick={handleExportUsers}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
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
                  Loading users...
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
                  No users found.
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

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. They will receive an email invitation to set up their password.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddUser)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="user@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="john_doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <div className="text-[0.8rem] text-muted-foreground">
                        User can access the platform
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditUser)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="john_doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <div className="text-[0.8rem] text-muted-foreground">
                        User can access the platform
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedUser?.username || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.profile_picture_url || undefined} />
                  <AvatarFallback className="text-lg">
                    {(selectedUser.username || selectedUser.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.username || 'N/A'}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <Badge
                    variant="outline"
                    className={
                      selectedUser.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-green-100 text-green-800"
                    }
                  >
                    {selectedUser.role}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p className="text-sm text-muted-foreground">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <p className="text-sm text-muted-foreground">
                    <span className={`inline-flex items-center gap-1 ${selectedUser.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      <span className={`h-2 w-2 rounded-full ${selectedUser.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                      {selectedUser.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Created</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedUser.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Updated</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedUser.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">User ID</label>
                <p className="text-xs text-muted-foreground font-mono">{selectedUser.id}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              if (selectedUser) {
                openEditDialog(selectedUser);
                setShowDetailsDialog(false);
              }
            }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Listings Dialog */}
      <Dialog open={showListingsDialog} onOpenChange={setShowListingsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Listings by {selectedUser?.username || selectedUser?.email}
            </DialogTitle>
            <DialogDescription>
              All car and rental listings posted by this user
              {userListings.length > 0 && (
                <span className="ml-2 text-sm">
                  ({userListings.filter(l => l.type === 'car').length} cars, {userListings.filter(l => l.type === 'rental').length} rentals)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-auto max-h-[60vh]">
            {isLoadingListings ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : userListings.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No listings found for this user
              </div>
            ) : (
              <div className="space-y-4">
                {userListings.map((listing) => (
                  <div key={`${listing.type}-${listing.id}`} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={listing.type === 'car' ? 'default' : 'secondary'}>
                            {listing.type === 'car' ? 'Car Sale' : 'Rental'}
                          </Badge>
                          <Badge 
                            variant={listing.status === 'active' || listing.availability_status === 'available' ? 'default' : 'destructive'}
                          >
                            {listing.status || listing.availability_status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleListingStatus(listing, listing.type)}
                            className="ml-2"
                          >
                            {listing.status === 'active' || listing.availability_status === 'available' ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                        
                        <h3 className="font-semibold text-lg">
                          {listing.make} {listing.model} {listing.year}
                        </h3>
                        
                        <div className="text-sm text-muted-foreground mt-1">
                          {listing.type === 'car' ? (
                            <>
                              <p>Price: ${listing.price?.toLocaleString()}</p>
                              <p>Mileage: {listing.mileage?.toLocaleString()} miles</p>
                              <p>Classification: {listing.classification}</p>
                            </>
                          ) : (
                            <>
                              <p>Price: ${listing.price_per_day}/day</p>
                              <p>Location: {listing.location || 'Not specified'}</p>
                              <p>Min/Max Days: {listing.min_rental_days}-{listing.max_rental_days}</p>
                            </>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          Posted: {new Date(listing.type === 'car' ? (listing.date_added || listing.created_at) : listing.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="ml-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewListingDetails(listing, listing.type)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              // Navigate to edit page
                              const basePath = listing.type === 'car' ? '/dashboard/listings' : '/dashboard/rentals';
                              window.open(`${basePath}?edit=${listing.id}`, '_blank');
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit listing
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleToggleListingStatus(listing, listing.type)}
                            >
                              {listing.status === 'active' || listing.availability_status === 'available' ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Deactivate listing
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activate listing
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => openDeleteListingDialog(listing, listing.type)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete listing
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                if (selectedUser) {
                  fetchUserListings(selectedUser.id, selectedUser);
                }
              }}
              disabled={isLoadingListings}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => setShowListingsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Listing Confirmation Dialog */}
      <AlertDialog open={showDeleteListingDialog} onOpenChange={setShowDeleteListingDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {listingToDelete?.type} listing? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setListingToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteListing}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Listing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}