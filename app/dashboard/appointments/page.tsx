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
  Calendar,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Phone
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface Appointment {
  id: string;
  car_id: string;
  user_id: string;
  date: string;
  time: string;
  status: string;
  notes: string | null;
  service_type?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  car_make?: string;
  car_model?: string;
  car_year?: number;
  customer_name?: string;
  customer_phone?: string;
}

export default function AppointmentsPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      
      // Get appointments with car data
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          cars(make, model, year)
        `)
        .order('date', { ascending: false });

      if (appointmentsError) {
        throw appointmentsError;
      }

      // Then get user information for each appointment
      const appointmentsList: Appointment[] = [];
      
      for (const appointment of appointmentsData || []) {
        try {
          // Try to get user info from profiles table (matching admin schema)
          const { data: userData } = await supabase
            .from('profiles')
            .select('full_name, id')
            .eq('id', appointment.user_id)
            .single();
          
          appointmentsList.push({
            ...appointment,
            car_make: appointment.cars?.make || 'Unknown',
            car_model: appointment.cars?.model || 'Unknown',
            car_year: appointment.cars?.year || 0,
            customer_name: userData?.full_name || 'Unknown Customer',
            customer_phone: 'N/A', // Phone not available in profiles table
          });
        } catch (userError) {
          // If user lookup fails, just use unknown customer
          appointmentsList.push({
            ...appointment,
            car_make: appointment.cars?.make || 'Unknown',
            car_model: appointment.cars?.model || 'Unknown',
            car_year: appointment.cars?.year || 0,
            customer_name: 'Unknown Customer',
            customer_phone: 'N/A',
          });
        }
      }

      setAppointments(appointmentsList);
    } catch (error: any) {
      toast({
        title: "Error fetching appointments",
        description: error.message || "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: newStatus
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Appointment status changed to ${newStatus}`,
      });
      
      fetchAppointments();
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<Appointment>[] = [
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
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date & Time
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const appointment = row.original;
        const date = new Date(appointment.date);
        const time = appointment.time;
        
        // Check if appointment is today
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        
        // Check if appointment is upcoming
        const appointmentDateTime = new Date(`${appointment.date}T${time}`);
        const isUpcoming = appointmentDateTime > today;
        
        return (
          <div>
            <div className={`font-medium ${isToday ? 'text-blue-600' : ''}`}>
              {date.toLocaleDateString()}
            </div>
            <div className={`text-sm flex items-center gap-1 ${isUpcoming ? 'text-green-600' : 'text-muted-foreground'}`}>
              <Clock className="h-3 w-3" />
              {time}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "car_make",
      header: "Vehicle",
      cell: ({ row }) => {
        const appointment = row.original;
        return (
          <div>
            <div className="font-medium">
              {appointment.car_make} {appointment.car_model}
            </div>
            <div className="text-sm text-muted-foreground">
              {appointment.car_year}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "customer_name",
      header: "Customer",
      cell: ({ row }) => {
        const appointment = row.original;
        return (
          <div>
            <div className="font-medium">{appointment.customer_name}</div>
            {appointment.customer_phone !== 'N/A' && (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {appointment.customer_phone}
              </div>
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
        
        const statusConfig = {
          scheduled: { 
            color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
            icon: Clock 
          },
          completed: { 
            color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
            icon: CheckCircle 
          },
          cancelled: { 
            color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
            icon: XCircle 
          }
        };
        
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
        const IconComponent = config.icon;
        
        return (
          <Badge variant="outline" className={config.color}>
            <IconComponent className="w-3 h-3 mr-1" />
            {status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => {
        const notes = row.getValue("notes") as string;
        return (
          <div className="max-w-40 truncate" title={notes || ''}>
            {notes || <span className="text-muted-foreground">No notes</span>}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Booked",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return <div className="text-sm">{date.toLocaleDateString()}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const appointment = row.original;

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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(appointment.id)}>
                Copy appointment ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                View details
              </DropdownMenuItem>
              <DropdownMenuItem>
                Contact customer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {appointment.status === 'scheduled' && (
                <DropdownMenuItem onClick={() => handleStatusUpdate(appointment.id, 'completed')}>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Mark completed
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}>
                <XCircle className="mr-2 h-4 w-4 text-red-500" />
                Cancel appointment
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Reschedule
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: appointments,
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
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            Manage car viewing appointments and schedules
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAppointments}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            Calendar View
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today's Appointments</p>
              <p className="text-2xl font-bold">
                {appointments.filter(apt => {
                  const today = new Date().toDateString();
                  const aptDate = new Date(apt.date).toDateString();
                  return aptDate === today;
                }).length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold text-yellow-600">
                {appointments.filter(apt => apt.status === 'scheduled').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {appointments.filter(apt => apt.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold">
                {appointments.filter(apt => {
                  const weekFromNow = new Date();
                  weekFromNow.setDate(weekFromNow.getDate() + 7);
                  const aptDate = new Date(apt.date);
                  return aptDate <= weekFromNow && aptDate >= new Date();
                }).length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
      </div>
      
      <div className="rounded-md border">
        <div className="flex items-center justify-between p-4">
          <Input
            placeholder="Search appointments..."
            value={(table.getColumn("customer_name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("customer_name")?.setFilterValue(event.target.value)
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
            <Button variant="outline">Export</Button>
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
                  Loading appointments...
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
                  No appointments found.
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
    </div>
  );
}