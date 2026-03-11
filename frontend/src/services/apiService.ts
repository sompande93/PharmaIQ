import axios from "axios";
import { PipelineRun, FullRunDetails, ProposedAction } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

const api = axios.create({
    baseURL: API_BASE_URL,
});

export const apiService = {
    // Pipeline
    runPipeline: async (): Promise<PipelineRun> => {
        const response = await api.post("/pipeline/run");
        return response.data;
    },

    listRuns: async (): Promise<{ total_runs: number; runs: PipelineRun[] }> => {
        const response = await api.get("/pipeline/runs");
        return response.data;
    },

    getRunDetails: async (runId: string): Promise<FullRunDetails> => {
        const response = await api.get(`/pipeline/runs/${runId}`);
        return response.data;
    },

    // Approvals
    getPendingApprovals: async (): Promise<{ total_pending: number; pending_actions: any[] }> => {
        const response = await api.get("/approvals/pending");
        return response.data;
    },

    processApproval: async (runId: string, actionId: string, decision: "approved" | "rejected", notes?: string) => {
        const response = await api.post(`/approvals/${runId}/${actionId}`, {
            decision,
            notes: notes || "",
        });
        return response.data;
    },

    // Store & MCP Data
    listStores: async () => {
        const response = await api.get("/stores");
        return response.data;
    },

    getFridgeData: async (storeId?: string) => {
        const response = await api.get("/stores/fridges", { params: { store_id: storeId } });
        return response.data;
    },

    getInventory: async (storeId?: string) => {
        const response = await api.get("/stores/inventory", { params: { store_id: storeId } });
        return response.data;
    },

    getDiseaseAlerts: async () => {
        const response = await api.get("/stores/disease-alerts");
        return response.data;
    },

    getStaff: async (storeId: string) => {
        const response = await api.get(`/stores/staff/${storeId}`);
        return response.data;
    },
};
