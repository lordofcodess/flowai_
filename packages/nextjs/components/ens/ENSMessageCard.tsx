// ENS Message Card Component
import { ChatMessage } from '@/services/ensagent/chatIntegration';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Copy, 
  RefreshCw,
  Globe,
  User,
  Settings
} from 'lucide-react';

interface ENSMessageCardProps {
  message: ChatMessage;
  onAction?: (action: any) => void;
}

const ENSMessageCard = ({ message, onAction }: ENSMessageCardProps) => {
  const isENSMessage = message.metadata?.ensQuery || message.pendingAction?.type === 'ens_operation';
  
  if (!isENSMessage) return null;

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
    }
  };

  const getOperationIcon = (type?: string) => {
    switch (type) {
      case 'register':
        return <Globe className="w-4 h-4" />;
      case 'renew':
        return <RefreshCw className="w-4 h-4" />;
      case 'setRecord':
        return <Settings className="w-4 h-4" />;
      case 'transfer':
        return <User className="w-4 h-4" />;
      case 'resolve':
        return <ExternalLink className="w-4 h-4" />;
      case 'availability_check':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="w-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getOperationIcon(message.pendingAction?.type)}
            <span className="font-medium text-sm">
              {message.pendingAction?.description || 'ENS Operation'}
            </span>
          </div>
          {message.pendingAction?.ensName && (
            <Badge variant="outline" className="text-xs">
              {message.pendingAction.ensName}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {message.content}
          </p>

          {/* Availability Status */}
          {message.metadata?.action?.type === 'availability_check' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              <Badge 
                variant={message.metadata.action.available ? "default" : "destructive"}
                className="text-xs"
              >
                {message.metadata.action.available ? 'Available' : 'Not Available'}
              </Badge>
            </div>
          )}

          {/* ENS Name */}
          {message.metadata?.ensQuery && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">ENS Name:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {message.metadata.ensQuery}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => copyToClipboard(message.metadata?.ensQuery!)}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Cost */}
          {message.pendingAction?.cost && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">Cost:</span>
              <span className="text-xs font-medium">{message.pendingAction.cost}</span>
            </div>
          )}

          {/* Actions */}
          {message.actions && message.actions.length > 0 && (
            <div className="space-y-2">
              {message.actions.map((action, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(action.status)}
                    <span className="text-xs">{action.description}</span>
                  </div>
                  {action.txHash && (
                    <div className="flex items-center space-x-1">
                      <code className="text-xs font-mono">
                        {action.txHash.slice(0, 8)}...{action.txHash.slice(-6)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(action.txHash!)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => window.open(`https://sepolia.etherscan.io/tx/${action.txHash}`, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
            <div className="mt-3">
              <span className="text-xs text-muted-foreground mb-2 block">Try these commands:</span>
              <div className="flex flex-wrap gap-1">
                {message.metadata.suggestions.slice(0, 3).map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-6"
                    onClick={() => onAction?.(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Availability-specific suggestions */}
          {message.metadata?.action?.type === 'availability_check' && (
            <div className="mt-3">
              <span className="text-xs text-muted-foreground mb-2 block">Next steps:</span>
              <div className="flex flex-wrap gap-1">
                {message.metadata.action.available ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-6"
                      onClick={() => onAction?.(`Register ${message.metadata?.ensQuery}`)}
                    >
                      Register Now
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-6"
                      onClick={() => onAction?.(`How much does ${message.metadata?.ensQuery} cost?`)}
                    >
                      Check Price
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-6"
                      onClick={() => onAction?.(`Tell me about ${message.metadata?.ensQuery}`)}
                    >
                      Get Info
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-6"
                      onClick={() => onAction?.(`Check another name`)}
                    >
                      Check Another
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ENSMessageCard;
