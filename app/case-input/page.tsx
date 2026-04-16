"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, Upload, Gavel, Loader2, CheckCircle2, 
  AlertTriangle, X, CheckCircle, ChevronDown, MessageSquare, Edit3, RefreshCw 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../../src/lib/api-client";

// --- 1. 사건 유형 상세 설정 ---
const typeDetails = {
  criminal: { 
    name: "형사 사건", 
    description: "폭행, 절도, 사기 등 범죄 피해를 입어 처벌을 원하는 경우",
    color: "border-red-500 bg-red-50/50", 
    textColor: "text-red-700" 
  },
  civil: { 
    name: "민사 사건", 
    description: "돈, 계약, 재산 등 개인 간의 분쟁 해결이 필요한 경우",
    color: "border-emerald-500 bg-emerald-50/50", 
    textColor: "text-emerald-700" 
  },
};

// --- 2. 사건 최종 확인 및 AI 추가 질문 모달 ---
interface CaseConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinalSubmit: (answers: string, finalType: string, finalDesc: string) => void;
  onReAnalyze: (newDesc: string) => void;
  isReAnalyzing: boolean;
  
  initialDescription: string;
  mlPredictedType: string;
  isSubmitting: boolean;
  dynamicQuestions: string[];
}

function CaseConfirmModal({
  isOpen, onClose, onFinalSubmit, onReAnalyze, isReAnalyzing, 
  initialDescription, mlPredictedType, isSubmitting, dynamicQuestions = []
}: CaseConfirmModalProps) {
  const [finalCaseType, setFinalCaseType] = useState<"criminal" | "civil">(mlPredictedType as "criminal" | "civil");
  const [editedDescription, setEditedDescription] = useState(initialDescription);
  const [isEditing, setIsEditing] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);

  // 부모의 데이터가 업데이트되면 모달 상태 동기화
  useEffect(() => {
    if (isOpen) {
      setFinalCaseType((mlPredictedType as "criminal" | "civil") || "criminal");
      setEditedDescription(initialDescription);
      const qCount = (dynamicQuestions || []).length;
      setAnswers(new Array(qCount).fill(""));
      setIsEditing(false);
    }
  }, [isOpen, mlPredictedType, initialDescription, dynamicQuestions]);

  const currentTypeInfo = typeDetails[finalCaseType] || typeDetails.criminal;
  
  // 원본과 수정본이 다른지 체크하여 재분석 버튼 노출 여부 결정
  const isModified = editedDescription !== initialDescription;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 backdrop-blur-sm font-sans">
          <style jsx>{`
            .custom-vertical-scrollbar::-webkit-scrollbar { width: 10px; }
            .custom-vertical-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
            .custom-vertical-scrollbar::-webkit-scrollbar-thumb { background: #111; border-radius: 10px; border: 2px solid #f1f1f1; }
          `}</style>

          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
            {/* 헤더 */}
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-100"><Gavel className="w-6 h-6 text-white" /></div>
                <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase">AI 분석 결과 검토</h2>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-900"><X /></button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto custom-vertical-scrollbar relative">
              {/* 로딩 오버레이 (재분석 중일 때만 표시) */}
              {isReAnalyzing && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-2xl">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                  <p className="font-black text-blue-800 tracking-widest text-sm uppercase">수정된 내용으로 재분석 중...</p>
                </div>
              )}

              {/* 사건 유형 선택 UI */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-black text-gray-700 px-1 uppercase tracking-widest">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> 사건 유형 선택
                </label>
                <div className="relative">
                  <select 
                    value={finalCaseType} 
                    onChange={(e) => setFinalCaseType(e.target.value as "criminal" | "civil")}
                    className={`w-full appearance-none p-5 border-2 rounded-2xl font-black text-lg outline-none transition-all cursor-pointer ${currentTypeInfo.color} ${currentTypeInfo.textColor}`}
                  >
                    <option value="criminal">📄 {typeDetails.criminal.name}</option>
                    <option value="civil">📄 {typeDetails.civil.name}</option>
                  </select>
                  <ChevronDown className={`absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 ${currentTypeInfo.textColor} pointer-events-none`} />
                </div>
                {/* 동적 설명 박스 */}
                <div className={`p-4 border-2 rounded-xl text-sm font-bold transition-all ${currentTypeInfo.color} ${currentTypeInfo.textColor} shadow-sm`}>
                  {currentTypeInfo.description}
                </div>
              </div>

              {/* 사건 경위 수정 및 재분석 알림 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <label className="text-sm font-black text-gray-800 tracking-widest flex items-center gap-2 uppercase"><FileText className="w-4 h-4 text-blue-500" /> 상세 경위 검토</label>
                  <button onClick={() => setIsEditing(!isEditing)} className={`text-xs font-black px-4 py-1.5 rounded-xl border-2 transition-all ${isEditing ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-gray-100 text-gray-800 border-gray-200"}`}>
                    <Edit3 className="w-3.5 h-3.5" /> {isEditing ? "완료" : "편집"}
                  </button>
                </div>
                
                {isEditing ? (
                  <textarea value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} className="w-full border-2 border-blue-400 rounded-[2rem] p-6 h-40 outline-none bg-white font-bold text-gray-800 leading-relaxed resize-none custom-vertical-scrollbar focus:ring-4 focus:ring-blue-50" placeholder="수정할 내용을 입력하세요" />
                ) : (
                  <div className="w-full border-2 border-gray-100 rounded-[2rem] p-7 h-40 overflow-y-auto bg-gray-50/50 shadow-inner custom-vertical-scrollbar text-sm font-bold text-gray-700 whitespace-pre-wrap">{editedDescription}</div>
                )}

                {/* 내용이 수정되었을 때 나타나는 재분석 제안 배너 */}
                <AnimatePresence>
                  {isModified && !isEditing && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl flex items-center justify-between shadow-sm">
                      <span className="text-[12px] font-black text-blue-800 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-blue-600" /> 내용이 수정되었습니다.
                      </span>
                      <button 
                        onClick={() => onReAnalyze(editedDescription)}
                        className="px-4 py-2 bg-blue-600 text-white text-[11px] uppercase tracking-widest font-black rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition-transform"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> AI 재분석
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* AI 추가 질문 */}
              {dynamicQuestions?.length > 0 && (
                <div className="space-y-6 pt-4 border-t border-gray-50">
                  <h3 className="flex items-center gap-2 text-sm font-black text-gray-800 uppercase tracking-widest font-sans"><MessageSquare className="w-4 h-4 text-blue-500" /> AI 보충 질문</h3>
                  {dynamicQuestions.map((q, i) => (
                    <div key={i} className="space-y-2">
                      <label className="text-[12px] font-bold text-gray-500 px-1 italic">Q{i+1}. {q}</label>
                      <input 
                        type="text" 
                        value={answers[i] || ""} 
                        onChange={(e) => { const newAns = [...answers]; newAns[i] = e.target.value; setAnswers(newAns); }}
                        className="w-full p-4 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-400 bg-gray-50/50 font-bold text-sm" 
                        placeholder="상세한 답변을 입력해주세요"
                        disabled={isSubmitting}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-8 bg-gray-50/50 flex gap-4 border-t border-gray-100 shrink-0">
              <button onClick={onClose} className="flex-1 py-5 rounded-2xl font-black text-gray-400 hover:bg-gray-100 uppercase text-xs tracking-widest transition-colors">취소</button>
              <button 
                onClick={() => onFinalSubmit(answers.join(" | "), finalCaseType, editedDescription)} 
                disabled={isSubmitting || isReAnalyzing || (dynamicQuestions?.length > 0 && answers.some(a => !a.trim()))}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black shadow-xl flex justify-center items-center gap-3 transition-all active:scale-[0.98] disabled:bg-blue-300"
              >
                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                <span className="uppercase tracking-widest text-xs font-black">시뮬레이션 시작</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- 3. 메인 페이지 컴포넌트 ---
export default function CaseInputPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReAnalyzing, setIsReAnalyzing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [caseId, setCaseId] = useState("");
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [mlPredictedType, setMlPredictedType] = useState<"criminal" | "civil">("criminal");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.replace("/login");
  }, [router]);

  // 공통 분석 로직 (최초 분석 & 재분석)
  const processAnalysis = async (descToAnalyze: string) => {
    try {
      const isCivilHint = ["계약", "금전", "빌려준", "부동산", "손해배상"].some(k => descToAnalyze.includes(k));
      setMlPredictedType(isCivilHint ? "civil" : "criminal");

      const response = await apiClient.post("/api/cases/input", {
        case_description: descToAnalyze
      });

      const { case_id, questions } = response.data;

      if (case_id) {
        setCaseId(case_id);
        setAiQuestions(questions || []);

        if (!questions || questions.length === 0) {
          router.push(`/simulation/${case_id}`);
        } else {
          setIsModalOpen(true);
        }
      }
    } catch (error: any) {
      alert("데이터 분석 요청 중 오류가 발생했습니다.");
    }
  };

  // 1단계: 초기 데이터 분석
  const handleInitialProcess = async () => {
    if (!title || description.trim().length < 20) {
      alert("제목과 사건 내용(최소 20자 이상)을 정확히 입력해주세요.");
      return;
    }
    setIsSubmitting(true);
    await processAnalysis(description);
    setIsSubmitting(false);
  };

  // 1.5단계: 모달 내에서 경위 수정 후 재분석 요청
  const handleReAnalyze = async (newDescription: string) => {
    setIsReAnalyzing(true);
    await processAnalysis(newDescription);
    setDescription(newDescription); // 재분석 완료 시 부모 상태(원본)도 업데이트
    setIsReAnalyzing(false);
  };

  // 2단계: 최종 데이터 전송 (시뮬레이션 돌입)
  const handleFinalSubmit = async (answers: string, type: string, finalDesc: string) => {
    setIsSubmitting(true);
    try {
      await apiClient.post("/api/cases/input_plus", {
        case_id: caseId,
        case_description: finalDesc,
        additional_info: answers,
        case_type: type === 'criminal' ? '형사' : '민사'
      });
      router.push(`/simulation/${caseId}`);
    } catch (error) {
      alert("최종 분석 데이터 전송에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 animate-in fade-in duration-500 pb-20 font-sans">
      <header className="flex flex-col items-start gap-2 text-blue-600 font-bold">
        <div className="flex items-center gap-2"><Gavel className="w-6 h-6" /><span className="uppercase tracking-tight">AI 재판 시뮬레이터</span></div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tighter">사건 분석 입력</h1>
      </header>

      <section className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl">
        <div className="space-y-3">
          <label className="text-sm font-black text-gray-700 uppercase tracking-widest px-1 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /> 사건 제목</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border-2 border-gray-50 rounded-2xl p-4 font-bold outline-none focus:border-blue-500 bg-gray-50/50" placeholder="제목을 입력하세요" />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-black text-gray-700 uppercase tracking-widest px-1 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" /> 상세 경위</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border-2 border-gray-50 rounded-2xl p-6 h-64 font-bold outline-none focus:border-blue-500 bg-gray-50/50 resize-none overflow-y-auto custom-vertical-scrollbar" placeholder="상세 내용을 입력하세요 (20자 이상)" />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-black text-gray-700 uppercase tracking-widest px-1 flex items-center gap-2"><Upload className="w-4 h-4 text-blue-500" /> 증거 업로드</label>
          <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-[2rem] p-10 text-center cursor-pointer transition-all ${file ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50/50'}`}>
            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && setFile(e.target.files[0])} className="hidden" />
            <p className="text-gray-500 font-bold text-sm">{file ? file.name : "클릭하여 파일 업로드"}</p>
          </div>
        </div>

        <button onClick={handleInitialProcess} disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[1.5rem] font-black shadow-xl flex justify-center items-center gap-3 transition-all active:scale-[0.98] disabled:bg-blue-300">
          {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          데이터 분석 시작
        </button>
      </section>

      <CaseConfirmModal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        onFinalSubmit={handleFinalSubmit} isSubmitting={isSubmitting}
        onReAnalyze={handleReAnalyze} isReAnalyzing={isReAnalyzing}
        initialDescription={description} mlPredictedType={mlPredictedType}
        dynamicQuestions={aiQuestions}
      />
    </div>
  );
}