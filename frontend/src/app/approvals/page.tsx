"use client";

import { useEffect, useState } from "react";
import {
    ShieldCheck,
    ShieldAlert,
    Check,
    X,
    Info,
    MessageSquare,
    History,
    TrendingUp,
    AlertCircle,
    RefreshCcw,
    MapPin,
    CheckSquare,
    XSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/services/apiService";
import { FullRunDetails, ProposedAction } from "@/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function ApprovalsPage() {
    const [pendingRuns, setPendingRuns] = useState<FullRunDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        try {
            setLoading(true);
            const data = await apiService.listRuns();
            const unresolvedRuns = [];
            for (const run of data.runs) {
                if (run.actions_awaiting_approval > 0) {
                    const details = await apiService.getRunDetails(run.run_id);
                    if (details.actions_for_approval.length > 0) {
                        unresolvedRuns.push(details);
                    }
                }
            }
            setPendingRuns(unresolvedRuns);
        } catch (error) {
            console.error("Failed to fetch pending approvals", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDecision = async (runId: string, actionId: string, decision: "approved" | "rejected") => {
        try {
            setProcessing(actionId);
            await apiService.processApproval(runId, actionId, decision);
            await fetchPending();
        } catch (error) {
            console.error("Failed to process decision", error);
        } finally {
            setProcessing(null);
        }
    };

    const handleBulkDecision = async (decision: "approved" | "rejected") => {
        try {
            setIsBulkProcessing(true);
            const allActions = pendingRuns.flatMap(run => 
                run.actions_for_approval.map(action => ({ runId: run.run_id, actionId: action.action_id }))
            );

            // Process sequentially to avoid overwhelming the server
            for (const item of allActions) {
                await apiService.processApproval(item.runId, item.actionId, decision);
            }
            
            await fetchPending();
        } catch (error) {
            console.error(`Failed to bulk process ${decision}`, error);
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const totalPendingItems = pendingRuns.reduce((acc, r) => acc + r.actions_for_approval.length, 0);

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-warning/20 flex items-center justify-center border border-warning/30 shadow-2xl shadow-warning/20">
                        <ShieldCheck className="text-warning w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white focus:outline-none">Safety Review</h1>
                        <p className="text-muted-foreground">Human-in-the-Loop gateway for high-value and risk-critical actions.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/5">
                        <History className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-white font-medium">{totalPendingItems} Items Pending</span>
                    </div>
                    {totalPendingItems > 0 && (
                        <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                            <Button 
                                variant="outline" 
                                size="sm"
                                disabled={isBulkProcessing || loading}
                                onClick={() => handleBulkDecision("approved")}
                                className="bg-success/10 text-success border-success/20 hover:bg-success hover:text-white transition-all shadow-sm"
                            >
                                {isBulkProcessing ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <CheckSquare className="w-4 h-4 mr-2" />}
                                Accept All
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                disabled={isBulkProcessing || loading}
                                onClick={() => handleBulkDecision("rejected")}
                                className="bg-danger/10 text-danger border-danger/20 hover:bg-danger hover:text-white transition-all shadow-sm"
                            >
                                {isBulkProcessing ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <XSquare className="w-4 h-4 mr-2" />}
                                Reject All
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-warning/20 border-t-warning rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Syncing with orchestration layer...</p>
                </div>
            ) : pendingRuns.length === 0 ? (
                <Card className="py-20 text-center border-dashed border-white/10 bg-transparent">
                    <CardContent>
                        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="text-success w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Queue Clear</h3>
                        <p className="text-muted-foreground">All high-priority agent actions have been resolved.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-12">
                    {pendingRuns.map((run) => (
                        <div key={run.run_id} className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="py-1 px-3 border-white/10 text-white bg-white/5">RUN: {run.run_id}</Badge>
                                <div className="h-px flex-1 bg-white/5" />
                                <span className="text-xs text-muted-foreground">{formatDate(run.started_at)}</span>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <AnimatePresence>
                                    {run.actions_for_approval.map((action) => (
                                        <motion.div
                                            key={action.action_id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                        >
                                            <Card className="hover:border-white/20 transition-all border-white/10 group overflow-visible relative">
                                                {/* Lane Indicator */}
                                                <div className={cn(
                                                    "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl",
                                                    action.lane === "yellow" ? "bg-warning" : "bg-danger"
                                                )} />

                                                <CardContent className="p-0">
                                                    <div className="grid grid-cols-1 lg:grid-cols-4">
                                                        {/* Action Info */}
                                                        <div className="p-6 lg:col-span-2 border-r border-white/5">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <Badge variant={action.lane === "yellow" ? "warning" : "danger"} className="uppercase tracking-widest text-[10px]">
                                                                    {action.lane.toUpperCase()} LANE AUTHORIZATION
                                                                </Badge>
                                                                <span className="text-[10px] font-mono text-muted-foreground">{action.action_id}</span>
                                                            </div>
                                                            <h3 className="text-lg font-bold text-white mb-2 uppercase group-hover:text-primary transition-colors">
                                                                {action.action_type.replace(/_/g, " ")}
                                                            </h3>
                                                            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                                                                {action.description}
                                                            </p>
                                                            <div className="flex items-center gap-6">
                                                                <div>
                                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">Store Context</p>
                                                                    <div className="flex items-center gap-1.5 text-xs text-white">
                                                                        <MapPin className="w-3 h-3 text-primary" />
                                                                        {action.store_id}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">Est. Revenue Impact</p>
                                                                    <p className="text-sm font-bold text-success">{formatCurrency(action.estimated_value)}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">Internal Cost</p>
                                                                    <p className="text-sm font-bold text-white">{formatCurrency(action.estimated_cost)}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Critique Summary */}
                                                        <div className="p-6 lg:col-span-1 border-r border-white/5 bg-white/[0.01]">
                                                            <div className="space-y-6">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <ShieldAlert className="w-3 h-3 text-blue-400" />
                                                                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">VIGIL Critique</span>
                                                                    </div>
                                                                    <p className="text-[11px] text-muted-foreground italic leading-relaxed line-clamp-3">
                                                                        "{action.vigil_summary || 'No safety issues detected. PASS.'}"
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <TrendingUp className="w-3 h-3 text-primary" />
                                                                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">AUDIT Analysis</span>
                                                                    </div>
                                                                    <p className="text-[11px] text-muted-foreground italic leading-relaxed line-clamp-3">
                                                                        "{action.audit_summary || 'Positive ROI protected. Financial PASS.'}"
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="p-6 lg:col-span-1 flex flex-col justify-center space-y-3">
                                                            <Button
                                                                variant="primary"
                                                                className="w-full bg-success hover:bg-success/90 shadow-success/10"
                                                                onClick={() => handleDecision(run.run_id, action.action_id, "approved")}
                                                                disabled={!!processing}
                                                            >
                                                                {processing === action.action_id ? (
                                                                    <RefreshCcw className="w-4 h-4 animate-spin mr-2" />
                                                                ) : (
                                                                    <Check className="w-4 h-4 mr-2" />
                                                                )}
                                                                Authorize Action
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                className="w-full border-danger/20 hover:bg-danger/10 hover:text-danger"
                                                                onClick={() => handleDecision(run.run_id, action.action_id, "rejected")}
                                                                disabled={!!processing}
                                                            >
                                                                <X className="w-4 h-4 mr-2" />
                                                                Reject & Revise
                                                            </Button>
                                                            <div className="flex items-center justify-center gap-1.5 opacity-50">
                                                                <MessageSquare className="w-3 h-3" />
                                                                <span className="text-[9px] uppercase font-medium">Add Feedback</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

