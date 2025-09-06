import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEFPPassport } from "@/hooks/useEFPPassport";
import { useAccount } from "wagmi";
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Edit, 
  Plus, 
  ExternalLink, 
  Copy,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building,
  Verified,
  AlertTriangle,
  Download,
  Upload,
  Star,
  Award,
  Link,
  Twitter,
  Github,
  MessageCircle,
  Loader2,
  Save,
  Trash2
} from "lucide-react";

const Identity = () => {
  const { address, isConnected } = useAccount();
  const { 
    profile, 
    credentials, 
    isLoading, 
    error, 
    updateProfile, 
    verifyCredential, 
    addAttestation,
    getProfileScore,
    getProfileLevel,
    exportProfile,
    importProfile
  } = useEFPPassport();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    displayName: '',
    bio: '',
    avatar: '',
    socialLinks: {
      twitter: '',
      github: '',
      discord: '',
      website: ''
    }
  });
  const [verifyingCredential, setVerifyingCredential] = useState<string | null>(null);
  const [showAddAttestation, setShowAddAttestation] = useState(false);
  const [newAttestation, setNewAttestation] = useState({
    type: 'custom' as const,
    title: '',
    description: '',
    issuer: '',
    issuerName: '',
    verified: true,
    metadata: {}
  });

  // Initialize edit data when profile changes
  useEffect(() => {
    if (profile) {
      setEditData({
        displayName: profile.displayName,
        bio: profile.bio || '',
        avatar: profile.avatar || '',
        socialLinks: {
          twitter: profile.socialLinks.twitter || '',
          github: profile.socialLinks.github || '',
          discord: profile.socialLinks.discord || '',
          website: profile.socialLinks.website || ''
        }
      });
    }
  }, [profile]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      await updateProfile({
        displayName: editData.displayName,
        bio: editData.bio,
        avatar: editData.avatar,
        socialLinks: editData.socialLinks
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditData({
        displayName: profile.displayName,
        bio: profile.bio || '',
        avatar: profile.avatar || '',
        socialLinks: {
          twitter: profile.socialLinks.twitter || '',
          github: profile.socialLinks.github || '',
          discord: profile.socialLinks.discord || '',
          website: profile.socialLinks.website || ''
        }
      });
    }
    setIsEditing(false);
  };

  const handleVerifyCredential = async (credentialId: string) => {
    setVerifyingCredential(credentialId);
    try {
      const success = await verifyCredential(credentialId, {});
      if (success) {
        // Show success message
        console.log(`Successfully verified ${credentialId}`);
      }
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setVerifyingCredential(null);
    }
  };

  const handleAddAttestation = async () => {
    if (!profile) return;

    try {
      await addAttestation(newAttestation);
      setNewAttestation({
        type: 'custom',
        title: '',
        description: '',
        issuer: '',
        issuerName: '',
        verified: true,
        metadata: {}
      });
      setShowAddAttestation(false);
    } catch (error) {
      console.error('Failed to add attestation:', error);
    }
  };

  const handleExportProfile = () => {
    const profileData = exportProfile();
    if (profileData) {
      const blob = new Blob([profileData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `efp-profile-${profile?.address.slice(0, 6)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getCredentialIcon = (credentialId: string) => {
    switch (credentialId) {
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'github': return <Github className="w-4 h-4" />;
      case 'discord': return <MessageCircle className="w-4 h-4" />;
      case 'ens': return <Globe className="w-4 h-4" />;
      case 'poap': return <Award className="w-4 h-4" />;
      case 'lens': return <Link className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getAttestationIcon = (type: string) => {
    switch (type) {
      case 'social': return <User className="w-4 h-4" />;
      case 'achievement': return <Award className="w-4 h-4" />;
      case 'credential': return <Shield className="w-4 h-4" />;
      case 'membership': return <Building className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  if (!isConnected || !address) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-4">
              Connect your wallet to access your Ethereum Foundation Passport
            </p>
            <Button disabled>
              <User className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your passport...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Passport Found</h2>
            <p className="text-muted-foreground mb-4">
              Unable to load your Ethereum Foundation Passport
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profileScore = getProfileScore();
  const profileLevel = getProfileLevel();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-4 bg-card flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <Shield className="w-6 h-6" />
              <span>Ethereum Foundation Passport</span>
            </h1>
            <p className="text-muted-foreground">Manage your onchain identity and verifiable credentials</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center space-x-1">
              <Star className="w-3 h-3" />
              <span>{profileLevel}</span>
            </Badge>
            <Button variant="outline" size="sm" onClick={handleExportProfile}>
              <Download className="w-4 h-4 mr-2" />
              Export
          </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                <span>Profile Overview</span>
              </CardTitle>
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="text-lg">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          value={editData.displayName}
                          onChange={(e) => setEditData(prev => ({ ...prev, displayName: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={editData.bio}
                          onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="avatar">Avatar URL</Label>
                        <Input
                          id="avatar"
                          value={editData.avatar}
                          onChange={(e) => setEditData(prev => ({ ...prev, avatar: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={handleSave}>
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                  </div>
                </div>
                  ) : (
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">{profile.displayName}</h3>
                      {profile.bio && <p className="text-muted-foreground">{profile.bio}</p>}
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{profile.address}</span>
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                </Button>
                      </div>
                      {profile.ensName && (
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-blue-500" />
                          <span className="text-blue-600">{profile.ensName}</span>
                        </div>
                      )}
                    </div>
                  )}
                  </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{profileScore}%</div>
                  <div className="text-sm text-muted-foreground">Profile Score</div>
                  <Badge className="mt-2">{profileLevel}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Link className="w-5 h-5" />
                <span>Social Links</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(profile.socialLinks).map(([platform, url]) => (
                  <div key={platform} className="flex items-center space-x-2">
                    {getCredentialIcon(platform)}
                    <span className="capitalize">{platform}</span>
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Verifiable Credentials */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Verifiable Credentials</span>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setShowAddAttestation(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Attestation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {credentials.map((credential) => {
                  const isVerified = profile.attestations.some(a => 
                    a.type === 'credential' && a.title.includes(credential.name)
                  );
                  const isCurrentlyVerifying = verifyingCredential === credential.id;

                  return (
                    <div key={credential.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getCredentialIcon(credential.id)}
                          <span className="font-medium">{credential.name}</span>
                      </div>
                        {isVerified ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{credential.description}</p>
                      <Button
                        size="sm"
                        variant={isVerified ? "outline" : "default"}
                        disabled={isVerified || !!isCurrentlyVerifying}
                        onClick={() => handleVerifyCredential(credential.id)}
                        className="w-full"
                      >
                        {isCurrentlyVerifying ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : isVerified ? (
                          'Verified'
                        ) : (
                          'Verify'
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Attestations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>Attestations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.attestations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No attestations yet</p>
                  <p className="text-sm">Add verifiable credentials to build your reputation</p>
                </div>
              ) : (
              <div className="space-y-4">
                  {profile.attestations.map((attestation) => (
                    <div key={attestation.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getAttestationIcon(attestation.type)}
                          <div>
                            <h4 className="font-medium">{attestation.title}</h4>
                            <p className="text-sm text-muted-foreground">{attestation.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                              <span>Issuer: {attestation.issuerName}</span>
                              <span>•</span>
                              <span>{attestation.createdAt instanceof Date ? attestation.createdAt.toLocaleDateString() : new Date(attestation.createdAt).toLocaleDateString()}</span>
                      </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                          {attestation.verified ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-500" />
                          )}
                        </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Attestation Modal */}
      {showAddAttestation && (
        <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Add Custom Attestation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newAttestation.title}
                  onChange={(e) => setNewAttestation(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newAttestation.description}
                  onChange={(e) => setNewAttestation(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="issuer">Issuer</Label>
                <Input
                  id="issuer"
                  value={newAttestation.issuer}
                  onChange={(e) => setNewAttestation(prev => ({ ...prev, issuer: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="issuerName">Issuer Name</Label>
                <Input
                  id="issuerName"
                  value={newAttestation.issuerName}
                  onChange={(e) => setNewAttestation(prev => ({ ...prev, issuerName: e.target.value }))}
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleAddAttestation} className="flex-1">
                  Add Attestation
                </Button>
                <Button variant="outline" onClick={() => setShowAddAttestation(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Identity;
