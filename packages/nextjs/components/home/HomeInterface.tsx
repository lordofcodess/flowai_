"use client";

import { useState } from "react";
import { HeroSection } from "./HeroSection";
import { AgentCard } from "./AgentCard";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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

export function HomeInterface() {
  const router = useRouter();
  const [agents] = useState<Agent[]>([
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
      lastActive: new Date("2024-01-15T10:30:00Z"),
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
  ]);

  const handleAgentSelect = (agent: Agent) => {
    router.push(`/chat?agent=${agent.name}&ens=${agent.ens}&role=${agent.role}`);
  };

  return (
    <div className="space-y-16">
      <HeroSection />
      <section id="explore" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Explore AI Agents
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover and interact with AI agents for various tasks
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onSelect={() => handleAgentSelect(agent)}
                isConnected={true}
              />
            ))}
          </div>
          
          <div className="text-center">
            <Button 
              onClick={() => router.push("/agents")} 
              size="lg"
              className="px-8 py-3"
            >
              View All Agents
            </Button>
          </div>
        </div>
      </section>
      
      <section id="how-it-works" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Understand the power of AI agents
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Started</h3>
              <p className="text-muted-foreground">
                Choose an AI agent that fits your needs and start chatting
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Chat with Agents</h3>
              <p className="text-muted-foreground">
                Interact with AI agents through natural language conversations
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Results</h3>
              <p className="text-muted-foreground">
                Receive intelligent responses and assistance from your AI agents
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
