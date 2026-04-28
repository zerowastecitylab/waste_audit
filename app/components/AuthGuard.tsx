'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isCheckComplete, setIsCheckComplete] = useState(false)

  // 세션 만료 시간 설정 (30분)
  const SESSION_TIMEOUT = 30 * 60 * 1000; 

  const handleLogout = (message: string) => {
    alert(message);
    localStorage.removeItem('user');
    setIsCheckComplete(false);
    router.replace('/login');
  };

  useEffect(() => {
    const checkSession = async () => {
      // 1. [수정됨] 허용 경로 리스트에 '/update-pw-direct' 추가
      const publicPaths = ['/login', '/signup', '/find-id', '/find-pw', '/update-pw-direct'];
      
      if (publicPaths.includes(pathname)) {
        setIsCheckComplete(true);
        return;
      }

      // 2. 로컬스토리지 데이터 확인
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        // 로그인 정보가 없으면 로그인 페이지로 이동
        router.replace('/login');
        return;
      }

      try {
        const userData = JSON.parse(storedUser);
        const { id, session_token, rememberMe } = userData;

        if (!id || !session_token) {
          handleLogout('세션 정보가 올바르지 않습니다. 다시 로그인해주세요.');
          return;
        }

        // 3. DB(profiles)에서 실시간 세션 정보 조회
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('session_token, last_activity')
          .eq('id', id)
          .single();

        if (error || !profile) {
          handleLogout('사용자 정보를 확인할 수 없습니다.');
          return;
        }

        // 4. [기기 변경 체크] DB의 토큰과 내 로컬 토큰이 다른지 확인
        if (profile.session_token !== session_token) {
          handleLogout('다른 기기에서 로그인되어 세션이 만료되었습니다.');
          return;
        }

        // 5. [시간 만료 체크] 로그인 유지를 체크하지 않았을 때만 30분 검사
        if (!rememberMe) {
          const lastActive = new Date(profile.last_activity).getTime();
          const now = new Date().getTime();

          if (now - lastActive > SESSION_TIMEOUT) {
            handleLogout('장시간 활동이 없어 안전을 위해 로그아웃되었습니다.');
            return;
          }
        }

        // 6. [활동 업데이트] 정상적인 활동 중이라면 DB의 마지막 활동 시간 갱신
        await supabase
          .from('profiles')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', id);

        setIsCheckComplete(true);

      } catch (e) {
        console.error('세션 검증 중 에러:', e);
        handleLogout('시스템 오류로 로그아웃되었습니다.');
      }
    };

    checkSession();
  }, [pathname, router]);

  // 인증 확인 전 공통 허용 경로 리스트
  const isPublicPath = ['/login', '/signup', '/find-id', '/find-pw', '/update-pw-direct'].includes(pathname);

  // 인증 확인 중 UI (허용 경로가 아닐 때만 표시)
  if (!isCheckComplete && !isPublicPath) {
    return (
      <div style={{ 
        display: 'flex', justifyContent: 'center', alignItems: 'center', 
        minHeight: '100vh', backgroundColor: '#f5f7fa', color: '#666' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>보안 세션 확인 중...</p>
          <div style={{ 
            width: '30px', height: '30px', border: '3px solid #ddd', 
            borderTop: '3px solid #007bff', borderRadius: '50%', 
            margin: '0 auto', animation: 'spin 1s linear infinite' 
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}