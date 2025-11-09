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
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please login to continue",
          variant: "destructive",
        });
        return;
      }

      // Fetch builder's projects
      const projectsRes = await fetch(`${API_BASE_URL}/api/projects/projects/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (projectsRes.ok) {
        const allProjects = await projectsRes.json();
        console.log("Fetched projects:", allProjects);
        
        // Filter only this builder's projects (in a real scenario, backend should filter by developer)
        const projectsList = allProjects.results || allProjects;
        setProjects(Array.isArray(projectsList) ? projectsList : []);

        // Fetch milestones for all builder's projects only if there are projects
        if (projectsList.length > 0) {
          const projectIds = projectsList.map((p: Project) => p.id);
          const milestonesPromises = projectIds.map((id: string) =>
            fetch(`${API_BASE_URL}/api/projects/projects/${id}/milestones/`, {
              headers: { Authorization: `Bearer ${token}` },
            }).then((res) => (res.ok ? res.json() : []))
          );

          const milestonesData = await Promise.all(milestonesPromises);
          const allMilestones = milestonesData.flat().map((m: any) => ({
            ...m,
            project_name: projectsList.find((p: Project) => p.id === m.project)?.name || "Unknown Project",
          }));
          setMilestones(allMilestones);
        }
      } else {
        console.error("Failed to fetch projects:", projectsRes.status, projectsRes.statusText);
        toast({
          title: "Error",
          description: "Failed to load projects",
          variant: "destructive",
        });
      }

      // Mock inquiries data (you can create a real API endpoint)
      setInquiries([
        {
          id: "1",
          project_id: projects[0]?.id || "",
          project_name: projects[0]?.name || "Sample Project",
          buyer_name: "John Doe",
          buyer_email: "john@example.com",
          buyer_phone: "+91 98765 43210",
          message: "I'm interested in 3BHK units. Can you share more details?",
          status: "new",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Failed to fetch builder data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
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
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
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
          <TabsList>
            <TabsTrigger value="projects">
              <Building2 className="h-4 w-4 mr-2" />
              My Projects
            </TabsTrigger>
            <TabsTrigger value="updates">
              <Upload className="h-4 w-4 mr-2" />
              Construction Updates
            </TabsTrigger>
            <TabsTrigger value="inquiries">
              <Users className="h-4 w-4 mr-2" />
              Inquiries
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Projects</CardTitle>
                  <CardDescription>
                    Manage your listed projects
                  </CardDescription>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)}>
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
                    <p className="text-muted-foreground mb-6">
                      Start by posting your first project
                    </p>
                    <Button size="lg" onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="h-5 w-5 mr-2" />
                      Post New Project
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <Card key={project.id} className="overflow-hidden">
                        <div className="flex">
                          {project.cover_image && (
                            <div className="w-48 h-32 flex-shrink-0">
                              <img
                                src={project.cover_image}
                                alt={project.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <CardContent className="flex-1 pt-6">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-xl font-semibold">{project.name}</h3>
                                  <Badge variant={project.status === "ongoing" ? "default" : "secondary"}>
                                    {project.status}
                                  </Badge>
                                  <Badge variant="outline">{project.project_type}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {project.city}, {project.state}
                                </p>
                                <div className="flex gap-6 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Eye className="h-4 w-4 text-primary" />
                                    <span className="font-medium">{project.views_count}</span>
                                    <span className="text-muted-foreground">views</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4 text-primary" />
                                    <span className="font-medium">{project.interested_count}</span>
                                    <span className="text-muted-foreground">interested</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Building2 className="h-4 w-4 text-primary" />
                                    <span className="font-medium">{project.available_units}/{project.total_units}</span>
                                    <span className="text-muted-foreground">available</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Link to={`/projects/${project.id}`}>
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </Button>
                                </Link>
                                <Button variant="outline" size="sm" disabled>
                                  <Settings className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                                <Link to={`/projects/${project.id}?tab=progress`}>
                                  <Button variant="default" size="sm">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Updates
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
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
