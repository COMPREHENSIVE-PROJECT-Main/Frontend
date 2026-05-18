"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Calendar, Gavel, Clock, PlusCircle,
  LayoutGrid, List, FileQuestion, ArrowRight, ShieldCheck, Activity, Loader2,
  MessageSquare 
} from "lucide-react";
import apiClient from "../../src/lib/api-client";

interface UserCase {
  id: string;
  case_id: string;
  case_type: string;
  title: string;
  created_at: string;
  status: string;
  summary?: string;
  result?: string;
  value?: string;
}

export default function UserHistoryDashboard() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [cases, setCases] = useState<UserCase[]>([]);
  const [loading, setLoading] = useState(true);

  // 데이터 페칭 로직
  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/api/cases");
        setCases(response.data.cases || response.data || []);
      } catch (err: any) {
        console.warn("Backend connection failed, showing empty state instead of error.");
        setCases([]); 
        if (err.response?.status === 401) router.replace("/login");
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };
    fetchCases();
  }, [router]);

  const goToInputPage = () => router.push("/case-input");
  
  //  법률 자문 페이지 이동 함수
  const goToLegalAdvice = () => router.push("/advice");

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-12 font-sans text-slate-800 relative overflow-x-hidden">
      {/* 배경 레이아웃 */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white via-transparent to-slate-50"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-10">
        
        {/* 헤더 섹션 */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">내 사건 기록</h1>
            <p className="text-slate-500 font-bold text-sm tracking-widest uppercase opacity-60">과거 분석된 사건 데이터를 관리</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* 검색창 */}
            <div className="relative flex-1 md:w-64 shadow-sm rounded-2xl overflow-hidden">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="사건 검색..." 
                className="w-full pl-11 pr-4 py-3 bg-white border-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-bold"
              />
            </div>

            {/* 법률 자문 이동 버튼 */}
            <button 
              onClick={goToLegalAdvice}
              className="p-3.5 bg-white border border-slate-200 text-slate-700 rounded-2xl shadow-sm hover:border-blue-500 hover:text-blue-600 transition-all flex items-center gap-2 group active:scale-95"
              title="AI 법률 자문 받기"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="hidden sm:block text-[10px] font-black uppercase pr-1 tracking-widest">법률 자문</span>
            </button>

            {/* 새로운 사건 버튼 */}
            <button 
              onClick={goToInputPage}
              className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-lg hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
            >
              <PlusCircle className="w-6 h-6" />
              <span className="hidden sm:block text-[10px] font-black uppercase pr-2 tracking-widest">새로운 사건</span>
            </button>
          </div>
        </header>

        <hr className="border-slate-100" />

        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center gap-4 text-slate-300">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Syncing Neural Data...</p>
          </div>
        ) : cases.length > 0 ? (
          <div className="space-y-6">
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
            >
              {cases.map((item) => (
                <motion.div 
                  key={item.id}
                  whileHover={{ y: -8, shadow: "0 20px 40px -15px rgba(0,0,0,0.1)" }}
                  onClick={() => router.push(`/simulation/dashboard/${item.case_id || item.id}`)}
                  className="group bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm transition-all cursor-pointer relative"
                >
                  <div className="flex justify-between items-start mb-6">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      item.case_type === "형사" ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                      {item.case_type} Case
                    </span>
                    <Clock className="w-4 h-4 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                    {item.title || "분석 완료된 사건"}
                  </h3>
                  <div className="bg-slate-50/80 rounded-3xl p-6 flex items-center justify-between border border-slate-100 mt-6">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Status</span>
                      <span className="text-base font-black text-slate-900">분석 완료</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Date</span>
                      <span className="text-sm font-black text-slate-600">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.section>
          </div>
        ) : (
          <motion.section 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 px-6 bg-white/40 border-2 border-dashed border-slate-200 rounded-[4rem] relative overflow-hidden"
          >
            <div className="absolute top-10 left-10 opacity-[0.03] -rotate-12"><Gavel size={120} /></div>
            <div className="absolute bottom-10 right-10 opacity-[0.03] rotate-12"><ShieldCheck size={120} /></div>

            <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex items-center justify-center mb-8 relative z-10">
              <Activity className="w-10 h-10 text-blue-500 animate-pulse" />
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tighter text-center relative z-10">
              아직 시뮬레이션 기록이 존재하지 않습니다
            </h2>
            <p className="text-slate-400 font-bold text-center max-w-sm mb-12 leading-relaxed text-sm relative z-10">
              AI 판사와 함께 첫 번째 분석을 시작하거나,<br />법률 자문 AI와 상담을 시작해보세요.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 relative z-10">
              <button 
                onClick={goToLegalAdvice}
                className="flex items-center gap-3 px-10 py-5 bg-white border border-slate-200 text-slate-900 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-slate-50 transition-all shadow-lg group active:scale-95"
              >
                법률 자문 받기
                <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              
              <button 
                onClick={goToInputPage}
                className="flex items-center gap-3 px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-slate-900 transition-all shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] group active:scale-95"
              >
                새로운 사건 입력하기
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}