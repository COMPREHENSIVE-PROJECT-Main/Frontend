"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, X, Gavel, Loader2, CheckCircle2 } from "lucide-react"; // Lucide React 활용
import { motion, AnimatePresence } from "framer-motion"; // Framer Motion 활용

export default function CaseInputPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true); // 인증 확인 상태
  const fileInputRef = useRef<HTMLInputElement>(null);

  // [중요도 최상: 보안 및 세션 관리] 페이지 진입 전 인증 체크
  useEffect(() => {
    const hasToken = document.cookie.includes("auth_token");
    if (!hasToken) {
      router.replace("/login");
    } else {
      setIsAuthenticating(false);
      
      // 기존 로컬스토리지 데이터 복구
      const savedTitle = localStorage.getItem("temp_case_title");
      const savedDesc = localStorage.getItem("temp_case_description");
      if (savedTitle) setTitle(savedTitle);
      if (savedDesc) setDescription(savedDesc);
    }
  }, [router]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    localStorage.setItem("temp_case_title", val);
  };

  const handleDescChange = (val: string) => {
    setDescription(val);
    localStorage.setItem("temp_case_description", val);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleStartSimulation = () => {
    if (!title || !description) {
      alert("사건 제목과 내용을 모두 입력해주세요.");
      return;
    }
    // 시뮬레이션 시작 시 로컬스토리지 정리 후 이동
    localStorage.removeItem("temp_case_title");
    localStorage.removeItem("temp_case_description");
    router.push("/simulation"); // 시뮬레이션 상세 페이지로 이동
  };

  // 인증 확인 중일 때는 아무것도 보여주지 않음 (깜빡임 방지)
  if (isAuthenticating) return null;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-blue-600">
          <Gavel className="w-6 h-6" />
          <span className="font-bold tracking-tight">AI 재판 시뮬레이터</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">사건 분석 입력</h1>
        <p className="text-sm text-gray-500 font-medium">정보를 입력하고 증거 자료를 업로드하여 시뮬레이션을 시작하세요.</p>
      </header>

      <section className="space-y-6 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-50">
        {/* 사건 제목 섹션 */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold mb-3 text-gray-700">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            사건 제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full border border-gray-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
            placeholder="사건 제목을 입력하세요."
          />
        </div>

        {/* 사건 상세 섹션 */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold mb-3 text-gray-700">
            <FileText className="w-4 h-4 text-blue-500" />
            사건 상세 경위
          </label>
          <textarea
            value={description}
            onChange={(e) => handleDescChange(e.target.value)}
            className="w-full border border-gray-200 rounded-2xl p-5 h-56 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all resize-none"
            placeholder="상세 내용을 적어주세요."
          />
        </div>

        {/* 증거 자료 업로드 섹션 */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold mb-3 text-gray-700">
            <Upload className="w-4 h-4 text-blue-500" />
            증거 자료 업로드
          </label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all relative overflow-hidden"
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden" 
              accept=".pdf,image/*"
            />
            
            <AnimatePresence mode="wait">
              {file ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="text-sm text-gray-900 font-bold truncate max-w-[250px]">
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)}MB • 업로드 준비됨
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="mt-2 text-xs text-red-500 hover:text-red-700 font-bold underline underline-offset-4"
                  >
                    파일 취소
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <div className="flex justify-center">
                    <Upload className="w-10 h-10 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">클릭하거나 파일을 여기로 드래그하세요.</p>
                  <p className="text-xs text-gray-400">PDF, 이미지 파일 (최대 10MB)</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button 
          onClick={handleStartSimulation}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
        >
          시뮬레이션 시작하기
        </button>
      </section>
    </div>
  );
}