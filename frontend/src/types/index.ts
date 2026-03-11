export interface Signal {
    fridge_breaches: any[];
    disease_clusters: any[];
    weather_alerts: any[];
    shift_gaps: any[];
    expiring_stock: any[];
}

export interface ProposedAction {
    action_id: string;
    action_type: string;
    store_id: string;
    proposed_by: string;
    description: string;
    estimated_value: number;
    estimated_cost: number;
    lane: "green" | "yellow" | "red";
    status?: string;
    critique_passed?: boolean;
    vigil_summary?: string;
    audit_summary?: string;
    approved_at?: string;
    approved_by?: string;
    executed_at?: string;
}

export interface PipelineRun {
    run_id: string;
    started_at: string;
    completed_at?: string;
    status: "complete" | "pending" | "failed" | "running";
    current_node?: string;
    signals_detected: {
        fridge_breaches: number;
        disease_clusters: number;
        weather_alerts: number;
        shift_gaps: number;
        expiring_stock: number;
    };
    actions_proposed: number;
    actions_auto_approved: number;
    actions_awaiting_approval: number;
    actions_executed: number;
    soma_analysis_preview?: string;
    pulse_analysis_preview?: string;
}

export interface FullRunDetails extends PipelineRun {
    signals: Signal;
    soma_analysis: string;
    pulse_analysis: string;
    vigil_critique: string;
    audit_critique: string;
    critique_passed: boolean;
    proposed_actions: ProposedAction[];
    approved_actions: ProposedAction[];
    actions_for_approval: ProposedAction[];
    rejected_actions: ProposedAction[];
    executed_actions: any[];
}
