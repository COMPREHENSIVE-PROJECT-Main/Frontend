"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// --- 내부 컴포넌트: 재판 단계 시각화 스테퍼 ---
function TrialStepper({ currentStep }: { currentStep: number }) {
  const steps = [
    { title: "사건 기소", icon: "📄" },
    { title: "증거 조사", icon: "🔍" },
    { title: "최종 변론", icon: "🗣️" },
    { title: "판결 선고", icon: "⚖️" },
  ];

  return (
    <div className="w-full py-4 bg-white border-b shadow-sm sticky top-0 z-20">
      <div className="max-w-md mx-auto px-6">
        <div className="relative flex justify-between">
          {/* 단계 연결 선 */}
          <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-100 -z-0">
            <div 
              className="h-full bg-blue-600 transition-all duration-1000 ease-out"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>

          {/* 단계별 노드 */}
          {steps.map((step, index) => {
            const isActive = index <= currentStep;
            const isCurrent = index === currentStep;
            return (
              <div key={index} className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isCurrent ? "bg-blue-600 text-white ring-4 ring-blue-100 scale-110" :
                  isActive ? "bg-blue-500 text-white" : "bg-white border-2 border-gray-200 text-gray-400"
                }`}>
                  <span className="text-sm">{isActive ? step.icon : index + 1}</span>
                </div>
                <span className={`mt-2 text-[10px] font-bold ${isActive ? "text-blue-700" : "text-gray-400"}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- 메인 시뮬레이션 페이지 ---
export default function SimulationPage() {
  const router = useRouter();
  const [isFinished, setIsFinished] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [visibleLogs, setVisibleLogs] = useState<any[]>([]);
  const hasStarted = useRef(false); // [FE_SIM.FR-01] 중복 실행 방지 플래그

  // 시뮬레이션용 시나리오 데이터
  const logs = [
    { id: "LOG_01", agent: "JUDGE", msg: "지금부터 사건번호 2026-고합123 재판 시뮬레이션을 시작합니다.", delay: 1000 },
    { id: "LOG_02", agent: "PROSECUTOR", msg: "피고인은 제출된 증거 사진에 대해 고의적인 파손이 아니라고 주장하나, 물리적 충격의 흔적이 명백합니다.", delay: 3500 },
    { id: "LOG_03", agent: "DEFENDER", msg: "반론하겠습니다. 해당 증거물은 사건 전부터 결함이 있었음을 입증하는 서비스 센터 기록을 제출했습니다.", delay: 6000 },
    { id: "LOG_04", agent: "JUDGE", msg: "양측의 변론과 제출된 자료를 모두 검토했습니다. 최종 판결을 위해 데이터를 연산합니다.", delay: 8500 },
  ];

  useEffect(() => {
    // Strict Mode 대응: 한 번만 실행되도록 제어
    if (hasStarted.current) return;
    hasStarted.current = true;

    logs.forEach((log, index) => {
      setTimeout(() => {
        setVisibleLogs((prev) => {
          // 중복 키 에러 방지: 이미 존재하는 ID면 추가 안 함
          if (prev.find((item) => item.id === log.id)) return prev;
          return [...prev, log];
        });

        // 로그 발생에 맞춰 상단 단계 업데이트
        if (index === 1) setCurrentStep(1);
        if (index === 2) setCurrentStep(2);
        
        if (index === logs.length - 1) {
          setCurrentStep(3); // 판결 선고 단계로 진입
          setIsFinished(true);
        }
      }, log.delay);
    });
  }, []);

  // 공방 종료 시 자동 이동 로직
  useEffect(() => {
    if (isFinished) {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isFinished, router]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 1. 상단 단계 시각화 */}
      <TrialStepper currentStep={currentStep} />

      {/* 2. 실시간 공방 피드 (중앙) */}
      <main className="flex-1 overflow-y-auto p-4 space-y-5">
        {visibleLogs.map((log, index) => (
          <div 
            key={`${log.id}-${index}`} // 고유 키 확보
            className={`flex ${log.agent === 'JUDGE' ? 'justify-center' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm border transition-all duration-500 animate-in fade-in slide-in-from-bottom-2 ${
              log.agent === 'JUDGE' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-800 border-gray-100'
            }`}>
              <div className={`text-[10px] font-black uppercase mb-1 tracking-wider ${
                log.agent === 'JUDGE' ? 'text-blue-300' : 'text-blue-600'
              }`}>
                {log.agent === 'JUDGE' ? '⚖️ Presiding Judge' : log.agent === 'PROSECUTOR' ? '⚖️ Prosecutor' : '⚖️ Defense Attorney'}
              </div>
              <p className="text-[13px] leading-relaxed font-medium">
                {log.msg}
              </p>
            </div>
          </div>
        ))}
        {/* 하단 여백용 */}
        <div className="h-10"></div>
      </main>

      {/* 3. 하단 상태바 */}
      <footer className="p-5 bg-white border-t border-gray-100">
        <div className="flex items-center justify-center">
          {!isFinished ? (
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.5s]"></div>
              </div>
              <span className="text-[11px] font-bold text-gray-400 tracking-tighter">AI 에이전트 간의 실시간 변론을 생성 중입니다</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[12px] font-black text-blue-700 animate-pulse">판결 분석 시스템 가동 중...</span>
              <span className="text-[10px] text-gray-400 mt-1 font-medium">잠시 후 대시보드로 이동합니다</span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}