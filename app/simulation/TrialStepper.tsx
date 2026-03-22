// app/simulation/components/TrialStepper.tsx
"use client";

interface TrialStepperProps {
  currentStep: number; // 0: 기소, 1: 증거조사, 2: 최종변론, 3: 판결
}

const steps = [
  { title: "사건 기소", icon: "📄" },
  { title: "증거 조사", icon: "🔍" },
  { title: "최종 변론", icon: "🗣️" },
  { title: "판결 선고", icon: "⚖️" },
];

export default function TrialStepper({ currentStep }: TrialStepperProps) {
  return (
    <div className="w-full py-6 bg-white border-b shadow-sm overflow-hidden">
      <div className="max-w-xl mx-auto px-4">
        <div className="relative flex justify-between">
          {/* 단계 사이 연결 선 */}
          <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-100 -z-0">
            <div 
              className="h-full bg-blue-600 transition-all duration-1000 ease-out"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>

          {/* 각 단계 노드 */}
          {steps.map((step, index) => {
            const isActive = index <= currentStep;
            const isCurrent = index === currentStep;

            return (
              <div key={index} className="relative z-10 flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isCurrent 
                      ? "bg-blue-600 text-white ring-4 ring-blue-100 scale-110" 
                      : isActive 
                        ? "bg-blue-500 text-white" 
                        : "bg-white border-2 border-gray-200 text-gray-400"
                  }`}
                >
                  <span className="text-sm">{isActive ? step.icon : index + 1}</span>
                </div>
                <span 
                  className={`mt-2 text-[10px] font-bold transition-colors ${
                    isActive ? "text-blue-700" : "text-gray-400"
                  }`}
                >
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