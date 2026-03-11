"use client";

import { useEffect, useState } from "react";
import {
    Stethoscope,
    Map,
    ThermometerSnowflake,
    Wind,
    Droplets,
    TrendingUp,
    AlertTriangle,
    History
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/services/apiService";
import { formatDate, cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function EpidemicPage() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const data = await apiService.getDiseaseAlerts();
            setAlerts(data.outbreaks || []);
        } catch (error) {
            console.error("Failed to fetch disease alerts", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-danger/20 flex items-center justify-center border border-danger/30 shadow-2xl shadow-danger/20">
                        <Stethoscope className="text-danger w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white focus:outline-none">Disease Watch</h1>
                        <p className="text-muted-foreground">Epidemiological surveillance & weather-weighted safety clusters.</p>
                    </div>
                </div>
                <Button variant="outline" size="md" onClick={fetchAlerts} disabled={loading}>
                    <History className="w-4 h-4 mr-2" />
                    Load IDSP History
                </Button>
            </div>

            {/* Risk Map Placeholder/Animation */}
            <Card className="bg-zinc-900/50 border-white/5 relative h-[300px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-danger rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary rounded-full blur-[100px] animate-pulse delay-700" />
                </div>
                <div className="relative text-center space-y-4">
                    <Map className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white tracking-tight leading-none">Regional Risk Visualization</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Interactive GIS mapping currently integrating East Delhi IDSP clusters with monsoon rainfall overlays.
                    </p>
                    <div className="flex gap-2 justify-center">
                        <Badge variant="danger">HIGH RISK: EAST DELHI</Badge>
                        <Badge variant="info">WATCH: SOUTH DELHI</Badge>
                    </div>
                </div>
            </Card>

            {/* Disease Alerts List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <CardHeader className="px-0">
                        <CardTitle>IDSP Surveillance Feed</CardTitle>
                        <CardDescription>Live outbreak alerts from Health Data MCP.</CardDescription>
                    </CardHeader>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="py-20 text-center">
                                <div className="w-8 h-8 border-2 border-danger/20 border-t-danger rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-xs text-muted-foreground">Syncing with IDSP feeds...</p>
                            </div>
                        ) : alerts.length === 0 ? (
                            <p className="text-center text-muted-foreground py-12">No active outbreaks detected.</p>
                        ) : (
                            alerts.map((alert, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <Card className="p-0 border-white/10 overflow-hidden">
                                        <div className="flex items-stretch">
                                            <div className={cn(
                                                "w-2",
                                                alert.severity === "CRITICAL" ? "bg-danger" : "bg-warning"
                                            )} />
                                            <div className="p-6 flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <AlertTriangle className={cn("w-4 h-4", alert.severity === "CRITICAL" ? "text-danger" : "text-warning")} />
                                                        <span className="text-sm font-bold text-white">{alert.disease.toUpperCase()} ALERT</span>
                                                    </div>
                                                    <Badge variant="outline" className="text-[10px] uppercase">{alert.report_id}</Badge>
                                                </div>
                                                <p className="text-lg font-bold text-white mb-1 uppercase tracking-tight">{alert.cluster_name}</p>
                                                <p className="text-xs text-muted-foreground mb-4">Reported At: {formatDate(alert.reported_at)}</p>

                                                <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
                                                    <div>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">Weekly Cases</p>
                                                        <p className="text-sm font-bold text-white">{alert.weekly_cases}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">WoW Growth</p>
                                                        <p className="text-sm font-bold text-danger">+{alert.growth_rate}%</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">Peak Prediction</p>
                                                        <p className="text-sm font-bold text-white">W+2</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Forecast/Indicators */}
                <div className="space-y-6 pt-[72px]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Meteorological Multipliers</CardTitle>
                            <CardDescription>Environmental factors used by PULSE.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Droplets className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <span className="text-sm text-muted-foreground">Humidity Index</span>
                                </div>
                                <span className="text-sm font-bold text-white">85.5%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                                        <ThermometerSnowflake className="w-4 h-4 text-cyan-400" />
                                    </div>
                                    <span className="text-sm text-muted-foreground">Mean Temp</span>
                                </div>
                                <span className="text-sm font-bold text-white">28.4°C</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-zinc-500/10 rounded-lg">
                                        <Wind className="w-4 h-4 text-zinc-400" />
                                    </div>
                                    <span className="text-sm text-muted-foreground">Stagnant Water Risk</span>
                                </div>
                                <Badge variant="danger">EXTREME</Badge>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-bold uppercase text-primary">PULSE Prediction Log</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed italic">
                                    "Correlation between 85% humidity and IDSP clusters indicates a 420% demand spike for paracetamol by T+14d."
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
