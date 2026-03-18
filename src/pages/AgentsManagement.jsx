import React, { useState } from "react";
import { Bot, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ConversationManager from "@/components/agents/ConversationManager";

const AVAILABLE_AGENTS = [
  { name: "trader_specialist", label: "Trader Specialist" },
  { name: "drone_pilot_specialist", label: "Drone Pilot Specialist" },
  { name: "startup_specialist", label: "Startup Specialist" },
  { name: "elite_human_specialist", label: "Elite Human Specialist" },
];

export default function AgentsManagement() {
  const [expandedAgent, setExpandedAgent] = useState(null);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold">Gestión de Agentes de IA</h1>
        </div>
        <p className="text-muted-foreground">Administra las conversaciones de tus agentes de IA.</p>
      </div>

      <div className="space-y-3">
        {AVAILABLE_AGENTS.map((agent) => (
          <Card key={agent.name} className="p-0 overflow-hidden">
            <button
              onClick={() => setExpandedAgent(expandedAgent === agent.name ? null : agent.name)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h2 className="font-semibold text-base">{agent.label}</h2>
              </div>
              {expandedAgent === agent.name ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {expandedAgent === agent.name && (
              <div className="border-t bg-muted/20 p-4">
                <ConversationManager agentName={agent.name} />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}