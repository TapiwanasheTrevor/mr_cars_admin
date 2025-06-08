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
  MessageCircle,
  RefreshCw,
  Plus,
  Edit,
  Eye,
  Trash2,
  Pin,
  PinOff,
  Lock,
  Unlock,
  AlertTriangle,
  UserX,
  MessageSquare
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface ForumTopic {
  id: string;
  title: string;
  content: string;
  user_id: string;
  author_name: string | null;
  category: string;
  likes: number;
  comments: number;
  created_at: string;
  updated_at: string;
  is_pinned?: boolean;
  is_locked?: boolean;
  views_count?: number;
}

interface ForumReply {
  id: string;
  topic_id: string;
  content: string;
  user_id: string;
  author_name: string | null;
  likes: number;
  dislikes: number;
  created_at: string;
  updated_at: string;
}

export default function ForumPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [isLoadingReplies, setIsLoadingReplies] = useState(true);
  const [activeTab, setActiveTab] = useState("topics");
  const [showTopicDialog, setShowTopicDialog] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [topicReplies, setTopicReplies] = useState<ForumReply[]>([]);
  const [isLoadingTopicReplies, setIsLoadingTopicReplies] = useState(false);
  const [showDeleteTopicDialog, setShowDeleteTopicDialog] = useState(false);
  const [showDeleteReplyDialog, setShowDeleteReplyDialog] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<ForumTopic | null>(null);
  const [replyToDelete, setReplyToDelete] = useState<ForumReply | null>(null);
  const { toast } = useToast();

  const fetchTopics = async () => {
    try {
      setIsLoadingTopics(true);
      
      const { data, error } = await supabase
        .from('forum_topics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTopics(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching topics",
        description: error.message || "Failed to load forum topics",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTopics(false);
    }
  };

  const fetchReplies = async () => {
    try {
      setIsLoadingReplies(true);
      
      const { data, error } = await supabase
        .from('forum_replies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setReplies(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching replies",
        description: error.message || "Failed to load forum replies",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReplies(false);
    }
  };

  const fetchTopicReplies = async (topicId: string) => {
    try {
      setIsLoadingTopicReplies(true);
      
      const { data, error } = await supabase
        .from('forum_replies')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      setTopicReplies(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching topic replies",
        description: error.message || "Failed to load topic replies",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTopicReplies(false);
    }
  };

  useEffect(() => {
    fetchTopics();
    fetchReplies();
  }, []);

  const handleDeleteTopic = async () => {
    if (!topicToDelete) return;

    try {
      const { error } = await supabase
        .from('forum_topics')
        .delete()
        .eq('id', topicToDelete.id);

      if (error) throw error;

      toast({
        title: "Topic deleted",
        description: "Topic and all replies have been removed",
      });

      fetchTopics();
      setShowDeleteTopicDialog(false);
      setTopicToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error deleting topic",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openDeleteTopicDialog = (topic: ForumTopic) => {
    setTopicToDelete(topic);
    setShowDeleteTopicDialog(true);
  };

  const handleDeleteReply = async () => {
    if (!replyToDelete) return;

    try {
      const { error } = await supabase
        .from('forum_replies')
        .delete()
        .eq('id', replyToDelete.id);

      if (error) throw error;

      toast({
        title: "Reply deleted",
        description: "Reply has been removed",
      });

      fetchReplies();
      if (selectedTopic) {
        fetchTopicReplies(selectedTopic.id);
      }
      setShowDeleteReplyDialog(false);
      setReplyToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error deleting reply",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openDeleteReplyDialog = (reply: ForumReply) => {
    setReplyToDelete(reply);
    setShowDeleteReplyDialog(true);
  };

  const handleTogglePin = async (topic: ForumTopic) => {
    try {
      const newPinnedStatus = !topic.is_pinned;
      
      const { error } = await supabase
        .from('forum_topics')
        .update({ is_pinned: newPinnedStatus })
        .eq('id', topic.id);

      if (error) throw error;

      toast({
        title: newPinnedStatus ? "Topic pinned" : "Topic unpinned",
        description: `Topic has been ${newPinnedStatus ? 'pinned to the top' : 'unpinned'}`,
      });

      fetchTopics();
    } catch (error: any) {
      toast({
        title: "Error updating topic",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleLock = async (topic: ForumTopic) => {
    try {
      const newLockedStatus = !topic.is_locked;
      
      const { error } = await supabase
        .from('forum_topics')
        .update({ is_locked: newLockedStatus })
        .eq('id', topic.id);

      if (error) throw error;

      toast({
        title: newLockedStatus ? "Topic locked" : "Topic unlocked",
        description: `Topic has been ${newLockedStatus ? 'locked from new replies' : 'unlocked'}`,
      });

      fetchTopics();
    } catch (error: any) {
      toast({
        title: "Error updating topic",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openTopicDialog = async (topic: ForumTopic) => {
    setSelectedTopic(topic);
    setShowTopicDialog(true);
    await fetchTopicReplies(topic.id);
  };

  const topicColumns: ColumnDef<ForumTopic>[] = [
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
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Topic
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const topic = row.original;
        return (
          <div className="max-w-[300px]">
            <div className="flex items-center gap-2">
              {topic.is_pinned && <Pin className="h-4 w-4 text-blue-500" />}
              {topic.is_locked && <Lock className="h-4 w-4 text-red-500" />}
              <span className="font-medium truncate">{topic.title}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              by {topic.author_name || 'Unknown User'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.getValue("category") as string;
        return (
          <Badge variant="outline" className="capitalize">
            {category}
          </Badge>
        );
      },
    },
    {
      accessorKey: "likes",
      header: "Likes",
      cell: ({ row }) => {
        const likes = row.getValue("likes") as number;
        return <div className="text-center">{likes}</div>;
      },
    },
    {
      accessorKey: "comments",
      header: "Replies",
      cell: ({ row }) => {
        const comments = row.getValue("comments") as number;
        return <div className="text-center">{comments}</div>;
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
        return <div>{date.toLocaleDateString()}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const topic = row.original;

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
              <DropdownMenuItem onClick={() => openTopicDialog(topic)}>
                <Eye className="mr-2 h-4 w-4" />
                View topic & replies
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleTogglePin(topic)}>
                {topic.is_pinned ? (
                  <>
                    <PinOff className="mr-2 h-4 w-4" />
                    Unpin topic
                  </>
                ) : (
                  <>
                    <Pin className="mr-2 h-4 w-4" />
                    Pin topic
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleLock(topic)}>
                {topic.is_locked ? (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    Unlock topic
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Lock topic
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => openDeleteTopicDialog(topic)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete topic
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const replyColumns: ColumnDef<ForumReply>[] = [
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
      accessorKey: "content",
      header: "Reply Content",
      cell: ({ row }) => {
        const reply = row.original;
        return (
          <div className="max-w-[400px]">
            <div className="text-sm truncate">{reply.content}</div>
            <div className="text-xs text-muted-foreground mt-1">
              by {reply.author_name || 'Unknown User'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "likes",
      header: "Likes",
      cell: ({ row }) => {
        const likes = row.getValue("likes") as number;
        return <div className="text-center text-green-600">{likes}</div>;
      },
    },
    {
      accessorKey: "dislikes",
      header: "Dislikes",
      cell: ({ row }) => {
        const dislikes = row.getValue("dislikes") as number;
        return <div className="text-center text-red-600">{dislikes}</div>;
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
        return <div>{date.toLocaleDateString()}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const reply = row.original;

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
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => openDeleteReplyDialog(reply)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete reply
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const topicTable = useReactTable({
    data: topics,
    columns: topicColumns,
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

  const replyTable = useReactTable({
    data: replies,
    columns: replyColumns,
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

  const currentTopicTable = topicTable;
  const currentReplyTable = replyTable;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Forum Management</h1>
          <p className="text-muted-foreground">
            Moderate forum topics and replies
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            if (activeTab === "topics") {
              fetchTopics();
            } else {
              fetchReplies();
            }
          }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="topics">Topics ({topics.length})</TabsTrigger>
          <TabsTrigger value="replies">All Replies ({replies.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="topics">
          <div className="rounded-md border">
            <div className="flex items-center justify-between p-4">
              <Input
                placeholder="Search topics..."
                value={(currentTopicTable.getColumn("title")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  currentTopicTable.getColumn("title")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Columns</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {currentTopicTable
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
                {currentTopicTable.getHeaderGroups().map((headerGroup) => (
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
                {isLoadingTopics ? (
                  <TableRow>
                    <TableCell colSpan={topicColumns.length} className="h-24 text-center">
                      Loading topics...
                    </TableCell>
                  </TableRow>
                ) : currentTopicTable.getRowModel().rows?.length ? (
                  currentTopicTable.getRowModel().rows.map((row) => (
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
                    <TableCell colSpan={topicColumns.length} className="h-24 text-center">
                      No topics found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-2 p-4">
              <div className="flex-1 text-sm text-muted-foreground">
                {currentTopicTable.getFilteredSelectedRowModel().rows.length} of{" "}
                {currentTopicTable.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => currentTopicTable.previousPage()}
                  disabled={!currentTopicTable.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => currentTopicTable.nextPage()}
                  disabled={!currentTopicTable.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="replies">
          <div className="rounded-md border">
            <div className="flex items-center justify-between p-4">
              <Input
                placeholder="Search replies..."
                value={(currentReplyTable.getColumn("content")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  currentReplyTable.getColumn("content")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Columns</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {currentReplyTable
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
                {currentReplyTable.getHeaderGroups().map((headerGroup) => (
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
                {isLoadingReplies ? (
                  <TableRow>
                    <TableCell colSpan={replyColumns.length} className="h-24 text-center">
                      Loading replies...
                    </TableCell>
                  </TableRow>
                ) : currentReplyTable.getRowModel().rows?.length ? (
                  currentReplyTable.getRowModel().rows.map((row) => (
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
                    <TableCell colSpan={replyColumns.length} className="h-24 text-center">
                      No replies found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-2 p-4">
              <div className="flex-1 text-sm text-muted-foreground">
                {currentReplyTable.getFilteredSelectedRowModel().rows.length} of{" "}
                {currentReplyTable.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => currentReplyTable.previousPage()}
                  disabled={!currentReplyTable.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => currentReplyTable.nextPage()}
                  disabled={!currentReplyTable.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Topic Detail Dialog */}
      <Dialog open={showTopicDialog} onOpenChange={setShowTopicDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTopic?.is_pinned && <Pin className="h-4 w-4 text-blue-500" />}
              {selectedTopic?.is_locked && <Lock className="h-4 w-4 text-red-500" />}
              {selectedTopic?.title}
            </DialogTitle>
            <DialogDescription>
              Topic details and all replies
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-auto max-h-[60vh] space-y-4">
            {selectedTopic && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedTopic.category}</Badge>
                    <span className="text-sm text-muted-foreground">
                      by {selectedTopic.author_name || 'Unknown User'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>❤️ {selectedTopic.likes}</span>
                    <span>💬 {selectedTopic.comments}</span>
                    <span>{new Date(selectedTopic.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-sm">{selectedTopic.content}</div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-semibold">Replies ({topicReplies.length})</h4>
              
              {isLoadingTopicReplies ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : topicReplies.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No replies found for this topic
                </div>
              ) : (
                topicReplies.map((reply) => (
                  <div key={reply.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {reply.author_name || 'Unknown User'}
                      </span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="text-green-600">👍 {reply.likes}</span>
                          <span className="text-red-600">👎 {reply.dislikes}</span>
                          <span>{new Date(reply.created_at).toLocaleDateString()}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteReplyDialog(reply)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm">{reply.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTopicDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Topic Confirmation Dialog */}
      <AlertDialog open={showDeleteTopicDialog} onOpenChange={setShowDeleteTopicDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topic</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{topicToDelete?.title}"? This will also delete all replies to this topic. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTopicToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTopic}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Topic
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Reply Confirmation Dialog */}
      <AlertDialog open={showDeleteReplyDialog} onOpenChange={setShowDeleteReplyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reply</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reply? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReplyToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReply}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Reply
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}