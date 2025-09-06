import { useState, useEffect } from 'react';
import { activityManager, Activity } from '@/services/activities/activityManager';

export function useActivities(limit: number = 10) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load initial activities
    setActivities(activityManager.getRecentActivities(limit));
    setIsLoading(false);

    // Subscribe to updates
    const unsubscribe = activityManager.subscribe((newActivities) => {
      setActivities(newActivities.slice(0, limit));
    });

    return unsubscribe;
  }, [limit]);

  const addActivity = (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    return activityManager.addActivity(activity);
  };

  const updateActivity = (id: string, updates: Partial<Activity>) => {
    activityManager.updateActivity(id, updates);
  };

  const clearActivities = () => {
    activityManager.clearActivities();
  };

  return {
    activities,
    isLoading,
    addActivity,
    updateActivity,
    clearActivities,
  };
}
