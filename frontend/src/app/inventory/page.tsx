"use client";

import { useEffect, useState } from "react";
import {
    Package,
    Search,
    Filter,
    ArrowUpDown,
    AlertCircle,
    Thermometer,
    Boxes,
    ExternalLink,
    RefreshCcw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/services/apiService";
import { cn } from "@/lib/utils";

export default function InventoryPage() {
    const [items, setItems] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [runs, setRuns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [invData, staffData, runsData] = await Promise.all([
                apiService.getInventory(),
                apiService.getStaff("STORE_088"), // Default for demo
                apiService.listRuns(),
            ]);
            setItems(invData.inventory || []);
            setStaff(staffData.staff || []);
            setRuns(runsData.runs || []);
        } catch (error) {
            console.error("Failed to fetch inventory or staff", error);
        } finally {
            setLoading(false);
        }
    };

    // Extract all executed actions from runs
    const executedActions = runs
        .flatMap(run => run.executed_actions || [])
        .sort((a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime())
        .slice(0, 5);

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header omitted for brevity in targetContent but I will include it in replacement */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-2xl shadow-primary/20">
                        <Package className="text-primary w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Operations Monitor</h1>
                        <p className="text-muted-foreground">Real-time inventory and personnel management.</p>
                    </div>
                </div>
                <Button variant="outline" size="md" onClick={fetchData} disabled={loading}>
                    <RefreshCcw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Inventory Table (2/3 width) */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>SKU Distribution</CardTitle>
                            <CardDescription>Master stock levels from ERP inventory.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                            <th className="pb-4">SKU / Store</th>
                                            <th className="pb-4">Batch</th>
                                            <th className="pb-4">Quantity</th>
                                            <th className="pb-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {items.slice(0, 10).map((item, idx) => (
                                            <tr key={idx} className="group hover:bg-white/[0.01]">
                                                <td className="py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-white">{item.drug_name || item.sku_id}</span>
                                                        <span className="text-[10px] text-muted-foreground">{item.store_id}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 font-mono text-xs text-zinc-400">{item.batch_id}</td>
                                                <td className="py-4 font-mono text-xs text-white">{item.quantity}</td>
                                                <td className="py-4">
                                                    <Badge variant={item.status === "quarantined" ? "danger" : item.quantity < 50 ? "warning" : "success"}>
                                                        {item.status.toUpperCase()}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Execution Log */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Action Execution Log</CardTitle>
                            <CardDescription>Verified results of agent-led operations.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {executedActions.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-8">No actions executed yet.</p>
                                ) : (
                                    executedActions.map((action, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center border border-success/30">
                                                    <RefreshCcw className="w-3 h-3 text-success" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-white uppercase tracking-wider">{action.action_type.replace(/_/g, " ")}</p>
                                                    <p className="text-[10px] text-muted-foreground">ID: {action.action_id} • {new Date(action.executed_at).toLocaleTimeString()}</p>
                                                </div>
                                            </div>
                                            <Badge variant="success">SUCCESS</Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Staffing Sidebar (1/3 width) */}
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-primary" />
                                <CardTitle className="text-sm">Personnel & Shifts</CardTitle>
                            </div>
                            <CardDescription className="text-[10px]">Active roster for STORE_088</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {staff.map((person, i) => (
                                    <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <p className="text-xs font-bold text-white">{person.name}</p>
                                            {person.is_registered_pharmacist && (
                                                <Badge variant="outline" className="text-[9px] border-blue-500/50 text-blue-400">RPh</Badge>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{person.role}</p>
                                        <div className="flex flex-col gap-1 mt-2">
                                            <span className="text-[10px] text-zinc-400">Today's Shift:</span>
                                            <span className="text-[11px] font-mono text-zinc-100">{person.shift_start} - {person.shift_end}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <p className="text-xs font-bold text-primary mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            HOW TO TEST AGENT FEEDBACK
                        </p>
                        <ol className="text-[10px] text-muted-foreground space-y-2 list-decimal ml-4">
                            <li>Go to Dashboard and <b>Trigger Analysis</b>.</li>
                            <li>Wait for agents to reason (~2 mins).</li>
                            <li>If high value, go to <b>Safety Review</b> and Approve.</li>
                            <li>Refresh this page to see <b>Inventory Increase</b> or <b>New Shifts</b>.</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}

