'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, full_name, login_id')
        .eq('login_id', loginId)
        .maybeSingle()

      if (profileError || !profile) {
        alert('존재하지 않는 아이디입니다.')
        setLoading(false)
        return
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: password,
      })

      if (loginError) {
        alert('비밀번호가 일치하지 않습니다.')
      } else {
        localStorage.setItem('user', JSON.stringify({
          user_name: profile.full_name,
          login_id: profile.login_id
        }))
        router.push('/dashboard')
      }
    } catch (err) {
      alert('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 메뉴 스타일 정의
  const menuLinkStyle = { 
    color: '#666', 
    cursor: 'pointer', 
    fontSize: '13px',
    textDecoration: 'none'
  }

  const dividerStyle = { 
    margin: '0 8px', 
    color: '#ccc', 
    fontSize: '12px' 
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f7fa', fontFamily: 'sans-serif' }}>
      <div style={{ padding: '40px', backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '360px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333', fontSize: '26px',      // 크기 증가
  letterSpacing: '-1px', // 글자 간격 조정
  lineHeight: '1.2' }}><b>폐기물 감사 정보 시스템</b></h2>
        
        <form onSubmit={handleLogin}>
          <input 
            type="text" placeholder="아이디" value={loginId} 
            onChange={(e) => setLoginId(e.target.value)} 
            style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} required 
          />
          <input 
            type="password" placeholder="비밀번호" value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} required 
          />
          
          <button type="submit" disabled={loading} style={{ 
            width: '100%', padding: '14px', backgroundColor: '#007bff', color: '#fff', 
            border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' 
          }}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 하단 메뉴 영역: 회원가입 | 아이디 찾기 | 비밀번호 찾기 */}
        <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span onClick={() => router.push('/signup')} style={menuLinkStyle}>
            회원가입
          </span>
          
          <span style={dividerStyle}>|</span>
          
          <span onClick={() => router.push('/find-id')} style={menuLinkStyle}>
            아이디 찾기
          </span>
          
          <span style={dividerStyle}>|</span>
          
          <span onClick={() => router.push('/find-pw')} style={menuLinkStyle}>
            비밀번호 찾기
          </span>
        </div>
      </div>
    </div>
  )
}