import { Button } from "@/components/ui/button";
import { MoreHorizontal, Globe, CheckCircle, AlertCircle, DollarSign, FileText, Settings, Zap } from "lucide-react";
import { Activity } from "@/services/activities/activityManager";

interface RightPanelProps {
  isRightPanelCollapsed: boolean;
  setIsRightPanelCollapsed: (collapsed: boolean) => void;
  recentActivities: Activity[];
  formatTime: (date: Date) => string;
}

const RightPanel = ({ 
  isRightPanelCollapsed, 
  setIsRightPanelCollapsed, 
  recentActivities, 
  formatTime 
}: RightPanelProps) => {
  if (!isRightPanelCollapsed) {
    return (
      <div className="w-80 bg-card border-l border-border p-4 transition-all duration-300 ease-in-out max-lg:hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Recent Activities ({recentActivities.length})</h3>
          <Button
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted/50"
            onClick={() => setIsRightPanelCollapsed(true)}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activities</p>
              <p className="text-xs">Start using ENS to see activities here</p>
            </div>
          ) : (
            recentActivities.map((activity) => {
              const getActivityIcon = () => {
                switch (activity.type) {
                  case 'ens_registration':
                    return <Globe className="w-4 h-4 text-blue-500" />;
                  case 'ens_resolution':
                    return <CheckCircle className="w-4 h-4 text-green-500" />;
                  case 'ens_update':
                    return <Settings className="w-4 h-4 text-purple-500" />;
                  case 'payment':
                    return <DollarSign className="w-4 h-4 text-green-500" />;
                  case 'credential':
                    return <FileText className="w-4 h-4 text-gray-500" />;
                  case 'transaction':
                    return <Zap className="w-4 h-4 text-purple-500" />;
                  case 'error':
                    return <AlertCircle className="w-4 h-4 text-red-500" />;
                  default:
                    return <div className="w-4 h-4 rounded-full bg-gray-400" />;
                }
              };

              const getStatusColor = () => {
                switch (activity.status) {
                  case 'completed':
                    return 'text-green-600';
                  case 'pending':
                    return 'text-yellow-600';
                  case 'failed':
                    return 'text-red-600';
                  default:
                    return 'text-gray-600';
                }
              };

              return (
                <div key={activity.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getActivityIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${getStatusColor()} bg-opacity-10`}>
                          {activity.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">
                          {formatTime(activity.timestamp)}
                        </p>
                        {activity.txHash && (
                          <p className="text-xs text-blue-600 font-mono">
                            {activity.txHash.slice(0, 6)}...{activity.txHash.slice(-4)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-16 bg-card border-l border-border p-4 transition-all duration-300 ease-in-out max-lg:hidden">
      <div className="flex flex-col items-center space-y-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 hover:bg-muted/50"
          onClick={() => setIsRightPanelCollapsed(false)}
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <div className="w-2 h-2 bg-gray-500 rounded-full mx-auto mb-2"></div>
          <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-2"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
