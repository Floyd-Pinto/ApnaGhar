import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

interface BlockchainProgressUploadProps {
  projectId: string;
  propertyId?: string;
  milestoneId?: string;
  onSuccess?: () => void;
}

export default function BlockchainProgressUpload({
  projectId,
  propertyId,
  milestoneId,
  onSuccess,
}: BlockchainProgressUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please select a file and provide a description',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('project_id', projectId);
      if (propertyId) {
        formData.append('property_id', propertyId);
      }
      if (milestoneId) {
        formData.append('milestone_id', milestoneId);
      }
      formData.append('description', description);
      formData.append('file', file);

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/blockchain/progress/upload_progress/`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }

      const result = await response.json();
      setUploadResult(result);

      toast({
        title: 'Upload Successful',
        description: 'Progress update stored on blockchain successfully',
      });

      // Reset form
      setFile(null);
      setDescription('');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload progress update',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Progress to Blockchain
        </CardTitle>
        <CardDescription>
          Upload construction progress photos/videos. Files are stored on IPFS and hashes are recorded on blockchain.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Progress Photo/Video</Label>
            <Input
              id="file"
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              disabled={uploading}
              required
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the construction progress, milestone achieved, or any updates..."
              rows={4}
              disabled={uploading}
              required
            />
          </div>

          <Button type="submit" disabled={uploading || !file || !description.trim()} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading to IPFS and Blockchain...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload to Blockchain
              </>
            )}
          </Button>
        </form>

        {uploadResult && (
          <Alert className="mt-4">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Upload Successful!</p>
                <div className="text-sm space-y-1">
                  <p><strong>IPFS Hash:</strong> {uploadResult.ipfs_hash}</p>
                  <p><strong>IPFS URL:</strong> <a href={uploadResult.ipfs_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{uploadResult.ipfs_url}</a></p>
                  {uploadResult.blockchain_tx_id && (
                    <p><strong>Blockchain TX ID:</strong> {uploadResult.blockchain_tx_id}</p>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

