import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, ArrowLeft, Send, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supportAPI, SupportTicket, SupportMessage } from "@/services/supportAPI";
import { useAuth } from "@/contexts/AuthContext";

// Helper function to format time ago
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? "s" : ""} ago`;
};

export default function SupportTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (id) {
      fetchTicket();
      fetchMessages();
    }
  }, [id]);

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const data = await supportAPI.getTicket(id!);
      setTicket(data);
    } catch (error: any) {
      console.error("Error fetching ticket:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load ticket",
        variant: "destructive",
      });
      navigate("/support");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await supportAPI.getMessages(id!);
      setMessages(data);
      
      // Mark messages as read
      if (data.length > 0) {
        await supportAPI.markTicketMessagesRead(id!);
      }
    } catch (error: any) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      await supportAPI.createMessage({
        ticket: id!,
        message: newMessage,
      });

      setNewMessage("");
      fetchMessages();
      fetchTicket(); // Refresh ticket to update last_activity_at
      
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any } } = {
      open: { label: "Open", variant: "outline", icon: AlertCircle },
      in_progress: { label: "In Progress", variant: "default", icon: Clock },
      waiting_for_user: { label: "Waiting for User", variant: "secondary", icon: Clock },
      resolved: { label: "Resolved", variant: "default", icon: CheckCircle2 },
      closed: { label: "Closed", variant: "secondary", icon: XCircle },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" as const, icon: MessageSquare };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
      low: { label: "Low", variant: "outline" },
      medium: { label: "Medium", variant: "secondary" },
      high: { label: "High", variant: "default" },
      urgent: { label: "Urgent", variant: "destructive" },
    };

    const config = priorityConfig[priority] || { label: priority, variant: "outline" as const };

    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Ticket Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The ticket you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button onClick={() => navigate("/support")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/support")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 mb-2">
                  Ticket #{ticket.ticket_number}
                </CardTitle>
                <CardDescription>{ticket.subject}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(ticket.status)}
                {getPriorityBadge(ticket.priority)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Category</p>
                <p className="font-medium capitalize">{ticket.category}</p>
              </div>
              {ticket.assigned_to_name && (
                <div>
                  <p className="text-muted-foreground mb-1">Assigned to</p>
                  <p className="font-medium">{ticket.assigned_to_name}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground mb-1">Created</p>
                <p className="font-medium">{formatTimeAgo(ticket.created_at)}</p>
              </div>
              {ticket.last_message_at && (
                <div>
                  <p className="text-muted-foreground mb-1">Last Activity</p>
                  <p className="font-medium">{formatTimeAgo(ticket.last_message_at)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{ticket.description}</p>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation ({messages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No messages yet. Start the conversation below.
              </div>
            ) : (
              messages.map((message) => {
                const isStaff = message.message_type === "staff";
                const isUser = message.message_type === "user";
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-4 ${
                        isStaff
                          ? "bg-muted"
                          : isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm">
                          {isStaff ? message.user_name || "Staff" : "You"}
                        </span>
                        <span className="text-xs opacity-70">
                          {formatTimeAgo(message.created_at)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{message.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resolution */}
      {ticket.resolution && (
        <Card className="mb-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Resolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{ticket.resolution}</p>
            {ticket.resolved_at && (
              <p className="text-sm text-muted-foreground mt-2">
                Resolved on {new Date(ticket.resolved_at).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reply Form */}
      {ticket.status !== "closed" && ticket.status !== "resolved" && (
        <Card>
          <CardHeader>
            <CardTitle>Add Reply</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Type your message here..."
              rows={4}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {ticket.status === "closed" && (
        <Card className="bg-muted">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="font-semibold mb-1">This ticket is closed</p>
            <p className="text-sm text-muted-foreground">
              This ticket has been closed and cannot receive new messages.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

