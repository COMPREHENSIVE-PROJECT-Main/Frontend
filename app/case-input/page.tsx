"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, Upload, Loader2, CheckCircle2, 
  X, CheckCircle, MessageSquare, Edit3, 
  Cpu, Activity, ScanSearch, ArrowRight, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../../src/lib/api-client";

// --- 1. 사건 유형 상세 설정 ---
const typeDetails = {
  criminal: { name: "형사 사건", color: "border-blue-100 bg-blue-50/30", textColor: "text-blue-700", accent: "bg-blue-600" },
  civil: { name: "민사 사건", color: "border-emerald-100 bg-emerald-50/30", textColor: "text-emerald-700", accent: "bg-emerald-600" },
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
  const [finalCaseType, setFinalCaseType] = useState<"criminal" | "civil">("criminal");
  const [editableDescription, setEditableDescription] = useState(initialDescription);
  const [isEditing, setIsEditing] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFinalCaseType((mlPredictedType as "criminal" | "civil") || "criminal");
      setEditableDescription(initialDescription);
      setAnswers(new Array(dynamicQuestions.length).fill(""));
    }
  }, [isOpen, mlPredictedType, initialDescription, dynamicQuestions]);

  const currentTypeInfo = typeDetails[finalCaseType] || typeDetails.criminal;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 z-[999] flex items-center justify-center p-4 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-8 border-b flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className={`${currentTypeInfo.accent} p-3 rounded-2xl`}><Cpu className="w-6 h-6 text-white" /></div>
                <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">AI 분석 결과 검토</h2>
              </div>
              <button onClick={onClose} className="text-slate-300 hover:text-slate-900 p-2"><X /></button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar relative">
              {isReAnalyzing && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                  <p className="font-black text-blue-800 text-[10px] tracking-[0.3em] uppercase">수정된 내용으로 질문 갱신 중...</p>
                </div>
              )}

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">01 / 사건 유형 확정</label>
                <div className="grid grid-cols-2 gap-4">
                  {(['criminal', 'civil'] as const).map((type) => (
                    <button key={type} onClick={() => setFinalCaseType(type)} className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-start gap-1 relative ${finalCaseType === type ? `${typeDetails[type].color} ${typeDetails[type].textColor} border-current shadow-lg` : "border-slate-100 bg-slate-50/50 text-slate-400"}`}>
                      <span className="text-xl font-black">{typeDetails[type].name}</span>
                      {finalCaseType === type && <CheckCircle2 className="absolute top-6 right-6 w-5 h-5" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">02 / 사건 경위 보완 및 편집</label>
                  <button onClick={() => {
                    if (isEditing && editableDescription !== initialDescription) onReAnalyze(editableDescription);
                    setIsEditing(!isEditing);
                  }} className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-xl transition-all ${isEditing ? "bg-blue-600 text-white" : "bg-slate-100"}`}>
                    {isEditing ? <><RefreshCw size={12} /> 저장 및 갱신</> : <><Edit3 size={12} /> 편집하기</>}
                  </button>
                </div>
                {isEditing ? (
                  <textarea value={editableDescription} onChange={(e) => setEditableDescription(e.target.value)} className="w-full p-6 bg-slate-50 border-2 border-blue-400 rounded-[2rem] text-sm font-bold text-slate-700 outline-none h-40 focus:bg-white" />
                ) : (
                  <div className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold text-slate-600 leading-relaxed italic line-clamp-6 italic">"{editableDescription}"</div>
                )}
              </div>

              {dynamicQuestions.length > 0 && (
                <div className="space-y-6 pt-6 border-t">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MessageSquare className="w-4 h-4 text-blue-500" /> 03 / AI 보충 질문</h3>
                  {dynamicQuestions.map((q, i) => (
                    <div key={i} className="space-y-3 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <label className="text-[12px] font-bold text-slate-500 block leading-snug">Q{i+1}. {q}</label>
                      <input type="text" value={answers[i] || ""} onChange={(e) => { const newAns = [...answers]; newAns[i] = e.target.value; setAnswers(newAns); }} className="w-full p-4 border rounded-xl outline-none focus:border-blue-400 font-bold text-sm bg-white" placeholder="상세 답변 입력" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50/50 flex gap-4 border-t shrink-0">
              <button onClick={onClose} className="flex-1 font-black text-slate-400 uppercase text-[11px] tracking-[0.3em]">취소</button>
              <button onClick={() => onFinalSubmit(answers.join(" | "), finalCaseType, editableDescription)} disabled={isSubmitting || isReAnalyzing || (dynamicQuestions.length > 0 && answers.some(a => !a.trim())) || isEditing} className="flex-[2] bg-blue-600 text-white py-6 rounded-2xl font-black shadow-lg flex justify-center items-center gap-3 disabled:bg-slate-200">
                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                <span className="uppercase tracking-[0.4em] text-[11px]">시뮬레이션 시작</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

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
    const token = localStorage.getItem("accessToken");
    if (!token) router.replace("/login");
  }, [router]);

  // 1단계 분석 및 질문 생성 요청
  const handleInitialProcess = async () => {
    if (!title || description.trim().length < 20) {
      alert("제목과 최소 20자 이상의 사건 설명을 입력해 주세요.");
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("case_description", description);
      if (file) formData.append("files", file);

      const response = await apiClient.post("/api/cases/input", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const { case_id, questions, predicted_type } = response.data;
      setCaseId(case_id);
      setAiQuestions(questions || []);
      setMlPredictedType(predicted_type || (description.includes("계약") ? "civil" : "criminal"));
      setIsModalOpen(true);
    } catch (error: any) {
      alert(error.response?.data?.detail || "분석 서버 연결에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReAnalyze = async (newDesc: string) => {
    setIsReAnalyzing(true);
    setDescription(newDesc);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("case_description", newDesc);
      const response = await apiClient.post("/api/cases/input", formData);
      setAiQuestions(response.data.questions || []);
    } catch (error) {
      alert("내용 수정 중 분석 오류가 발생했습니다.");
    } finally {
      setIsReAnalyzing(false);
    }
  };

  // 🚀 최종 제출 및 시뮬레이션 시작 연동 로직
  const handleFinalSubmit = async (answers: string, type: string, finalDesc: string) => {
    setIsSubmitting(true);
    try {
      // [1] input_plus 데이터 저장
      const plusPayload = {
        case_id: String(caseId),
        description: finalDesc,
        created_at: new Date().toISOString().split('T')[0],
        additional_info: answers,
        analysis: {
          case_type: type === 'criminal' ? '형사' : '민사',
          main_action: title,
          victim_exist: true,
          injury_level: "분석 중",
          evidence: [
            { type: "입력 진술", description: "사용자 작성 사건 경위" },
            { type: "첨부 자료", description: file ? file.name : "없음" }
          ]
        }
      };
      await apiClient.post("/api/cases/input_plus", plusPayload);

      // [2] 시뮬레이션 페이지로 이동 (case_type을 URL 파라미터와 sessionStorage 모두 전달)
      const caseType = type === 'criminal' ? '형사' : '민사';
      sessionStorage.setItem('caseType', caseType);
      router.push(`/simulation/${caseId}?case_type=${encodeURIComponent(caseType)}`);

    } catch (error: any) {
      if (error.response?.status === 422) {
        console.error("❌ 422 상세 원인:", error.response.data.detail);
        alert("서버 데이터 형식이 맞지 않습니다.");
      } else {
        alert("데이터 저장 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-20 relative overflow-hidden">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>

      <div className="relative z-10 max-w-2xl mx-auto p-6 lg:p-12 min-h-screen flex flex-col justify-center gap-12">
        <header className="flex flex-col items-start gap-4">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl animate-pulse"><Activity className="text-white w-9 h-9" /></div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">AI 재판 시뮬레이션</h1>
              <p className="text-slate-500 font-bold text-sm italic">사건을 입력하면 ai가 자동으로 분석하여 시뮬레이션을 제공합니다.</p>
            </div>
          </div>
        </header>

        <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 border border-white rounded-[3.5rem] p-10 lg:p-14 backdrop-blur-xl shadow-2xl space-y-12">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2"><ScanSearch className="w-4 h-4 text-blue-600" /> 01 / 사건 제목</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl p-6 text-xl font-black outline-none focus:border-blue-500 transition-all shadow-inner" placeholder="제목을 입력하세요" />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" /> 02 / 상세 경위 (최소 20자)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-[2.5rem] p-8 h-64 text-base font-bold text-slate-700 outline-none focus:border-blue-500 transition-all resize-none shadow-inner" placeholder="내용을 상세히 입력하세요." />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2"><Upload className="w-4 h-4 text-blue-600" /> 03 / 증거 자료 (선택)</label>
            <div onClick={() => fileInputRef.current?.click()} className={`group border-2 border-dashed rounded-[2.5rem] p-10 text-center cursor-pointer transition-all ${file ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:bg-slate-50'}`}>
              <input type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{file ? file.name : "파일 업로드"}</p>
            </div>
          </div>

          <button onClick={handleInitialProcess} disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-7 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.5em] shadow-xl transition-all disabled:bg-slate-200 flex justify-center items-center gap-3">
            {isSubmitting ? <Loader2 className="animate-spin w-6 h-6" /> : <ArrowRight className="w-6 h-6" />}
            분석 및 시뮬레이션 준비
          </button>
        </motion.section>
      </div>

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
