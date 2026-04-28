'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true) // 로딩 상태 추가
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      // 1. 로컬 스토리지 데이터 확인
      const userData = localStorage.getItem('user')
      
      if (!userData) {
        // 데이터 없으면 즉시 리다이렉트
        window.location.href = '/'
        return
      }

      try {
        const user = JSON.parse(userData)
        setUserName(user.user_name)
        
        // 2. Supabase 실제 세션이 있는지 보조적으로 확인
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          // 세션이 만료되었다면 로그아웃 처리
          handleLogout()
        }
      } catch (e) {
        handleLogout()
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user')
      sessionStorage.clear()
      // 새로고침하며 이동하여 잔여 상태 제거
      window.location.href = '/'
    }
  }

  if (loading) return <div style={{ padding: '20px' }}>인증 확인 중...</div>

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        <h2 style={{ margin: 0 }}> </h2>
        <span><strong>{userName}</strong> 님 환영합니다</span>
      </header>

      <div style={{ display: 'grid', gap: '15px' }}>
        <button 
          onClick={() => router.push('/dashboard/new-audit')}
          style={{ 
            padding: '25px', borderRadius: '12px', border: 'none', 
            backgroundColor: '#60ebd4', color: '#000', fontSize: '18px', fontWeight: 'bold', 
            cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
          }}
        >
          ➕ 새로운 감사 정보 등록
        </button>

        <button 
        onClick={() => router.push('/admin/analysis-history')}
          style={{ 
            padding: '20px', borderRadius: '12px', border: '1px solid #ddd', 
            backgroundColor: '#fff', color: '#333', fontSize: '16px', cursor: 'pointer' 
          }}
        >
          📋 과거 분석 내역
        </button>

        <button 
          onClick={handleLogout}
          style={{ marginTop: '20px', color: '#888', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}