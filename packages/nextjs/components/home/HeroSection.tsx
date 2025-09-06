"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Bot, ArrowRight, Shield, Users, DollarSign, Sparkles, Zap, Globe } from "lucide-react";
import { useState, useEffect } from "react";

export function HeroSection() {
  const router = useRouter();
  const [currentText, setCurrentText] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [particlePositions, setParticlePositions] = useState<Array<{left: string, top: string, delay: string, duration: string}>>([]);

  const dynamicTexts = [
    "AI Agents",
    "Smart Assistants", 
    "Digital Workers",
    "Intelligent Bots"
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentText((prev) => (prev + 1) % dynamicTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Generate particle positions on client side to avoid hydration mismatch
  useEffect(() => {
    const positions = [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 3}s`
    }));
    setParticlePositions(positions);
  }, []);

  const agentTypes = [
    {
      name: "Payment Agent",
      description: "Seamlessly handle transactions and financial operations",
      icon: DollarSign,
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
      bgPattern: "bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.3),transparent_50%)]",
      href: "/onboarding?agent=Payment%20Agent&ens=payment.agent.eth&role=Payment%20Agent"
    },
    {
      name: "Identity Agent",
      description: "Secure credential management and verification systems",
      icon: Shield,
      gradient: "from-blue-400 via-indigo-500 to-purple-600",
      bgPattern: "bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.3),transparent_50%)]",
      href: "/onboarding?agent=Identity%20Agent&ens=identity.agent.eth&role=Identity%20Agent"
    },
    {
      name: "Community Agent",
      description: "Orchestrate groups and build meaningful connections",
      icon: Users,
      gradient: "from-purple-400 via-pink-500 to-rose-600",
      bgPattern: "bg-[radial-gradient(circle_at_50%_80%,rgba(168,85,247,0.3),transparent_50%)]",
      href: "/onboarding?agent=Community%20Agent&ens=community.agent.eth&role=Community%20Agent"
    }
  ];

  return (
    <section className="relative min-h-screen overflow-hidden bg-black">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {particlePositions.map((position, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse"
              style={{
                left: position.left,
                top: position.top,
                animationDelay: position.delay,
                animationDuration: position.duration
              }}
            />
          ))}
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-24">
        <div className="text-center max-w-6xl mx-auto">
          {/* Main Heading with Typewriter Effect */}
          <div className={`mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="h-8 w-8 text-yellow-400 mr-3 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-lg font-medium text-gray-300 tracking-wider uppercase">The Future is Autonomous</span>
              <Sparkles className="h-8 w-8 text-yellow-400 ml-3 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-tight">
              <span className="block text-white">Intelligent</span>
              <span className="block bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 bg-clip-text text-transparent animate-pulse">
                {dynamicTexts[currentText]}
              </span>
              <span className="block text-white">for Everyone</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-4xl mx-auto mb-8">
              Deploy autonomous agents that work 24/7. Handle payments, verify identities,
              and coordinate communities with AI that never sleeps.
            </p>

            <div className="flex items-center justify-center gap-4 text-sm text-gray-400 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live on Ethereum</span>
              </div>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span>Lightning Fast</span>
              </div>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-400" />
                <span>Global Scale</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row gap-6 justify-center mb-20 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Button
              size="lg"
              className="text-lg px-10 py-6 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 border-0 rounded-full shadow-2xl hover:shadow-gray-600 transition-all duration-300 hover:scale-105"
              onClick={() => router.push("/onboarding")}
            >
              <Bot className="mr-2 h-5 w-5" />
              Deploy Your Agent
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-10 py-6 border-2 border-gray-600 text-white hover:bg-white hover:text-black rounded-full transition-all duration-300 hover:scale-105"
              onClick={() => router.push("/agents")}
            >
              Explore Marketplace
            </Button>
          </div>

          {/* Agent Type Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {agentTypes.map((agent, index) => {
              const Icon = agent.icon;
              return (
                <div
                  key={index}
                  className="group cursor-pointer"
                  onClick={() => router.push(agent.href)}
                >
                  <div className="relative p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 transition-all duration-500 group-hover:scale-105 group-hover:border-gray-500 group-hover:shadow-2xl overflow-hidden">
                    {/* Background Pattern */}
                    <div className={`absolute inset-0 ${agent.bgPattern} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                    {/* Gradient Border Effect */}
                    <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${agent.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${agent.gradient} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                        <ArrowRight className="h-6 w-6 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-white transition-all duration-300 group-hover:translate-x-1" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                        {agent.name}
                      </h3>
                      <p className="text-gray-400 text-base leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                        {agent.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enhanced Stats */}
          <div className={`mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {[
              { value: "100+", label: "Active Agents", icon: Bot },
              { value: "50K+", label: "Conversations", icon: Zap },
              { value: "10+", label: "Agent Types", icon: Shield },
              { value: "24/7", label: "Availability", icon: Globe }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 mb-4 group-hover:border-gray-600 transition-all duration-300">
                    <Icon className="h-8 w-8 text-gray-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div className="text-4xl font-black text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-gray-200 group-hover:to-gray-400 group-hover:bg-clip-text transition-all duration-300">
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-sm font-medium group-hover:text-gray-300 transition-colors duration-300">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
