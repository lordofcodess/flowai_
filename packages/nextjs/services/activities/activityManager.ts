// Activity Manager for tracking ENS and Web3 activities
export interface Activity {
  id: string;
  title: string;
  description: string;
  type: 'ens_registration' | 'ens_resolution' | 'ens_update' | 'ens_availability' | 'payment' | 'credential' | 'transaction' | 'balance_check' | 'error';
  timestamp: Date;
  txHash?: string;
  ensName?: string;
  amount?: string;
  status: 'pending' | 'completed' | 'failed';
  metadata?: Record<string, any>;
}

class ActivityManager {
  private activities: Activity[] = [];
  private listeners: ((activities: Activity[]) => void)[] = [];

  constructor() {
    // Load activities from localStorage on initialization
    this.loadActivities();
  }

  // Subscribe to activity updates
  subscribe(listener: (activities: Activity[]) => void) {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of activity changes
  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.activities]));
  }

  // Add a new activity
  addActivity(activity: Omit<Activity, 'id' | 'timestamp'>) {
    const newActivity: Activity = {
      ...activity,
      id: this.generateId(),
      timestamp: new Date(),
    };

    this.activities.unshift(newActivity); // Add to beginning
    
    // Keep only last 50 activities
    if (this.activities.length > 50) {
      this.activities = this.activities.slice(0, 50);
    }

    this.saveActivities();
    this.notifyListeners();
    
    return newActivity;
  }

  // Update activity status
  updateActivity(id: string, updates: Partial<Activity>) {
    const index = this.activities.findIndex(a => a.id === id);
    if (index !== -1) {
      this.activities[index] = { ...this.activities[index], ...updates };
      this.saveActivities();
      this.notifyListeners();
    }
  }

  // Get recent activities (last 10)
  getRecentActivities(limit: number = 10): Activity[] {
    return this.activities.slice(0, limit);
  }

  // Get activities by type
  getActivitiesByType(type: Activity['type']): Activity[] {
    return this.activities.filter(a => a.type === type);
  }

  // Generate unique ID
  private generateId(): string {
    return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Save activities to localStorage
  private saveActivities() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ens_activities', JSON.stringify(this.activities));
      }
    } catch (error) {
      console.error('Failed to save activities:', error);
    }
  }

  // Load activities from localStorage
  private loadActivities() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('ens_activities');
        if (stored) {
          this.activities = JSON.parse(stored).map((activity: any) => ({
            ...activity,
            timestamp: new Date(activity.timestamp)
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  }

  // Clear all activities
  clearActivities() {
    this.activities = [];
    this.saveActivities();
    this.notifyListeners();
  }

  // Create ENS-specific activities
  createENSRegistrationActivity(ensName: string, txHash?: string, status: Activity['status'] = 'pending') {
    return this.addActivity({
      title: `ENS Registration: ${ensName}`,
      description: status === 'completed' 
        ? `Successfully registered ${ensName}` 
        : status === 'failed' 
        ? `Failed to register ${ensName}` 
        : `Registering ${ensName}...`,
      type: 'ens_registration',
      ensName,
      txHash,
      status,
    });
  }

  createENSResolutionActivity(ensName: string, resolvedAddress: string) {
    return this.addActivity({
      title: `ENS Resolution: ${ensName}`,
      description: `Resolved ${ensName} to ${resolvedAddress.slice(0, 6)}...${resolvedAddress.slice(-4)}`,
      type: 'ens_resolution',
      ensName,
      status: 'completed',
    });
  }

  createENSUpdateActivity(ensName: string, recordType: string, txHash?: string) {
    return this.addActivity({
      title: `ENS Update: ${ensName}`,
      description: `Updated ${recordType} record for ${ensName}`,
      type: 'ens_update',
      ensName,
      txHash,
      status: 'completed',
    });
  }

  createPaymentActivity(to: string, amount: string, token: string = 'ETH', txHash?: string) {
    return this.addActivity({
      title: `Payment to ${to}`,
      description: `Successfully sent ${amount} ${token} to ${to}`,
      type: 'payment',
      amount,
      txHash,
      status: 'completed',
    });
  }

  createCredentialActivity(action: string, ensName: string) {
    return this.addActivity({
      title: `Credential ${action}`,
      description: `${action} credentials for ${ensName}`,
      type: 'credential',
      ensName,
      status: 'completed',
    });
  }

  createErrorActivity(error: string, context?: string) {
    return this.addActivity({
      title: 'Error',
      description: context ? `${context}: ${error}` : error,
      type: 'error',
      status: 'failed',
    });
  }
}

// Export singleton instance
export const activityManager = new ActivityManager();
