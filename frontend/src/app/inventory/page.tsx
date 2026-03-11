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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const data = await apiService.getInventory();
            setItems(data.inventory || []);
        } catch (error) {
            console.error("Failed to fetch inventory", error);
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
                        <Package className="text-primary w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Inventory Monitor</h1>
                        <p className="text-muted-foreground">Real-time SKU visibility across the supply network.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="glass px-3 py-2 rounded-lg flex items-center gap-2 border-white/5">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Filter by SKU or Batch..."
                            className="bg-transparent border-none text-sm text-white focus:outline-none placeholder:text-muted-foreground/50"
                        />
                    </div>
                    <Button variant="outline" size="md">
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                    </Button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-danger/5 border-danger/20">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <Thermometer className="w-4 h-4 text-danger" />
                            <CardTitle className="text-sm font-bold uppercase tracking-wider">Cold Chain Risks</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-white">4 Items</p>
                        <p className="text-[10px] text-muted-foreground mt-1">SOMA identifying stability buffers...</p>
                    </CardContent>
                </Card>
                <Card className="bg-warning/5 border-warning/20">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-warning" />
                            <CardTitle className="text-sm font-bold uppercase tracking-wider">Near Expiry</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-white">12 Batches</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Markdown triggers pending AUDIT...</p>
                    </CardContent>
                </Card>
                <Card className="bg-success/5 border-success/20">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <Boxes className="w-4 h-4 text-success" />
                            <CardTitle className="text-sm font-bold uppercase tracking-wider">Stock Health</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-white">94% Optimal</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Network balanced by PULSE shifts.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Inventory Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>SKU Distribution</CardTitle>
                            <CardDescription>Master inventory list from ERP Inventory MCP.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={fetchInventory}>
                            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-20 text-center">
                            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-xs text-muted-foreground">Reading ERP masters...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                        <th className="pb-4">SKU / Store</th>
                                        <th className="pb-4">Category</th>
                                        <th className="pb-4">Batch</th>
                                        <th className="pb-4">Quantity</th>
                                        <th className="pb-4">Status</th>
                                        <th className="pb-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {items.map((item, idx) => (
                                        <tr key={idx} className="group hover:bg-white/[0.01]">
                                            <td className="py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white">{item.sku_name || item.sku_id}</span>
                                                    <span className="text-[10px] text-muted-foreground">{item.store_id}</span>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                                            </td>
                                            <td className="py-4">
                                                <span className="text-xs font-mono text-zinc-400">{item.batch_id}</span>
                                            </td>
                                            <td className="py-4 font-mono text-xs text-white">
                                                {item.quantity} {item.unit}
                                            </td>
                                            <td className="py-4">
                                                <Badge variant={item.quantity < 50 ? "warning" : "success"}>
                                                    {item.quantity < 50 ? "LOW STOCK" : "OPTIMAL"}
                                                </Badge>
                                            </td>
                                            <td className="py-4 text-right">
                                                <Button variant="ghost" size="icon" className="group-hover:text-primary">
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

