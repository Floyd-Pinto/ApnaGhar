import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateProjectDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateProjectDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    project_type: "residential",
    status: "upcoming",
    address: "",
    city: "",
    state: "",
    pincode: "",
    starting_price: "",
    total_units: "",
    available_units: "",
    total_floors: "",
    total_area_sqft: "",
    launch_date: "",
    expected_completion: "",
    cover_image: "",
    amenities: [] as string[],
  });
  const [amenityInput, setAmenityInput] = useState("");

  const handleSlugGeneration = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData({ ...formData, name, slug });
  };

  const handleAddAmenity = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenityInput.trim()],
      });
      setAmenityInput("");
    }
  };

  const handleRemoveAmenity = (amenity: string) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter((a) => a !== amenity),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const payload = {
        ...formData,
        starting_price: parseFloat(formData.starting_price),
        total_units: parseInt(formData.total_units) || 0,
        available_units: parseInt(formData.available_units) || parseInt(formData.total_units) || 0,
        total_floors: parseInt(formData.total_floors) || 0,
        total_area_sqft: parseFloat(formData.total_area_sqft) || 0,
      };

      const response = await fetch(`${API_BASE_URL}/api/projects/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create project");
      }

      toast({
        title: "Success!",
        description: "Project created successfully",
      });

      setFormData({
        name: "",
        slug: "",
        description: "",
        project_type: "residential",
        status: "upcoming",
        address: "",
        city: "",
        state: "",
        pincode: "",
        starting_price: "",
        total_units: "",
        available_units: "",
        total_floors: "",
        total_area_sqft: "",
        launch_date: "",
        expected_completion: "",
        cover_image: "",
        amenities: [],
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Create project error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new real estate project to your portfolio
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <form 
            id="create-project-form" 
            onSubmit={handleSubmit} 
            className="space-y-6 pb-4"
          >
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold border-b pb-2">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleSlugGeneration(e.target.value)}
                  placeholder="e.g., Tranquil Apartments"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., tranquil-apartments"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Auto-generated from project name
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the project"
                  className="min-h-20 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="project_type">Project Type *</Label>
                  <Select
                    value={formData.project_type}
                    onValueChange={(value) => setFormData({ ...formData, project_type: value })}
                  >
                    <SelectTrigger id="project_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="mixed">Mixed Use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="font-semibold border-b pb-2">Location Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="Pincode"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="space-y-4">
              <h3 className="font-semibold border-b pb-2">Project Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="starting_price">Starting Price (₹) *</Label>
                  <Input
                    id="starting_price"
                    type="number"
                    step="0.01"
                    value={formData.starting_price}
                    onChange={(e) => setFormData({ ...formData, starting_price: e.target.value })}
                    placeholder="e.g., 5000000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total_units">Total Units</Label>
                  <Input
                    id="total_units"
                    type="number"
                    value={formData.total_units}
                    onChange={(e) => setFormData({ ...formData, total_units: e.target.value })}
                    placeholder="e.g., 50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total_floors">Total Floors</Label>
                  <Input
                    id="total_floors"
                    type="number"
                    value={formData.total_floors}
                    onChange={(e) => setFormData({ ...formData, total_floors: e.target.value })}
                    placeholder="e.g., 10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total_area_sqft">Total Area (sq.ft.)</Label>
                  <Input
                    id="total_area_sqft"
                    type="number"
                    step="0.01"
                    value={formData.total_area_sqft}
                    onChange={(e) => setFormData({ ...formData, total_area_sqft: e.target.value })}
                    placeholder="e.g., 50000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="launch_date">Launch Date</Label>
                  <Input
                    id="launch_date"
                    type="date"
                    value={formData.launch_date}
                    onChange={(e) => setFormData({ ...formData, launch_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_completion">Expected Completion</Label>
                  <Input
                    id="expected_completion"
                    type="date"
                    value={formData.expected_completion}
                    onChange={(e) => setFormData({ ...formData, expected_completion: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-4">
              <h3 className="font-semibold border-b pb-2">Amenities</h3>
              
              <div className="flex gap-2">
                <Input
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddAmenity();
                    }
                  }}
                  placeholder="e.g., Swimming Pool"
                />
                <Button
                  type="button"
                  onClick={handleAddAmenity}
                  variant="outline"
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {formData.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((amenity, index) => (
                    <Badge key={index} variant="secondary" className="px-2 py-1">
                      {amenity}
                      <button
                        type="button"
                        onClick={() => handleRemoveAmenity(amenity)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="create-project-form" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
