"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  FileQuestion,
  Gavel,
  LayoutGrid,
  List,
  Loader2,
  MessageSquare,
  PlusCircle,
  Search,
  ShieldCheck,
} from "lucide-react";
import apiClient from "../../src/lib/api-client";

interface UserCase {
  case_id: string;
  case_type: string;
  title: string;
  result: string;
  summary: string;
  created_at: string;
}

interface CasesResponse {
  cases: UserCase[];
}

const normalizeKoreanCaseType = (value?: string) => {
  const normalized = (value || "").trim().toLowerCase();
  return normalized === "civil" || normalized === "민사" ? "민사" : "형사";
};

interface ApiError {
  response?: {
    status?: number;
  };
}

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "-";
  }

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const hasResultSummary = (item: UserCase) =>
  Boolean(item.result?.trim()) && Boolean(item.summary?.trim());

export default function UserHistoryDashboard() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [cases, setCases] = useState<UserCase[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<CasesResponse>("/api/cases");
        const caseList = Array.isArray(response.data?.cases) ? response.data.cases : [];

        setCases(caseList);
      } catch (err) {
        const apiError = err as ApiError;

        console.warn("Backend connection failed, showing empty state instead of error.");
        setCases([]);

        if (apiError.response?.status === 401) {
          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [router]);

  const filteredCases = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const casesWithResultSummary = cases.filter(hasResultSummary);

    if (!normalizedKeyword) {
      return casesWithResultSummary;
    }

    return casesWithResultSummary.filter((item) =>
      [
        item.case_id,
        item.case_type,
        item.title,
        item.result,
        item.summary,
        item.created_at,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedKeyword),
    );
  }, [cases, keyword]);

  const goToInputPage = () => router.push("/case-input");
  const goToLegalAdvice = () => router.push("/advice");
  const goToCaseDetail = (caseId: string, caseType?: string) => {
    if (caseId) {
      const normalizedCaseType = normalizeKoreanCaseType(caseType);
      sessionStorage.setItem(`case-type:${caseId}`, normalizedCaseType);
      router.push(`/simulation/dashboard/${caseId}?case_type=${encodeURIComponent(normalizedCaseType)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-12 font-sans text-slate-800 relative overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white via-transparent to-slate-50" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-blue-700">
              <FileQuestion className="h-4 w-4" />
              Case Records
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
                내 사건 기록
              </h1>
              <p className="mt-3 text-sm font-bold text-slate-500">
                과거 분석된 사건 데이터를 조회하고 관리합니다.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <div className="relative flex-1 overflow-hidden rounded-2xl shadow-sm lg:w-72">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="사건 검색..."
                className="w-full border border-slate-100 bg-white py-3 pl-11 pr-4 text-sm font-bold outline-none transition-all focus:border-blue-200 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <button
              onClick={goToLegalAdvice}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-700 shadow-sm transition-all hover:border-blue-500 hover:text-blue-600 active:scale-95"
              title="AI 법률 자문 받기"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">법률 자문</span>
            </button>

            <button
              onClick={goToInputPage}
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 text-white shadow-lg transition-all hover:bg-blue-600 active:scale-95"
            >
              <PlusCircle className="h-5 w-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">새 사건</span>
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">목록 보기</h2>
            <p className="mt-1 text-xs font-bold text-slate-400">
              원하는 방식으로 사건 기록을 확인하세요.
            </p>
          </div>

          <div className="inline-flex w-fit rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === "table"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="테이블 보기"
            >
              <List className="h-4 w-4" />
              테이블
            </button>
            <button
              type="button"
              onClick={() => setViewMode("card")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === "card"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="카드 보기"
            >
              <LayoutGrid className="h-4 w-4" />
              카드
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-40 text-slate-300">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">
              사건 기록을 불러오는 중...
            </p>
          </div>
        ) : filteredCases.length > 0 && viewMode === "table" ? (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-6 py-4">사건 ID</th>
                    <th className="px-6 py-4">사건 유형</th>
                    <th className="px-6 py-4">제목</th>
                    <th className="px-6 py-4">결과</th>
                    <th className="px-6 py-4">요약</th>
                    <th className="px-6 py-4">생성일</th>
                    <th className="px-6 py-4 text-right">상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCases.map((item) => (
                    <tr
                      key={item.case_id}
                      onClick={() => goToCaseDetail(item.case_id, item.case_type)}
                      className="cursor-pointer transition-colors hover:bg-blue-50/50"
                    >
                      <td className="px-6 py-5 align-top">
                        <span className="font-mono text-xs font-bold text-slate-500">
                          {item.case_id || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <span className="inline-flex rounded-lg border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-700">
                          {item.case_type || "-"}
                        </span>
                      </td>
                      <td className="max-w-[220px] px-6 py-5 align-top">
                        <p className="line-clamp-2 text-sm font-black leading-6 text-slate-900">
                          {item.title || "제목 없음"}
                        </p>
                      </td>
                      <td className="max-w-[180px] px-6 py-5 align-top">
                        <p className="line-clamp-2 text-sm font-bold leading-6 text-slate-700">
                          {item.result}
                        </p>
                      </td>
                      <td className="max-w-[300px] px-6 py-5 align-top">
                        <p className="line-clamp-2 text-sm font-medium leading-6 text-slate-500">
                          {item.summary}
                        </p>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                          <Calendar className="h-4 w-4 text-slate-300" />
                          {formatDate(item.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right align-top">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            goToCaseDetail(item.case_id, item.case_type);
                          }}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white transition-all hover:bg-blue-600 active:scale-95"
                          title="상세 보기"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        ) : filteredCases.length > 0 ? (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            {filteredCases.map((item) => (
              <motion.article
                key={item.case_id}
                whileHover={{ y: -6, boxShadow: "0 22px 48px -24px rgba(15, 23, 42, 0.35)" }}
                onClick={() => goToCaseDetail(item.case_id, item.case_type)}
                className="group cursor-pointer rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-colors hover:border-blue-100"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <span className="inline-flex rounded-lg border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-700">
                    {item.case_type || "-"}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-400">
                    {item.case_id || "-"}
                  </span>
                </div>

                <h3 className="line-clamp-2 min-h-[3rem] text-lg font-black leading-6 text-slate-900 transition-colors group-hover:text-blue-600">
                  {item.title || "제목 없음"}
                </h3>

                {(item.result || item.summary) && (
                  <div className="mt-5 space-y-4">
                    {item.result && (
                      <div>
                        <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                          결과
                        </span>
                        <p className="line-clamp-2 text-sm font-bold leading-6 text-slate-700">
                          {item.result}
                        </p>
                      </div>
                    )}

                    {item.summary && (
                      <div>
                        <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                          요약
                        </span>
                        <p className="line-clamp-3 text-sm font-medium leading-6 text-slate-500">
                          {item.summary}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-300" />
                    {formatDate(item.created_at)}
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      goToCaseDetail(item.case_id, item.case_type);
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white transition-all hover:bg-blue-600 active:scale-95"
                    title="상세 보기"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.article>
            ))}
          </motion.section>
        ) : (
          <motion.section
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative flex flex-col items-center justify-center overflow-hidden rounded-[3rem] border-2 border-dashed border-slate-200 bg-white/40 px-6 py-32"
          >
            <div className="absolute left-10 top-10 -rotate-12 opacity-[0.03]">
              <Gavel size={120} />
            </div>
            <div className="absolute bottom-10 right-10 rotate-12 opacity-[0.03]">
              <ShieldCheck size={120} />
            </div>

            <div className="relative z-10 mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white shadow-xl shadow-slate-200/50">
              <FileQuestion className="h-10 w-10 text-blue-500" />
            </div>

            <h2 className="relative z-10 mb-3 text-center text-2xl font-black tracking-tighter text-slate-900">
              조회된 사건 기록이 없습니다
            </h2>
            <p className="relative z-10 mb-12 max-w-sm text-center text-sm font-bold leading-relaxed text-slate-400">
              새로운 사건을 입력하거나 법률 자문을 시작해 첫 기록을 만들어보세요.
            </p>

            <div className="relative z-10 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={goToLegalAdvice}
                className="flex items-center gap-3 rounded-[2rem] border border-slate-200 bg-white px-10 py-5 text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 shadow-lg transition-all hover:bg-slate-50 active:scale-95"
              >
                법률 자문 받기
                <MessageSquare className="h-4 w-4" />
              </button>

              <button
                onClick={goToInputPage}
                className="flex items-center gap-3 rounded-[2rem] bg-blue-600 px-10 py-5 text-[11px] font-black uppercase tracking-[0.3em] text-white shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] transition-all hover:bg-slate-900 active:scale-95"
              >
                새로운 사건 입력하기
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
