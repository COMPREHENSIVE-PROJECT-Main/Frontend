import axios from 'axios';

const apiClient = axios.create({
  //로컬 주소로 설정 (백엔드가 8080 포트에서 돌아가고 있다고 가정)
  baseURL:'http://127.0.0.1:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 모든 요청에 JWT 토큰을 자동으로 삽입
apiClient.interceptors.request.use(
  (config) => {
    // 로컬스토리지에서 로그인할 때 저장했던 토큰을 꺼내오기
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    if (token) {
      // 토큰이 존재하면 요청 헤더에 Authorization 필드로 추가
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;