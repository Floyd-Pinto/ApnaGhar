import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  QrCode,
  Camera,
  MapPin,
} from "lucide-react";

interface Milestone {
  id: string;
  title: string;
  description: string;
  phase_number: number;
  status: string;
  progress_percentage: string;
  target_date: string;
  start_date?: string;
  completion_date?: string;
  verified: boolean;
  images: string[];
}

interface ProgressTrackerProps {
  milestones: Milestone[];
  projectName: string;
  overallProgress?: number;
}

export default function ProgressTracker({
  milestones,
  projectName,
  overallProgress = 0,
}: ProgressTrackerProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "verified":
        return "bg-green-500";
      case "in_progress":
        return "bg-blue-500";
      case "delayed":
        return "bg-red-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string, verified: boolean) => {
    if (verified) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  // Calculate overall progress if not provided
  const calculatedProgress =
    overallProgress ||
    (milestones.length > 0
      ? milestones.reduce((sum, m) => sum + parseFloat(m.progress_percentage), 0) /
        milestones.length
      : 0);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Live Progress Tracker
              </CardTitle>
              <CardDescription>Real-time construction updates for {projectName}</CardDescription>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Clock className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Overall Completion</span>
              <span className="font-bold text-primary">{calculatedProgress.toFixed(1)}%</span>
            </div>
            <Progress value={calculatedProgress} className="h-3" />
          </div>

          {/* Cloudinary Integration Placeholder */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-6 border-2 border-dashed border-primary/30">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Camera className="h-8 w-8 text-primary" />
                <QrCode className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Cloudinary Media & QR Verification</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Coming Soon: Real-time photo/video updates from construction site via Cloudinary
                integration with QR code verification for authenticity
              </p>
              <div className="flex items-center justify-center gap-4 pt-2">
                <div className="text-center">
                  <Camera className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Live Photos</span>
                </div>
                <div className="text-center">
                  <QrCode className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">QR Verify</span>
                </div>
                <div className="text-center">
                  <MapPin className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Geo-tagged</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Construction Milestones</CardTitle>
          <CardDescription>Phase-wise progress tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {milestones.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No milestones available yet</p>
              </div>
            ) : (
              milestones.map((milestone, index) => (
                <div
                  key={milestone.id}
                  className="relative pl-8 pb-6 border-l-2 border-muted last:border-transparent"
                >
                  {/* Timeline Dot */}
                  <div
                    className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 border-background ${getStatusColor(
                      milestone.status
                    )}`}
                  />

                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            Phase {milestone.phase_number}
                          </Badge>
                          <Badge className={`${getStatusColor(milestone.status)} text-xs`}>
                            {milestone.status.replace("_", " ")}
                          </Badge>
                          {milestone.verified && (
                            <Badge variant="outline" className="text-green-600 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold">{milestone.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {milestone.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {parseFloat(milestone.progress_percentage).toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <Progress value={parseFloat(milestone.progress_percentage)} className="h-2" />

                    {/* Dates */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Target:{" "}
                          {new Date(milestone.target_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      {milestone.completion_date && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>
                            Completed:{" "}
                            {new Date(milestone.completion_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Images Placeholder */}
                    {milestone.images && milestone.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        {milestone.images.map((image, idx) => (
                          <img
                            key={idx}
                            src={image}
                            alt={`${milestone.title} ${idx + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Verification Info */}
      <Card className="border-primary/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <QrCode className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">QR Code Verification (Coming Soon)</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Each milestone update will include QR codes that you can scan on-site to verify the
                authenticity of progress photos and construction updates.
              </p>
              <Button variant="outline" size="sm" disabled>
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR Code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
