import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RecentActivityItem {
  id: string;
  user_name: string;
  user_email: string;
  action: string;
  target: string;
  created_at: string;
}

interface RecentActivityProps {
  activities: RecentActivityItem[];
  isLoading: boolean;
}

const activities = [
  {
    id: 1,
    user: {
      name: "John Doe",
      email: "john@example.com",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    action: "created a new listing",
    target: "BMW X5 2022",
    time: "2 minutes ago",
  },
  {
    id: 2,
    user: {
      name: "Jane Smith",
      email: "jane@example.com",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    action: "purchased a subscription",
    target: "Premium Plan",
    time: "1 hour ago",
  },
  {
    id: 3,
    user: {
      name: "Robert Johnson",
      email: "robert@example.com",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    action: "submitted a support ticket",
    target: "#1234",
    time: "3 hours ago",
  },
  {
    id: 4,
    user: {
      name: "Emily Davis",
      email: "emily@example.com",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    action: "scheduled an appointment",
    target: "Test Drive",
    time: "5 hours ago",
  },
  {
    id: 5,
    user: {
      name: "Michael Wilson",
      email: "michael@example.com",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    action: "updated their profile",
    target: "",
    time: "1 day ago",
  },
];

export function RecentActivity({ activities: recentActivities, isLoading }: RecentActivityProps) {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Use real activities if available, otherwise fall back to default
  const displayActivities = recentActivities.length > 0 ? recentActivities : activities.map(activity => ({
    id: activity.id.toString(),
    user_name: activity.user.name,
    user_email: activity.user.email,
    action: activity.action,
    target: activity.target,
    created_at: new Date().toISOString(),
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Loading recent activities...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions across the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity to display
            </p>
          ) : (
            displayActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{activity.user_name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.user_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.action}{" "}
                    {activity.target && <span className="font-medium">{activity.target}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(activity.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}