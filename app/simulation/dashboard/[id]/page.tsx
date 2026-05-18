"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Gavel, Target, MessageSquare,
  BarChart3, Triangle, ArrowLeft, Download,
  ShieldCheck, Loader2, Scale, ListChecks, ClipboardCheck
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080";

type VerdictSection = {
  title: string;
  body: string;
};

function parseVerdictText(text: string): VerdictSection[] {
  const sections: VerdictSection[] = [];
  let currentTitle = "";
  let currentLines: string[] = [];

  const pushCurrent = () => {
    const body = currentLines.join("\n").trim();
    if (currentTitle && body) {
      sections.push({ title: currentTitle, body });
    }
    currentLines = [];
  };

  text.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line || /^─+$/.test(line)) return;

    const normalizedTitle = line.replace(/\s/g, "");
    if (["주문", "이유", "결론"].includes(normalizedTitle)) {
      pushCurrent();
      currentTitle = normalizedTitle === "이유" ? "판단 이유" : normalizedTitle;
      return;
    }

    currentLines.push(line);
  });

  pushCurrent();
  return sections;
}

export default function SimulationDashboard() {
  const router = useRouter();
  const params = useParams();
  const caseId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const handleDownloadPDF = () => {
    window.print();
  };

  useEffect(() => {
    const fetchReport = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/report/${caseId}/export`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          document.cookie = "auth_token=; path=/; max-age=0";
          router.replace("/login");
          return;
        }

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

  const r = data.report || data;
  if (!r?.case_info || !r?.verdict || !r?.judge_comparison || !r?.summary) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="font-black text-slate-900">리포트 형식이 올바르지 않습니다.</p>
        <button onClick={() => router.back()} className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase">뒤로 가기</button>
      </div>
    );
  }

  const verdictText = data.verdict_text || [
    r.verdict?.sentence,
    r.verdict?.rationale,
    r.verdict?.conclusion,
  ].filter(Boolean).join("<br /><br />");

  const isCriminal = r.case_info.case_type === "형사";
  const theme = {
    bg: isCriminal ? "bg-blue-600" : "bg-emerald-600",
    color: isCriminal ? "text-blue-600" : "text-emerald-600",
    unit: r.judge_comparison.gap.unit || "",
    hex: isCriminal ? "#2563eb" : "#10b981"
  };
  const judges = Array.isArray(r.judge_comparison.judges) ? r.judge_comparison.judges : [];
  const judgeValues = judges.map((j: any) => Number.parseFloat(String(j.value)) || 0);
  const maxJudgeValue = Math.max(...judgeValues, 1);
  const radarScores = [0, 1, 2].map((idx) => Math.max(0.18, (judgeValues[idx] || 0) / maxJudgeValue));
  const radarPoints = [
    `50,${82 - radarScores[0] * 58}`,
    `${50 - radarScores[1] * 40},82`,
    `${50 + radarScores[2] * 40},82`,
  ].join(" ");
  const keyIssues = Array.isArray(r.summary.key_issues) ? r.summary.key_issues : [];
  const rounds = Array.isArray(r.summary.rounds) ? r.summary.rounds : [];
  const visibleRounds = rounds.filter((round: any) => {
    const content = typeof round.content === "string" ? round.content.trim() : "";
    const refs = Array.isArray(round.law_refs) ? round.law_refs.filter(Boolean) : [];
    return content || refs.length > 0;
  });
  const verdictSections = [
    { title: "주문", body: r.verdict.sentence || r.verdict.order || `${r.verdict.decision} ${r.verdict.value}`.trim() },
    { title: "판단 이유", body: r.verdict.rationale },
    { title: "결론", body: r.verdict.conclusion },
  ].filter((section) => section.body);
  const originalVerdictSections = parseVerdictText(verdictText);
  const displayVerdictSections = originalVerdictSections.length > 0 ? originalVerdictSections : verdictSections;
  const strongestJudge = judges[judgeValues.indexOf(maxJudgeValue)];
  const gapLabel = judges.length >= 2
    ? `${judges[0]?.judge_type || "1심"}와 ${judges[judges.length - 1]?.judge_type || "비교군"}의 판단 차이를 기준으로 확인`
    : "판사별 판단 데이터가 부족합니다.";

  return (
    <div className="report-screen min-h-screen bg-[#fcfcfc] text-slate-900 font-sans pb-32">
      <style>{`
        @media print {
          @page { size: A4; margin: 0mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          nav { display: none !important; }
          body { background: white !important; padding: 12mm 14mm !important; }
          main { margin-top: 6mm !important; padding-left: 0 !important; padding-right: 0 !important; }
          .space-y-10 > * + * { margin-top: 5mm !important; }
          .gap-6 { gap: 3mm !important; }
          .p-8 { padding: 3mm !important; }
          .p-10 { padding: 4mm !important; }
          * { box-shadow: none !important; }
          .bg-slate-900  { background-color: #1e293b !important; }
          .bg-slate-950  { background-color: #0f172a !important; }
          .bg-blue-600   { background-color: #2563eb !important; }
          .bg-emerald-600{ background-color: #059669 !important; }
          .bg-slate-50   { background-color: #f8fafc !important; }
          .bg-slate-100  { background-color: #f1f5f9 !important; }
          .bg-white      { background-color: #ffffff !important; }
          .pdf-page { page-break-before: always; break-before: page; }
          .pdf-avoid { page-break-inside: avoid; break-inside: avoid; }
          .pdf-page > * { page-break-inside: avoid; break-inside: avoid; }
          h3 { color: #1e293b !important; }
          h4 { color: #334155 !important; font-size: 9pt !important; font-weight: 900 !important; }
          .text-slate-300 { color: #475569 !important; }
          .pb-32 { padding-bottom: 0 !important; }
          .pb-20 { padding-bottom: 0 !important; }
          button[class*="fixed"] { display: none !important; }
        }
      `}</style>

      <nav className="print:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button onClick={() => router.push('/user')} className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">
            <ArrowLeft size={14} /> 기록 목록
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/advice?caseId=${encodeURIComponent(caseId)}`)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm active:scale-95"
            >
              <MessageSquare size={14} className="text-blue-600" /> AI 법률 자문
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95"
            >
              <Download size={14} /> PDF 리포트
            </button>
          </div>
        </div>
      </nav>

      <main className="report-document max-w-6xl mx-auto mt-10 px-6 space-y-10 animate-in fade-in duration-700">

        <header className="pdf-section pdf-avoid grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-end">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[9px] font-black text-white ${theme.bg}`}>
                {r.case_info.case_type} 사건
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">관리번호 {r.case_info.case_id}</span>
              {r.case_info.created_at && (
                <span className="text-[10px] font-mono text-slate-400 uppercase">작성일 {r.case_info.created_at}</span>
              )}
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-slate-950">최종 시뮬레이션 보고서</h1>
              <p className="mt-4 text-base md:text-lg text-slate-600 font-bold leading-relaxed max-w-3xl">
                {r.case_info.case_description}
              </p>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">최종 판단</span>
              <span className={`rounded-full px-3 py-1 text-[10px] font-black text-white ${theme.bg}`}>
                {r.verdict.decision}
              </span>
            </div>
            <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {isCriminal ? "예상 형량" : "산정 책임"}
              </p>
              <p className="mt-3 text-2xl font-black leading-snug text-slate-950 break-keep">
                {r.verdict.value}
              </p>
              {theme.unit && !String(r.verdict.value).includes(theme.unit) && (
                <p className="mt-1 text-xs font-black text-slate-400">{theme.unit}</p>
              )}
            </div>
            <p className="mt-4 line-clamp-3 text-sm font-bold leading-7 text-slate-600">
              {r.verdict.sentence || r.verdict.conclusion}
            </p>
          </div>
        </header>

        <section className="pdf-section pdf-avoid grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "사건 유형", value: r.case_info.case_type, icon: Scale },
            { label: "최종 결론", value: r.verdict.decision, icon: Gavel },
            { label: isCriminal ? "산정 형량" : "산정 책임", value: r.verdict.value, icon: ClipboardCheck },
            { label: "핵심 쟁점", value: `${keyIssues.length}개`, icon: ListChecks },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Icon size={15} className={theme.color} /> {item.label}
                </div>
                <p className="mt-3 text-xl font-black text-slate-900">{item.value}</p>
              </div>
            );
          })}
        </section>

        <section className="pdf-page grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="bg-slate-950 rounded-[2rem] p-8 md:p-10 text-white relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Executive Summary</span>
              <h2 className="mt-5 text-2xl md:text-3xl font-black leading-snug">판결 핵심 요약</h2>
              <div className="mt-8 grid gap-4">
                {verdictSections.map((section) => (
                  <div key={section.title} className="rounded-2xl bg-white/[0.06] border border-white/10 p-5">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${theme.color}`}>{section.title}</p>
                    <p className="mt-3 text-sm md:text-base font-bold leading-8 text-slate-200">{section.body}</p>
                  </div>
                ))}
              </div>
            </div>
            <Gavel className="absolute -right-14 -bottom-16 w-72 h-72 text-white/5 -rotate-12" />
          </div>

          <aside className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Target size={16} className={theme.color} /> 주요 쟁점
            </h3>
            <div className="mt-6 space-y-3">
              {keyIssues.map((issue: string, i: number) => (
                <div key={i} className="flex gap-3 rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white ${theme.bg}`}>
                    {i + 1}
                  </span>
                  <p className="text-sm font-black leading-relaxed text-slate-800">{issue}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="pdf-page bg-white border border-slate-100 rounded-[2rem] p-8 md:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <ShieldCheck size={24} className={theme.color} /> 판결문
              </h3>
              <p className="mt-2 text-sm font-bold text-slate-500">주문, 판단 이유, 결론을 분리해 검토할 수 있도록 정리했습니다.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {verdictSections.map((section) => (
              <article key={section.title} className="rounded-2xl bg-slate-50 border border-slate-100 p-6">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">{section.title}</h4>
                <p className="mt-4 text-[15px] font-bold leading-8 text-slate-800">{section.body}</p>
              </article>
            ))}
          </div>
          {data.verdict_text && (
            <details className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 print:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xs font-black uppercase tracking-widest text-slate-500">
                <span>원문 판결문 보기</span>
                <span className={`rounded-full px-3 py-1 text-[10px] text-white ${theme.bg}`}>원문</span>
              </summary>
              <div className="mt-6 grid gap-4">
                {displayVerdictSections.map((section) => (
                  <article key={section.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                    <h4 className={`text-[11px] font-black uppercase tracking-widest ${theme.color}`}>
                      {section.title}
                    </h4>
                    <p className="mt-4 whitespace-pre-line break-keep text-[15px] font-bold leading-8 text-slate-800">
                      {section.body}
                    </p>
                  </article>
                ))}
              </div>
            </details>
          )}
        </section>

        <section className="pdf-page grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 size={16} className={theme.color} /> 판사별 판단 비교
              </h3>
              {strongestJudge && (
                <span className="text-[11px] font-bold text-slate-500">가장 높은 산정: {strongestJudge.judge_type}</span>
              )}
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="grid grid-cols-[1.1fr_0.8fr_1fr] bg-slate-50 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>판사</span>
                <span>판단</span>
                <span>산정값</span>
              </div>
              {judges.map((j: any, i: number) => {
                const numericValue = Number.parseFloat(String(j.value)) || 0;
                const width = Math.max(8, (numericValue / maxJudgeValue) * 100);
                return (
                  <div key={i} className="grid grid-cols-[1.1fr_0.8fr_1fr] gap-4 border-t border-slate-100 px-5 py-5 items-center">
                    <span className="font-black text-slate-900">{j.judge_type}</span>
                    <span className={`w-fit rounded-full px-3 py-1 text-[11px] font-black text-white ${theme.bg}`}>{j.decision}</span>
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-black text-slate-700">{j.value}</span>
                        {theme.unit && !String(j.value).includes(theme.unit) && (
                          <span className="text-[10px] font-bold text-slate-400">{theme.unit}</span>
                        )}
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${width}%` }} className={`h-full rounded-full ${theme.bg}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Triangle size={16} className={theme.color} /> 판단 편차 지도
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] lg:grid-cols-1 gap-6 items-center">
              <div className="mx-auto w-44 aspect-square">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <polygon points="50,24 10,82 90,82" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
                  <line x1="50" y1="24" x2="50" y2="82" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="10" y1="82" x2="50" y2="82" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="90" y1="82" x2="50" y2="82" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                  <motion.polygon points={radarPoints} fill={theme.hex} fillOpacity="0.16" stroke={theme.hex} strokeWidth="2.5" strokeLinejoin="round" />
                  <text x="50" y="17" textAnchor="middle" className="fill-slate-500 font-black text-[6px]">{judges[0]?.judge_type || "원칙판사"}</text>
                  <text x="12" y="93" textAnchor="start" className="fill-slate-500 font-black text-[6px]">{judges[1]?.judge_type || "형평판사"}</text>
                  <text x="88" y="93" textAnchor="end" className="fill-slate-500 font-black text-[6px]">{judges[2]?.judge_type || "여론판사"}</text>
                </svg>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-bold leading-7 text-slate-600">{gapLabel}</p>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">해석</p>
                  <p className="mt-2 text-sm font-bold leading-7 text-slate-700">
                    세 판단값을 동일 기준으로 정규화했습니다. 도형이 한쪽으로 치우칠수록 해당 판단 축의 산정이 상대적으로 강합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pdf-page space-y-6 pb-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <MessageSquare size={24} className={theme.color} /> 공방 요약 타임라인
              </h3>
              <p className="mt-2 text-sm font-bold text-slate-500">라운드별 주장과 인용 근거를 빠르게 훑을 수 있게 정리했습니다.</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
            {visibleRounds.map((round: any, idx: number) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-[130px_1fr] gap-5 border-b border-slate-100 p-6 last:border-b-0" style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                <div className="space-y-2">
                  <span className="block text-[10px] font-mono font-black uppercase tracking-widest text-slate-300">라운드 {round.round_no}</span>
                  <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black text-white ${idx % 2 === 0 ? 'bg-slate-900' : theme.bg}`}>
                    {round.speaker}
                  </span>
                </div>
                <div>
                  <p className="text-base font-bold leading-8 text-slate-800">{round.content}</p>
                  {Array.isArray(round.law_refs) && round.law_refs.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {round.law_refs.map((law: string, i: number) => (
                        <span key={i} className="text-[10px] font-black px-3 py-1 bg-slate-100 text-slate-500 rounded-lg"># {law}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
