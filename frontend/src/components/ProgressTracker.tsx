import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  QrCode,
  Camera,
  MapPin,
  Upload,
  Loader2,
  X,
  ZoomIn,
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
  images: Array<{
    sha256?: string;
    url: string;
    uploaded_at?: string;
    description?: string;
  }>;
  videos: Array<{
    sha256?: string;
    url: string;
    uploaded_at?: string;
    description?: string;
  }>;
}

interface ProgressTrackerProps {
  milestones: Milestone[];
  projectName: string;
  projectId?: string;
  overallProgress?: number;
  onMilestoneUpdate?: () => void;
}

export default function ProgressTracker({
  milestones,
  projectName,
  projectId,
  overallProgress = 0,
  onMilestoneUpdate,
}: ProgressTrackerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadingMilestoneId, setUploadingMilestoneId] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const [uploadDescription, setUploadDescription] = useState("");
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    description?: string;
    uploaded_at?: string;
    milestone?: string;
  } | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const handleImageClick = (image: any, milestoneTitle: string) => {
    setLightboxImage({
      url: image.url,
      description: image.description,
      uploaded_at: image.uploaded_at,
      milestone: milestoneTitle,
    });
    setLightboxOpen(true);
  };

  const handleUpload = async (milestoneId: string) => {
    if (selectedImages.length === 0 && selectedVideos.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one image or video",
        variant: "destructive",
      });
      return;
    }

    setUploadingMilestoneId(milestoneId);
    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      
      selectedImages.forEach((file) => formData.append("images", file));
      selectedVideos.forEach((file) => formData.append("videos", file));
      if (uploadDescription) formData.append("description", uploadDescription);

      const response = await fetch(
        `${API_BASE_URL}/api/projects/milestones/${milestoneId}/upload_media/`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        }
      );

      if (!response.ok) {
        let errorMessage = "Upload failed";
        const contentType = response.headers.get("content-type");
        
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          errorMessage = error.detail || error.message || "Upload failed";
        } else {
          const text = await response.text();
          console.error("Non-JSON response:", text);
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      toast({
        title: "Upload successful",
        description: "Media has been uploaded to milestone",
      });

      // Reset form
      setSelectedImages([]);
      setSelectedVideos([]);
      setUploadDescription("");
      
      // Notify parent to refresh data
      if (onMilestoneUpdate) {
        onMilestoneUpdate();
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || String(error),
        variant: "destructive",
      });
    } finally {
      setUploadingMilestoneId(null);
    }
  };

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
      {/* Debug Info - Remove after testing */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-4">
            <p className="text-xs font-mono">
              <strong>Debug Info:</strong> User Role: {user?.role || 'Not logged in'} | 
              Milestones: {milestones.length} | 
              Project ID: {projectId || 'N/A'}
            </p>
          </CardContent>
        </Card>
      )}

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

          {/* Cloudinary Media Integration - Active */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-6 border-2 border-primary/30">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Camera className="h-8 w-8 text-primary" />
                <QrCode className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Cloudinary Media & Hash Verification</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {user?.role === "builder" 
                  ? "Upload photos and videos to each milestone below. Files are stored securely in Cloudinary with SHA256 hash verification."
                  : "View real-time construction photos and videos uploaded by the builder, verified with SHA256 hashing."}
              </p>
              <div className="flex items-center justify-center gap-4 pt-2">
                <div className="text-center">
                  <Camera className="h-6 w-6 mx-auto mb-1 text-primary" />
                  <span className="text-xs text-muted-foreground">Photos</span>
                </div>
                <div className="text-center">
                  <QrCode className="h-6 w-6 mx-auto mb-1 text-primary" />
                  <span className="text-xs text-muted-foreground">Hash Verified</span>
                </div>
                <div className="text-center">
                  <MapPin className="h-6 w-6 mx-auto mb-1 text-primary" />
                  <span className="text-xs text-muted-foreground">Cloudinary</span>
                </div>
              </div>
              {user?.role === "builder" && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium text-primary">
                    👋 Hey Builder! {milestones.length > 0 
                      ? `Scroll down to upload media to ${milestones.length} milestone(s)` 
                      : "Create milestones in the admin panel first, then upload media here"}
                  </p>
                </div>
              )}
              {!user && (
                <div className="mt-3 text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-950 rounded p-2">
                  � Login as a buyer to view construction progress
                </div>
              )}
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
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No milestones created yet</p>
                  {user?.role === "builder" && (
                    <p className="text-xs mt-2">Create milestones in the admin panel to start tracking progress</p>
                  )}
                </div>
                
                {/* General Upload Section for builders when no milestones exist */}
                {user?.role === "builder" && (
                  <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 bg-muted/30">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Upload className="h-5 w-5 text-primary" />
                      Upload Project Progress Media
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm mb-1 block font-medium">Description</label>
                        <input
                          value={uploadDescription}
                          onChange={(e) => setUploadDescription(e.target.value)}
                          className="w-full rounded border p-2 bg-background"
                          placeholder="e.g., Foundation work completed"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm mb-1 block font-medium">Upload Images</label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => setSelectedImages(Array.from(e.target.files || []))}
                          className="w-full"
                        />
                        {selectedImages.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ✓ {selectedImages.length} image(s) selected
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm mb-1 block font-medium">Upload Videos</label>
                        <input
                          type="file"
                          accept="video/*"
                          multiple
                          onChange={(e) => setSelectedVideos(Array.from(e.target.files || []))}
                          className="w-full"
                        />
                        {selectedVideos.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ✓ {selectedVideos.length} video(s) selected
                          </p>
                        )}
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950 rounded p-3 text-sm">
                        <p className="text-muted-foreground">
                          <strong>Note:</strong> To upload media, you need to create milestones first in the admin panel.
                          Milestones help organize construction progress into phases.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
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

                    {/* Images and Videos */}
                    {((milestone.images && milestone.images.length > 0) || 
                      (milestone.videos && milestone.videos.length > 0)) && (
                      <div className="space-y-2 pt-2">
                        {milestone.images && milestone.images.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium mb-2 flex items-center gap-1">
                              <Camera className="h-3 w-3" />
                              Photos ({milestone.images.length})
                            </h5>
                            <div className="grid grid-cols-3 gap-2">
                              {milestone.images.map((image, idx) => (
                                <div 
                                  key={idx} 
                                  className="relative group cursor-pointer"
                                  onClick={() => handleImageClick(image, milestone.title)}
                                >
                                  <img
                                    src={image.url}
                                    alt={image.description || `${milestone.title} ${idx + 1}`}
                                    className="w-full h-20 object-cover rounded transition-transform group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded flex items-center justify-center">
                                    <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  {image.description && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b opacity-0 group-hover:opacity-100 transition-opacity">
                                      <p className="truncate">{image.description}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {milestone.videos && milestone.videos.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium mb-2">Videos</h5>
                            <div className="space-y-2">
                              {milestone.videos.map((video, idx) => (
                                <video
                                  key={idx}
                                  controls
                                  className="w-full h-40 bg-black rounded"
                                >
                                  <source src={video.url} />
                                  Your browser does not support the video tag.
                                </video>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Builder Upload Form - Always show for builders */}
                    {user?.role === "builder" && (
                      <div className="mt-4 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border-2 border-primary/20">
                        <div className="flex items-center gap-2 mb-3">
                          <Upload className="h-5 w-5 text-primary" />
                          <h5 className="text-sm font-semibold">Upload Media (Builder Only)</h5>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs mb-1 block font-medium">Description</label>
                            <input
                              value={uploadDescription}
                              onChange={(e) => setUploadDescription(e.target.value)}
                              className="w-full text-sm rounded border p-2 bg-background"
                              placeholder="e.g., Completed foundation work"
                            />
                          </div>
                          
                          <div>
                            <label className="text-xs mb-1 block font-medium">Images</label>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => setSelectedImages(Array.from(e.target.files || []))}
                              className="w-full text-xs p-1 bg-background border rounded"
                            />
                            {selectedImages.length > 0 && (
                              <p className="text-xs text-primary font-medium mt-1">
                                ✓ {selectedImages.length} image(s) selected
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="text-xs mb-1 block font-medium">Videos</label>
                            <input
                              type="file"
                              accept="video/*"
                              multiple
                              onChange={(e) => setSelectedVideos(Array.from(e.target.files || []))}
                              className="w-full text-xs p-1 bg-background border rounded"
                            />
                            {selectedVideos.length > 0 && (
                              <p className="text-xs text-primary font-medium mt-1">
                                ✓ {selectedVideos.length} video(s) selected
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpload(milestone.id)}
                              disabled={uploadingMilestoneId === milestone.id}
                              className="flex-1"
                            >
                              {uploadingMilestoneId === milestone.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-3 w-3 mr-2" />
                                  Upload to Cloudinary
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedImages([]);
                                setSelectedVideos([]);
                                setUploadDescription("");
                              }}
                            >
                              Clear
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hash Verification Info */}
      <Card className="border-primary/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">SHA256 Hash Verification</h4>
              <p className="text-sm text-muted-foreground mb-3">
                All uploaded media is verified using SHA256 cryptographic hashing. This ensures content integrity
                and prevents tampering. Each file's unique hash is stored in the database while the actual media
                is securely stored in Cloudinary.
              </p>
              <div className="flex gap-2 text-xs">
                <Badge variant="outline" className="gap-1">
                  <Camera className="h-3 w-3" />
                  Cloudinary Storage
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Hash Verified
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Upload className="h-3 w-3" />
                  Deduplicated
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              {lightboxImage?.milestone}
            </DialogTitle>
            {lightboxImage?.description && (
              <DialogDescription className="text-base">
                {lightboxImage.description}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="relative bg-black/5">
            {lightboxImage && (
              <img
                src={lightboxImage.url}
                alt={lightboxImage.description || "Construction progress"}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            )}
          </div>
          {lightboxImage?.uploaded_at && (
            <div className="px-6 pb-6 pt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Uploaded: {new Date(lightboxImage.uploaded_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>SHA256 Hash Verified • Stored in Cloudinary</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
