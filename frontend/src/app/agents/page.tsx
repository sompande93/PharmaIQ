"use client";

import { useEffect, useState } from "react";
import {
    Brain,
    Search,
    Cpu,
    Zap,
    ShieldAlert,
    LineChart,
    Terminal,
    ChevronDown,
    ExternalLink,
    MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/services/apiService";
import { FullRunDetails } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export default function AgentsPage() {
    const [latestRun, setLatestRun] = useState<FullRunDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"soma" | "pulse">("soma");

    useEffect(() => {
        fetchLatestRun();
    }, []);

    const fetchLatestRun = async () => {
        try {
            setLoading(true);
            const data = await apiService.listRuns();
            if (data.runs.length > 0) {
                const details = await apiService.getRunDetails(data.runs[0].run_id);
                setLatestRun(details);
            }
        } catch (error) {
            console.error("Failed to fetch latest run", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-2xl shadow-primary/20">
                        <Brain className="text-primary w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Agent Control</h1>
                        <p className="text-muted-foreground">Deep-dive into multi-agent reasoning and tool orchestration.</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={fetchLatestRun} disabled={loading}>
                    <Zap className="w-4 h-4 mr-2" />
                    Inspect Latest
                </Button>
            </div>

            {!latestRun ? (
                <Card className="py-20 text-center">
                    <CardContent>
                        <p className="text-muted-foreground">No analysis data available. Run a pipeline from the dashboard.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Agent Selector */}
                    <div className="space-y-4">
                        <button
                            onClick={() => setActiveTab("soma")}
                            className={cn(
                                "w-full text-left p-4 rounded-xl transition-all duration-300 border",
                                activeTab === "soma"
                                    ? "bg-primary/20 border-primary/40 shadow-xl shadow-primary/10"
                                    : "bg-white/5 border-white/5 hover:bg-white/10"
                            )}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Badge variant={activeTab === "soma" ? "default" : "outline"}>SOMA Agent</Badge>
                                <Cpu className={cn("w-4 h-4", activeTab === "soma" ? "text-primary" : "text-muted-foreground")} />
                            </div>
                            <p className="text-sm font-semibold text-white">Store Operations & Monitoring</p>
                            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">Internal Signals</p>
                        </button>

                        <button
                            onClick={() => setActiveTab("pulse")}
                            className={cn(
                                "w-full text-left p-4 rounded-xl transition-all duration-300 border",
                                activeTab === "pulse"
                                    ? "bg-primary/20 border-primary/40 shadow-xl shadow-primary/10"
                                    : "bg-white/5 border-white/5 hover:bg-white/10"
                            )}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Badge variant={activeTab === "pulse" ? "default" : "outline"}>PULSE Agent</Badge>
                                <LineChart className={cn("w-4 h-4", activeTab === "pulse" ? "text-primary" : "text-muted-foreground")} />
                            </div>
                            <p className="text-sm font-semibold text-white">Predictive Logistics Unit</p>
                            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">External Signals</p>
                        </button>

                        <div className="p-4 glass rounded-xl border-blue-500/20 bg-blue-500/5 mt-8">
                            <div className="flex items-center gap-2 mb-3">
                                <ShieldAlert className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Critique Active</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                VIGIL and AUDIT are currently providing multi-turn feedback to the active agents.
                            </p>
                        </div>
                    </div>

                    {/* Reasoning View */}
                    <div className="lg:col-span-3 space-y-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <Card className="min-h-[500px]">
                                    <CardHeader className="flex-row items-center justify-between">
                                        <div>
                                            <CardTitle>{activeTab === "soma" ? "Internal Logistics Analysis" : "Epidemiological Supply Forecast"}</CardTitle>
                                            <CardDescription>
                                                RunID: {latestRun.run_id} • Agents used their {activeTab === "soma" ? "6" : "5"} integrated MCP tools.
                                            </CardDescription>
                                        </div>
                                        <Button variant="ghost" size="icon">
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-black/40 rounded-lg p-6 font-mono text-sm border border-white/5 whitespace-pre-wrap leading-relaxed text-blue-50/90 custom-scrollbar max-h-[600px] overflow-y-auto">
                                            {activeTab === "soma" ? latestRun.soma_analysis : latestRun.pulse_analysis}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Extracted Actions Preview */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {(activeTab === "soma" ? latestRun.proposed_actions.filter(a => a.proposed_by === "soma") : latestRun.proposed_actions.filter(a => a.proposed_by === "pulse")).map((action, i) => (
                                        <motion.div
                                            key={action.action_id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <Card className="p-4 bg-white/5 border-white/5 hover:border-primary/30 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <Badge variant={action.lane === "green" ? "success" : action.lane === "yellow" ? "warning" : "danger"}>
                                                        {action.lane.toUpperCase()}
                                                    </Badge>
                                                    <Terminal className="w-3 h-3 text-muted-foreground" />
                                                </div>
                                                <p className="text-xs font-bold text-white mb-1 line-clamp-1">{action.description}</p>
                                                <p className="text-[10px] text-muted-foreground">Store: {action.store_id}</p>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}

