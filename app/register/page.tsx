"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Gavel, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);
    try {
      // 회원가입 API 호출 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
      router.push("/login");
    } catch (error) {
      alert("회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6">
      {/* 상단 로고 및 타이틀 */}

      {/* 회원가입 카드 */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-12 px-10 shadow-xl shadow-gray-100 rounded-[2.5rem] border border-gray-100">
          <form className="space-y-6" onSubmit={handleRegister}>
            
            {/* 이름 입력 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold mb-3 text-gray-700">
                <User className="w-4 h-4 text-blue-500" />
                성함
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all text-sm"
                placeholder="홍길동"
              />
            </div>

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
                placeholder="8자 이상 입력하세요"
              />
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold mb-3 text-gray-700">
                <CheckCircle2 className={`w-4 h-4 ${password && password === confirmPassword ? 'text-green-500' : 'text-blue-500'}`} />
                비밀번호 확인
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all text-sm"
                placeholder="한 번 더 입력하세요"
              />
            </div>

            {/* 가입 버튼 */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>가입하기</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* 하단 로그인 이동 섹션 */}
          <div className="mt-10 pt-8 border-t border-gray-50 text-center">
            <p className="text-sm text-gray-400 font-medium mb-4">
              이미 계정이 있으신가요?
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 hover:underline underline-offset-4 transition-all group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              로그인 페이지로 돌아가기
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}