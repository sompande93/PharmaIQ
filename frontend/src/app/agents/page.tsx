"use client";

import { useEffect, useState } from "react";
import {
    Activity,
    Brain,
    Bot,
    Shield,
    Wallet,
    Check,
    AlertCircle,
    Terminal,
    ChevronRight,
    Search,
    History as HistoryIcon,
    FileText,
    Database,
    Zap,
    Trash2,
    Square
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/services/apiService";
import { FullRunDetails, ProposedAction, ToolCall } from "@/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function AgentsPage() {
    const [latestRun, setLatestRun] = useState<FullRunDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"soma" | "pulse">("soma");

    useEffect(() => {
        let interval: NodeJS.Timeout;

        const fetchData = async () => {
            try {
                // If we have a specific run in the URL, use it
                const params = new URLSearchParams(window.location.search);
                const runId = params.get("runId");

                if (runId) {
                    const full = await apiService.getRunDetails(runId);
                    setLatestRun(full);
                } else {
                    const data = await apiService.listRuns();
                    if (data.runs.length > 0) {
                        const full = await apiService.getRunDetails(data.runs[0].run_id);
                        setLatestRun(full);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch agent details", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Poll if the run is active
        if (latestRun?.status === "running") {
            interval = setInterval(fetchData, 3000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [latestRun?.status]);

    const handleStopRun = async (runId: string) => {
        if (!confirm(`Are you sure you want to stop analysis ${runId}?`)) return;
        try {
            await apiService.stopRun(runId);
            // Re-fetch data to update the run status
            const params = new URLSearchParams(window.location.search);
            const currentRunId = params.get("runId") || latestRun?.run_id;
            if (currentRunId) {
                const full = await apiService.getRunDetails(currentRunId);
                setLatestRun(full);
            } else {
                const data = await apiService.listRuns();
                if (data.runs.length > 0) {
                    const full = await apiService.getRunDetails(data.runs[0].run_id);
                    setLatestRun(full);
                } else {
                    setLatestRun(null);
                }
            }
        } catch (error) {
            console.error("Failed to stop run", error);
        }
    };

    const handleDeleteRun = async (runId: string) => {
        if (!confirm(`Permanently delete history for ${runId}?`)) return;
        try {
            await apiService.deleteRun(runId);
            window.location.href = "/"; // Redirect to home after deleting the current run
        } catch (error) {
            console.error("Failed to delete run", error);
        }
    };

    const handleStopAll = async () => {
        if (!confirm("Emergency Stop: Terminate all active analyses?")) return;
        try {
            await apiService.stopAllRuns();
            // Re-fetch data to update the status of all runs
            const params = new URLSearchParams(window.location.search);
            const currentRunId = params.get("runId") || latestRun?.run_id;
            if (currentRunId) {
                const full = await apiService.getRunDetails(currentRunId);
                setLatestRun(full);
            } else {
                const data = await apiService.listRuns();
                if (data.runs.length > 0) {
                    const full = await apiService.getRunDetails(data.runs[0].run_id);
                    setLatestRun(full);
                } else {
                    setLatestRun(null);
                }
            }
        } catch (error) {
            console.error("Failed to stop all runs", error);
        }
    };

    const toolCalls = activeTab === "soma" ? latestRun?.soma_tool_calls : latestRun?.pulse_tool_calls;

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-2xl shadow-primary/20">
                        <Activity className="text-primary w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white focus:outline-none">Agent Control Centre</h1>
                        <p className="text-muted-foreground">Monitor the underlying logic and data collection of your autonomous operations.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Sidebar: Controls & Critique Status */}
                <div className="lg:col-span-4 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Active Agent Profiles</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <button
                                onClick={() => setActiveTab("soma")}
                                className={cn(
                                    "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group",
                                    activeTab === "soma"
                                        ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                                        : "bg-white/5 border-white/5 hover:bg-white/10"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                    activeTab === "soma" ? "bg-primary text-white" : "bg-white/10 text-muted-foreground group-hover:text-white"
                                )}>
                                    <Brain className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white uppercase tracking-wider">SOMA</p>
                                    <p className="text-[10px] text-muted-foreground">Operational Internal Monitor</p>
                                </div>
                                <ChevronRight className={cn("w-4 h-4 transition-transform", activeTab === "soma" ? "text-primary" : "text-zinc-600")} />
                            </button>

                            <button
                                onClick={() => setActiveTab("pulse")}
                                className={cn(
                                    "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group",
                                    activeTab === "pulse"
                                        ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                                        : "bg-white/5 border-white/5 hover:bg-white/10"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                    activeTab === "pulse" ? "bg-primary text-white" : "bg-white/10 text-muted-foreground group-hover:text-white"
                                )}>
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white uppercase tracking-wider">PULSE</p>
                                    <p className="text-[10px] text-muted-foreground">Predictive External Signal</p>
                                </div>
                                <ChevronRight className={cn("w-4 h-4 transition-transform", activeTab === "pulse" ? "text-primary" : "text-zinc-600")} />
                            </button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Critique Layer Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-4 h-4 text-blue-400" />
                                    <span className="text-xs font-medium text-white">VIGIL (Safety)</span>
                                </div>
                                <Badge variant="success" className="text-[9px]">ACTIVE</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Wallet className="w-4 h-4 text-success" />
                                    <span className="text-xs font-medium text-white">AUDIT (Financial)</span>
                                </div>
                                <Badge variant="success" className="text-[9px]">ACTIVE</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tool Calls Log Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <HistoryIcon className="w-4 h-4" />
                                MCP Activity Log
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {!loading && toolCalls && toolCalls.length > 0 ? (
                                toolCalls.map((call, i) => (
                                    <div key={i} className="flex gap-3 text-[10px] border-l border-primary/30 pl-3">
                                        <div className="flex-1">
                                            <p className="font-mono text-primary uppercase font-bold">{call.tool}</p>
                                            <p className="text-muted-foreground line-clamp-1 truncate opacity-70">
                                                {JSON.stringify(call.args)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground italic">No recent tool interactions recorded.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Management Actions */}
                    {latestRun && (
                        <Card className="border-danger/20 bg-danger/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-danger">Manage Run</CardTitle>
                            </CardHeader>
                            <CardContent className="flex gap-2">
                                {latestRun.status === "running" && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 border-danger/50 text-danger hover:bg-danger/20 text-[10px]"
                                        onClick={() => handleStopRun(latestRun.run_id)}
                                    >
                                        <Square className="w-3 h-3 mr-2 fill-current" />
                                        Stop
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 text-[10px]"
                                    onClick={() => handleDeleteRun(latestRun.run_id)}
                                >
                                    <Trash2 className="w-3 h-3 mr-2" />
                                    Delete
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Content: Analysis & Tool Timeline */}
                <div className="lg:col-span-8 space-y-8">
                    {loading ? (
                        <div className="h-96 w-full bg-white/5 rounded-2xl animate-pulse flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <p className="text-sm text-muted-foreground font-mono">Synthesizing agent reasoning...</p>
                            </div>
                        </div>
                    ) : latestRun ? (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                {/* Analysis Content */}
                                <Card className="border-white/10 bg-black/40 shadow-2xl overflow-hidden">
                                    <div className="px-6 py-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-primary" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-white">AI Analysis & Strategy</span>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 uppercase tracking-tighter">
                                            {latestRun.run_id}
                                        </Badge>
                                    </div>
                                    <CardContent className="p-8">
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {activeTab === "soma" ? latestRun.soma_analysis : latestRun.pulse_analysis}
                                            </ReactMarkdown>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Tool Call Investigation Timeline */}
                                {toolCalls && toolCalls.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-2">
                                            <Terminal className="w-4 h-4 text-primary" />
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Deep Dive: MCP Data Interactions</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            {toolCalls.map((call, i) => (
                                                <Card key={i} className="border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors overflow-hidden">
                                                    <div className="flex flex-col md:flex-row gap-4">
                                                        <div className="w-full md:w-1/3 p-4 bg-white/5 border-r border-white/5 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <Database className="w-3 h-3 text-primary" />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{call.tool}</span>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-[9px] text-muted-foreground uppercase font-bold">Query Parameters</p>
                                                                <pre className="text-[9px] font-mono text-zinc-400 bg-black/40 p-2 rounded overflow-x-auto">
                                                                    {JSON.stringify(call.args, null, 2)}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 p-4 flex flex-col justify-center">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Zap className="w-3 h-3 text-success" />
                                                                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">MCP Response</span>
                                                            </div>
                                                            <p className="text-xs text-zinc-300 font-mono italic p-3 bg-black/40 rounded border border-white/5 line-clamp-4">
                                                                {call.result}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Extracted Actions Preview */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-2">
                                        <Zap className="w-4 h-4 text-primary" />
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Proposed Actions to HITL Gate</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {(activeTab === "soma" ? latestRun.proposed_actions.filter(a => a.proposed_by === "soma") : latestRun.proposed_actions.filter(a => a.proposed_by === "pulse")).map((action, i) => (
                                            <Card key={i} className="border-white/10 group hover:border-primary/30 transition-all overflow-hidden relative">
                                                <div className={cn(
                                                    "absolute left-0 top-0 bottom-0 w-1",
                                                    action.lane === "green" ? "bg-success" : action.lane === "yellow" ? "bg-warning" : "bg-danger"
                                                )} />
                                                <CardContent className="p-6">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <Badge variant={action.lane === "green" ? "success" : action.lane === "yellow" ? "warning" : "danger"} className="uppercase tracking-widest text-[9px]">
                                                                {action.lane.toUpperCase()} LANE
                                                            </Badge>
                                                            <span className="text-[10px] font-mono text-muted-foreground">{action.action_id}</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-white">{formatCurrency(action.estimated_value)}</span>
                                                    </div>
                                                    <h4 className="text-white font-bold mb-2 uppercase tracking-wide group-hover:text-primary transition-colors">{action.action_type.replace(/_/g, " ")}</h4>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    ) : (
                        <Card className="py-20 text-center border-dashed border-white/10 bg-transparent h-96 flex flex-col justify-center">
                            <CardContent>
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <AlertCircle className="text-muted-foreground w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">No Active State</h3>
                                <p className="text-muted-foreground text-sm">Trigger an analysis from the dashboard to initialize agents.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
