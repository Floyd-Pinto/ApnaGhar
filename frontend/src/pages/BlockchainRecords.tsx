import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, Image, ExternalLink, Shield, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProgressUpdate {
  id: string;
  progress_id: string;
  description: string;
  ipfs_hash: string;
  ipfs_url: string;
  blockchain_tx_id?: string;
  created_at: string;
  uploaded_by_username: string;
}

interface Document {
  id: string;
  document_id: string;
  document_name: string;
  document_type: string;
  ipfs_hash: string;
  ipfs_url: string;
  blockchain_tx_id?: string;
  created_at: string;
  uploaded_by_username: string;
}

export default function BlockchainRecords() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState('progress');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    if (projectId) {
      fetchProgressUpdates();
      fetchDocuments();
    }
  }, [projectId]);

  const fetchProgressUpdates = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/blockchain/progress/`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter by project if needed
        const filtered = projectId
          ? data.results?.filter((item: any) => item.project?.id === projectId) || []
          : data.results || [];
        setProgressUpdates(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch progress updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/blockchain/documents/`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter by project if needed
        const filtered = projectId
          ? data.results?.filter((item: any) => item.project?.id === projectId) || []
          : data.results || [];
        setDocuments(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (projectId) {
                navigate(`/projects/${projectId}`);
              } else {
                navigate('/explore-projects');
              }
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
        </div>
        <h1 className="text-3xl font-bold mb-2">Blockchain Records</h1>
        <p className="text-muted-foreground">
          View and manage immutable records stored on Hyperledger Fabric blockchain
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="progress">Progress Updates</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          {progressUpdates.length === 0 ? (
            <Alert>
              <AlertDescription>No progress updates found on blockchain.</AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {progressUpdates.map((update) => (
                <Card key={update.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        Progress Update
                      </CardTitle>
                      {update.blockchain_tx_id && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      Uploaded by {update.uploaded_by_username} on{' '}
                      {new Date(update.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">{update.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <strong>IPFS Hash:</strong> <code className="text-xs">{update.ipfs_hash}</code>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(update.ipfs_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on IPFS
                      </Button>
                    </div>
                    {update.blockchain_tx_id && (
                      <div className="mt-2 text-sm">
                        <strong>Blockchain TX ID:</strong> <code className="text-xs">{update.blockchain_tx_id}</code>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          {documents.length === 0 ? (
            <Alert>
              <AlertDescription>No documents found on blockchain.</AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {doc.document_name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge>{doc.document_type}</Badge>
                        {doc.blockchain_tx_id && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      Uploaded by {doc.uploaded_by_username} on{' '}
                      {new Date(doc.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <strong>IPFS Hash:</strong> <code className="text-xs">{doc.ipfs_hash}</code>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.ipfs_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on IPFS
                      </Button>
                    </div>
                    {doc.blockchain_tx_id && (
                      <div className="mt-2 text-sm">
                        <strong>Blockchain TX ID:</strong> <code className="text-xs">{doc.blockchain_tx_id}</code>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}

