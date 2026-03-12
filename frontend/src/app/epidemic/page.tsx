"use client";

import { useEffect, useState } from "react";
import {
    Activity,
    Wind,
    Droplets,
    Thermometer,
    AlertTriangle,
    MapPin,
    Calendar,
    ArrowUpRight,
    Search,
    Filter,
    Layers,
    Navigation,
    Microscope,
    CloudRain,
    Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/services/apiService";
import { motion } from "framer-motion";

export default function EpidemicPage() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [weatherSummary, setWeatherSummary] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [diseaseData, weatherData] = await Promise.all([
                    apiService.getDiseaseAlerts(),
                    apiService.getWeatherSummary()
                ]);
                setAlerts(diseaseData.clusters || []);
                setWeatherSummary(weatherData || []);
            } catch (error) {
                console.error("Failed to fetch epidemic data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Aggregate average weather metrics for the global sidebar
    const avgHumidity = weatherSummary.length > 0
        ? Math.round(weatherSummary.reduce((acc, current) => acc + current.humidity, 0) / weatherSummary.length)
        : 72;

    const avgRainfall = weatherSummary.length > 0
        ? Math.round(weatherSummary.reduce((acc, current) => acc + current.rainfall, 0) / weatherSummary.length)
        : 124;

    const highestRisk = weatherSummary.some(w => w.mosquito_risk === "very_high" || w.mosquito_risk === "high") ? "CRITICAL" : "MODERATE";

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-danger/20 flex items-center justify-center border border-danger/30 shadow-2xl shadow-danger/20">
                        <Microscope className="text-danger w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white focus:outline-none">Disease Watch</h1>
                        <p className="text-muted-foreground">IDSP Integrated Disease Surveillance Program — Real-time cluster monitoring.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: GIS Map / Cluster View */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className="border-white/10 bg-black/40 overflow-hidden">
                        <div className="aspect-video relative bg-zinc-900 flex items-center justify-center">
                            {/* GIS Placeholder with some animated points */}
                            <div className="absolute inset-0 opacity-20 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=20.5937,78.9629&zoom=4&size=800x450&maptype=dark&key=')] bg-cover grayscale" />
                            <div className="relative flex flex-col items-center gap-4">
                                <Navigation className="w-12 h-12 text-primary/40 animate-pulse" />
                                <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">GIS Spatial Node: India_Central</p>
                            </div>

                            {/* Alert Points */}
                            {alerts.slice(0, 3).map((a, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: [1, 1.5, 1] }}
                                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
                                    className="absolute w-4 h-4 rounded-full bg-danger/40 border border-danger shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                                    style={{ top: `${30 + i * 20}%`, left: `${40 + i * 15}%` }}
                                />
                            ))}
                        </div>
                        <CardHeader className="bg-white/5 border-t border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-primary" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">Heatmap Layers: Dengue, Malaria, Typhoid</span>
                                </div>
                                <Badge variant="outline" className="text-[9px] bg-white/5 border-white/10 text-muted-foreground">REFRESHED: {new Date().toLocaleTimeString()}</Badge>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">IDSP Surveillance Feed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {loading ? (
                                    <div className="py-10 text-center space-y-4">
                                        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                                        <p className="text-xs text-muted-foreground font-mono">Querying central surveillance nodes...</p>
                                    </div>
                                ) : alerts.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic text-center py-10">No active clusters detected in monitored regions.</p>
                                ) : (
                                    alerts.map((alert, i) => (
                                        <div key={i} className="group p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center border border-danger/20 text-danger">
                                                    <AlertTriangle className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-sm font-bold text-white uppercase">{alert.disease}</p>
                                                        <Badge variant={alert.alert_level === "outbreak" ? "danger" : "warning"} className="text-[8px] tracking-tighter uppercase px-1">
                                                            {alert.alert_level}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                                                        <MapPin className="w-3 h-3 text-primary" />
                                                        {alert.region.replace(/_/g, " ").toUpperCase()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 justify-end text-white font-bold text-sm mb-1">
                                                    <ArrowUpRight className="w-3 h-3 text-danger" />
                                                    {alert.growth_rate_pct}% Growth
                                                </div>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{alert.confirmed_cases} CONFIRMED CASES</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Environmental Multipliers */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-primary/20 bg-primary/[0.02]">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Meteorological Multipliers</CardTitle>
                            <CardDescription className="text-[10px]">Real-time correlation between weather and contagion risk from Weather MCP.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg">
                                            <Droplets className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Relative Humidity</p>
                                            <p className="text-lg font-bold text-white">{avgHumidity}%</p>
                                        </div>
                                    </div>
                                    <Badge variant="warning" className="text-[8px]">HIGH</Badge>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <CloudRain className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Cumulative Rainfall</p>
                                            <p className="text-lg font-bold text-white">{avgRainfall}mm</p>
                                        </div>
                                    </div>
                                    <Badge variant="success" className="text-[8px]">+14D FCST</Badge>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-danger/10 rounded-lg">
                                            <Thermometer className="w-4 h-4 text-danger" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Mosquito Risk</p>
                                            <p className="text-lg font-bold text-white uppercase tracking-tighter">{highestRisk}</p>
                                        </div>
                                    </div>
                                    <Badge variant="danger" className="text-[8px]">ACTIVE</Badge>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap className="w-3 h-3 text-warning" />
                                    <p className="text-[10px] font-bold text-white uppercase">PULSE Calibration</p>
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    Environmental variables have triggered a <span className="text-white font-bold">2.4x demand multiplier</span> for Antipyretics and Rehydration Salts in monitored zones.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">IDSP Node Logs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {weatherSummary.slice(0, 4).map((w, i) => (
                                    <div key={i} className="flex gap-4 p-2 border-b border-white/5 last:border-0">
                                        <div className="w-1 h-auto bg-primary/30 rounded-full" />
                                        <div>
                                            <p className="text-[10px] font-bold text-white uppercase">{w.region.replace(/_/g, " ")}</p>
                                            <p className="text-[9px] text-muted-foreground">Rain: {w.rainfall}mm • Hum: {w.humidity}% • {w.waterlogging_risk.replace(/_/g, " ")} risk</p>
                                        </div>
                                    </div>
                                ))}
                                {weatherSummary.length === 0 && (
                                    <p className="text-[9px] text-muted-foreground italic">Syncing with regional weather descriptors...</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
