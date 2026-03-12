"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BuildingOfficeIcon, 
  ShieldCheckIcon, 
  BoltIcon, 
  ArrowRightIcon, 
  XMarkIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CpuChipIcon,
  CircleStackIcon,
  ComputerDesktopIcon,
  ChevronDownIcon
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

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
      </div>
    );
  }

  // Common animation variants
  const fadeInUP = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {authState === "landing" && (
        <motion.div
           key="landing"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="relative flex h-screen w-screen flex-col bg-gray-950 overflow-y-auto scroll-smooth custom-scrollbar overflow-x-hidden min-h-0"
        >
          {/* Fixed Header */}
          <header className="fixed top-0 w-full z-50 flex items-center justify-between px-8 py-4 bg-gray-950/50 backdrop-blur-lg border-b border-white/5">
            <div className="flex items-center gap-2 text-white">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-bold tracking-tight">Pharma<span className="text-blue-500">IQ</span></span>
            </div>
            <button
              onClick={() => setAuthState("login")}
              className="rounded-full bg-blue-600/90 hover:bg-blue-500 px-6 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all hover:scale-105"
            >
              Sign In
            </button>
          </header>

          {/* Section 1: Hero */}
          <section className="relative flex min-h-screen w-full flex-col items-center justify-center px-4 md:px-6 text-center pt-24 pb-12 overflow-hidden shrink-0">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
              <div className="h-[600px] w-[600px] md:h-[800px] md:w-[800px] rounded-full bg-blue-900/10 blur-[100px] md:blur-[120px]" />
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center"
            >
              <motion.div variants={fadeInUP} className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 mb-8">
                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-sm font-medium text-blue-200 tracking-wide">PHARMAIQ V1.2.0 DEPLOYED</span>
              </motion.div>
              
              <motion.h1 variants={fadeInUP} className="mb-6 text-5xl font-extrabold tracking-tight text-white md:text-7xl lg:text-8xl">
                The Autonomous <br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Healthcare Retail
                </span> OS
              </motion.h1>
              
              <motion.p variants={fadeInUP} className="mx-auto mb-10 max-w-3xl text-lg text-gray-400 md:text-2xl leading-relaxed font-light">
                Connect IoT sensors, ERP systems, and epidemiological data to Multi-Agent LLMs. Stop spoilage, preempt outbreaks, and automate compliance natively.
              </motion.p>
              
              <motion.div variants={fadeInUP} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setAuthState("login")}
                  className="group flex items-center justify-center gap-2 rounded-full bg-white text-gray-900 px-8 py-4 text-lg font-bold transition-all hover:bg-gray-200 hover:scale-105"
                >
                  Enter Platform
                  <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
                <a
                  href="#problem"
                  className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-lg font-medium text-white backdrop-blur-sm transition-all hover:bg-white/10"
                >
                  Discover How It Works
                  <ChevronDownIcon className="h-5 w-5 animate-bounce" />
                </a>
              </motion.div>
            </motion.div>
          </section>

          {/* Section 2: The Problem */}
          <section id="problem" className="relative flex min-h-screen w-full items-center justify-center py-20 px-4 md:px-6 bg-gradient-to-b from-gray-950 to-gray-900 border-t border-white/5 shrink-0 overflow-hidden">
            <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center">
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeInUP}
                className="text-center mb-16"
              >
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">The Healthcare Retail Crisis</h2>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">Traditional pharmacies rely on siloed, reactive systems. We're bleeding money and risking patient safety because we analyze data <span className="text-red-400 italic">after</span> the event.</p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full justify-items-center">
                {/* Problem 1 */}
                <motion.div 
                  initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20px" }} variants={fadeInUP}
                  className="w-full max-w-[400px] group relative rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent p-6 md:p-8 backdrop-blur-md overflow-hidden flex flex-col items-center md:items-start text-center md:text-left"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all"></div>
                  <ExclamationTriangleIcon className="h-14 w-14 text-red-400 mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-4">Reactive Cold Chain</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Pinging a manager when a fridge crosses 8°C is too late. The insulin is already compromised. We need to predict compressor failures hours before they happen based on IoT telemetry and local weather.
                  </p>
                </motion.div>

                {/* Problem 2 */}
                <motion.div 
                  initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20px" }} variants={fadeInUP} transition={{ delay: 0.2 }}
                  className="w-full max-w-[400px] group relative rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-6 md:p-8 backdrop-blur-md overflow-hidden flex flex-col items-center md:items-start text-center md:text-left"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all"></div>
                  <ChartBarIcon className="h-14 w-14 text-amber-400 mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-4">Epidemic Blindspots</h3>
                  <p className="text-gray-400 leading-relaxed">
                    By the time ERP systems show a spike in Dengue medication sales, the local warehouse is empty. We need to route inventory based on real-time disease cluster surveillance from health departments.
                  </p>
                </motion.div>

                {/* Problem 3 */}
                <motion.div 
                  initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20px" }} variants={fadeInUP} transition={{ delay: 0.4 }}
                  className="w-full max-w-[400px] group relative rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent p-6 md:p-8 backdrop-blur-md overflow-hidden flex flex-col items-center md:items-start text-center md:text-left"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all"></div>
                  <ShieldCheckIcon className="h-14 w-14 text-purple-400 mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-4">Unsafe Automation</h3>
                  <p className="text-gray-400 leading-relaxed">
                    You can't just let an AI order schedule 80 units of Morphine autonomously. Healthcare requires strict CDSCO compliance gating. Automation without specialized legal oversight is a liability.
                  </p>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Section 3: The Solution / Features */}
          <section className="relative flex w-full flex-col items-center py-20 px-4 md:px-6 overflow-hidden bg-gray-900 border-t border-white/5 shrink-0 min-h-screen h-auto">
             {/* Tech grid background */}
             <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
             
             <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center">
                <motion.div 
                  initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUP}
                  className="text-center mb-16"
                >
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Enter <span className="text-blue-500">PharmaIQ</span></h2>
                  <p className="text-xl text-gray-400 max-w-3xl mx-auto">We don't just alert you. We deploy specialized AI agents that debate the best course of action, calculate the ROI, and queue the fix for your final approval.</p>
                </motion.div>

                <div className="space-y-24 md:space-y-32 w-full">
                  {/* Feature 1 - LangGraph */}
                  <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 w-full">
                    <motion.div 
                      initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.8 }}
                      className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 mb-6">
                        <CpuChipIcon className="h-8 w-8" />
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-4">Multi-Agent Orchestration</h3>
                      <p className="text-lg text-gray-400 leading-relaxed">
                        Powered by LangGraph and Gemini 2.0. The <strong>SOMA</strong> agent handles internal store operations. The <strong>PULSE</strong> agent tracks external logistics and outbreaks. They feed their findings to the <strong>VIGIL</strong> compliance agent and <strong>AUDIT</strong> financial agent to formulate a legally sound, profitable plan.
                      </p>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.8 }}
                      className="w-full md:w-1/2 relative flex justify-center mt-8 md:mt-0"
                    >
                       <div className="absolute inset-0 bg-blue-500/20 blur-2xl md:blur-3xl rounded-full max-w-[400px] w-full mx-auto"></div>
                       <div className="relative w-full max-w-[450px] rounded-2xl border border-white/10 bg-black/50 p-4 md:p-6 backdrop-blur-xl shadow-2xl overflow-x-auto whitespace-pre-wrap">
                          <pre className="text-xs md:text-sm text-blue-300 font-mono text-left break-words">
{`SOMA: "Fridge 3 compressor degrading. Spoils in 4hr."
PULSE: "Storm warning. Tech dispatch delayed."
VIGIL: "Transfer to Fridge 1 approved (CDSCO safe)."
AUDIT: "ROI protected. $4k inventory saved."
-> Proposing Action to Human Manager...`}
                          </pre>
                       </div>
                    </motion.div>
                  </div>

                  {/* Feature 2 - MCP Native */}
                  <div className="flex flex-col md:flex-row-reverse items-center gap-10 md:gap-16 w-full">
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.8 }}
                      className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mb-6">
                        <CircleStackIcon className="h-8 w-8" />
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-4">MCP Native Integration</h3>
                      <p className="text-lg text-gray-400 leading-relaxed">
                        LLMs are useless without real environment data. PharmaIQ securely connects to 8+ Model Context Protocol (MCP) servers. We pull live data from IoT Fridge telemetry, HRMS Rosters, Weather APIs, and local Epidemiological databases in real-time.
                      </p>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.8 }}
                      className="w-full max-w-[500px] md:w-1/2 grid grid-cols-2 gap-3 md:gap-4 mt-8 md:mt-0"
                    >
                       <div className="h-32 rounded-2xl border border-emerald-500/20 bg-emerald-900/10 flex flex-col items-center justify-center text-emerald-400">
                         <span className="font-bold text-2xl">IoT</span>
                         <span className="text-sm opacity-70">Sensors</span>
                       </div>
                       <div className="h-32 rounded-2xl border border-emerald-500/20 bg-emerald-900/10 flex flex-col items-center justify-center text-emerald-400">
                         <span className="font-bold text-2xl">ERP</span>
                         <span className="text-sm opacity-70">Inventory</span>
                       </div>
                       <div className="h-32 rounded-2xl border border-emerald-500/20 bg-emerald-900/10 flex flex-col items-center justify-center text-emerald-400">
                         <span className="font-bold text-2xl">IDSP</span>
                         <span className="text-sm opacity-70">Health Data</span>
                       </div>
                       <div className="h-32 rounded-2xl border border-emerald-500/20 bg-emerald-900/10 flex flex-col items-center justify-center text-emerald-400">
                         <span className="font-bold text-2xl">HRMS</span>
                         <span className="text-sm opacity-70">Roster</span>
                       </div>
                    </motion.div>
                  </div>

                  {/* Feature 3 - HITL */}
                  <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 w-full">
                    <motion.div 
                      initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.8 }}
                      className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 mb-6">
                        <ComputerDesktopIcon className="h-8 w-8" />
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-4">You Retain Control (HITL)</h3>
                      <p className="text-lg text-gray-400 leading-relaxed">
                        The AI handles the heavy lifting of reasoning over thousands of data points, but <strong>high-impact actions are never fully automated</strong>. The system pauses and waits for your clear approval in a secure, glassmorphism dashboard.
                      </p>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.8 }}
                      className="w-full md:w-1/2 flex justify-center mt-8 md:mt-0"
                    >
                      <button
                        onClick={() => setAuthState("login")}
                        className="group flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 py-5 md:px-10 md:py-6 text-lg md:text-xl font-bold text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all hover:bg-blue-500 hover:scale-105 w-full max-w-[350px]"
                      >
                        Enter The Grid
                        <ArrowRightIcon className="h-6 w-6 transition-transform group-hover:translate-x-2" />
                      </button>
                    </motion.div>
                  </div>
                </div>
             </div>
             
             
             <footer className="w-full text-center mt-20 pt-8 pb-12 border-t border-white/5 text-gray-600">
               <p>© 2026 PharmaIQ. Autonomous Healthcare Retail Operations.</p>
             </footer>
          </section>
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
