import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import SecureUpload from '@/components/SecureUpload';
import {
  QrCode,
  Upload,
  ArrowLeft,
  Loader2,
  Building2,
  Home,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface Milestone {
  id: string;
  title: string;
  description: string;
  phase_number: number;
  status: string;
  qr_code_data: string | null;
}

interface Property {
  id: string;
  unit_number: string;
  property_type: string;
  tower: string;
  floor_number: number;
  status: string;
  qr_code_data: string | null;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  developer: {
    company_name: string;
  };
}

export default function ManageQRCodes() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast({
          title: 'Authentication required',
          description: 'Please login to continue',
          variant: 'destructive',
        });
        return;
      }

      // Fetch project details
      const projectRes = await fetch(
        `${API_BASE_URL}/api/projects/projects/${projectId}/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!projectRes.ok) throw new Error('Failed to fetch project');
      const projectData = await projectRes.json();
      setProject(projectData);

      // Fetch milestones
      const milestonesRes = await fetch(
        `${API_BASE_URL}/api/projects/projects/${projectId}/milestones/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (milestonesRes.ok) {
        const milestonesData = await milestonesRes.json();
        setMilestones(milestonesData.results || milestonesData || []);
      }

      // Fetch properties
      const propertiesRes = await fetch(
        `${API_BASE_URL}/api/projects/projects/${projectId}/properties/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json();
        setProperties(propertiesData.results || propertiesData || []);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShowQR = (item: Milestone | Property, type: 'milestone' | 'property') => {
    if (!item.qr_code_data) {
      toast({
        title: 'QR Code Not Available',
        description: 'This item does not have a QR code yet. Please contact support.',
        variant: 'destructive',
      });
      return;
    }

    if (type === 'milestone') {
      setSelectedMilestone(item as Milestone);
      setSelectedProperty(null);
    } else {
      setSelectedProperty(item as Property);
      setSelectedMilestone(null);
    }
    setShowQRDialog(true);
  };

  const handleUpload = () => {
    setShowUploadDialog(true);
  };

  const handleCloseQRDialog = () => {
    setShowQRDialog(false);
    setSelectedMilestone(null);
    setSelectedProperty(null);
  };

  const handleCloseUploadDialog = () => {
    setShowUploadDialog(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Project not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6">
        <Link to="/dashboard/builder">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">QR Code Management</h1>
        <p className="text-muted-foreground">{project.name}</p>
      </div>

      <Tabs defaultValue="milestones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="milestones">
            <Building2 className="mr-2 h-4 w-4" />
            Milestones ({milestones.length})
          </TabsTrigger>
          <TabsTrigger value="properties">
            <Home className="mr-2 h-4 w-4" />
            Properties ({properties.length})
          </TabsTrigger>
        </TabsList>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold">Construction Milestones</h2>
              <Button onClick={handleUpload} variant="outline" className="w-full sm:w-auto min-h-[44px]">
                <Upload className="mr-2 h-4 w-4" />
                Secure Upload
              </Button>
            </div>

            {milestones.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No milestones found for this project
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {milestones.map((milestone) => (
                  <Card key={milestone.id}>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            Phase {milestone.phase_number}: {milestone.title}
                          </CardTitle>
                          <CardDescription>{milestone.description}</CardDescription>
                        </div>
                        <Badge
                          variant={
                            milestone.status === 'completed'
                              ? 'default'
                              : milestone.status === 'in_progress'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="self-start"
                        >
                          {milestone.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => handleShowQR(milestone, 'milestone')}
                        disabled={!milestone.qr_code_data}
                        className="w-full sm:w-auto min-h-[44px]"
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        {milestone.qr_code_data ? 'Show QR Code' : 'QR Code Not Available'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold">Property Units</h2>
              <Button onClick={handleUpload} variant="outline" className="w-full sm:w-auto min-h-[44px]">
                <Upload className="mr-2 h-4 w-4" />
                Secure Upload
              </Button>
            </div>

            {properties.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No properties found for this project
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {properties.map((property) => (
                  <Card key={property.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">Unit {property.unit_number}</CardTitle>
                      <CardDescription>
                        {property.property_type} • Floor {property.floor_number}
                        {property.tower && ` • Tower ${property.tower}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="outline" className="mb-4">
                        {property.status.replace('_', ' ')}
                      </Badge>
                      <Button
                        onClick={() => handleShowQR(property, 'property')}
                        disabled={!property.qr_code_data}
                        className="w-full min-h-[44px]"
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        {property.qr_code_data ? 'Show QR Code' : 'QR Code Not Available'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMilestone ? 'Milestone QR Code' : 'Property QR Code'}
            </DialogTitle>
            <DialogDescription>
              Scan this QR code at the construction site for secure uploads
            </DialogDescription>
          </DialogHeader>

          {selectedMilestone && project && (
            <QRCodeDisplay
              entityType="milestone"
              entityId={selectedMilestone.id}
              projectName={project.name}
              title={selectedMilestone.title}
              qrCodeData={selectedMilestone.qr_code_data!}
            />
          )}

          {selectedProperty && project && (
            <QRCodeDisplay
              entityType="property"
              entityId={selectedProperty.id}
              projectName={project.name}
              unitNumber={selectedProperty.unit_number}
              qrCodeData={selectedProperty.qr_code_data!}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Secure Upload Dialog */}
      <Dialog 
        open={showUploadDialog} 
        onOpenChange={(open) => {
          // Only allow closing via X button or explicit close
          if (!open) {
            setShowUploadDialog(false);
          }
        }}
      >
        <DialogContent 
          className="max-w-4xl max-h-[90vh] !translate-x-[-50%] !translate-y-[-50%]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Secure Upload</DialogTitle>
            <DialogDescription>
              Upload construction updates using QR code verification
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <SecureUpload
              onSuccess={() => {
                toast({
                  title: 'Upload Successful',
                  description: 'Construction updates uploaded successfully',
                });
                fetchProjectData(); // Refresh data
              }}
              onClose={() => {
                setShowUploadDialog(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
