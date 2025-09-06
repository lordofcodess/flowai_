"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Clock, ArrowRight } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  ens: string;
  role: string;
  description: string;
  features: string[];
  isActive: boolean;
  rating: number;
  usageCount: number;
  lastActive: Date;
}

interface AgentCardProps {
  agent: Agent;
  onSelect: () => void;
  isConnected: boolean;
}

export function AgentCard({ agent, onSelect, isConnected }: AgentCardProps) {
  const formatLastActive = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Payment Agent":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "Identity Agent":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700";
      case "Community Agent":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "AI Assistant":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold">{agent.name}</CardTitle>
            <CardDescription className="text-sm font-mono text-muted-foreground">
              {agent.ens}
            </CardDescription>
          </div>
          <Badge 
            variant="secondary" 
            className={`${getRoleColor(agent.role)} border-0`}
          >
            {agent.role}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {agent.description}
        </p>
        
        {/* Features */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Key Features:</h4>
          <div className="flex flex-wrap gap-1">
            {agent.features.slice(0, 3).map((feature, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
            {agent.features.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{agent.features.length - 3} more
              </Badge>
            )}
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{agent.rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{agent.usageCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatLastActive(agent.lastActive)}</span>
          </div>
        </div>
        
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${agent.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-xs text-muted-foreground">
              {agent.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <Button 
            onClick={onSelect} 
            size="sm" 
            className="flex items-center gap-2"
          >
            Chat Now
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
