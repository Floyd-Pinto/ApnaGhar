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
import { Loader2, Plus } from "lucide-react";

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

      // Prepare payload
      const payload = {
        ...formData,
        starting_price: parseFloat(formData.starting_price),
        total_units: parseInt(formData.total_units) || 0,
        available_units: parseInt(formData.available_units) || parseInt(formData.total_units) || 0,
        total_floors: formData.total_floors ? parseInt(formData.total_floors) : null,
        total_area_sqft: formData.total_area_sqft ? parseFloat(formData.total_area_sqft) : null,
        launch_date: formData.launch_date || null,
        expected_completion: formData.expected_completion || null,
      };

      const response = await fetch(`${API_BASE_URL}/api/projects/projects/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || error.message || "Failed to create project");
      }

      toast({
        title: "Success!",
        description: "Project created successfully",
      });

      // Reset form
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
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new real estate project to your portfolio
          </DialogDescription>
        </DialogHeader>

        <form id="create-project-form" onSubmit={handleSubmit} className="dialog-scroll space-y-6 overflow-y-auto flex-1 px-6 pr-3">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Basic Information</h3>
            
            <div>
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleSlugGeneration(e.target.value)}
                placeholder="e.g., Tranquil Apartments"
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., tranquil-apartments"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-generated from project name. Customize if needed.
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your project..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project_type">Project Type *</Label>
                <Select
                  value={formData.project_type}
                  onValueChange={(value) => setFormData({ ...formData, project_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="mixed">Mixed Use</SelectItem>
                    <SelectItem value="plotted">Plotted Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Location</h3>
            
            <div>
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address"
                rows={2}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g., Bangalore"
                  required
                />
              </div>

              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g., Karnataka"
                  required
                />
              </div>

              <div>
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="e.g., 560001"
                  required
                />
              </div>
            </div>
          </div>

          {/* Financial & Units */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Pricing & Units</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="starting_price">Starting Price (₹) *</Label>
                <Input
                  id="starting_price"
                  type="number"
                  value={formData.starting_price}
                  onChange={(e) => setFormData({ ...formData, starting_price: e.target.value })}
                  placeholder="e.g., 5000000"
                  required
                />
              </div>

              <div>
                <Label htmlFor="total_units">Total Units *</Label>
                <Input
                  id="total_units"
                  type="number"
                  value={formData.total_units}
                  onChange={(e) => setFormData({ ...formData, total_units: e.target.value })}
                  placeholder="e.g., 100"
                  required
                />
              </div>

              <div>
                <Label htmlFor="available_units">Available Units</Label>
                <Input
                  id="available_units"
                  type="number"
                  value={formData.available_units}
                  onChange={(e) => setFormData({ ...formData, available_units: e.target.value })}
                  placeholder="Same as total units"
                />
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Project Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="total_floors">Total Floors</Label>
                <Input
                  id="total_floors"
                  type="number"
                  value={formData.total_floors}
                  onChange={(e) => setFormData({ ...formData, total_floors: e.target.value })}
                  placeholder="e.g., 15"
                />
              </div>

              <div>
                <Label htmlFor="total_area_sqft">Total Area (sq.ft)</Label>
                <Input
                  id="total_area_sqft"
                  type="number"
                  value={formData.total_area_sqft}
                  onChange={(e) => setFormData({ ...formData, total_area_sqft: e.target.value })}
                  placeholder="e.g., 50000"
                />
              </div>

              <div>
                <Label htmlFor="launch_date">Launch Date</Label>
                <Input
                  id="launch_date"
                  type="date"
                  value={formData.launch_date}
                  onChange={(e) => setFormData({ ...formData, launch_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="expected_completion">Expected Completion</Label>
                <Input
                  id="expected_completion"
                  type="date"
                  value={formData.expected_completion}
                  onChange={(e) => setFormData({ ...formData, expected_completion: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cover_image">Cover Image URL</Label>
              <Input
                id="cover_image"
                type="url"
                value={formData.cover_image}
                onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Amenities</h3>
            
            <div className="flex gap-2">
              <Input
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAmenity())}
                placeholder="e.g., Swimming Pool, Gym, Park"
              />
              <Button type="button" onClick={handleAddAmenity} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {formData.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {amenity}
                    <button
                      type="button"
                      onClick={() => handleRemoveAmenity(amenity)}
                      className="text-primary hover:text-primary/70"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        <DialogFooter className="px-6 pb-6 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" form="create-project-form" disabled={loading}>
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
