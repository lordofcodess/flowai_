// Ethereum Foundation Passport (EFP) Manager
export interface EFPProfile {
  id: string;
  address: string;
  ensName?: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  socialLinks: {
    twitter?: string;
    github?: string;
    discord?: string;
    website?: string;
  };
  attestations: EFPAttestation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EFPAttestation {
  id: string;
  type: 'social' | 'achievement' | 'credential' | 'membership' | 'custom';
  title: string;
  description: string;
  issuer: string;
  issuerName: string;
  verified: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

export interface EFPCredential {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'social' | 'professional' | 'achievement' | 'membership';
  required: boolean;
  verified: boolean;
}

class EFPPassportManager {
  private profiles: Map<string, EFPProfile> = new Map();
  private credentials: EFPCredential[] = [];
  private isInitialized: boolean = false;

  constructor() {
    this.initializeCredentials();
  }

  // Initialize available credentials
  private initializeCredentials() {
    this.credentials = [
      {
        id: 'twitter',
        name: 'Twitter Account',
        description: 'Verify your Twitter profile',
        icon: '🐦',
        category: 'social',
        required: false,
        verified: false
      },
      {
        id: 'github',
        name: 'GitHub Profile',
        description: 'Verify your GitHub account',
        icon: '💻',
        category: 'professional',
        required: false,
        verified: false
      },
      {
        id: 'discord',
        name: 'Discord Account',
        description: 'Verify your Discord profile',
        icon: '💬',
        category: 'social',
        required: false,
        verified: false
      },
      {
        id: 'ens',
        name: 'ENS Domain',
        description: 'Own an ENS domain',
        icon: '🌐',
        category: 'professional',
        required: false,
        verified: false
      },
      {
        id: 'gitcoin',
        name: 'Gitcoin Passport',
        description: 'Gitcoin Passport verification',
        icon: '🎫',
        category: 'professional',
        required: false,
        verified: false
      },
      {
        id: 'poap',
        name: 'POAP Collection',
        description: 'Proof of Attendance Protocol',
        icon: '🏆',
        category: 'achievement',
        required: false,
        verified: false
      },
      {
        id: 'lens',
        name: 'Lens Protocol',
        description: 'Lens social graph profile',
        icon: '🔍',
        category: 'social',
        required: false,
        verified: false
      },
      {
        id: 'brightid',
        name: 'BrightID',
        description: 'Unique human verification',
        icon: '✨',
        category: 'professional',
        required: false,
        verified: false
      }
    ];
  }

  // Initialize EFP for an address
  async initializePassport(address: string, ensName?: string): Promise<EFPProfile> {
    const existingProfile = this.profiles.get(address);
    if (existingProfile) {
      return existingProfile;
    }

    const profile: EFPProfile = {
      id: `efp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      address,
      ensName,
      displayName: ensName || `${address.slice(0, 6)}...${address.slice(-4)}`,
      bio: '',
      avatar: '',
      socialLinks: {},
      attestations: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.profiles.set(address, profile);
    this.saveToStorage();
    
    return profile;
  }

  // Get profile by address
  getProfile(address: string): EFPProfile | null {
    return this.profiles.get(address) || null;
  }

  // Update profile
  async updateProfile(address: string, updates: Partial<EFPProfile>): Promise<EFPProfile> {
    const profile = this.profiles.get(address);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const updatedProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date()
    };

    this.profiles.set(address, updatedProfile);
    this.saveToStorage();
    
    return updatedProfile;
  }

  // Add attestation
  async addAttestation(address: string, attestation: Omit<EFPAttestation, 'id' | 'createdAt'>): Promise<EFPAttestation> {
    const profile = this.profiles.get(address);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const newAttestation: EFPAttestation = {
      ...attestation,
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    profile.attestations.push(newAttestation);
    profile.updatedAt = new Date();
    
    this.profiles.set(address, profile);
    this.saveToStorage();
    
    return newAttestation;
  }

  // Verify credential
  async verifyCredential(address: string, credentialId: string, verificationData: any): Promise<boolean> {
    try {
      // Simulate credential verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const credential = this.credentials.find(c => c.id === credentialId);
      if (!credential) {
        return false;
      }

      // Add attestation for verified credential
      await this.addAttestation(address, {
        type: 'credential',
        title: credential.name,
        description: `Verified ${credential.name}`,
        issuer: 'EFP System',
        issuerName: 'Ethereum Foundation Passport',
        verified: true,
        metadata: verificationData
      });

      return true;
    } catch (error) {
      console.error('Credential verification failed:', error);
      return false;
    }
  }

  // Get available credentials
  getAvailableCredentials(): EFPCredential[] {
    return [...this.credentials];
  }

  // Get profile score (based on verified credentials)
  getProfileScore(address: string): number {
    const profile = this.profiles.get(address);
    if (!profile) return 0;

    const verifiedAttestations = profile.attestations.filter(a => a.verified);
    const totalCredentials = this.credentials.length;
    
    return Math.round((verifiedAttestations.length / totalCredentials) * 100);
  }

  // Get profile level
  getProfileLevel(address: string): string {
    const score = this.getProfileScore(address);
    
    if (score >= 80) return 'Expert';
    if (score >= 60) return 'Advanced';
    if (score >= 40) return 'Intermediate';
    if (score >= 20) return 'Beginner';
    return 'Newcomer';
  }

  // Save to localStorage
  private saveToStorage() {
    try {
      const profilesArray = Array.from(this.profiles.entries());
      localStorage.setItem('efp_profiles', JSON.stringify(profilesArray));
    } catch (error) {
      console.error('Failed to save EFP profiles:', error);
    }
  }

  // Load from localStorage
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('efp_profiles');
      if (stored) {
        const profilesArray = JSON.parse(stored);
        // Convert date strings back to Date objects
        const profilesWithDates = profilesArray.map(([address, profile]: [string, any]) => [
          address,
          {
            ...profile,
            createdAt: new Date(profile.createdAt),
            updatedAt: new Date(profile.updatedAt),
            attestations: profile.attestations.map((attestation: any) => ({
              ...attestation,
              createdAt: new Date(attestation.createdAt),
              expiresAt: attestation.expiresAt ? new Date(attestation.expiresAt) : undefined
            }))
          }
        ]);
        this.profiles = new Map(profilesWithDates);
      }
    } catch (error) {
      console.error('Failed to load EFP profiles:', error);
    }
  }

  // Export profile data
  exportProfile(address: string): string {
    const profile = this.profiles.get(address);
    if (!profile) {
      throw new Error('Profile not found');
    }

    return JSON.stringify(profile, null, 2);
  }

  // Import profile data
  importProfile(profileData: string): EFPProfile {
    const profile = JSON.parse(profileData);
    this.profiles.set(profile.address, profile);
    this.saveToStorage();
    return profile;
  }
}

// Export singleton instance
export const efpPassportManager = new EFPPassportManager();
