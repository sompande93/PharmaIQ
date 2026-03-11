"use client";

import { useEffect, useState } from "react";
import {
  Play,
  RefreshCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  TrendingUp,
  MapPin,
  ChevronRight
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
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const data = await apiService.listRuns();
      setRuns(data.runs);
    } catch (error) {
      console.error("Failed to fetch runs", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrigger = async () => {
    try {
      setTriggering(true);
      await apiService.runPipeline();
      await fetchRuns();
    } catch (error) {
      console.error("Failed to trigger pipeline", error);
    } finally {
      setTriggering(false);
    }
  };

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
      value: "₹24.8L",
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10"
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Executive Suite</h1>
          <p className="text-muted-foreground">Multi-agent supply chain orchestration dashboard.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" size="md" onClick={fetchRuns} disabled={loading}>
            <RefreshCcw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Sync Data
          </Button>
          <Button variant="primary" size="md" onClick={handleTrigger} disabled={triggering}>
            <Play className={cn("w-4 h-4 mr-2", triggering && "animate-pulse")} />
            Trigger Analysis
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
            <CardTitle>Recent Orchestration Cycles</CardTitle>
            <CardDescription>Live status of agent reasoning and decision flows.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
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
                      <th className="pb-3 font-medium text-center">ACTIONS</th>
                      <th className="pb-3 font-medium text-right">TIMESTAMP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {runs.map((run) => (
                      <tr key={run.run_id} className="group hover:bg-white/[0.02] cursor-pointer">
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">
                              {run.run_id}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase">Agents: SOMA, PULSE</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge variant={run.status === "complete" ? "success" : run.status === "pending" ? "warning" : "danger"}>
                            {run.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Badge variant="outline" className="text-[10px]">{run.signals_detected?.fridge_breaches || 0}B</Badge>
                            <Badge variant="outline" className="text-[10px]">{run.signals_detected?.disease_clusters || 0}O</Badge>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <span className="text-sm font-semibold text-white">{run.actions_proposed || 0}</span>
                        </td>
                        <td className="py-4 text-right">
                          <span className="text-xs text-muted-foreground italic">
                            {formatDate(run.started_at)}
                          </span>
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
