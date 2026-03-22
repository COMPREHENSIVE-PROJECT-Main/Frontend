"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // 페이지 이동을 위한 Link 추가
import { Mail, Lock, Gavel, ArrowRight, UserPlus } from "lucide-react"; 
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 인증 시뮬레이션 (0.8초 지연)
      await new Promise((resolve) => setTimeout(resolve, 800));
      document.cookie = "auth_token=true; path=/; max-age=3600"; 
      router.push("/case-input");
    } catch (error) {
      alert("로그인 정보가 올바르지 않습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6">
      {/* 상단 로고 및 타이틀 */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-10"
      >
        <div className="flex justify-center mb-5">
          <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-100">
            <Gavel className="w-10 h-10 text-white" />
          </div>
        </div>
        <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          AI 재판 시뮬레이터
        </h2>
        <p className="mt-3 text-sm text-gray-500 font-medium">
          로그인하여 AI 재판 시뮬레이터를 시작하세요.
        </p>
      </motion.div>

      {/* 로그인 카드 */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-12 px-10 shadow-xl shadow-gray-100 rounded-[2.5rem] border border-gray-100">
          <form className="space-y-7" onSubmit={handleLogin}>
            
            {/* 이메일 입력 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold mb-3 text-gray-700">
                <Mail className="w-4 h-4 text-blue-500" />
                이메일 주소
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all text-sm"
                placeholder="name@example.com"
              />
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold mb-3 text-gray-700">
                <Lock className="w-4 h-4 text-blue-500" />
                비밀번호
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all text-sm"
                placeholder="••••••••"
              />
            </div>

            {/* 로그인 버튼 */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>서비스 시작하기</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* 하단 회원가입 유도 섹션 */}
          <div className="mt-10 pt-8 border-t border-gray-50 text-center">
            <p className="text-sm text-gray-400 font-medium mb-4">
              아직 계정이 없으신가요?
            </p>
            <Link href="/register" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 hover:underline underline-offset-4 transition-all group">
              <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              회원가입 하러가기
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}