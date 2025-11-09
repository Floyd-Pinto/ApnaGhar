import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Building2,
  Eye,
  Users,
  TrendingUp,
  FileText,
  Upload,
  Settings,
  Camera,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  BarChart3,
  Loader2,
  QrCode,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import CreateProjectDialog from "@/components/CreateProjectDialog";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface Project {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  status: string;
  project_type: string;
  views_count: number;
  interested_count: number;
  total_units: number;
  available_units: number;
  cover_image: string | null;
  created_at: string;
}

interface Milestone {
  id: string;
  project: string;
  project_name?: string;
  title: string;
  description: string;
  status: string;
  progress_percentage: string;
  images: any[];
  videos: any[];
  target_date: string;
  completion_date?: string;
  verified: boolean;
}

interface Inquiry {
  id: string;
  project_id: string;
  project_name: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  message: string;
  status: string;
  created_at: string;
}

export default function BuilderDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchBuilderData();
  }, []);

  const fetchBuilderData = async () => {
    setLoading(true);
    console.log("BuilderDashboard: Starting to fetch data...");
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error("BuilderDashboard: Fetch timeout - forcing loading to false");
      setLoading(false);
      toast({
        title: "Connection Timeout",
        description: "Unable to load projects. Please check your connection and try refreshing the page.",
        variant: "destructive",
      });
    }, 10000); // 10 second timeout
    
    try {
      const token = localStorage.getItem("access_token");
      console.log("BuilderDashboard: Token exists:", !!token);
      
      if (!token) {
        console.error("BuilderDashboard: No access token found");
        clearTimeout(timeoutId);
        toast({
          title: "Authentication required",
          description: "Please login to continue",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Fetch builder's projects (using my_projects endpoint to get only this builder's projects)
      console.log(`BuilderDashboard: Fetching from ${API_BASE_URL}/api/projects/projects/my_projects/`);
      const projectsRes = await fetch(`${API_BASE_URL}/api/projects/projects/my_projects/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("BuilderDashboard: Response status:", projectsRes.status);

      if (!projectsRes.ok) {
        const errorData = await projectsRes.json().catch(() => ({ detail: 'Unknown error' }));
        console.error("BuilderDashboard: API Error:", errorData);
        
        if (projectsRes.status === 403) {
          toast({
            title: "Access Denied",
            description: errorData.detail || "Only builders can access this page. Please ensure your account is set up as a builder.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: `Failed to load projects: ${errorData.detail || projectsRes.statusText}`,
            variant: "destructive",
          });
        }
        setProjects([]);
        setMilestones([]);
        setInquiries([]);
      } else {
        const allProjects = await projectsRes.json();
        console.log("BuilderDashboard: Fetched projects:", allProjects);
        
        // Backend now filters by developer, so these are all this builder's projects
        const projectsList = allProjects.results || allProjects;
        const projectsArray = Array.isArray(projectsList) ? projectsList : [];
        console.log(`BuilderDashboard: Setting ${projectsArray.length} projects for this builder`);
        setProjects(projectsArray);

        // Don't fetch milestones on initial load - they're loaded per-project when needed
        // This makes the dashboard load instantly
        console.log("BuilderDashboard: Skipping milestone fetch for faster load");
        setMilestones([]);

        // Mock inquiries data (you can create a real API endpoint)
        // Only create if there are projects
        if (projectsArray.length > 0) {
          setInquiries([
            {
              id: "1",
              project_id: projectsArray[0]?.id || "",
              project_name: projectsArray[0]?.name || "Sample Project",
              buyer_name: "John Doe",
              buyer_email: "john@example.com",
              buyer_phone: "+91 98765 43210",
              message: "I'm interested in 3BHK units. Can you share more details?",
              status: "new",
              created_at: new Date().toISOString(),
            },
          ]);
        } else {
          // No projects, no inquiries
          setInquiries([]);
        }
      }
    } catch (error: any) {
      console.error("BuilderDashboard: Failed to fetch builder data:", error);
      clearTimeout(timeoutId);
      
      let errorMessage = "Failed to load dashboard data. ";
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage += "Cannot connect to server. Please ensure the backend is running on port 8000.";
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += "Please try again later.";
      }
      
      toast({
        title: "Error Loading Dashboard",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      clearTimeout(timeoutId);
      console.log("BuilderDashboard: Data fetch complete - setting loading to false");
      setLoading(false);
    }
  };

  const totalViews = projects.reduce((sum, p) => sum + p.views_count, 0);
  const totalInterested = projects.reduce((sum, p) => sum + p.interested_count, 0);
  const conversionRate = totalViews > 0 ? ((totalInterested / totalViews) * 100).toFixed(1) : "0";

  const stats = [
    {
      title: "Active Projects",
      value: projects.length.toString(),
      icon: Building2,
      description: "Projects currently listed",
    },
    {
      title: "Total Views",
      value: totalViews.toString(),
      icon: Eye,
      description: "Across all projects",
    },
    {
      title: "Inquiries",
      value: inquiries.length.toString(),
      icon: Users,
      description: "Potential buyers",
    },
    {
      title: "Conversion Rate",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      description: "Views to interest",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if user has the correct role
  if (user?.role !== 'builder') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              Access Denied
            </CardTitle>
            <CardDescription>
              This dashboard is only accessible to builders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your account role: <strong>{user?.role || 'Not set'}</strong>
            </p>
            <p className="text-sm">
              If you are a builder, please contact support to update your account role.
            </p>
            <Link to="/">
              <Button className="w-full">Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Builder Dashboard</h1>
            <p className="text-lg opacity-90">
              Welcome back, {user?.first_name || "Builder"}!
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="flex flex-col items-center gap-2 mb-3 w-full">
                  <stat.icon className="h-8 w-8 text-primary" />
                  <span className="text-3xl font-bold">{stat.value}</span>
                </div>
                <h3 className="font-semibold">{stat.title}</h3>
                <p className="text-sm text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="projects" className="w-full">
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="inline-flex md:grid w-auto md:w-full grid-cols-4 min-w-max md:min-w-0">
              <TabsTrigger value="projects" className="text-xs sm:text-sm whitespace-nowrap">
                <Building2 className="h-4 w-4 mr-2" />
                My Projects
              </TabsTrigger>
              <TabsTrigger value="updates" className="text-xs sm:text-sm whitespace-nowrap">
                <Upload className="h-4 w-4 mr-2" />
                Construction Updates
              </TabsTrigger>
              <TabsTrigger value="inquiries" className="text-xs sm:text-sm whitespace-nowrap">
                <Users className="h-4 w-4 mr-2" />
                Inquiries
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm whitespace-nowrap">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="projects" className="mt-6">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="w-full sm:w-auto">
                  <CardTitle className="text-center sm:text-left">My Projects</CardTitle>
                  <CardDescription className="text-center sm:text-left">
                    Manage your listed projects
                  </CardDescription>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      No projects yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Start by posting your first project
                    </p>
                    
                    {/* Debug Info */}
                    <div className="mb-6 p-4 bg-muted/50 rounded-lg text-left max-w-md mx-auto">
                      <p className="text-xs font-mono text-muted-foreground">
                        <strong>Debug Info:</strong><br/>
                        User Role: {user?.role || 'undefined'}<br/>
                        User ID: {user?.id || 'undefined'}<br/>
                        Email: {user?.email || 'undefined'}<br/>
                        <br/>
                        Check browser console (F12) for detailed API logs
                      </p>
                    </div>
                    
                    <Button size="lg" onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
                      <Plus className="h-5 w-5 mr-2" />
                      Post New Project
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 md:space-y-6 w-full max-w-full overflow-hidden">
                    {projects.map((project) => (
                      <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow w-full max-w-full">
                        <div className="flex flex-col md:flex-row w-full">
                          {/* Project Image */}
                          {project.cover_image && (
                            <div className="w-full md:w-64 h-48 md:h-auto flex-shrink-0">
                              <img
                                src={project.cover_image}
                                alt={project.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          {/* Project Content */}
                          <div className="flex-1 p-4 sm:p-6 w-full max-w-full overflow-hidden">
                            {/* Header Section */}
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold break-words">{project.name}</h3>
                                  <Badge 
                                    variant={project.status === "ongoing" ? "default" : "secondary"}
                                    className="text-xs flex-shrink-0"
                                  >
                                    {project.status}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs flex-shrink-0">
                                    {project.project_type}
                                  </Badge>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 break-words">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  {project.city}, {project.state}
                                </p>
                              </div>
                            </div>

                            {/* Stats Section */}
                            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-muted/30 rounded-lg">
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                                  <span className="text-sm sm:text-lg font-bold">{project.views_count}</span>
                                </div>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">Views</p>
                              </div>
                              <div className="text-center border-x">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                                  <span className="text-sm sm:text-lg font-bold">{project.interested_count}</span>
                                </div>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">Interested</p>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                                  <span className="text-sm sm:text-lg font-bold">{project.available_units}/{project.total_units}</span>
                                </div>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">Available</p>
                              </div>
                            </div>

                            {/* Actions Section */}
                            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full">
                              <Link to={`/projects/${project.id}`} className="w-full sm:flex-1 sm:min-w-[120px]">
                                <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                  <span className="truncate">View</span>
                                </Button>
                              </Link>
                              <Link to={`/projects/${project.id}/qr-codes`} className="w-full sm:flex-1 sm:min-w-[120px]">
                                <Button variant="secondary" size="sm" className="w-full text-xs sm:text-sm">
                                  <QrCode className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                  <span className="truncate">QR Codes</span>
                                </Button>
                              </Link>
                              <Link to={`/projects/${project.id}?tab=progress`} className="w-full sm:flex-1 sm:min-w-[120px]">
                                <Button variant="default" size="sm" className="w-full text-xs sm:text-sm">
                                  <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                  <span className="truncate">Upload</span>
                                </Button>
                              </Link>
                              <Button variant="outline" size="sm" disabled className="w-full sm:min-w-[100px] text-xs sm:text-sm">
                                <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="truncate">Edit</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="updates" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Construction Updates Overview</CardTitle>
                <CardDescription>
                  View all construction progress across your projects (Upload from project details page)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {milestones.length === 0 ? (
                  <div className="text-center py-12">
                    <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      No construction updates yet
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Construction milestones and updates from your projects will appear here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      To upload updates, go to the specific project's Progress tab
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {projects.map((project) => {
                      const projectMilestones = milestones.filter((m) => m.project === project.id);
                      if (projectMilestones.length === 0) return null;

                      return (
                        <div key={project.id} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <Building2 className="h-5 w-5 text-primary" />
                              {project.name}
                            </h3>
                            <Link to={`/projects/${project.id}?tab=progress`}>
                              <Button variant="outline" size="sm">
                                <Upload className="h-4 w-4 mr-2" />
                                Upload More
                              </Button>
                            </Link>
                          </div>

                          <div className="space-y-3">
                            {projectMilestones.map((milestone) => (
                              <Card key={milestone.id} className="bg-muted/30">
                                <CardContent className="pt-4">
                                  <div className="flex items-start gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-semibold">{milestone.title}</h4>
                                        <Badge variant={milestone.verified ? "default" : "secondary"}>
                                          {milestone.verified ? (
                                            <>
                                              <CheckCircle2 className="h-3 w-3 mr-1" />
                                              Verified
                                            </>
                                          ) : (
                                            <>
                                              <Clock className="h-3 w-3 mr-1" />
                                              {milestone.status}
                                            </>
                                          )}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-3">
                                        {milestone.description}
                                      </p>
                                      <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                          <Camera className="h-4 w-4 text-primary" />
                                          <span className="font-medium">{milestone.images?.length || 0}</span>
                                          <span className="text-muted-foreground">photos</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-primary" />
                                          <span className="font-medium">{milestone.videos?.length || 0}</span>
                                          <span className="text-muted-foreground">videos</span>
                                        </div>
                                        <div className="flex-1">
                                          <Progress value={parseFloat(milestone.progress_percentage)} className="h-2" />
                                        </div>
                                        <span className="font-semibold text-primary">
                                          {parseFloat(milestone.progress_percentage).toFixed(0)}%
                                        </span>
                                      </div>
                                    </div>

                                    {milestone.images && milestone.images.length > 0 && (
                                      <div className="flex gap-2">
                                        {milestone.images.slice(0, 3).map((image: any, idx: number) => (
                                          <div key={idx} className="w-20 h-20 rounded overflow-hidden">
                                            <img
                                              src={image.url}
                                              alt={`Preview ${idx + 1}`}
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inquiries" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Buyer Inquiries</CardTitle>
                <CardDescription>
                  Messages and leads from interested buyers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {inquiries.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      No inquiries yet
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Buyer inquiries will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inquiries.map((inquiry) => (
                      <Card key={inquiry.id} className="bg-muted/30">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{inquiry.buyer_name}</h4>
                                <Badge variant={inquiry.status === "new" ? "default" : "secondary"}>
                                  {inquiry.status === "new" ? (
                                    <>
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      New
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Responded
                                    </>
                                  )}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {inquiry.project_name}
                              </p>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 inline mr-1" />
                              {new Date(inquiry.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="bg-background rounded-lg p-3">
                              <p className="text-sm">{inquiry.message}</p>
                            </div>

                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-primary" />
                                <a href={`mailto:${inquiry.buyer_email}`} className="text-primary hover:underline">
                                  {inquiry.buyer_email}
                                </a>
                              </div>
                              {inquiry.buyer_phone && (
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-primary" />
                                  <a href={`tel:${inquiry.buyer_phone}`} className="text-primary hover:underline">
                                    {inquiry.buyer_phone}
                                  </a>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button size="sm" variant="default">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Respond
                              </Button>
                              <Button size="sm" variant="outline">
                                Mark as Read
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="space-y-6">
              {/* Performance Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription>
                    Track engagement and conversion metrics across your projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Views</span>
                        <Eye className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-3xl font-bold">{totalViews}</p>
                      <Progress value={75} className="h-2" />
                      <p className="text-xs text-green-600">↑ 12% from last month</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Interested Buyers</span>
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-3xl font-bold">{totalInterested}</p>
                      <Progress value={60} className="h-2" />
                      <p className="text-xs text-green-600">↑ 8% from last month</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Conversion Rate</span>
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-3xl font-bold">{conversionRate}%</p>
                      <Progress value={parseFloat(conversionRate)} className="h-2" />
                      <p className="text-xs text-green-600">↑ 3% from last month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Performance</CardTitle>
                  <CardDescription>
                    Compare engagement across your projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {projects.length === 0 ? (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No projects to analyze yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projects.map((project) => {
                        const projectConversion = project.views_count > 0
                          ? ((project.interested_count / project.views_count) * 100).toFixed(1)
                          : "0";

                        return (
                          <div key={project.id} className="p-4 bg-muted/30 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold">{project.name}</h4>
                                <p className="text-sm text-muted-foreground">{project.city}</p>
                              </div>
                              <Link to={`/projects/${project.id}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                              </Link>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Views</p>
                                <p className="text-xl font-bold">{project.views_count}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Interested</p>
                                <p className="text-xl font-bold">{project.interested_count}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Conversion</p>
                                <p className="text-xl font-bold text-primary">{projectConversion}%</p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span>Engagement Score</span>
                                <span className="font-medium">{projectConversion}%</span>
                              </div>
                              <Progress value={parseFloat(projectConversion)} className="h-2" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Insights & Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm mb-1">Increase Visibility</h5>
                        <p className="text-sm text-muted-foreground">
                          Projects with regular construction updates get 40% more views. Upload progress photos weekly.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm mb-1">Great Response Rate</h5>
                        <p className="text-sm text-muted-foreground">
                          Your average response time to inquiries is excellent. Keep it up!
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm mb-1">Enhance Project Details</h5>
                        <p className="text-sm text-muted-foreground">
                          Add high-quality images and detailed amenities to improve conversion rates.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchBuilderData}
      />
    </div>
  );
}
