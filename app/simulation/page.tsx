"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// --- 내부 컴포넌트: 타이핑 효과 텍스트 ---
function TypewriterText({ text, onComplete }: { text: string; onComplete: () => void }) {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    let index = 0;
    let timeoutId: NodeJS.Timeout;

    // 초기화
    setDisplayedText("");

    const type = () => {
      if (index < text.length) {
        // 이전 글자들에 현재 인덱스의 글자를 하나씩 더함
        setDisplayedText(text.slice(0, index + 1));
        index++;
        // 다음 글자를 위한 타이머 설정
        timeoutId = setTimeout(type, 30); // 타이핑 속도 50ms
      } else {
        // 모든 글자가 타이핑되면 완료 콜백 호출
        setTimeout(onComplete, 800); // 문장 끝난 후 여운을 위해 0.8초 대기
      }
    };

    // 타이핑 시작
    type();

    // 컴포넌트가 사라지거나 text가 바뀔 때 타이머 청소
    return () => clearTimeout(timeoutId);
  }, [text]); // text가 바뀔 때마다 새로 시작

  return <span>{displayedText}</span>;
}

// --- 내부 컴포넌트: 재판 단계 시각화 스테퍼 (동일) ---
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
          <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-100 -z-0">
            <div 
              className="h-full bg-blue-600 transition-all duration-1000 ease-out"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>
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
  const [logIndex, setLogIndex] = useState(0); // 현재 출력 중인 로그 인덱스
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // 시뮬레이션 데이터
  const logs = [
    { id: "LOG_01", agent: "JUDGE", msg: "지금부터 사건번호 2026-고합123 재판 시뮬레이션을 시작합니다.", step: 0 },
    { id: "LOG_02", agent: "PROSECUTOR", msg: "피고인은 제출된 증거 사진에 대해 고의적인 파손이 아니라고 주장하나, 물리적 충격의 흔적이 명백합니다.", step: 1 },
    { id: "LOG_03", agent: "DEFENDER", msg: "반론하겠습니다. 해당 증거물은 사건 전부터 결함이 있었음을 입증하는 서비스 센터 기록을 제출했습니다.", step: 2 },
    { id: "LOG_04", agent: "JUDGE", msg: "양측의 변론과 제출된 자료를 모두 검토했습니다. 최종 판결을 위해 데이터를 연산합니다.", step: 3 },
  ];

  // 타이핑이 끝날 때마다 다음 로그로 넘어가는 함수
  const handleTypeComplete = () => {
    if (logIndex < logs.length - 1) {
      setLogIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  // 새로운 로그가 추가될 때마다 해당 단계(Step) 업데이트 및 스크롤 하단 이동
  useEffect(() => {
    const currentLog = logs[logIndex];
    if (currentLog) {
      setCurrentStep(currentLog.step);
      setVisibleLogs((prev) => {
        if (prev.find(l => l.id === currentLog.id)) return prev;
        return [...prev, currentLog];
      });
    }
  }, [logIndex]);

  // 자동 스크롤 하단 이동
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleLogs]);

  // 종료 시 이동
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
      <TrialStepper currentStep={currentStep} />

      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5 scroll-smooth">
        {visibleLogs.map((log, index) => (
          <div 
            key={log.id} 
            className={`flex ${log.agent === 'JUDGE' ? 'justify-center' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm border ${
              log.agent === 'JUDGE' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-800 border-gray-100'
            }`}>
              <div className={`text-[10px] font-black uppercase mb-1 tracking-wider ${
                log.agent === 'JUDGE' ? 'text-blue-300' : 'text-blue-600'
              }`}>
                {log.agent === 'JUDGE' ? '⚖️ Presiding Judge' : log.agent === 'PROSECUTOR' ? '⚖️ Prosecutor' : '⚖️ Defense Attorney'}
              </div>
              <p className="text-[13px] leading-relaxed font-medium">
                {/* ⭐️ 마지막 로그(현재 타이핑 중인 로그)에만 타이핑 효과 적용 */}
                {index === visibleLogs.length - 1 && !isFinished ? (
                  <TypewriterText text={log.msg} onComplete={handleTypeComplete} />
                ) : (
                  log.msg
                )}
              </p>
            </div>
          </div>
        ))}
        <div className="h-10"></div>
      </main>

      <footer className="p-5 bg-white border-t border-gray-100">
        <div className="flex items-center justify-center">
          {!isFinished ? (
            <div className="flex items-center space-x-3">
              <span className="text-[11px] font-bold text-blue-600 animate-pulse">
                AI 에이전트가 변론을 구성 중입니다...
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[12px] font-black text-blue-700">판결 분석 완료</span>
              <span className="text-[10px] text-gray-400 mt-1">대시보드로 이동합니다</span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}