'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

export default function Header() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  // 1. 모든 Hook 선언 (순서 고정)
  useEffect(() => {
    const getUserData = async () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const user = JSON.parse(userData)
          setUserName(user.user_name || '사용자')
          const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('login_id', user.login_id)
            .maybeSingle()
          if (data?.role === 'admin') setIsAdmin(true)
          else setIsAdmin(false)
        } catch (e) { console.error(e) }
      }
    }
   // 인증 관련 페이지가 아닐 때만 유저 정보 가져오기
    if (!isAuthPage) {
      getUserData()
    }
  }, [pathname])

  // 2. [수정 포인트] 로그인 페이지 경로 체크 강화
  // 메인(/), 로그인(/login), 회원가입(/signup), 아이디/비번찾기(/find-...) 포함
  const isAuthPage = 
    pathname === '/' || 
    pathname === '/login' || 
    pathname === '/signup' || 
    pathname.includes('find-') ||     // 아이디/비번 찾기 관련 포함
    pathname.includes('update-pw-') ||     // 아이디/비번 찾기 관련 포함
    // pathname.includes('password') || // 비밀번호 재설정/변경 관련 포함
    pathname.includes('reset');      // 초기화 관련 포함

  if (isAuthPage) {
    return null; // 인증 페이지에서는 아무것도 그리지 않음
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('user')
    setIsAdmin(false)
    setIsMenuOpen(false)
    window.location.href = '/'
  }

  // --- 3. 렌더링 ---
  return (
    <>
      <header style={headerStyle}>
        <div style={iconStyle} onClick={() => setIsMenuOpen(!isMenuOpen)}>☰</div>
        <div style={titleContainerStyle}>
            <h1 style={titleStyle} onClick={() => router.push('/dashboard')}>
              폐기물 감사 정보 시스템
            </h1>
        </div>
        <div style={iconStyle} onClick={() => router.push('/profile')}>👤</div>

        {isMenuOpen && (
          <div style={menuWindowStyle}>
            <div style={userNameStyle}><strong>{userName}</strong>님</div>
            <div style={dividerStyle} />
            <div style={menuItemStyle} onClick={() => {router.push('/dashboard'); setIsMenuOpen(false);}}>🏠 대시보드</div>
            
            {isAdmin && (
              <>
                <div style={adminSectionStyle}>관리자 메뉴</div>
                <div style={menuItemStyle} onClick={() => {router.push('/admin/users'); setIsMenuOpen(false);}}>👥 사용자 권한 관리</div>
                <div style={menuItemStyle} onClick={() => {router.push('/admin/category'); setIsMenuOpen(false);}}>📂 폐기물 카테고리 관리</div>
              </>
            )}
            
            <div style={dividerStyle} />
            <div style={{...menuItemStyle, color: '#ff4d4f'}} onClick={handleLogout}>🚪 로그아웃</div>
          </div>
        )}
      </header>
      {isMenuOpen && <div style={overlayStyle} onClick={() => setIsMenuOpen(false)} />}
    </>
  )
}

// 스타일 코드는 이전과 동일합니다.
const headerStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '0 20px', height: '60px', backgroundColor: '#fff',
  borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 1000
}
const titleContainerStyle: React.CSSProperties = { flex: 1, display: 'flex', justifyContent: 'center' }
const titleStyle: React.CSSProperties = { fontSize: '18px', fontWeight: 'bold', margin: 0, cursor: 'pointer', color: '#333' }
const iconStyle: React.CSSProperties = { fontSize: '24px', cursor: 'pointer', width: '40px', display: 'flex', justifyContent: 'center' }
const menuWindowStyle: React.CSSProperties = { position: 'absolute', top: '65px', left: '10px', width: '220px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', padding: '10px', zIndex: 1001, border: '1px solid #eee' }
const userNameStyle = { padding: '10px', fontSize: '14px', color: '#666' }
const adminSectionStyle = { padding: '10px 10px 5px 10px', fontSize: '12px', color: '#007bff', fontWeight: 'bold' }
const menuItemStyle: React.CSSProperties = { padding: '12px', cursor: 'pointer', fontSize: '14px', borderRadius: '8px' }
const dividerStyle = { height: '1px', backgroundColor: '#f0f0f0', margin: '5px 0' }
const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999 }