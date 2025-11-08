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
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  AlertCircle,
  FileText,
  Download,
  DollarSign,
  User,
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

interface PaymentTransaction {
  id: string;
  user_id: string;
  gateway_id: string | null;
  transaction_type: 'subscription' | 'listing' | 'product' | 'service' | 'other';
  reference_id: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  payment_method: string | null;
  transaction_ref: string | null;
  payment_details: any;
  error_message: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  gateway?: {
    name: string;
    type: string;
  };
  user?: {
    username: string;
    email: string;
  };
  subscription?: {
    plan_id: string;
    plan_name: string;
  };
}

export default function PaymentVerificationPage() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const { toast } = useToast();

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          gateway:payment_gateways(name, type)
        `)
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Fetch user data
      if (transactionsData && transactionsData.length > 0) {
        const userIds = Array.from(new Set(transactionsData.map(t => t.user_id)));
        const { data: usersData } = await supabase
          .from('users')
          .select('id, username, email')
          .in('id', userIds);

        if (usersData) {
          const usersMap = new Map(usersData.map(u => [u.id, u]));
          transactionsData.forEach(txn => {
            txn.user = usersMap.get(txn.user_id);
          });
        }

        // Fetch subscription data for subscription payments
        const subscriptionTxns = transactionsData.filter(t => t.transaction_type === 'subscription' && t.reference_id);
        if (subscriptionTxns.length > 0) {
          const subscriptionIds = subscriptionTxns.map(t => t.reference_id).filter(Boolean);
          const { data: subscriptionsData } = await supabase
            .from('user_subscriptions')
            .select('id, plan_id, subscription_plans(name)')
            .in('id', subscriptionIds);

          if (subscriptionsData) {
            const subsMap = new Map(subscriptionsData.map(s => [s.id, s]));
            transactionsData.forEach(txn => {
              if (txn.reference_id && txn.transaction_type === 'subscription') {
                const sub = subsMap.get(txn.reference_id);
                if (sub) {
                  txn.subscription = {
                    plan_id: sub.plan_id,
                    plan_name: (sub as any).subscription_plans?.name || 'Unknown',
                  };
                }
              }
            });
          }
        }
      }

      setTransactions(transactionsData || []);
    } catch (error: any) {
      toast({
        title: "Error fetching transactions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleApprovePayment = async () => {
    if (!selectedTransaction) return;

    try {
      // Update transaction status
      const { error: txnError } = await supabase
        .from('payment_transactions')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          payment_details: {
            ...(selectedTransaction.payment_details || {}),
            admin_notes: adminNotes,
            verified_by: 'admin',
            verified_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedTransaction.id);

      if (txnError) throw txnError;

      // If this is a subscription payment, activate the subscription
      if (selectedTransaction.transaction_type === 'subscription' && selectedTransaction.reference_id) {
        const { error: subError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedTransaction.reference_id);

        if (subError) throw subError;
      }

      toast({
        title: "Payment approved",
        description: "Transaction has been verified and completed successfully",
      });

      setShowApproveDialog(false);
      setSelectedTransaction(null);
      setAdminNotes("");
      fetchTransactions();
    } catch (error: any) {
      toast({
        title: "Error approving payment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedTransaction) return;

    try {
      const { error } = await supabase
        .from('payment_transactions')
        .update({
          status: 'failed',
          error_message: rejectionReason,
          payment_details: {
            ...(selectedTransaction.payment_details || {}),
            rejection_reason: rejectionReason,
            rejected_by: 'admin',
            rejected_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedTransaction.id);

      if (error) throw error;

      toast({
        title: "Payment rejected",
        description: "User will be notified of the rejection",
      });

      setShowRejectDialog(false);
      setSelectedTransaction(null);
      setRejectionReason("");
      fetchTransactions();
    } catch (error: any) {
      toast({
        title: "Error rejecting payment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openDetailsDialog = (transaction: PaymentTransaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsDialog(true);
  };

  const openApproveDialog = (transaction: PaymentTransaction) => {
    setSelectedTransaction(transaction);
    setShowApproveDialog(true);
  };

  const openRejectDialog = (transaction: PaymentTransaction) => {
    setSelectedTransaction(transaction);
    setShowRejectDialog(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      refunded: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    };
    return colors[status] || colors.pending;
  };

  const columns: ColumnDef<PaymentTransaction>[] = React.useMemo(() => [
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
        const txn = row.original;
        return (
          <div>
            <div className="font-medium">{txn.user?.username || 'Unknown'}</div>
            <div className="text-sm text-muted-foreground">{txn.user?.email || txn.user_id.slice(0, 8) + '...'}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const txn = row.original;
        return (
          <div className="font-medium">
            {txn.currency} ${txn.amount.toFixed(2)}
          </div>
        );
      },
    },
    {
      accessorKey: "gateway",
      header: "Payment Method",
      cell: ({ row }) => {
        const txn = row.original;
        return (
          <div>
            <div className="font-medium">{txn.gateway?.name || txn.payment_method || 'N/A'}</div>
            {txn.gateway?.type && (
              <Badge variant="outline" className="text-xs mt-1">
                {txn.gateway.type.replace('_', ' ').toUpperCase()}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "transaction_type",
      header: "Type",
      cell: ({ row }) => {
        const txn = row.original;
        return (
          <div>
            <Badge variant="outline">{txn.transaction_type.toUpperCase()}</Badge>
            {txn.subscription && (
              <div className="text-xs text-muted-foreground mt-1">
                {txn.subscription.plan_name}
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
        return (
          <Badge variant="outline" className={getStatusColor(status)}>
            {status.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
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
        const txn = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openDetailsDialog(txn)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {txn.status === 'pending' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => openApproveDialog(txn)}
                    className="text-green-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Payment
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => openRejectDialog(txn)}
                    className="text-red-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Payment
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(txn => {
      if (activeTab === "all") return true;
      return txn.status === activeTab;
    });
  }, [transactions, activeTab]);

  const table = useReactTable({
    data: filteredTransactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const getTabCount = (status: string) => {
    if (status === "all") return transactions.length;
    return transactions.filter(t => t.status === status).length;
  };

  const stats = {
    pending: transactions.filter(t => t.status === 'pending').length,
    pendingAmount: transactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0),
    approvedToday: transactions.filter(t => {
      return t.status === 'completed' &&
        new Date(t.processed_at || t.updated_at).toDateString() === new Date().toDateString();
    }).length,
    totalRevenue: transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Verification</h1>
          <p className="text-muted-foreground">
            Review and approve pending payment submissions
          </p>
        </div>
        <Button variant="outline" onClick={fetchTransactions} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.pendingAmount.toFixed(2)} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedToday}</div>
            <p className="text-xs text-muted-foreground">Processed today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All completed payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pending > 0 ? 'Action required' : 'All clear'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({getTabCount("pending")})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({getTabCount("completed")})
          </TabsTrigger>
          <TabsTrigger value="failed">
            Rejected ({getTabCount("failed")})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({getTabCount("all")})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <div className="rounded-md border">
            <div className="p-4">
              <Input
                placeholder="Search by user, transaction ID..."
                className="max-w-sm"
              />
            </div>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
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
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Loading transactions...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
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
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-2 p-4">
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
        </TabsContent>
      </Tabs>

      {/* Transaction Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Complete transaction information
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Transaction ID</p>
                  <p className="font-mono text-xs">
                    {selectedTransaction.transaction_ref || selectedTransaction.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedTransaction.status)}>
                    {selectedTransaction.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{selectedTransaction.user?.username}</p>
                  <p className="text-xs text-muted-foreground">{selectedTransaction.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium text-lg">
                    {selectedTransaction.currency} ${selectedTransaction.amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{selectedTransaction.gateway?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge variant="outline">{selectedTransaction.transaction_type.toUpperCase()}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(selectedTransaction.created_at).toLocaleString()}
                  </p>
                </div>
                {selectedTransaction.processed_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Processed</p>
                    <p className="font-medium">
                      {new Date(selectedTransaction.processed_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedTransaction.payment_details && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Payment Details</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(selectedTransaction.payment_details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedTransaction.error_message && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-red-600">Error/Rejection Reason</h3>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm">{selectedTransaction.error_message}</p>
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

      {/* Approve Payment Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Payment</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the payment as completed and activate the associated subscription (if applicable).
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {selectedTransaction && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">
                  {selectedTransaction.currency} ${selectedTransaction.amount.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedTransaction.user?.username} - {selectedTransaction.transaction_type}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any verification notes..."
                rows={3}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowApproveDialog(false);
              setAdminNotes("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprovePayment}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Payment Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this payment. The user will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {selectedTransaction && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">
                  {selectedTransaction.currency} ${selectedTransaction.amount.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedTransaction.user?.username} - {selectedTransaction.transaction_type}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this payment is being rejected..."
                rows={4}
                required
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowRejectDialog(false);
              setRejectionReason("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectPayment}
              disabled={!rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
