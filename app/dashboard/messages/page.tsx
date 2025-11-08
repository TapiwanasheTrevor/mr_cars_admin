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
  MessageSquare,
  Users,
  Archive,
  Ban,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  AlertTriangle,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Separator } from "@/components/ui/separator";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  attachments: string[];
  is_read: boolean;
  read_at: string | null;
  is_deleted_by_sender: boolean;
  is_deleted_by_receiver: boolean;
  created_at: string;
}

interface UserFlag {
  user_id: string;
  flag_level: 'watch' | 'warning' | 'restricted' | 'banned';
  total_evasion_attempts: number;
  messaging_restricted: boolean;
  restricted_until: string | null;
  last_evasion_attempt_at: string | null;
}

interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  reference_type: string | null;
  reference_id: string | null;
  status: 'active' | 'archived' | 'blocked';
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  messages?: Message[];
  participant_1?: {
    username: string;
    email: string;
  };
  participant_2?: {
    username: string;
    email: string;
  };
  unread_count?: number;
  participant_1_flag?: UserFlag;
  participant_2_flag?: UserFlag;
  evasion_count?: number;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [showConversationDialog, setShowConversationDialog] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  const fetchConversations = async () => {
    try {
      setIsLoading(true);

      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (conversationsError) throw conversationsError;

      // Fetch user data for participants
      if (conversationsData && conversationsData.length > 0) {
        const userIds = Array.from(
          new Set([
            ...conversationsData.map(c => c.participant_1_id),
            ...conversationsData.map(c => c.participant_2_id),
          ])
        );

        const { data: usersData } = await supabase
          .from('users')
          .select('id, username, email')
          .in('id', userIds);

        if (usersData) {
          const usersMap = new Map(usersData.map(u => [u.id, u]));
          conversationsData.forEach(conv => {
            conv.participant_1 = usersMap.get(conv.participant_1_id);
            conv.participant_2 = usersMap.get(conv.participant_2_id);
          });
        }

        // Fetch user flags for all participants
        const { data: flagsData } = await supabase
          .from('user_flags')
          .select('*')
          .in('user_id', userIds);

        if (flagsData) {
          const flagsMap = new Map(flagsData.map(f => [f.user_id, f]));
          conversationsData.forEach(conv => {
            conv.participant_1_flag = flagsMap.get(conv.participant_1_id);
            conv.participant_2_flag = flagsMap.get(conv.participant_2_id);
          });
        }

        // Fetch unread counts and evasion attempts for each conversation
        for (const conv of conversationsData) {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false);

          conv.unread_count = count || 0;

          // Count evasion attempts in this conversation
          const { count: evasionCount } = await supabase
            .from('security_logs')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .like('event_type', '%evasion%');

          conv.evasion_count = evasionCount || 0;
        }
      }

      setConversations(conversationsData || []);
    } catch (error: any) {
      toast({
        title: "Error fetching conversations",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching messages",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleStatusUpdate = async (conversationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) throw error;

      toast({
        title: "Conversation updated",
        description: `Status changed to ${newStatus}`,
      });

      fetchConversations();
    } catch (error: any) {
      toast({
        title: "Error updating conversation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed",
      });

      fetchConversations();
    } catch (error: any) {
      toast({
        title: "Error deleting conversation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openConversationDialog = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await fetchMessages(conversation.id);
    setShowConversationDialog(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      blocked: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return colors[status] || colors.active;
  };

  const getFlagColor = (flagLevel: string) => {
    const colors: Record<string, string> = {
      watch: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      restricted: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      banned: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return colors[flagLevel] || '';
  };

  const getFlagIcon = (flagLevel: string) => {
    const icons: Record<string, React.ReactNode> = {
      watch: <Eye className="h-3 w-3" />,
      warning: <AlertTriangle className="h-3 w-3" />,
      restricted: <Ban className="h-3 w-3" />,
      banned: <Shield className="h-3 w-3" />,
    };
    return icons[flagLevel] || null;
  };

  const columns: ColumnDef<Conversation>[] = React.useMemo(() => [
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
      accessorKey: "participants",
      header: "Participants",
      cell: ({ row }) => {
        const conv = row.original;
        const flag1 = conv.participant_1_flag;
        const flag2 = conv.participant_2_flag;

        return (
          <div className="space-y-1">
            <div className="font-medium flex items-center gap-2">
              <span>{conv.participant_1?.username || 'Unknown'}</span>
              {flag1 && (
                <Badge variant="outline" className={`text-xs ${getFlagColor(flag1.flag_level)}`}>
                  {getFlagIcon(flag1.flag_level)}
                  <span className="ml-1">{flag1.flag_level.toUpperCase()}</span>
                  <span className="ml-1">({flag1.total_evasion_attempts})</span>
                </Badge>
              )}
              <span>↔</span>
              <span>{conv.participant_2?.username || 'Unknown'}</span>
              {flag2 && (
                <Badge variant="outline" className={`text-xs ${getFlagColor(flag2.flag_level)}`}>
                  {getFlagIcon(flag2.flag_level)}
                  <span className="ml-1">{flag2.flag_level.toUpperCase()}</span>
                  <span className="ml-1">({flag2.total_evasion_attempts})</span>
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {conv.participant_1?.email || ''} • {conv.participant_2?.email || ''}
            </div>
            {(conv.evasion_count || 0) > 0 && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />
                <span>{conv.evasion_count} evasion attempt(s) in this conversation</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "reference_type",
      header: "Reference",
      cell: ({ row }) => {
        const conv = row.original;
        if (!conv.reference_type) return <span className="text-muted-foreground">None</span>;
        return (
          <Badge variant="outline">
            {conv.reference_type.toUpperCase()}
          </Badge>
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
      accessorKey: "unread_count",
      header: "Unread",
      cell: ({ row }) => {
        const count = row.original.unread_count || 0;
        return count > 0 ? (
          <Badge variant="default" className="bg-blue-600">
            {count} new
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "last_message_at",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Last Activity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue("last_message_at");
        if (!date) return <span className="text-muted-foreground">No messages</span>;
        return (
          <div>
            <div>{new Date(date as string).toLocaleDateString()}</div>
            <div className="text-sm text-muted-foreground">
              {new Date(date as string).toLocaleTimeString()}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return date.toLocaleDateString();
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const conv = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openConversationDialog(conv)}>
                <Eye className="mr-2 h-4 w-4" />
                View Conversation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {conv.status === 'active' && (
                <>
                  <DropdownMenuItem onClick={() => handleStatusUpdate(conv.id, 'archived')}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusUpdate(conv.id, 'blocked')}>
                    <Ban className="mr-2 h-4 w-4" />
                    Block
                  </DropdownMenuItem>
                </>
              )}
              {conv.status === 'archived' && (
                <DropdownMenuItem onClick={() => handleStatusUpdate(conv.id, 'active')}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Restore
                </DropdownMenuItem>
              )}
              {conv.status === 'blocked' && (
                <DropdownMenuItem onClick={() => handleStatusUpdate(conv.id, 'active')}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Unblock
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleDeleteConversation(conv.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  const filteredConversations = React.useMemo(() => {
    return conversations.filter(conv => {
      if (activeTab === "all") return true;
      return conv.status === activeTab;
    });
  }, [conversations, activeTab]);

  const table = useReactTable({
    data: filteredConversations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const getTabCount = (status: string) => {
    if (status === "all") return conversations.length;
    return conversations.filter(c => c.status === status).length;
  };

  const stats = {
    total: conversations.length,
    active: conversations.filter(c => c.status === 'active').length,
    unread: conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0),
    flagged: conversations.filter(c => c.status === 'blocked').length,
    flaggedUsers: conversations.filter(c =>
      (c.participant_1_flag && c.participant_1_flag.flag_level !== 'watch') ||
      (c.participant_2_flag && c.participant_2_flag.flag_level !== 'watch')
    ).length,
    restrictedUsers: conversations.filter(c =>
      (c.participant_1_flag && c.participant_1_flag.messaging_restricted) ||
      (c.participant_2_flag && c.participant_2_flag.messaging_restricted)
    ).length,
    totalEvasions: conversations.reduce((sum, c) => sum + (c.evasion_count || 0), 0),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages & Inbox</h1>
          <p className="text-muted-foreground">
            Manage user conversations and messaging
          </p>
        </div>
        <Button variant="outline" onClick={fetchConversations} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unread}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Users</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.flaggedUsers}</div>
            <p className="text-xs text-muted-foreground">Warning+ level</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restricted</CardTitle>
            <Ban className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.restrictedUsers}</div>
            <p className="text-xs text-muted-foreground">Cannot message</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evasion Attempts</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvasions}</div>
            <p className="text-xs text-muted-foreground">Total detected</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({getTabCount("all")})</TabsTrigger>
          <TabsTrigger value="active">Active ({getTabCount("active")})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({getTabCount("archived")})</TabsTrigger>
          <TabsTrigger value="blocked">Blocked ({getTabCount("blocked")})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <div className="rounded-md border">
            <div className="p-4">
              <Input
                placeholder="Search conversations..."
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
                      Loading conversations...
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
                      No conversations found.
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

      {/* Conversation Details Dialog */}
      <Dialog open={showConversationDialog} onOpenChange={setShowConversationDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Conversation Details</DialogTitle>
            <DialogDescription>
              {selectedConversation && (
                <span>
                  Between {selectedConversation.participant_1?.username || 'Unknown'} and{' '}
                  {selectedConversation.participant_2?.username || 'Unknown'}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedConversation && (
            <div className="space-y-4">
              {/* Conversation Info */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedConversation.status)}>
                    {selectedConversation.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(selectedConversation.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Messages</p>
                  <p className="font-medium">{messages.length}</p>
                </div>
              </div>

              {/* Messages */}
              <div>
                <h3 className="font-semibold mb-2">Messages</h3>
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {message.sender_id === selectedConversation.participant_1_id
                              ? selectedConversation.participant_1?.username
                              : selectedConversation.participant_2?.username}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleString()}
                          </span>
                          {!message.is_read && (
                            <Badge variant="default" className="text-xs bg-blue-600">
                              Unread
                            </Badge>
                          )}
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="whitespace-pre-wrap">{message.message_text}</p>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 flex gap-2">
                              {message.attachments.map((attachment, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  Attachment {idx + 1}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {messages.indexOf(message) < messages.length - 1 && (
                          <Separator className="my-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConversationDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
