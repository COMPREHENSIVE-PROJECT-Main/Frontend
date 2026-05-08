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
    <div className="w-full py-8 bg-white/80 backdrop-blur-md sticky top-0 z-20 shadow-sm border-none font-sans">
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
  const [currentEvent, setCurrentEvent] = useState("서버 연결 중...");
  const [isFinished, setIsFinished] = useState(false);
  const [errorStatus, setErrorStatus] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 📝 자동 스크롤 로직
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // 🔗 SSE 스트리밍 연결 및 자동 시작 로직 (422 에러 대응 버전)
  useEffect(() => {
    if (!caseId) return;

    const startSimulationStream = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // 🚀 422 에러 방지를 위한 데이터 정밀화
        const payload = { 
          case_id: String(caseId),     // 반드시 문자열
          case_type: "criminal",       // 💡 '형사' 대신 영문 'criminal'로 전송 (백엔드 스키마 호환성)
          start_from_round: 1          // 반드시 숫자(Number)
        };

        const response = await fetch("http://localhost:8080/api/simulation/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`, 
          },
          body: JSON.stringify(payload),
        });

        // 422 또는 기타 에러 발생 시 상세 로깅
        if (!response.ok) {
          const errorDetail = await response.json();
          console.error("❌ 백엔드 에러 상세:", errorDetail);
          throw new Error(errorDetail.detail?.[0]?.msg || "데이터 형식이 맞지 않습니다.");
        }

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
            try {
              const payload = JSON.parse(jsonStr);
              const { event, data } = payload;

              // 이벤트명 한글 맵핑
              const eventMap: { [key: string]: string } = {
                "simulation_start": "시뮬레이션 시작",
                "round_start": "공방 진행 중",
                "token": "데이터 수신 중",
                "round_end": "공방 대기",
                "judge_decision": "판사 판단 중",
                "final_verdict": "최종 판결 중",
                "simulation_end": "시뮬레이션 종료",
                "error": "시스템 오류"
              };

              setCurrentEvent(eventMap[event] || event);

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
                      return [...prev.slice(0, -1), { ...last, msg: last.msg + data.text }];
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
                  return;
              }
            } catch (e) {
              console.error("데이터 파싱 에러:", e);
            }
          }
        }
      } catch (err: any) {
        console.error("연결 오류:", err);
        setErrorStatus({ code: "연결 오류", message: err.message });
      }
    };

    startSimulationStream();
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
            <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">AI 실시간 법정</h2>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter">
              {isFinished ? "시뮬레이션 종료" : "실시간 법리 공방"}
            </h1>
          </div>
        </div>
        <div className="text-[10px] font-black text-blue-600 bg-white px-5 py-2.5 rounded-xl shadow-md tracking-widest uppercase border border-blue-50">
          {currentEvent}
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto px-10 py-6 space-y-10 custom-scrollbar z-10">
        <AnimatePresence>
          {logs.length === 0 && !errorStatus && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
              <Loader2 className="w-12 h-12 animate-spin text-slate-900" />
              <p className="text-[10px] font-black tracking-[0.4em] uppercase italic">AI 엔진 연결 중...</p>
            </motion.div>
          )}

          {logs.map((log, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className={`flex ${log.type === 'verdict' || log.type === 'decision' ? 'justify-center' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-10 rounded-[3.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border-none ${
                log.type === 'verdict' ? 'bg-slate-900 text-white ring-[15px] ring-blue-500/5' : 
                log.type === 'decision' ? 'bg-blue-50 text-blue-800 ring-4 ring-blue-100' :
                'bg-white text-slate-800'
              }`}>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    {log.type === 'decision' && <ShieldCheck className="w-4 h-4 text-blue-600" />}
                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${log.type === 'verdict' ? 'text-blue-400' : 'text-blue-600'}`}>
                      {log.type === 'verdict' ? "최종 판결 요지" : log.type === 'decision' ? "판사 개입 및 판단" : log.speaker}
                    </span>
                  </div>
                  {log.round && <span className="text-[9px] font-black text-slate-300 uppercase">제 {log.round}차 공방</span>}
                </div>
                
                {(log.decision || log.value) && (
                  <div className="mb-6 flex gap-3">
                    <span className={`px-4 py-1.5 text-[10px] font-black rounded-xl ${log.type === 'verdict' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 shadow-sm'}`}>{log.decision}</span>
                    <span className={`px-4 py-1.5 text-[10px] font-black rounded-xl ${log.type === 'verdict' ? 'bg-slate-800 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>{log.value}</span>
                  </div>
                )}

                <p className="text-[17px] leading-[1.9] font-bold whitespace-pre-wrap tracking-tight">
                  {log.msg}
                  {log.isStreaming && <span className="inline-block w-1.5 h-5 ml-2 bg-blue-600 animate-pulse align-middle" />}
                </p>

                {log.rationale && (
                  <div className={`mt-8 p-7 rounded-[2rem] text-sm ${log.type === 'verdict' ? 'bg-white/5 text-slate-400' : 'bg-white/50 text-blue-900/60'}`}>
                    <span className="block text-[10px] font-black uppercase mb-3 opacity-50 tracking-widest">판단 근거</span>
                    <p className="leading-relaxed">{log.rationale}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {errorStatus && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex justify-center p-10">
              <div className="bg-red-50 p-12 rounded-[3.5rem] text-center max-w-md shadow-xl border border-red-100">
                <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-5" />
                <h3 className="text-red-900 font-black uppercase text-xl mb-2">분석 시스템 오류</h3>
                <p className="text-red-600/70 text-sm font-bold mb-8 italic leading-relaxed">
                  {errorStatus.message || "알 수 없는 오류가 발생했습니다."}
                </p>
                <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 mx-auto active:scale-95">
                  <RefreshCcw size={16} /> 시뮬레이션 다시 시도
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="p-10 bg-white/80 backdrop-blur-md z-10 shadow-[0_-20px_40px_rgba(0,0,0,0.02)] border-t border-slate-50">
        <div className="max-w-4xl mx-auto flex justify-center items-center">
          {isFinished ? (
            <motion.button 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              onClick={() => router.push(`/simulation/report/${caseId}`)} 
              className="px-14 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:bg-blue-600 transition-all flex items-center gap-4 group"
            >
              종합 분석 리포트 확인 <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
            </motion.button>
          ) : (
            <div className="flex items-center gap-5">
              <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-ping" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">AI 법률 알고리즘 연산 중...</span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}