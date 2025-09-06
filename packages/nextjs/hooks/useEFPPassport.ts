import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { efpPassportManager, EFPProfile, EFPAttestation, EFPCredential } from '@/services/efp/passportManager';

export function useEFPPassport() {
  const { address, isConnected } = useAccount();
  const [profile, setProfile] = useState<EFPProfile | null>(null);
  const [credentials, setCredentials] = useState<EFPCredential[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize passport when wallet connects
  useEffect(() => {
    const initializePassport = async () => {
      if (!address || !isConnected) {
        setProfile(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Load existing profiles from storage
        efpPassportManager.loadFromStorage();
        
        // Get or create profile
        let userProfile = efpPassportManager.getProfile(address);
        if (!userProfile) {
          userProfile = await efpPassportManager.initializePassport(address);
        }

        setProfile(userProfile);
        setCredentials(efpPassportManager.getAvailableCredentials());
      } catch (err) {
        console.error('Failed to initialize EFP passport:', err);
        setError('Failed to initialize passport');
      } finally {
        setIsLoading(false);
      }
    };

    initializePassport();
  }, [address, isConnected]);

  // Update profile
  const updateProfile = async (updates: Partial<EFPProfile>) => {
    if (!address || !profile) return;

    try {
      const updatedProfile = await efpPassportManager.updateProfile(address, updates);
      setProfile(updatedProfile);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile');
    }
  };

  // Verify credential
  const verifyCredential = async (credentialId: string, verificationData: any) => {
    if (!address) return false;

    try {
      const success = await efpPassportManager.verifyCredential(address, credentialId, verificationData);
      if (success) {
        // Refresh profile to get updated attestations
        const updatedProfile = efpPassportManager.getProfile(address);
        if (updatedProfile) {
          setProfile(updatedProfile);
        }
      }
      return success;
    } catch (err) {
      console.error('Failed to verify credential:', err);
      setError('Failed to verify credential');
      return false;
    }
  };

  // Add custom attestation
  const addAttestation = async (attestation: Omit<EFPAttestation, 'id' | 'createdAt'>) => {
    if (!address) return;

    try {
      const newAttestation = await efpPassportManager.addAttestation(address, attestation);
      // Refresh profile
      const updatedProfile = efpPassportManager.getProfile(address);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
      return newAttestation;
    } catch (err) {
      console.error('Failed to add attestation:', err);
      setError('Failed to add attestation');
      return null;
    }
  };

  // Get profile score and level
  const getProfileScore = () => {
    if (!address) return 0;
    return efpPassportManager.getProfileScore(address);
  };

  const getProfileLevel = () => {
    if (!address) return 'Newcomer';
    return efpPassportManager.getProfileLevel(address);
  };

  // Export profile
  const exportProfile = () => {
    if (!address) return null;
    try {
      return efpPassportManager.exportProfile(address);
    } catch (err) {
      console.error('Failed to export profile:', err);
      setError('Failed to export profile');
      return null;
    }
  };

  // Import profile
  const importProfile = (profileData: string) => {
    try {
      const importedProfile = efpPassportManager.importProfile(profileData);
      setProfile(importedProfile);
      return importedProfile;
    } catch (err) {
      console.error('Failed to import profile:', err);
      setError('Failed to import profile');
      return null;
    }
  };

  return {
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
    importProfile,
    isConnected: !!isConnected && !!address
  };
}
