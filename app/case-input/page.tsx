"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, Upload, Loader2, CheckCircle2, 
  X, CheckCircle, Cpu, Activity, ArrowRight, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- 1. 사건 유형 설정 ---
criminal: { 
    name: "형사 사건", 
    description: "폭행, 절도, 사기 등 범죄 피해를 입어 상대방의 처벌을 원하는 경우",
    color: "bg-blue-50/50", 
    textColor: "text-blue-700",
    accent: "bg-blue-600"
  },
  civil: { 
    name: "민사 사건", 
    description: "돈, 계약, 재산권 등 개인 간의 경제적 분쟁 해결이 필요한 경우",
    color: "bg-emerald-50/50", 
    textColor: "text-emerald-700",
    accent: "bg-emerald-600"
  },
};

// --- 2. 사건 최종 확인 및 AI 추가 질문 모달 ---
function CaseConfirmModal({
  isOpen, onClose, onFinalSubmit, initialDescription, 
  mlPredictedType, dynamicQuestions, isSubmitting 
}: any) {
  const [finalCaseType, setFinalCaseType] = useState(mlPredictedType);
  const [answers, setAnswers] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFinalCaseType(mlPredictedType);
      setAnswers(new Array(dynamicQuestions.length).fill(""));
    }
  }, [isOpen, mlPredictedType, dynamicQuestions]);

  const currentTypeInfo = typeDetails[finalCaseType as keyof typeof typeDetails] || typeDetails.criminal;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 z-[999] flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            <div className="p-8 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className={`${currentTypeInfo.accent} p-3 rounded-2xl shadow-lg`}><Cpu className="w-6 h-6 text-white" /></div>
                <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">AI 정밀 분석 결과</h2>
              </div>
              <button onClick={onClose} className="text-slate-300 hover:text-slate-900"><X size={20}/></button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
              {/* 사건 유형 확정 */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">분류된 사건 유형</label>
                <div className="grid grid-cols-2 gap-4">
                  {(['criminal', 'civil'] as const).map((type) => (
                    <button key={type} onClick={() => setFinalCaseType(type)} className={`p-6 rounded-[2rem] transition-all flex flex-col items-start gap-1 relative ${finalCaseType === type ? `${typeDetails[type].color} ${typeDetails[type].textColor} ring-2 ring-blue-100` : "bg-slate-50 text-slate-400"}`}>
                      <span className="text-lg font-black">{typeDetails[type].name}</span>
                      {finalCaseType === type && <CheckCircle2 className="absolute top-6 right-6 w-5 h-5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI 추가 질문 섹션 (Server Response: questions) */}
              {dynamicQuestions.length > 0 && (
                <div className="space-y-6 pt-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">증거 보완 질문</h3>
                    <p className="text-[11px] text-blue-500 font-bold italic">* 정확한 시뮬레이션을 위해 답변이 필요합니다.</p>
                  </div>
                  {dynamicQuestions.map((q: string, i: number) => (
                    <div key={i} className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-700">Q. {q}</label>
                      <input 
                        type="text" 
                        value={answers[i] || ""} 
                        onChange={(e) => { const newAns = [...answers]; newAns[i] = e.target.value; setAnswers(newAns); }}
                        className="w-full p-5 bg-slate-50 rounded-[1.5rem] outline-none font-bold text-sm focus:ring-2 focus:ring-blue-100 shadow-inner" 
                        placeholder="내용을 입력하세요"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50/50 flex gap-4">
              <button onClick={onClose} className="flex-1 font-black text-slate-400 text-[10px] tracking-[0.2em]">취소</button>
              <button 
                onClick={() => onFinalSubmit(answers)} 
                disabled={isSubmitting}
                className={`flex-[2] ${currentTypeInfo.accent} text-white py-5 rounded-[2rem] font-black shadow-xl flex justify-center items-center gap-3 active:scale-95 transition-all`}
              >
                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <><CheckCircle size={18} /> <span className="uppercase tracking-[0.2em] text-[11px]">시뮬레이션 시작</span></>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- 3. 메인 페이지 ---
export default function CaseInputPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 서버 응답 데이터 저장
  const [serverCaseId, setServerCaseId] = useState("");
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [mlPredictedType, setMlPredictedType] = useState<"criminal" | "civil">("criminal");

  //  사건 접수 및 최초 질문 수신
  const handleInitialProcess = async () => {
    if (!title || description.length < 20) {
      alert("사건 내용을 20자 이상 상세히 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. FormData 생성 (파일 포함 시 대응)
      const formData = new FormData();
      formData.append("title", title);
      formData.append("case_description", description);
      files.forEach(f => formData.append("files", f));

      // 2. 서버 통신 (JWT 인증 포함)
      const response = await fetch("http://localhost:8080/api/simulation/case-submit", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`, // JWT 유저 확인
        },
        body: formData
      });

      const result = await response.json();
      // 응답 구조: { case_id, user_id, questions, message }
      
      if (response.ok) {
        setServerCaseId(result.case_id);
        setAiQuestions(result.questions || []);
        // 간단한 텍스트 분석으로 타입 예측 (서버에서 줄 수도 있음)
        setMlPredictedType(description.includes("돈") || description.includes("계약") ? "civil" : "criminal");
        setIsModalOpen(true);
      } else {
        alert(result.message || "오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("제출 실패:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  //  최종 답변 제출 및 시뮬레이션 이동
  const handleFinalSubmit = async (answers: string[]) => {
    setIsSubmitting(true);
    try {
      // 추가 답변(answers)을 서버에 업데이트하거나 바로 시뮬레이션 시작 요청
      // 여기서는 시뮬레이션 페이지로 이동하는 시나리오
      router.push(`/simulation/${serverCaseId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-800 pb-20 relative overflow-hidden">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>

      <div className="max-w-2xl mx-auto p-6 lg:p-12 min-h-screen flex flex-col justify-center gap-10 relative z-10">
        <header className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl">
            <Activity className="text-white w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">사건 접수</h1>
            <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-widest opacity-60">JWT Verified | AI Legal Simulation</p>
          </div>
        </header>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] space-y-10 border-none">
          {/* 사건 제목 */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">01 / 사건 제목</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl p-6 text-lg font-black outline-none focus:ring-2 focus:ring-slate-100 transition-all shadow-inner" placeholder="사건의 핵심 제목을 입력하세요" />
          </div>

          {/* 사건 경위 */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">02 / 사건 경위 (최소 20자)</label>
            <div className="relative">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-50 border-none rounded-[2rem] p-8 h-60 text-base font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-100 transition-all resize-none shadow-inner" placeholder="누가, 언제, 어디서, 어떻게 사건이 발생했나요?" />
              <div className={`absolute bottom-6 right-8 text-[9px] font-black uppercase ${description.length < 20 ? 'text-red-400' : 'text-slate-300'}`}>
                {description.length} / 20 characters min
              </div>
            </div>
          </div>

          {/* 증거 자료 업로드 */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">03 / 증거 자료 (선택)</label>
            <div onClick={() => fileInputRef.current?.click()} className={`group bg-slate-50 rounded-[2rem] p-10 text-center cursor-pointer transition-all ${files.length > 0 ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-slate-100 shadow-inner'}`}>
              <input type="file" multiple ref={fileInputRef} onChange={(e) => setFiles(Array.from(e.target.files || []))} className="hidden" />
              <div className="flex flex-col items-center gap-2">
                <Upload className={`w-6 h-6 ${files.length > 0 ? 'text-blue-600' : 'text-slate-300'}`} />
                <p className={`text-[11px] font-black uppercase tracking-widest ${files.length > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                  {files.length > 0 ? `${files.length}개의 파일 선택됨` : "PDF, 문서, 이미지, 동영상 업로드"}
                </p>
                <p className="text-[9px] text-slate-400 font-bold italic opacity-60">* 동영상 업로드 시 AI가 추가 질문을 생성합니다.</p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleInitialProcess} 
            disabled={isSubmitting || description.length < 20} 
            className="w-full bg-slate-900 hover:bg-blue-600 text-white py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl transition-all disabled:bg-slate-100 disabled:text-slate-300 flex justify-center items-center gap-3 active:scale-95"
          >
            {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <ArrowRight size={18} />}
            정밀 분석 및 시뮬레이션 준비
          </button>
        </motion.section>
      </div>

      <CaseConfirmModal
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onFinalSubmit={handleFinalSubmit} 
        initialDescription={description} 
        mlPredictedType={mlPredictedType}
        dynamicQuestions={aiQuestions} 
        isSubmitting={isSubmitting}
      />
    </div>
  );
}