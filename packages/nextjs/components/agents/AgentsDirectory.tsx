"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Bot, Users, DollarSign, Shield, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { AgentCard } from "./AgentCard";

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

const AgentsDirectory = () => {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // Web3 integration
  const { isConnected, address: account } = useAccount();

  // Mock data - in real app this would come from blockchain
  useEffect(() => {
    const mockAgents: Agent[] = [
      {
        id: "1",
        name: "Kwame",
        ens: "kwame.agent.eth",
        role: "Payment Agent",
        description: "Handles payments, routing, and financial transactions with smart automation.",
        features: ["Split payments", "Privacy controls", "Rotating addresses", "Cross-chain support"],
        isActive: true,
        rating: 4.8,
        usageCount: 1250,
        lastActive: new Date("2024-01-15T10:28:00Z"),
      },
      {
        id: "2",
        name: "Ama",
        ens: "ama.agent.eth",
        role: "Identity Agent",
        description: "Manages credentials, attestations, and verifiable identity records.",
        features: ["Credential storage", "Identity verification", "Privacy protection", "Attestation management"],
        isActive: true,
        rating: 4.9,
        usageCount: 890,
        lastActive: new Date("2024-01-15T10:25:00Z"),
      },
      {
        id: "3",
        name: "Kofi",
        ens: "kofi.agent.eth",
        role: "Community Agent",
        description: "Coordinates groups, DAOs, and community activities seamlessly.",
        features: ["DAO coordination", "Group messaging", "Voting automation", "Savings circles"],
        isActive: true,
        rating: 4.7,
        usageCount: 650,
        lastActive: new Date("2024-01-15T10:20:00Z"),
      },
      {
        id: "4",
        name: "Abena",
        ens: "abena.agent.eth",
        role: "AI Assistant",
        description: "Your personal AI companion for web3 tasks and automation.",
        features: ["Task automation", "Smart routing", "Context awareness", "Multi-agent coordination"],
        isActive: true,
        rating: 4.6,
        usageCount: 2100,
        lastActive: new Date("2024-01-15T10:29:00Z"),
      },
    ];

    setAgents(mockAgents);
    setFilteredAgents(mockAgents);
    setIsLoading(false);
  }, []);

  // Filter agents based on search and role
  useEffect(() => {
    let filtered = agents;

    if (searchTerm) {
      filtered = filtered.filter(
        agent =>
          agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agent.ens.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agent.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedRole !== "all") {
      filtered = filtered.filter(agent => agent.role === selectedRole);
    }

    setFilteredAgents(filtered);
  }, [searchTerm, selectedRole, agents]);

  const handleAgentSelect = (agent: Agent) => {
    router.push(`/chat?agent=${agent.name}&ens=${agent.ens}&role=${agent.role}`);
  };

  const roles = [
    { value: "all", label: "All Agents", icon: Bot },
    { value: "Payment Agent", label: "Payment", icon: DollarSign },
    { value: "Identity Agent", label: "Identity", icon: Shield },
    { value: "Community Agent", label: "Community", icon: Users },
    { value: "AI Assistant", label: "AI Assistant", icon: Bot },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">AI Agents Directory</h1>
        <p className="text-xl text-muted-foreground mt-4">
          Discover and interact with decentralized AI agents on the blockchain
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search agents by name, ENS, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Button
                key={role.value}
                variant={selectedRole === role.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRole(role.value)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {role.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredAgents.length} agent{filteredAgents.length !== 1 ? "s" : ""} found
        </p>
        {!isConnected && (
          <Button onClick={() => router.push("/onboarding")} variant="outline">
            Connect Wallet to Interact
          </Button>
        )}
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onSelect={() => handleAgentSelect(agent)}
            isConnected={isConnected}
          />
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No agents found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or filters to find more agents.
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentsDirectory;
