"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BuildingOfficeIcon, 
  ShieldCheckIcon, 
  BoltIcon, 
  ArrowRightIcon, 
  XMarkIcon 
} from "@heroicons/react/24/outline";

type AuthState = "landing" | "login" | "authenticated";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("landing");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Login Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Check initial auth state
    const authStatus = localStorage.getItem("pharmaiq_auth");
    if (authStatus === "true") {
      setAuthState("authenticated");
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "PharmaEmployee" && password === "12345") {
      localStorage.setItem("pharmaiq_auth", "true");
      setAuthState("authenticated");
      setError("");
    } else {
      setError("Invalid username or password");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("pharmaiq_auth");
    setAuthState("landing");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {authState === "landing" && (
        <motion.div
           key="landing"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="relative flex h-screen w-screen flex-col bg-gray-950 overflow-y-auto"
        >
          {/* Header */}
          <header className="absolute top-0 w-full z-50 flex items-center justify-between px-8 py-6">
            <div className="flex items-center gap-2 text-white">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-bold tracking-tight">Pharma<span className="text-blue-500">IQ</span></span>
            </div>
            <button
              onClick={() => setAuthState("login")}
              className="rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-105"
            >
              Sign In
            </button>
          </header>

          {/* Hero Content */}
          <main className="relative flex flex-1 flex-col items-center justify-center px-6 text-center z-10">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-[40%] left-[20%] h-[800px] w-[800px] rounded-full bg-blue-900/20 blur-[120px]" />
              <div className="absolute top-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-indigo-900/20 blur-[120px]" />
            </div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="z-10 max-w-4xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 mb-8">
                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-sm font-medium text-blue-200">v1.2 Agentic OS Now Live</span>
              </div>
              
              <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-white md:text-7xl">
                The Autonomous <br />
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Healthcare Retail
                </span> OS
              </h1>
              
              <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400 md:text-xl leading-relaxed">
                Connect external IoT sensors, ERP systems, and weather APIs to multi-agent LLM orchestrators. Shift your pharmacy from reactive alerts to proactive autonomy.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setAuthState("login")}
                  className="group flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-blue-500 hover:scale-105 disabled:opacity-50"
                >
                  Enter Platform
                  <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
                <a
                  href="https://github.com/sompande93/PharmaIQ"
                  target="_blank"
                  className="flex items-center justify-center rounded-full border border-gray-700 bg-gray-800/50 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:bg-gray-800"
                >
                  View Documentation
                </a>
              </div>
            </motion.div>

            {/* Feature Grid */}
            <motion.div 
               initial={{ y: 40, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.6, duration: 0.8 }}
               className="z-10 mt-24 grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3"
            >
              <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm text-left">
                <ShieldCheckIcon className="h-10 w-10 text-emerald-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Compliance Driven</h3>
                <p className="text-gray-400">VIGIL Agent strictly critiques all operational moves against CDSCO compliance standards.</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm text-left">
                <BoltIcon className="h-10 w-10 text-amber-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Proactive Logistics</h3>
                <p className="text-gray-400">PULSE Agent cross-references local epidemiology reports to route medications before outbreaks hit.</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm text-left">
                <BuildingOfficeIcon className="h-10 w-10 text-blue-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Cold Chain Armor</h3>
                <p className="text-gray-400">SOMA Agent prevents $100k spoilage events by predicting compressor failures.</p>
              </div>
            </motion.div>
          </main>
        </motion.div>
      )}

      {authState === "login" && (
        <motion.div
           key="login"
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 0.95 }}
           transition={{ duration: 0.3 }}
           className="relative flex h-screen w-screen items-center justify-center bg-gray-900"
        >
          {/* Ambient Background Glow */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[20%] left-[30%] h-[600px] w-[600px] rounded-full bg-blue-900/20 blur-[100px]" />
          </div>

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <button 
              onClick={() => setAuthState("landing")}
              className="absolute right-6 top-6 text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            <div className="mb-8 text-center mt-2">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <BuildingOfficeIcon className="h-8 w-8 text-blue-500" />
              </div>
              <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">
                Welcome Back
              </h1>
              <p className="text-sm text-gray-400">Enter your credentials to access the grid.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5 focus-within:text-blue-400 transition-colors">Employee ID</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-gray-500 backdrop-blur-md focus:border-blue-500 focus:bg-blue-500/5 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                  placeholder="e.g. PharmaEmployee"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5 focus-within:text-blue-400 transition-colors">Access Code</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-gray-500 backdrop-blur-md focus:border-blue-500 focus:bg-blue-500/5 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="text-sm font-medium text-red-400 bg-red-400/10 border border-red-400/20 py-2 px-3 rounded-lg text-center"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all active:scale-[0.98]"
              >
                Authenticate
              </button>
            </form>
            
            <div className="mt-8 text-center text-xs text-gray-500 bg-white/5 py-3 rounded-lg border border-white/5">
              <span className="block font-medium mb-1">Demo Environment</span>
              ID: <code className="text-blue-400 bg-blue-400/10 px-1 py-0.5 rounded">PharmaEmployee</code> | Pin: <code className="text-blue-400 bg-blue-400/10 px-1 py-0.5 rounded">12345</code>
            </div>
          </div>
        </motion.div>
      )}

      {authState === "authenticated" && (
        <motion.div
           key="app"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="h-full w-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
