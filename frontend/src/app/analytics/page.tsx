"use client";

import { useEffect, useState } from "react";
import {
    TrendingUp,
    TrendingDown,
    BarChart3,
    PieChart,
    Target,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/services/apiService";
import { formatCurrency, cn } from "@/lib/utils";

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(false);

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-2xl shadow-primary/20">
                        <TrendingUp className="text-primary w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Network Analytics</h1>
                        <p className="text-muted-foreground">Financial ROI and Sales Velocity insights derived from agent decisions.</p>
                    </div>
                </div>
                <div className="flex bg-white/5 rounded-lg border border-white/5 p-1">
                    <Button variant="ghost" size="sm" className="bg-white/5 font-bold">LTD</Button>
                    <Button variant="ghost" size="sm">QTD</Button>
                    <Button variant="ghost" size="sm">YTD</Button>
                </div>
            </div>

            {/* High Level ROI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase tracking-widest font-bold text-[10px]">Net Value Protected</CardDescription>
                        <CardTitle className="text-3xl font-bold text-white tracking-tighter">₹42.2L</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1.5 text-success text-xs font-bold">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>+18.4% vs prev. month</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
                            Calculated by SOMA & AUDIT based on prevented waste and stockout avoidance.
                        </p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-success/10 rounded-full blur-2xl group-hover:bg-success/20 transition-all" />
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase tracking-widest font-bold text-[10px]">OpEx Efficiency</CardDescription>
                        <CardTitle className="text-3xl font-bold text-white tracking-tighter">92.4%</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1.5 text-success text-xs font-bold">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>+4.2 pts improvement</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
                            Staffing cost optimization and routing efficiency via PULSE reallocation.
                        </p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase tracking-widest font-bold text-[10px]">Stockout Mitigation</CardDescription>
                        <CardTitle className="text-3xl font-bold text-white tracking-tighter">₹8.1L</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1.5 text-success text-xs font-bold">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>124 potential stockouts prevented</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
                            Preemptive reordering based on health clusters and weather trends.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Sales Velocity Chart Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>SKU Velocity Trends</CardTitle>
                                <CardDescription>Top moving categories across high-risk zones.</CardDescription>
                            </div>
                            <BarChart3 className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-end gap-2 pb-2">
                        {[65, 45, 85, 30, 95, 20, 55].map((h, i) => (
                            <div
                                key={i}
                                className="flex-1 bg-primary/20 border border-primary/10 rounded-md transition-all hover:bg-primary/40 group relative"
                                style={{ height: `${h}%` }}
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-[10px] font-bold px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {h}%
                                </div>
                            </div>
                        ))}
                    </CardContent>
                    <div className="px-6 pb-6 flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                        <span>Dengue</span>
                        <span>Flu</span>
                        <span>Covid</span>
                        <span>Malaria</span>
                        <span>Hypertension</span>
                        <span>Diabetes</span>
                        <span>Cardiac</span>
                    </div>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Decision ROI Breakdown</CardTitle>
                        <CardDescription>Critique agent impact on financial outcomes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-[spin_3s_linear_infinite]" />
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-bold text-white">SOMA Yield Improvement</span>
                                    <span className="text-sm text-primary">+12%</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-[72%]" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full border-4 border-success border-t-transparent animate-[spin_4s_linear_infinite_reverse]" />
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-bold text-white">PULSE Accuracy</span>
                                    <span className="text-sm text-success">98.2%</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-success w-[98%]" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full border-4 border-blue-400 border-t-transparent animate-[spin_2s_linear_infinite]" />
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-bold text-white">VIGIL Safety Score</span>
                                    <span className="text-sm text-blue-400">100%</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-400 w-[100%]" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
