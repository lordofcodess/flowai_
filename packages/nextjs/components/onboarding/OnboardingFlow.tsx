"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Wallet, Bot, Users, Globe, DollarSign, Shield, ArrowRight, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFlowWeb3 } from "../../web3";
import { ethers } from "ethers";

const OnboardingFlow = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState("");
  const [ensName, setEnsName] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);

  // Web3 integration
  const { 
    isConnected, 
    account, 
    network, 
    connectWallet, 
    disconnectWallet,
    switchNetwork,
    flowContracts,
    executeFlowAction
  } = useFlowWeb3();

  // Get agent info from URL if activating a specific agent
  const agentName = searchParams.get('agent');
  const agentEns = searchParams.get('ens');
  const agentRole = searchParams.get('role');

  // Customize onboarding based on agent being activated
  const isActivatingAgent = Boolean(agentName && agentEns && agentRole);

  const steps = [
    { id: 1, title: "Connect Wallet", description: "Connect your Web3 wallet" },
    { id: 2, title: "Choose ENS Name", description: "Select your agent's ENS subname" },
    { id: 3, title: "Select Agent", description: "Choose which agent to activate" },
    { id: 4, title: "Deploy", description: "Launch your AI agent" },
  ];

  // Check if this is a general activation (from header/hero buttons) or specific agent activation
  const isGeneralActivation = !agentName && !agentEns && !agentRole;
  const isSpecificAgentActivation = Boolean(agentName && agentEns && agentRole);

  // Pre-select role if activating specific agent
  useEffect(() => {
    if (agentRole && !isGeneralActivation) {
      // Map the agent role to the internal role ID
      const roleMapping: { [key: string]: string } = {
        "Payment Agent": "payment",
        "Identity Agent": "identity", 
        "Community Agent": "community",
        "AI Assistant": "ai"
      };
      setSelectedRole(roleMapping[agentRole] || "ai");
    }
  }, [agentRole, isGeneralActivation]);

  // Auto-advance to next step when wallet is connected
  useEffect(() => {
    if (isConnected && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [isConnected, currentStep]);

  const agentRoles = [
    {
      id: "payment",
      title: "Payment Agent",
      icon: DollarSign,
      description: "Handle payments, routing, and financial transactions with smart automation.",
      features: ["Split payments", "Privacy controls", "Rotating addresses", "Cross-chain support"],
      color: "from-green-500 to-emerald-600"
    },
    {
      id: "identity",
      title: "Identity Agent",
      icon: Shield,
      description: "Manage credentials, attestations, and verifiable identity records.",
      features: ["Credential storage", "Identity verification", "Privacy protection", "Attestation management"],
      color: "from-blue-500 to-cyan-600"
    },
    {
      id: "community",
      title: "Community Agent",
      icon: Users,
      description: "Coordinate groups, DAOs, and community activities seamlessly.",
      features: ["DAO coordination", "Group messaging", "Voting automation", "Savings circles"],
      color: "from-purple-500 to-indigo-600"
    },
    {
      id: "ai",
      title: "AI Assistant",
      icon: Bot,
      description: "Your personal AI companion for web3 tasks and automation.",
      features: ["Task automation", "Smart routing", "Context awareness", "Multi-agent coordination"],
      color: "from-orange-500 to-red-600"
    }
  ];

  // ... existing code ...
  // Note: This is a simplified version - the full component would continue here

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          {isActivatingAgent ? `Activate ${agentName}` : "Welcome to Flow"}
        </h1>
        <p className="text-xl text-muted-foreground mt-4">
          {isActivatingAgent 
            ? `Set up your ${agentRole} agent on the blockchain`
            : "Create your first decentralized AI agent"
          }
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex justify-center">
        <div className="flex space-x-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                currentStep >= step.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <span className="text-sm font-medium">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content would go here */}
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">Step {currentStep} content</p>
      </div>
    </div>
  );
};

export default OnboardingFlow;
