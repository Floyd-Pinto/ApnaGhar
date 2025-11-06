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
import {
  Plus,
  Building2,
  Eye,
  Users,
  TrendingUp,
  FileText,
  Upload,
  Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface ProjectStats {
  id: string;
  name: string;
  views_count: number;
  interested_count: number;
  status: string;
}

export default function BuilderDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectStats[]>([]);

  const stats = [
    {
      title: "Active Projects",
      value: "0",
      icon: Building2,
      description: "Projects currently listed",
    },
    {
      title: "Total Views",
      value: "0",
      icon: Eye,
      description: "Across all projects",
    },
    {
      title: "Inquiries",
      value: "0",
      icon: Users,
      description: "Potential buyers",
    },
    {
      title: "Avg. Interest",
      value: "0%",
      icon: TrendingUp,
      description: "Conversion rate",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">Builder Dashboard</h1>
              <p className="text-lg opacity-90">
                Welcome back, {user?.first_name || "Builder"}!
              </p>
            </div>
            <Button variant="secondary" size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Post New Project
            </Button>
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
              <CardHeader>
                <CardTitle>My Projects</CardTitle>
                <CardDescription>
                  Manage your listed projects
                </CardDescription>
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
                    <Button size="lg">
                      <Plus className="h-5 w-5 mr-2" />
                      Post New Project
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <Card key={project.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-xl font-semibold mb-2">
                                {project.name}
                              </h3>
                              <div className="flex gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-4 w-4" />
                                  {project.views_count} views
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {project.interested_count} interested
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Link to={`/projects/${project.id}`}>
                                <Button variant="default" size="sm">
                                  View
                                </Button>
                              </Link>
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

          <TabsContent value="updates" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Construction Updates</CardTitle>
                <CardDescription>
                  Upload progress photos and milestone updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    No updates uploaded
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Keep buyers informed with regular construction updates
                  </p>
                  <Button disabled>
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Update
                  </Button>
                </div>
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
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    No inquiries yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Buyer inquiries will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Analytics</CardTitle>
                <CardDescription>
                  Track performance of your projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    Analytics coming soon
                  </h3>
                  <p className="text-muted-foreground">
                    Detailed insights and performance metrics
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="w-full h-20">
                <div className="flex flex-col items-center gap-2">
                  <Plus className="h-6 w-6" />
                  <span>Post New Project</span>
                </div>
              </Button>
              <Button variant="outline" className="w-full h-20" disabled>
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-6 w-6" />
                  <span>Upload Construction Update</span>
                </div>
              </Button>
              <Button variant="outline" className="w-full h-20" disabled>
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Manage Documents</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
