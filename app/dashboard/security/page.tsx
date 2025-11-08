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
  Shield,
  AlertTriangle,
  Lock,
  Unlock,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Activity,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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

interface SecurityLog {
  id: string;
  user_id: string | null;
  event_type: string;
  event_description: string;
  ip_address: string | null;
  user_agent: string | null;
  status: string | null;
  metadata: any;
  created_at: string;
}

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_by: string | null;
  blocked_until: string | null;
  is_active: boolean;
  created_at: string;
}

export default function SecurityPage() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("logs");
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockForm, setBlockForm] = useState({
    ip_address: '',
    reason: '',
    blocked_until: '',
  });
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch security logs
      const { data: logsData, error: logsError } = await supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;
      setLogs(logsData || []);

      // Fetch blocked IPs
      const { data: blockedData, error: blockedError } = await supabase
        .from('blocked_ips')
        .select('*')
        .order('created_at', { ascending: false });

      if (blockedError) throw blockedError;
      setBlockedIPs(blockedData || []);

    } catch (error: any) {
      toast({
        title: "Error fetching security data",
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

  const handleBlockIP = async () => {
    try {
      const { error } = await supabase
        .from('blocked_ips')
        .insert([{
          ip_address: blockForm.ip_address,
          reason: blockForm.reason,
          blocked_until: blockForm.blocked_until || null,
          is_active: true,
        }]);

      if (error) throw error;

      toast({
        title: "IP blocked",
        description: `${blockForm.ip_address} has been blocked`,
      });

      setShowBlockDialog(false);
      setBlockForm({ ip_address: '', reason: '', blocked_until: '' });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error blocking IP",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUnblockIP = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blocked_ips')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "IP unblocked",
        description: "The IP address has been unblocked",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error unblocking IP",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteBlockedIP = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blocked_ips')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Block removed",
        description: "The IP block has been deleted",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error deleting block",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      login: 'bg-green-100 text-green-800',
      logout: 'bg-gray-100 text-gray-800',
      failed_login: 'bg-red-100 text-red-800',
      password_change: 'bg-blue-100 text-blue-800',
      data_access: 'bg-yellow-100 text-yellow-800',
      data_modification: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      success: 'bg-green-100 text-green-800',
      failure: 'bg-red-100 text-red-800',
      blocked: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const logColumns: ColumnDef<SecurityLog>[] = React.useMemo(() => [
    {
      accessorKey: "event_type",
      header: "Event Type",
      cell: ({ row }) => {
        const type = row.getValue("event_type") as string;
        return (
          <Badge variant="outline" className={getEventTypeColor(type)}>
            {type.replace('_', ' ').toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "event_description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-md truncate" title={row.getValue("event_description")}>
          {row.getValue("event_description")}
        </div>
      ),
    },
    {
      accessorKey: "ip_address",
      header: "IP Address",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.ip_address || 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        if (!status) return <span className="text-muted-foreground">—</span>;
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
          Timestamp
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return (
          <div>
            <div className="text-sm">{date.toLocaleDateString()}</div>
            <div className="text-xs text-muted-foreground">{date.toLocaleTimeString()}</div>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const log = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {log.ip_address && (
                <DropdownMenuItem onClick={() => {
                  setBlockForm({
                    ip_address: log.ip_address!,
                    reason: `Suspicious activity: ${log.event_type}`,
                    blocked_until: '',
                  });
                  setShowBlockDialog(true);
                }}>
                  <Ban className="mr-2 h-4 w-4" />
                  Block IP
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  const blockedIPColumns: ColumnDef<BlockedIP>[] = React.useMemo(() => [
    {
      accessorKey: "ip_address",
      header: "IP Address",
      cell: ({ row }) => (
        <span className="font-mono font-medium">{row.getValue("ip_address")}</span>
      ),
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <div className="max-w-md">{row.getValue("reason")}</div>
      ),
    },
    {
      accessorKey: "blocked_until",
      header: "Blocked Until",
      cell: ({ row }) => {
        const until = row.original.blocked_until;
        if (!until) return <Badge variant="outline">Permanent</Badge>;
        return new Date(until).toLocaleString();
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean;
        return (
          <Badge variant={isActive ? "destructive" : "outline"}>
            {isActive ? "BLOCKED" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleString(),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const blockedIP = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {blockedIP.is_active && (
                <DropdownMenuItem onClick={() => handleUnblockIP(blockedIP.id)}>
                  <Unlock className="mr-2 h-4 w-4" />
                  Unblock IP
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleDeleteBlockedIP(blockedIP.id)}
              >
                Delete Block
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  const logTable = useReactTable({
    data: logs,
    columns: logColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const blockedIPTable = useReactTable({
    data: blockedIPs,
    columns: blockedIPColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Calculate stats
  const stats = {
    totalLogs: logs.length,
    failedLogins: logs.filter(l => l.event_type === 'failed_login').length,
    blockedIPs: blockedIPs.filter(b => b.is_active).length,
    recentAlerts: logs.filter(l =>
      l.status === 'blocked' || l.status === 'failure'
    ).length,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor system security and manage access controls
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
            <CardTitle className="text-sm font-medium">Security Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogs}</div>
            <p className="text-xs text-muted-foreground">Recent events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedLogins}</div>
            <p className="text-xs text-muted-foreground">Authentication failures</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Ban className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blockedIPs}</div>
            <p className="text-xs text-muted-foreground">Currently blocked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentAlerts}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="logs">Security Logs ({logs.length})</TabsTrigger>
          <TabsTrigger value="blocked">Blocked IPs ({blockedIPs.length})</TabsTrigger>
        </TabsList>

        {/* Security Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Security Event Log</CardTitle>
              <CardDescription>
                Audit trail of authentication and security events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Search logs..."
                  className="max-w-sm"
                />
              </div>
              <Table>
                <TableHeader>
                  {logTable.getHeaderGroups().map((headerGroup) => (
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
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={logColumns.length} className="h-24 text-center">
                        Loading security logs...
                      </TableCell>
                    </TableRow>
                  ) : logTable.getRowModel().rows.length ? (
                    logTable.getRowModel().rows.map((row) => (
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
                      <TableCell colSpan={logColumns.length} className="h-24 text-center">
                        No security logs found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logTable.previousPage()}
                  disabled={!logTable.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logTable.nextPage()}
                  disabled={!logTable.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blocked IPs Tab */}
        <TabsContent value="blocked">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Blocked IP Addresses</CardTitle>
                <CardDescription>
                  Manage IP-based access restrictions
                </CardDescription>
              </div>
              <Button onClick={() => setShowBlockDialog(true)}>
                <Ban className="mr-2 h-4 w-4" />
                Block IP
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  {blockedIPTable.getHeaderGroups().map((headerGroup) => (
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
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={blockedIPColumns.length} className="h-24 text-center">
                        Loading blocked IPs...
                      </TableCell>
                    </TableRow>
                  ) : blockedIPTable.getRowModel().rows.length ? (
                    blockedIPTable.getRowModel().rows.map((row) => (
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
                      <TableCell colSpan={blockedIPColumns.length} className="h-24 text-center">
                        No blocked IPs found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => blockedIPTable.previousPage()}
                  disabled={!blockedIPTable.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => blockedIPTable.nextPage()}
                  disabled={!blockedIPTable.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Block IP Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block IP Address</DialogTitle>
            <DialogDescription>
              Add an IP address to the block list
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ip_address">IP Address</Label>
              <Input
                id="ip_address"
                value={blockForm.ip_address}
                onChange={(e) => setBlockForm({ ...blockForm, ip_address: e.target.value })}
                placeholder="192.168.1.1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Blocking</Label>
              <Textarea
                id="reason"
                value={blockForm.reason}
                onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                placeholder="Suspicious activity detected..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blocked_until">Block Until (Optional)</Label>
              <Input
                id="blocked_until"
                type="datetime-local"
                value={blockForm.blocked_until}
                onChange={(e) => setBlockForm({ ...blockForm, blocked_until: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for permanent block
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBlockIP} variant="destructive">
              <Ban className="mr-2 h-4 w-4" />
              Block IP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
