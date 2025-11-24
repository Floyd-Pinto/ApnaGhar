import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, Image, ExternalLink, Shield, ArrowLeft, CheckCircle2, Clock, Copy, Database } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

interface ProgressUpdate {
  id: string;
  progress_id: string;
  description: string;
  ipfs_hash: string;
  ipfs_url: string;
  blockchain_tx_id?: string;
  blockchain_timestamp?: string;
  created_at: string;
  uploaded_by_username: string;
  metadata?: any;
}

interface Document {
  id: string;
  document_id: string;
  document_name: string;
  document_type: string;
  ipfs_hash: string;
  ipfs_url: string;
  blockchain_tx_id?: string;
  blockchain_timestamp?: string;
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
        const filtered = projectId
          ? data.results?.filter((item: any) => item.project?.id === projectId) || []
          : data.results || [];
        setDocuments(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        < Loader2 className="h-8 w-8 animate-spin" />
      </div >
    );
  }


  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
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
        <div className="flex items-center gap-3 mb-2">
          <Database className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Blockchain Records</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Immutable records stored on Hyperledger Fabric blockchain with IPFS storage
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Progress Updates</p>
                  <p className="text-3xl font-bold">{progressUpdates.length}</p>
                </div>
                <Image className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <p className="text-3xl font-bold">{documents.length}</p>
                </div>
                <FileText className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Blockchain Verified</p>
                  <p className="text-3xl font-bold">
                    {progressUpdates.filter(u => u.blockchain_tx_id).length + documents.filter(d => d.blockchain_tx_id).length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Progress Updates ({progressUpdates.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents ({documents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          {progressUpdates.length === 0 ? (
            <Alert>
              <AlertDescription>No progress updates found on blockchain.</AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-6">
              {progressUpdates.map((update) => (
                <Card key={update.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="flex items-center gap-2 text-xl">
                            <Image className="h-5 w-5 text-blue-500" />
                            Construction Progress Update
                          </CardTitle>
                          {update.blockchain_tx_id ? (
                            <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Blockchain Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Pending Verification
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-base">
                          Uploaded by <span className="font-semibold">{update.uploaded_by_username}</span> on{' '}
                          {formatDate(update.created_at)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-lg mb-4">{update.description}</p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase">Blockchain Data</h4>

                      {/* Progress ID */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Progress ID</p>
                          <code className="text-sm font-mono">{update.progress_id}</code>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(update.progress_id, 'Progress ID')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* IPFS Hash */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">IPFS Hash</p>
                          <code className="text-sm font-mono break-all">{update.ipfs_hash}</code>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(update.ipfs_hash, 'IPFS Hash')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(update.ipfs_url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>

                      {/* Blockchain TX ID */}
                      {update.blockchain_tx_id && (
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1">Blockchain Transaction ID</p>
                            <code className="text-sm font-mono break-all text-green-700 dark:text-green-400">
                              {update.blockchain_tx_id}
                            </code>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(update.blockchain_tx_id!, 'Transaction ID')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {/* Blockchain Timestamp */}
                      {update.blockchain_timestamp && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Blockchain Timestamp: {formatDate(update.blockchain_timestamp)}</span>
                        </div>
                      )}
                    </div>
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
            <div className="grid gap-6">
              {documents.map((doc) => (
                <Card key={doc.id} className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="flex items-center gap-2 text-xl">
                            <FileText className="h-5 w-5 text-green-500" />
                            {doc.document_name}
                          </CardTitle>
                          <Badge variant="secondary">{doc.document_type}</Badge>
                          {doc.blockchain_tx_id ? (
                            <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Blockchain Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Pending Verification
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-base">
                          Uploaded by <span className="font-semibold">{doc.uploaded_by_username}</span> on{' '}
                          {formatDate(doc.created_at)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase">Blockchain Data</h4>

                      {/* Document ID */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Document ID</p>
                          <code className="text-sm font-mono">{doc.document_id}</code>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(doc.document_id, 'Document ID')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* IPFS Hash */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">IPFS Hash</p>
                          <code className="text-sm font-mono break-all">{doc.ipfs_hash}</code>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(doc.ipfs_hash, 'IPFS Hash')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(doc.ipfs_url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>

                      {/* Blockchain TX ID */}
                      {doc.blockchain_tx_id && (
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1">Blockchain Transaction ID</p>
                            <code className="text-sm font-mono break-all text-green-700 dark:text-green-400">
                              {doc.blockchain_tx_id}
                            </code>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(doc.blockchain_tx_id!, 'Transaction ID')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {/* Blockchain Timestamp */}
                      {doc.blockchain_timestamp && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Blockchain Timestamp: {formatDate(doc.blockchain_timestamp)}</span>
                        </div>
                      )}
                    </div>
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
