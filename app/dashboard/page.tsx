'use client'

import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [userName, setUserName] = useState('')

  useEffect(() => {
    // 로컬 스토리지에서 로그인한 사용자 정보 가져오기
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setUserName(user.user_name)
    } else {
      // 로그인 정보 없으면 로그인 페이지로 튕겨내기
      window.location.href = '/'
    }
  }, [])

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        <h2> </h2>
        <span><strong>{userName}</strong> 님 환영합니다</span>
      </header>

      <div style={{ display: 'grid', gap: '15px' }}>
        <button 
          onClick={() => window.location.href = '/dashboard/new-audit'}
          style={{ 
            padding: '25px', borderRadius: '12px', border: 'none', 
            backgroundColor: '#32f5d4', color: '#white', fontSize: '18px', fontWeight: 'bold', 
            cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
          }}
        >
          ➕ 새로운 감사 정보 등록
        </button>

        <button 
          style={{ 
            padding: '20px', borderRadius: '12px', border: '1px solid #ddd', 
            backgroundColor: '#fff', color: '#333', fontSize: '16px', cursor: 'pointer' 
          }}
        >
          📋 과거 분석 내역 확인 (준비중)
        </button>

        <button 
          onClick={() => { localStorage.removeItem('user'); window.location.href = '/'; }}
          style={{ marginTop: '20px', color: '#666', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}