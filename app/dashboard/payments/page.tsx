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
  CreditCard,
  Building,
  Plus,
  Edit,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  TrendingUp,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface PaymentGateway {
  id: string;
  name: string;
  type: 'mobile_money' | 'bank_transfer' | 'card' | 'crypto' | 'other';
  is_enabled: boolean;
  configuration: any;
  fees_percentage: number;
  fees_fixed: number;
  min_amount: number | null;
  max_amount: number | null;
  supported_currencies: string[];
  logo_url: string | null;
  instructions: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string;
  account_number: string;
  branch_name: string | null;
  swift_code: string | null;
  currency: string;
  is_primary: boolean;
  is_active: boolean;
  instructions: string | null;
  created_at: string;
  updated_at: string;
}

interface PaymentTransaction {
  id: string;
  user_id: string;
  gateway_id: string | null;
  transaction_type: string;
  reference_id: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  transaction_ref: string | null;
  payment_details: any;
  error_message: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  gateway?: PaymentGateway;
}

export default function PaymentsPage() {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("gateways");
  const [showBankDialog, setShowBankDialog] = useState(false);
  const [showGatewayDialog, setShowGatewayDialog] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Form states for bank account
  const [bankForm, setBankForm] = useState({
    account_name: '',
    bank_name: '',
    account_number: '',
    branch_name: '',
    swift_code: '',
    currency: 'USD',
    is_primary: false,
    is_active: true,
    instructions: '',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch gateways
      const { data: gatewaysData, error: gatewaysError } = await supabase
        .from('payment_gateways')
        .select('*')
        .order('sort_order', { ascending: true });

      if (gatewaysError) throw gatewaysError;
      setGateways(gatewaysData || []);

      // Fetch bank accounts
      const { data: banksData, error: banksError } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (banksError) throw banksError;
      setBankAccounts(banksData || []);

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          gateway:payment_gateways(name, type)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

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

  const handleSaveBank = async () => {
    try {
      if (isEditing && selectedBank) {
        const { error } = await supabase
          .from('bank_accounts')
          .update({
            ...bankForm,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedBank.id);

        if (error) throw error;
        toast({ title: "Bank account updated successfully" });
      } else {
        const { error } = await supabase
          .from('bank_accounts')
          .insert([bankForm]);

        if (error) throw error;
        toast({ title: "Bank account added successfully" });
      }

      setShowBankDialog(false);
      setBankForm({
        account_name: '',
        bank_name: '',
        account_number: '',
        branch_name: '',
        swift_code: '',
        currency: 'USD',
        is_primary: false,
        is_active: true,
        instructions: '',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error saving bank account",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleGateway = async (gatewayId: string, isEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('payment_gateways')
        .update({
          is_enabled: !isEnabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', gatewayId);

      if (error) throw error;
      toast({ title: `Gateway ${!isEnabled ? 'enabled' : 'disabled'}` });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error updating gateway",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleBankStatus = async (bankId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({
          is_active: !isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', bankId);

      if (error) throw error;
      toast({ title: `Bank account ${!isActive ? 'activated' : 'deactivated'}` });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error updating bank account",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteBank = async (bankId: string) => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', bankId);

      if (error) throw error;
      toast({ title: "Bank account deleted" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error deleting bank account",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.pending;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      mobile_money: <CreditCard className="h-4 w-4" />,
      bank_transfer: <Building className="h-4 w-4" />,
      card: <CreditCard className="h-4 w-4" />,
      crypto: <DollarSign className="h-4 w-4" />,
      other: <DollarSign className="h-4 w-4" />,
    };
    return icons[type] || icons.other;
  };

  const gatewayColumns: ColumnDef<PaymentGateway>[] = [
    {
      accessorKey: "name",
      header: "Gateway Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getTypeIcon(row.original.type)}
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.type.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "fees",
      header: "Fees",
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{row.original.fees_percentage}%</div>
          <div className="text-muted-foreground">+ ${row.original.fees_fixed.toFixed(2)}</div>
        </div>
      ),
    },
    {
      accessorKey: "supported_currencies",
      header: "Currencies",
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.supported_currencies.map(curr => (
            <Badge key={curr} variant="outline" className="text-xs">{curr}</Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "is_enabled",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.is_enabled ? "default" : "outline"}>
          {row.original.is_enabled ? "Enabled" : "Disabled"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const gateway = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleToggleGateway(gateway.id, gateway.is_enabled)}>
                {gateway.is_enabled ? 'Disable' : 'Enable'} Gateway
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const bankColumns: ColumnDef<BankAccount>[] = [
    {
      accessorKey: "bank_name",
      header: "Bank",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.bank_name}</div>
          <div className="text-sm text-muted-foreground">{row.original.branch_name || 'No branch'}</div>
        </div>
      ),
    },
    {
      accessorKey: "account_name",
      header: "Account Name",
    },
    {
      accessorKey: "account_number",
      header: "Account Number",
      cell: ({ row }) => (
        <span className="font-mono">{row.original.account_number}</span>
      ),
    },
    {
      accessorKey: "currency",
      header: "Currency",
      cell: ({ row }) => <Badge variant="outline">{row.original.currency}</Badge>,
    },
    {
      accessorKey: "is_primary",
      header: "Primary",
      cell: ({ row }) => row.original.is_primary ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-gray-400" />
      ),
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
        const bank = row.original;
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
                setSelectedBank(bank);
                setBankForm({
                  account_name: bank.account_name,
                  bank_name: bank.bank_name,
                  account_number: bank.account_number,
                  branch_name: bank.branch_name || '',
                  swift_code: bank.swift_code || '',
                  currency: bank.currency,
                  is_primary: bank.is_primary,
                  is_active: bank.is_active,
                  instructions: bank.instructions || '',
                });
                setIsEditing(true);
                setShowBankDialog(true);
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleBankStatus(bank.id, bank.is_active)}>
                {bank.is_active ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleDeleteBank(bank.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const transactionColumns: ColumnDef<PaymentTransaction>[] = [
    {
      accessorKey: "transaction_ref",
      header: "Transaction ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.transaction_ref || row.original.id.slice(0, 8) + '...'}
        </span>
      ),
    },
    {
      accessorKey: "gateway",
      header: "Gateway",
      cell: ({ row }) => row.original.gateway?.name || 'N/A',
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.currency} ${row.original.amount.toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "transaction_type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.transaction_type.toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={getStatusColor(row.original.status)}>
          {row.original.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
    },
  ];

  const gatewayTable = useReactTable({
    data: gateways,
    columns: gatewayColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const bankTable = useReactTable({
    data: bankAccounts,
    columns: bankColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const transactionTable = useReactTable({
    data: transactions,
    columns: transactionColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Calculate stats
  const stats = {
    totalRevenue: transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0),
    pendingAmount: transactions
      .filter(t => t.status === 'pending' || t.status === 'processing')
      .reduce((sum, t) => sum + t.amount, 0),
    successRate: transactions.length > 0
      ? (transactions.filter(t => t.status === 'completed').length / transactions.length) * 100
      : 0,
    totalTransactions: transactions.length,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Configuration</h1>
          <p className="text-muted-foreground">
            Manage payment gateways, bank accounts, and transactions
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
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
            <p className="text-xs text-muted-foreground">Completed transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pendingAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Transaction success</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="gateways">Payment Gateways ({gateways.length})</TabsTrigger>
          <TabsTrigger value="banks">Bank Accounts ({bankAccounts.length})</TabsTrigger>
          <TabsTrigger value="transactions">Transactions ({transactions.length})</TabsTrigger>
        </TabsList>

        {/* Payment Gateways Tab */}
        <TabsContent value="gateways">
          <Card>
            <CardHeader>
              <CardTitle>Payment Gateways</CardTitle>
              <CardDescription>Configure available payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  {gatewayTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {gatewayTable.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Accounts Tab */}
        <TabsContent value="banks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bank Accounts</CardTitle>
                <CardDescription>Manage bank transfer accounts</CardDescription>
              </div>
              <Button onClick={() => {
                setIsEditing(false);
                setSelectedBank(null);
                setBankForm({
                  account_name: '',
                  bank_name: '',
                  account_number: '',
                  branch_name: '',
                  swift_code: '',
                  currency: 'USD',
                  is_primary: false,
                  is_active: true,
                  instructions: '',
                });
                setShowBankDialog(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Bank Account
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  {bankTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {bankTable.getRowModel().rows.length ? (
                    bankTable.getRowModel().rows.map((row) => (
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
                      <TableCell colSpan={bankColumns.length} className="h-24 text-center">
                        No bank accounts configured. Click "Add Bank Account" to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Payment transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  {transactionTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {transactionTable.getRowModel().rows.length ? (
                    transactionTable.getRowModel().rows.map((row) => (
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
                      <TableCell colSpan={transactionColumns.length} className="h-24 text-center">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => transactionTable.previousPage()}
                  disabled={!transactionTable.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => transactionTable.nextPage()}
                  disabled={!transactionTable.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Bank Account Dialog */}
      <Dialog open={showBankDialog} onOpenChange={setShowBankDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit' : 'Add'} Bank Account</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update' : 'Configure new'} bank account details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account_name">Account Name</Label>
                <Input
                  id="account_name"
                  value={bankForm.account_name}
                  onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value })}
                  placeholder="Mr Cars Platform"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={bankForm.bank_name}
                  onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                  placeholder="Standard Bank"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={bankForm.account_number}
                  onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                  placeholder="1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch_name">Branch Name</Label>
                <Input
                  id="branch_name"
                  value={bankForm.branch_name}
                  onChange={(e) => setBankForm({ ...bankForm, branch_name: e.target.value })}
                  placeholder="Main Branch"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="swift_code">SWIFT Code (Optional)</Label>
                <Input
                  id="swift_code"
                  value={bankForm.swift_code}
                  onChange={(e) => setBankForm({ ...bankForm, swift_code: e.target.value })}
                  placeholder="SBICZAHX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={bankForm.currency}
                  onValueChange={(value) => setBankForm({ ...bankForm, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="ZWL">ZWL</SelectItem>
                    <SelectItem value="ZAR">ZAR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions for Users</Label>
              <Textarea
                id="instructions"
                value={bankForm.instructions}
                onChange={(e) => setBankForm({ ...bankForm, instructions: e.target.value })}
                placeholder="Instructions for making bank transfers..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_primary"
                checked={bankForm.is_primary}
                onCheckedChange={(checked) => setBankForm({ ...bankForm, is_primary: checked })}
              />
              <Label htmlFor="is_primary">Set as primary account</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={bankForm.is_active}
                onCheckedChange={(checked) => setBankForm({ ...bankForm, is_active: checked })}
              />
              <Label htmlFor="is_active">Account is active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBankDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBank}>
              {isEditing ? 'Update' : 'Add'} Bank Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
