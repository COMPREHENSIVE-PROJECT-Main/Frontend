"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Loader2, Cpu, ArrowRight, Activity, AlertCircle, RefreshCcw, ShieldCheck 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- 내부 컴포넌트: 재판 단계 스테퍼 ---
function TrialStepper({ currentStep }: { currentStep: number }) {
  const steps = [
    { title: "사건 기소", icon: "📄" },
    { title: "증거 조사", icon: "🔍" },
    { title: "최종 변론", icon: "🗣️" },
    { title: "판결 선고", icon: "⚖️" },
  ];
  return (
    <div className="w-full py-8 bg-white/80 backdrop-blur-md sticky top-0 z-20 shadow-sm border-none">
      <div className="max-w-md mx-auto px-6">
        <div className="relative flex justify-between">
          <div className="absolute top-5 left-0 w-full h-1 bg-slate-50 -z-0 rounded-full">
            <div 
              className="h-full bg-blue-600 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>
          {steps.map((step, index) => (
            <div key={index} className="relative z-10 flex flex-col items-center">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${
                index <= currentStep ? "bg-blue-600 text-white shadow-lg shadow-blue-100 scale-110" : "bg-white text-slate-300"
              }`}>
                <span className="text-sm">{index <= currentStep ? step.icon : index + 1}</span>
              </div>
              <span className={`mt-3 text-[10px] font-black uppercase tracking-tighter ${index <= currentStep ? "text-blue-700" : "text-slate-400"}`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SimulationPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params?.id as string;

  const [logs, setLogs] = useState<any[]>([]);
  const [caseInfo, setCaseInfo] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentEvent, setCurrentEvent] = useState("연결 준비 중");
  const [isFinished, setIsFinished] = useState(false);
  const [errorStatus, setErrorStatus] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  // 🔗 SSE 스트리밍 연결 로직
  useEffect(() => {
    if (!caseId) return;

    const startSimulation = async () => {
      try {
        const response = await fetch("api/simulation/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "user_id", 
          },
          body: JSON.stringify({ case_id: caseId }),
        });

        if (!response.body) return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (!line.trim() || !line.startsWith("data:")) continue;
            
            const jsonStr = line.replace("data:", "").trim();
            const payload = JSON.parse(jsonStr);
            const { event, data } = payload;

            setCurrentEvent(event);

            switch (event) {
              case "simulation_start":
                setCaseInfo(data);
                setCurrentStep(0);
                break;

              case "round_start":
                setCurrentStep(data.round >= 2 ? 2 : 1);
                setLogs(prev => [...prev, { ...data, type: 'argument', msg: "", isStreaming: true }]);
                break;

              case "token":
                setLogs(prev => {
                  const last = prev[prev.length - 1];
                  if (last && last.type === 'argument') {
                    const updated = { ...last, msg: last.msg + data.text };
                    return [...prev.slice(0, -1), updated];
                  }
                  return prev;
                });
                break;

              case "round_end":
                setLogs(prev => {
                  const last = prev[prev.length - 1];
                  return [...prev.slice(0, -1), { ...last, ...data, msg: data.argument, isStreaming: false }];
                });
                break;

              case "judge_decision":
                setLogs(prev => [...prev, { ...data, type: 'decision' }]);
                break;

              case "final_verdict":
                setCurrentStep(3);
                setLogs(prev => [...prev, { ...data, type: 'verdict', msg: data.order }]);
                break;

              case "error":
                setErrorStatus(data);
                break;

              case "simulation_end":
                setIsFinished(true);
                break;
            }
          }
        }
      } catch (err) {
        console.error("연결 오류:", err);
        setErrorStatus({ code: "CONN_FAIL", message: "서버와의 연결에 실패했습니다." });
      }
    };

    startSimulation();
  }, [caseId]);

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-800 font-sans flex flex-col overflow-hidden relative">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>

      <TrialStepper currentStep={currentStep} />
      
      <header className="px-10 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl">
            <Activity className={`text-white w-6 h-6 ${!isFinished && !errorStatus ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tighter uppercase leading-none italic"></h1>
            {caseInfo && (
              <div className="flex items-center gap-3 mt-1.5">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded uppercase">{caseInfo.case_type}</span>
                <span className="text-slate-400 font-bold text-[9px] uppercase tracking-widest opacity-60">ID: {caseId}</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-[10px] font-black text-blue-600 bg-white px-4 py-2 rounded-xl shadow-md tracking-widest uppercase">
          {currentEvent.replace('_', ' ')}
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto px-10 py-6 space-y-10 custom-scrollbar z-10">
        <AnimatePresence>
          {logs.length === 0 && !errorStatus && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
              <Loader2 className="w-10 h-10 animate-spin text-slate-900" />
              <p className="text-[10px] font-black tracking-[0.4em] uppercase italic">시뮬레이션 시작 중</p>
            </motion.div>
          )}

          {logs.map((log, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className={`flex ${log.type === 'verdict' || log.type === 'decision' ? 'justify-center' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-10 rounded-[3rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border-none ${
                log.type === 'verdict' ? 'bg-slate-900 text-white ring-[15px] ring-blue-500/5' : 
                log.type === 'decision' ? 'bg-blue-50 text-blue-800 ring-4 ring-blue-100' :
                'bg-white text-slate-800'
              }`}>
                <div className="flex justify-between items-center mb-6">
                  <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${log.type === 'verdict' ? 'text-blue-400' : 'text-blue-600'}`}>
                    {log.type === 'verdict' ? "최종 판결" : log.type === 'decision' ? "판사 개입" : log.speaker}
                  </span>
                  {log.round && <span className="text-[9px] font-black text-slate-300 uppercase">ROUND {log.round}</span>}
                </div>
                
                {(log.decision || log.value) && (
                  <div className="mb-6 flex gap-3">
                    <span className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-xl">{log.decision}</span>
                    <span className="px-4 py-1.5 bg-slate-800 text-blue-300 text-[10px] font-black rounded-xl">{log.value}</span>
                  </div>
                )}

                <p className="text-[17px] leading-[1.8] font-bold whitespace-pre-wrap tracking-tight">
                  {log.msg}
                  {log.isStreaming && <span className="inline-block w-2 h-5 ml-2 bg-blue-600 animate-bounce align-middle" />}
                </p>

                {log.rationale && (
                  <div className={`mt-6 p-6 rounded-2xl text-sm ${log.type === 'verdict' ? 'bg-white/5 text-slate-400' : 'bg-white/50 text-blue-900/60'}`}>
                    <span className="block text-[10px] font-black uppercase mb-2 opacity-50">판단 근거</span>
                    {log.rationale}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {errorStatus && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex justify-center p-10">
              <div className="bg-red-50 p-10 rounded-[3rem] text-center max-w-md shadow-xl">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-red-900 font-black uppercase text-xl mb-2">프로세스 오류</h3>
                <p className="text-red-600/70 text-sm font-bold mb-6 italic">[{errorStatus.code}] {errorStatus.message}</p>
                <button onClick={() => window.location.reload()} className="bg-red-500 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 mx-auto">
                  <RefreshCcw size={16}/> 재시도 하기
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="p-10 bg-white/80 backdrop-blur-md z-10 shadow-[0_-20px_40px_rgba(0,0,0,0.02)]">
        <div className="max-w-4xl mx-auto flex justify-center items-center">
          {isFinished ? (
            <motion.button initial={{ y: 20 }} animate={{ y: 0 }} onClick={() => router.push(`/simulation/dashboard/${caseId}`)} className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.3em] shadow-2xl">
              결과 리포트 확인하기 <ArrowRight className="inline ml-2" />
            </motion.button>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">데이터 실시간 수신 중</span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
