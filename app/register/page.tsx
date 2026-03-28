"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Gavel, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

// API 클라이언트 불러오기
import apiClient from "../../src/lib/api-client"; 

export default function RegisterPage() {
  const router = useRouter();
  
  // 상태 변수들
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 백엔드와 연결된 실제 회원가입 함수
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);
    
    try {
      // 백엔드 주소 설정
      const response = await apiClient.post("/api/auth/register", {
        username: email,    // 백엔드는 아이디 대신 username을 씀
        password: password, // 비밀번호

      });

      // 201(Created) 응답 확인
      if (response.status === 201 || response.status === 200) {
        alert("🎉 회원가입 성공! 로그인 페이지로 이동합니다.");
        router.push("/login");
      }

    } catch (error: any) {
      // 에러 확인용 코드
      console.log("백엔드 상세 에러 정보:", error.response?.data);
      
      const detail = error.response?.data?.detail;
      const message = Array.isArray(detail) ? detail[0].msg : detail;
      alert(`가입 실패: ${message || "형식이 올바르지 않습니다."}`);
    }finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6">
      {/* 상단 로고 및 타이틀 (디자인) */}
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
          계정 만들기
        </h2>
        <p className="mt-3 text-sm text-gray-500 font-medium">
          단 몇 초만에 가입하고 AI 재판 시뮬레이터를 경험해보세요.
        </p>
      </motion.div>

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

            {/* 이메일(아이디) 입력 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold mb-3 text-gray-700">
                <Mail className="w-4 h-4 text-blue-500" />
                아이디 (이메일)
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all text-sm"
                placeholder="아이디를 입력하세요"
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