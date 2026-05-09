"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Gavel, Cpu, FileText, Target, MessageSquare,
  BarChart3, Triangle, ArrowLeft, Download, 
  ShieldCheck, Loader2 
} from "lucide-react";

export default function SimulationDashboard() {
  const router = useRouter();
  const params = useParams();
  const caseId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  // API 데이터 가져오기
  useEffect(() => {
    const fetchReport = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8080/api/report/${caseId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error("리포트를 불러오는 데 실패했습니다.");
        }

        const result = await res.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (caseId) fetchReport();
  }, [caseId, router]);



  if (loading) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="font-black text-[10px] tracking-[0.3em] uppercase text-slate-400">사건 분석 리포트 생성 중...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="font-black text-slate-900">오류가 발생했습니다.</p>
        <p className="text-sm text-slate-500">{error}</p>
        <button onClick={() => router.back()} className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase">뒤로 가기</button>
      </div>
    );
  }

  const r = data.report;
  const isCriminal = r.case_info.case_type ? "형사" : "민사";
  const theme = {
    bg: isCriminal ? "bg-blue-600" : "bg-emerald-600",
    color: isCriminal ? "text-blue-600" : "text-emerald-600",
    unit: r.judge_comparison.gap.unit,
    hex: isCriminal ? "#2563eb" : "#10b981"
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 font-sans pb-32">
      {/* 1. 네비게이션 */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button onClick={() => router.push('/user')} className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">
            <ArrowLeft size={14} /> 기록 목록
          </button>
          
          <div className="flex items-center gap-3">
            {/* 법률 자문 페이지 이동 버튼 */}
            <button 
              onClick={() => router.push('/advice')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm active:scale-95"
            >
              <MessageSquare size={14} className="text-blue-600" /> AI 법률 자문
            </button>

            {/* PDF 다운로드 버튼 */}
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95"
            >
              <Download size={14} /> PDF 리포트
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto mt-12 px-6 space-y-12 animate-in fade-in duration-700">
        <header className="space-y-4">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-[9px] font-black text-white ${theme.bg}`}>
              {r.case_info.case_type} 사건
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">관리번호: {data.case_id}</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight leading-none text-slate-900">AI 시뮬레이션 분석 리포트</h1>
          <p className="text-slate-500 font-bold text-lg leading-relaxed max-w-3xl italic">
            "{r.case_info.case_description}"
          </p>
        </header>

        <hr className="border-slate-100" />

        {/* 3. 판결 요약 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 block">최종 인공지능 판결</span>
            <h2 className="text-7xl font-black mb-8 tracking-tighter">{r.verdict.decision}</h2>
            <div className="space-y-4 pt-8 border-t border-white/10">
              <p className="text-slate-400 text-lg font-bold leading-relaxed italic">"{r.verdict.rationale}"</p>
              <p className={`font-black text-sm uppercase tracking-widest ${theme.color}`}>결론: {r.verdict.conclusion}</p>
            </div>
            <Gavel className="absolute -right-16 -bottom-16 w-80 h-80 text-white/5 -rotate-12" />
          </div>
          <div className={`${theme.bg} rounded-[3rem] p-10 flex flex-col justify-center items-center text-white shadow-xl`}>
             <span className="text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest">{isCriminal ? "예상 형량" : "책임 비율"}</span>
             <div className="text-8xl font-black tracking-tighter">
               {r.verdict.value}<span className="text-2xl ml-1 opacity-40">{theme.unit}</span>
             </div>
          </div>
        </section>

        {/* 4. 판결문 전문 */}
        <section className="bg-slate-50 border border-slate-100 rounded-[3.5rem] p-12 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-6">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3 text-slate-400">
              <ShieldCheck size={18} className={theme.color} /> 판결문 전문 (생성 결과)
            </h3>
          </div>
          <div 
            className="prose prose-slate max-w-none font-serif text-slate-800 leading-[2.2] bg-white p-12 rounded-2xl shadow-inner min-h-[400px]"
            dangerouslySetInnerHTML={{ __html: data.verdict_text }} 
          />
        </section>

        {/* 5. 분석 지표 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2">
              <BarChart3 size={16} className={theme.color} /> 판사군별 성향 분석
            </h4>
            <div className="flex items-end justify-around h-40 gap-4">
              {r.judge_comparison.judges.map((j: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
                  <motion.div 
                    initial={{ height: 0 }} 
                    animate={{ height: `${(parseFloat(j.value)/20) * 100}%` }}
                    className={`w-full rounded-t-xl ${theme.bg}`} 
                  />
                  <span className="text-[9px] font-black text-slate-400 uppercase">{j.judge_type}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm flex flex-col items-center">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 self-start flex items-center gap-2">
              <Triangle size={16} className={theme.color} /> 판결 편차 지형도
            </h4>
            <div className="relative w-48 h-48 mt-4">
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                <polygon points="50,15 90,80 10,80" fill="none" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2 2" />
                <text x="50" y="8" textAnchor="middle" className="fill-slate-400 font-black text-[7px]">원칙주의</text>
                <text x="5" y="88" textAnchor="middle" className="fill-slate-400 font-black text-[7px]">형평주의</text>
                <text x="95" y="88" textAnchor="middle" className="fill-slate-400 font-black text-[7px]">여론중심</text>
                <motion.polygon 
                  points={`50,${15 + r.judge_comparison.gap.delta_principle_equity} ${90 - r.judge_comparison.gap.delta_principle_opinion},80 ${10 + r.judge_comparison.gap.delta_equity_opinion},80`} 
                  fill={theme.hex} fillOpacity="0.15" stroke={theme.hex} strokeWidth="2" strokeLinejoin="round"
                />
                <circle cx="50" cy={15 + r.judge_comparison.gap.delta_principle_equity} r="1.5" fill={theme.hex} />
                <circle cx={90 - r.judge_comparison.gap.delta_principle_opinion} cy="80" r="1.5" fill={theme.hex} />
                <circle cx={10 + r.judge_comparison.gap.delta_equity_opinion} cy="80" r="1.5" fill={theme.hex} />
              </svg>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Target size={16} className={theme.color} /> AI 추출 핵심 쟁점
            </h4>
            <div className="space-y-2">
              {r.summary.key_issues.map((issue: string, i: number) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-[10px] text-slate-600">
                  # {issue}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. 타임라인 */}
        <section className="space-y-10 pb-20">
            <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
             <MessageSquare size={24} className={theme.color} /> 재판 시뮬레이션 타임라인
            </h3>
            <div className="space-y-6">
              {r.summary.rounds.map((round: any, idx: number) => (
                <div key={idx} className="bg-white border border-slate-50 p-8 rounded-[3rem] flex flex-col md:flex-row gap-8 shadow-sm">
                  <div className="md:w-24 shrink-0 flex flex-col items-center justify-center border-r border-slate-50 pr-8">
                    <span className="text-[10px] font-mono font-black text-slate-300 mb-2 uppercase">라운드 {round.round_no}</span>
                    <div className={`px-3 py-1 rounded-lg text-[9px] font-black text-white ${idx % 2 === 0 ? 'bg-slate-900' : theme.bg}`}>
                      {round.speaker}
                    </div>
                  </div>
                  <div className="space-y-6 flex-1">
                     <p className="text-xl font-bold text-slate-800 leading-snug">"{round.content}"</p>
                     <div className="flex flex-wrap gap-2">
                       {round.law_refs.map((law: string, i: number) => (
                         <span key={i} className="text-[10px] font-black px-3 py-1 bg-slate-100 text-slate-500 rounded-lg"># {law}</span>
                       ))}
                     </div>
                  </div>
                </div>
              ))}
            </div>
        </section>
      </main>
    </div>
  );
}