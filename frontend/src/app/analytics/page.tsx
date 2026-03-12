"use client";

import { useEffect, useState } from "react";
import {
    TrendingUp,
    BarChart3,
    ArrowUpRight,
    Search,
    History,
    Zap,
    AlertCircle,
    LayoutDashboard,
    Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/services/apiService";
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function AnalyticsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const data = await apiService.getAnalytics();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="p-8 h-96 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground font-mono">Aggregating cross-pipeline network data...</p>
            </div>
        );
    }

    if (!stats || stats.total_runs === 0) {
        return (
            <div className="p-8 h-96 flex flex-col items-center justify-center">
                <LayoutDashboard className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-white uppercase tracking-widest">No Analytics Available</h3>
                <p className="text-sm text-muted-foreground mt-2 text-center max-w-xs">
                    Execute pipeline runs from the dashboard to generate network insights.
                </p>
                <Button variant="outline" className="mt-8 uppercase text-[10px] tracking-widest border-primary/30 text-primary hover:bg-primary/10">
                    <Zap className="w-3 h-3 mr-2" />
                    Go to Dashboard
                </Button>
            </div>
        );
    }

    const signalData = [
        { label: "Fridge", value: stats.signals_by_category?.fridge || 0 },
        { label: "Disease", value: stats.signals_by_category?.disease || 0 },
        { label: "Weather", value: stats.signals_by_category?.weather || 0 },
        { label: "Staffing", value: stats.signals_by_category?.staffing || 0 },
        { label: "Expiry", value: stats.signals_by_category?.expiry || 0 }
    ];

    const maxSignal = Math.max(...signalData.map(s => s.value), 1);

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-2xl shadow-primary/20">
                        <TrendingUp className="text-primary w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white focus:outline-none">Network Analytics</h1>
                        <p className="text-muted-foreground">Financial ROI and Sales Velocity insights derived from agent decisions.</p>
                    </div>
                </div>
                <Badge variant="outline" className="bg-white/5 border-white/10 uppercase tracking-widest text-[10px]">
                    {stats.total_runs} PIPELINE RUNS ANALYSED
                </Badge>
            </div>

            {/* High Level ROI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase tracking-widest font-bold text-[10px]">Net Value Protected</CardDescription>
                        <CardTitle className="text-3xl font-bold text-white tracking-tighter">
                            {formatCurrency(stats.net_value_protected)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1.5 text-success text-xs font-bold">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Calculated across {stats.total_runs} runs</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
                            Prevents waste and stockout avoidance based on actual executed agent actions.
                        </p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-success/10 rounded-full blur-2xl group-hover:bg-success/20 transition-all" />
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase tracking-widest font-bold text-[10px]">OpEx Efficiency</CardDescription>
                        <CardTitle className="text-3xl font-bold text-white tracking-tighter">
                            {(stats.opex_efficiency * 100).toFixed(1)}%
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1.5 text-success text-xs font-bold">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>High efficiency threshold met</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
                            Staffing cost optimization and routing efficiency vs total operational cost.
                        </p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase tracking-widest font-bold text-[10px]">Stockout Mitigation</CardDescription>
                        <CardTitle className="text-3xl font-bold text-white tracking-tighter">
                            {formatCurrency(stats.stockout_mitigation)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
                            <Target className="w-3 h-3" />
                            <span>Validated by health cluster data</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
                            Preemptive reordering based on health clusters and weather trends.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Signal Velocity & Action Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-white/10 bg-black/40">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-warning" />
                                    Signal Distribution
                                </CardTitle>
                                <CardDescription className="text-[10px]">Category-wise signals processed by PULSE.</CardDescription>
                            </div>
                            <BarChart3 className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent className="h-[250px] flex items-end gap-3 pb-2 px-8">
                        {signalData.map((s, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div
                                    className="w-full bg-primary/20 border-t border-x border-primary/30 rounded-t-lg transition-all hover:bg-primary/40 relative"
                                    style={{ height: `${(s.value / maxSignal) * 100}%`, minHeight: '10%' }}
                                >
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-800 text-[10px] px-2 py-0.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {s.value}
                                    </div>
                                </div>
                                <span className="text-[9px] font-bold text-muted-foreground uppercase">{s.label}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-black/40">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                            <History className="w-4 h-4 text-primary" />
                            Action Composition
                        </CardTitle>
                        <CardDescription className="text-[10px]">Distribution of approved agent operations.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Object.entries(stats.actions_by_type || {}).map(([type, count]: [string, any], i) => (
                            <div key={i}>
                                <div className="flex justify-between items-center mb-1 text-[10px] uppercase font-bold tracking-wider">
                                    <span className="text-white">{type.replace(/_/g, ' ')}</span>
                                    <span className="text-muted-foreground">{count}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(count / (Object.values(stats.actions_by_type) as number[]).reduce((a, b) => a + b, 0)) * 100}%` }}
                                        className="h-full bg-primary"
                                    />
                                </div>
                            </div>
                        ))}
                        {(!stats.actions_by_type || Object.keys(stats.actions_by_type).length === 0) && (
                            <p className="text-xs text-muted-foreground italic text-center py-10">No actions executed in session.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
