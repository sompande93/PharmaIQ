"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart3,
    ShieldCheck,
    Settings,
    LayoutDashboard,
    Activity,
    Package,
    Stethoscope,
    TrendingDown
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Executive Suite", href: "/", icon: LayoutDashboard },
    { name: "Agent Control", href: "/agents", icon: Activity },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Disease Watch", href: "/epidemic", icon: Stethoscope },
    { name: "Safety Review", href: "/approvals", icon: ShieldCheck },
    { name: "Analytics", href: "/analytics", icon: TrendingDown },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-full glass border-r border-white/5 w-64">
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <BarChart3 className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">PharmaIQ</span>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-muted-foreground")} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <span className="text-xs font-bold">OM</span>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-white">Ops Manager</p>
                        <p className="text-[10px] text-muted-foreground">MedChain India</p>
                    </div>
                    <Settings className="w-4 h-4 ml-auto text-muted-foreground cursor-pointer hover:text-white" />
                </div>
            </div>
        </div>
    );
}
