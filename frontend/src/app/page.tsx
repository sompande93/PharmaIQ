"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  RefreshCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  TrendingUp,
  ChevronRight,
  Trash2,
  Square
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { apiService } from "@/services/apiService";
import { PipelineRun } from "@/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [networkStats, setNetworkStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, []);

  // Polling for active runs
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const hasActiveRun = runs.some(r => r.status === "running");
    if (hasActiveRun) {
      interval = setInterval(fetchData, 3000); // Poll every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [runs]);

  const fetchData = async () => {
    try {
      const [runsData, statsData] = await Promise.all([
        apiService.listRuns(),
        apiService.getAnalytics()
      ]);
      setRuns(runsData.runs);
      setNetworkStats(statsData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      setLoading(false);
    }
  };

  const handleTrigger = async () => {
    try {
      setTriggering(true);
      const result = await apiService.runPipeline();
      setActiveRunId(result.run_id);
      await fetchData();
    } catch (error) {
      console.error("Failed to trigger pipeline", error);
    } finally {
      setTriggering(false);
    }
  };

  const handleStopRun = async (runId: string) => {
    if (!confirm(`Are you sure you want to stop analysis ${runId}?`)) return;
    try {
      await apiService.stopRun(runId);
      await fetchData();
    } catch (error) {
      console.error("Failed to stop run", error);
    }
  };

  const handleDeleteRun = async (runId: string) => {
    if (!confirm(`Permanently delete history for ${runId}?`)) return;
    try {
      await apiService.deleteRun(runId);
      await fetchData();
    } catch (error) {
      console.error("Failed to delete run", error);
    }
  };

  const handleStopAll = async () => {
    if (!confirm("Emergency Stop: Terminate all active analyses?")) return;
    try {
      await apiService.stopAllRuns();
      await fetchData();
    } catch (error) {
      console.error("Failed to stop all runs", error);
    }
  };

  // Progress mapping
  const getNodeProgress = (node: string | undefined): number => {
    if (!node) return 0;
    const progressMap: Record<string, number> = {
      "START": 5,
      "collect_signals": 15,
      "soma": 30,
      "pulse": 45,
      "vigil": 60,
      "audit": 75,
      "hitl": 90,
      "execute": 100,
      "END": 100
    };
    return progressMap[node] || 0;
  };

  const activeRun = runs.find(r => r.status === "running");

  const stats = [
    {
      name: "Total Analyses",
      value: runs.length.toString(),
      icon: Activity,
      color: "text-blue-400",
      bg: "bg-blue-400/10"
    },
    {
      name: "Auto-Approved",
      value: runs.reduce((acc, run) => acc + (run.actions_auto_approved || 0), 0).toString(),
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10"
    },
    {
      name: "Pending Review",
      value: runs.reduce((acc, run) => acc + (run.actions_awaiting_approval || 0), 0).toString(),
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/10"
    },
    {
      name: "Value Protected",
      value: networkStats ? formatCurrency(networkStats.net_value_protected) : "₹0",
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10"
    },
  ];

  if (!isMounted) return null;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* HITL Attention Banner */}
      {runs.some(r => (r.actions_awaiting_approval || 0) > 0) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-center justify-between shadow-lg shadow-warning/5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-bold text-white uppercase tracking-wider">Human Attention Required</p>
              <p className="text-xs text-muted-foreground mt-0.5">High-value reorders or safety transfers are pending your authorization in the Safety Review panel.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.href = "/approvals"} className="border-warning/50 text-warning hover:bg-warning/10">
            Go to Safety Review
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>
      )}

      {/* Progress Banner for Active Run */}
      {activeRun && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-primary/10 border border-primary/30 shadow-2xl shadow-primary/5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 animate-pulse">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-widest">Analysis in Progress: {activeRun.run_id}</p>
                <p className="text-xs text-muted-foreground">Currently processing: <span className="text-primary font-mono uppercase">{activeRun.current_node?.replace(/_/g, " ")} Agent</span></p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  console.log("Stop Button Clicked");
                  e.preventDefault();
                  handleStopRun(activeRun.run_id);
                }}
                className="border-danger/50 text-danger hover:bg-danger/10 h-7 text-[10px] uppercase tracking-widest relative z-50"
              >
                <Square className="w-3 h-3 mr-1 fill-current" />
                Stop Analysis
              </Button>
              <span className="text-lg font-bold text-primary font-mono">{getNodeProgress(activeRun.current_node)}%</span>
            </div>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
            <motion.div
              className="h-full bg-gradient-to-r from-primary/50 to-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${getNodeProgress(activeRun.current_node)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-3 text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
            <span>Signals</span>
            <span>Reasoning</span>
            <span>Critique</span>
            <span>HITL GATE</span>
            <span className="text-primary">Execution</span>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Executive Suite</h1>
          <p className="text-muted-foreground">Multi-agent supply chain orchestration dashboard.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" size="md" onClick={fetchData} disabled={loading}>
            <RefreshCcw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Sync Data
          </Button>
          {runs.some(r => r.status === "running") && (
            <Button variant="outline" size="md" onClick={handleStopAll} className="border-danger/50 text-danger hover:bg-danger/10">
              <Square className="w-4 h-4 mr-2 fill-current" />
              Stop All
            </Button>
          )}
          <Button variant="primary" size="md" onClick={handleTrigger} disabled={triggering || !!activeRun}>
            <Play className={cn("w-4 h-4 mr-2", (triggering || !!activeRun) && "animate-pulse")} />
            {activeRun ? "Analysis Running..." : "Trigger Analysis"}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="hover:scale-[1.02] active:scale-[0.98]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-2 rounded-lg", stat.bg)}>
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                  <Badge variant="outline" className="text-[10px]">LTD</Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">{stat.name}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Runs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Orchestration History</CardTitle>
            <CardDescription>Live status of agent reasoning and decision flows.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && runs.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Fetching latest signals...</p>
              </div>
            ) : runs.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No pipeline runs detected. Trigger an analysis to begin.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-muted-foreground">
                      <th className="pb-3 font-medium">RUN ID</th>
                      <th className="pb-3 font-medium">STATUS</th>
                      <th className="pb-3 font-medium text-center">SIGNALS</th>
                      <th className="pb-3 font-medium text-center text-primary">ROI</th>
                      <th className="pb-3 font-medium text-right">TIMESTAMP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {runs.map((run) => (
                      <tr
                        key={run.run_id}
                        className={cn(
                          "group hover:bg-white/[0.02] transition-colors",
                          run.status === "running" && "bg-primary/5 border-l-2 border-l-primary"
                        )}
                      >
                        <td className="py-4 px-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">
                              {run.run_id}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase">Agents: SOMA, PULSE</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge variant={run.status === "complete" ? "success" : run.status === "running" ? "warning" : "danger"}>
                            {run.status.toUpperCase()}
                          </Badge>
                          {run.status === "running" && (
                            <span className="ml-2 text-[10px] text-muted-foreground animate-pulse uppercase">
                              {run.current_node}
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Badge variant="outline" className="text-[10px]">{Object.values(run.signals_detected || {}).reduce((a, b) => (a as any) + (b as any), 0)} S</Badge>
                          </div>
                        </td>
                        <td className="py-4 text-center text-sm font-semibold text-white">
                          {run.actions_proposed || 0}
                        </td>
                        <td className="py-4 text-right pr-2">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[10px] text-muted-foreground italic mr-2">
                              {formatDate(run.started_at)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/agents?runId=${run.run_id}`)}
                              className="h-7 text-[10px] uppercase tracking-wider"
                            >
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteRun(run.run_id);
                              }}
                              className="w-8 h-8 p-0 text-muted-foreground hover:text-danger hover:bg-danger/10 relative z-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Decision Lane Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Green Lane (Auto)</span>
                  <span className="text-white">85%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-success w-[85%]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Yellow Lane (Manager)</span>
                  <span className="text-white">12%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-warning w-[12%]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Red Lane (Senior)</span>
                  <span className="text-white">3%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-danger w-[3%]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Active Monitoring</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                VIGIL and AUDIT agents are currently scanning East Delhi clusters for CDSCO compliance and logistics ROI.
              </p>
              <Button variant="ghost" className="w-full mt-4 text-[10px] h-8 justify-between px-2">
                View VIGIL Audit Log
                <ChevronRight className="w-3 h-3" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
