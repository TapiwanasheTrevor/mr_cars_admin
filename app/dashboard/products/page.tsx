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
  Package,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
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

interface TireProduct {
  id: string;
  name: string;
  brand: string;
  size: string | null;
  price: number;
  rating: number;
  sales_count: number;
  description: string | null;
  image_url: string | null;
  in_stock: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BatteryProduct {
  id: string;
  name: string;
  brand: string;
  type: string | null;
  cca: number | null;
  price: number;
  rating: number;
  sales_count: number;
  description: string | null;
  image_url: string | null;
  in_stock: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ProductsPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [tires, setTires] = useState<TireProduct[]>([]);
  const [batteries, setBatteries] = useState<BatteryProduct[]>([]);
  const [isLoadingTires, setIsLoadingTires] = useState(true);
  const [isLoadingBatteries, setIsLoadingBatteries] = useState(true);
  const [activeTab, setActiveTab] = useState("tires");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'tire' | 'battery'} | null>(null);
  const { toast } = useToast();

  const fetchTires = async () => {
    try {
      setIsLoadingTires(true);
      
      const { data, error } = await supabase
        .from('tire_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTires(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching tires",
        description: error.message || "Failed to load tire products",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTires(false);
    }
  };

  const fetchBatteries = async () => {
    try {
      setIsLoadingBatteries(true);
      
      const { data, error } = await supabase
        .from('battery_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setBatteries(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching batteries",
        description: error.message || "Failed to load battery products",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBatteries(false);
    }
  };

  useEffect(() => {
    fetchTires();
    fetchBatteries();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: boolean, type: 'tire' | 'battery') => {
    try {
      const table = type === 'tire' ? 'tire_products' : 'battery_products';
      const { error } = await supabase
        .from(table)
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Product is now ${!currentStatus ? 'active' : 'inactive'}`,
      });
      
      if (type === 'tire') {
        fetchTires();
      } else {
        fetchBatteries();
      }
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleStock = async (id: string, currentStock: boolean, type: 'tire' | 'battery') => {
    try {
      const table = type === 'tire' ? 'tire_products' : 'battery_products';
      const { error } = await supabase
        .from(table)
        .update({ in_stock: !currentStock })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Stock updated",
        description: `Product is now ${!currentStock ? 'in stock' : 'out of stock'}`,
      });
      
      if (type === 'tire') {
        fetchTires();
      } else {
        fetchBatteries();
      }
    } catch (error: any) {
      toast({
        title: "Error updating stock",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const table = itemToDelete.type === 'tire' ? 'tire_products' : 'battery_products';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      toast({
        title: "Product deleted",
        description: "Product has been removed successfully",
      });
      
      if (itemToDelete.type === 'tire') {
        fetchTires();
      } else {
        fetchBatteries();
      }
    } catch (error: any) {
      toast({
        title: "Error deleting product",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setItemToDelete(null);
    }
  };

  const openDeleteDialog = (id: string, type: 'tire' | 'battery') => {
    setItemToDelete({ id, type });
    setShowDeleteDialog(true);
  };

  const tireColumns: ColumnDef<TireProduct>[] = [
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
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Product
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const tire = row.original;
        return (
          <div>
            <div className="font-medium">{tire.name}</div>
            <div className="text-sm text-muted-foreground">
              {tire.brand} • {tire.size}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Price
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("price"));
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(price);

        return <div className="font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => {
        const rating = row.getValue("rating") as number;
        return (
          <div className="flex items-center">
            <span className="text-yellow-500">★</span>
            <span className="ml-1">{rating.toFixed(1)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "sales_count",
      header: "Sales",
      cell: ({ row }) => {
        const sales = row.getValue("sales_count") as number;
        return <div>{sales}</div>;
      },
    },
    {
      accessorKey: "in_stock",
      header: "Stock",
      cell: ({ row }) => {
        const inStock = row.getValue("in_stock") as boolean;
        return (
          <Badge
            variant="outline"
            className={
              inStock
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
            }
          >
            {inStock ? "In Stock" : "Out of Stock"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean;
        return (
          <Badge
            variant="outline"
            className={
              isActive
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
            }
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const tire = row.original;

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
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit product
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleToggleStatus(tire.id, tire.is_active, 'tire')}>
                {tire.is_active ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleStock(tire.id, tire.in_stock, 'tire')}>
                {tire.in_stock ? 'Mark Out of Stock' : 'Mark In Stock'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => openDeleteDialog(tire.id, 'tire')}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const batteryColumns: ColumnDef<BatteryProduct>[] = [
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
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Product
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const battery = row.original;
        return (
          <div>
            <div className="font-medium">{battery.name}</div>
            <div className="text-sm text-muted-foreground">
              {battery.brand} • {battery.type} • {battery.cca} CCA
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Price
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("price"));
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(price);

        return <div className="font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => {
        const rating = row.getValue("rating") as number;
        return (
          <div className="flex items-center">
            <span className="text-yellow-500">★</span>
            <span className="ml-1">{rating.toFixed(1)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "sales_count",
      header: "Sales",
      cell: ({ row }) => {
        const sales = row.getValue("sales_count") as number;
        return <div>{sales}</div>;
      },
    },
    {
      accessorKey: "in_stock",
      header: "Stock",
      cell: ({ row }) => {
        const inStock = row.getValue("in_stock") as boolean;
        return (
          <Badge
            variant="outline"
            className={
              inStock
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
            }
          >
            {inStock ? "In Stock" : "Out of Stock"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean;
        return (
          <Badge
            variant="outline"
            className={
              isActive
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
            }
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const battery = row.original;

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
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit product
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleToggleStatus(battery.id, battery.is_active, 'battery')}>
                {battery.is_active ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleStock(battery.id, battery.in_stock, 'battery')}>
                {battery.in_stock ? 'Mark Out of Stock' : 'Mark In Stock'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => openDeleteDialog(battery.id, 'battery')}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const tireTable = useReactTable({
    data: tires,
    columns: tireColumns,
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

  const batteryTable = useReactTable({
    data: batteries,
    columns: batteryColumns,
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

  const currentTireTable = tireTable;
  const currentBatteryTable = batteryTable;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage tire and battery inventory
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            if (activeTab === "tires") {
              fetchTires();
            } else {
              fetchBatteries();
            }
          }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tires">Tires ({tires.length})</TabsTrigger>
          <TabsTrigger value="batteries">Batteries ({batteries.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tires">
          <div className="rounded-md border">
            <div className="flex items-center justify-between p-4">
              <Input
                placeholder="Search tires..."
                value={(currentTireTable.getColumn("name")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  currentTireTable.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Columns</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {currentTireTable
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
                {currentTireTable.getHeaderGroups().map((headerGroup) => (
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
                {isLoadingTires ? (
                  <TableRow>
                    <TableCell colSpan={tireColumns.length} className="h-24 text-center">
                      Loading products...
                    </TableCell>
                  </TableRow>
                ) : currentTireTable.getRowModel().rows?.length ? (
                  currentTireTable.getRowModel().rows.map((row) => (
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
                    <TableCell colSpan={tireColumns.length} className="h-24 text-center">
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-2 p-4">
              <div className="flex-1 text-sm text-muted-foreground">
                {currentTireTable.getFilteredSelectedRowModel().rows.length} of{" "}
                {currentTireTable.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => currentTireTable.previousPage()}
                  disabled={!currentTireTable.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => currentTireTable.nextPage()}
                  disabled={!currentTireTable.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="batteries">
          <div className="rounded-md border">
            <div className="flex items-center justify-between p-4">
              <Input
                placeholder="Search batteries..."
                value={(currentBatteryTable.getColumn("name")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  currentBatteryTable.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Columns</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {currentBatteryTable
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
                {currentBatteryTable.getHeaderGroups().map((headerGroup) => (
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
                {isLoadingBatteries ? (
                  <TableRow>
                    <TableCell colSpan={batteryColumns.length} className="h-24 text-center">
                      Loading products...
                    </TableCell>
                  </TableRow>
                ) : currentBatteryTable.getRowModel().rows?.length ? (
                  currentBatteryTable.getRowModel().rows.map((row) => (
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
                    <TableCell colSpan={batteryColumns.length} className="h-24 text-center">
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-2 p-4">
              <div className="flex-1 text-sm text-muted-foreground">
                {currentBatteryTable.getFilteredSelectedRowModel().rows.length} of{" "}
                {currentBatteryTable.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => currentBatteryTable.previousPage()}
                  disabled={!currentBatteryTable.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => currentBatteryTable.nextPage()}
                  disabled={!currentBatteryTable.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              and remove all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setItemToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}