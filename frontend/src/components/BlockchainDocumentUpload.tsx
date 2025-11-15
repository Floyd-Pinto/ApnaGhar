import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, CheckCircle2, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

interface BlockchainDocumentUploadProps {
  projectId: string;
  propertyId?: string;
  onSuccess?: () => void;
}

const DOCUMENT_TYPES = [
  { value: 'contract', label: 'Contract' },
  { value: 'agreement', label: 'Agreement' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'permit', label: 'Permit' },
  { value: 'license', label: 'License' },
  { value: 'other', label: 'Other' },
];

export default function BlockchainDocumentUpload({
  projectId,
  propertyId,
  onSuccess,
}: BlockchainDocumentUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('other');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Auto-fill document name if empty
      if (!documentName) {
        setDocumentName(e.target.files[0].name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !documentName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please select a file and provide a document name',
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
      formData.append('document_name', documentName);
      formData.append('document_type', documentType);
      formData.append('file', file);

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/blockchain/documents/upload_document/`, {
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
        description: 'Document stored on blockchain successfully',
      });

      // Reset form
      setFile(null);
      setDocumentName('');
      setDocumentType('other');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload document',
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
          <FileText className="h-5 w-5" />
          Upload Document to Blockchain
        </CardTitle>
        <CardDescription>
          Upload legal documents (PDF, etc.). Files are stored on IPFS and hashes are recorded on blockchain.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Document File</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
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
            <Label htmlFor="documentName">Document Name</Label>
            <Input
              id="documentName"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="e.g., Sale Agreement, Building Permit"
              disabled={uploading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentType">Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType} disabled={uploading}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={uploading || !file || !documentName.trim()} className="w-full">
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

