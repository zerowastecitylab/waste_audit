'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false) // 로그인 유지 체크 상태
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. profiles 테이블에서 로그인 ID로 사용자 조회 (정확히 profiles 사용)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, login_id')
        .eq('login_id', loginId)
        .maybeSingle()

      if (profileError || !profile) {
        alert('존재하지 않는 아이디입니다.')
        setLoading(false)
        return
      }

      // 2. Supabase Auth 로그인 시도
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: password,
      })

      if (loginError) {
        alert('비밀번호가 일치하지 않습니다.')
      } else {
        // 3. 고도화된 세션 관리 로직 (session_token 생성)
        const newSessionToken = crypto.randomUUID();
        const now = new Date().toISOString();

        // 4. DB(profiles 테이블)에 세션 토큰과 활동 시간 업데이트
        // 이 과정에서 다른 기기의 기존 토큰은 무효화됨 (기존 값 덮어쓰기)
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            session_token: newSessionToken,
            last_activity: now 
          })
          .eq('id', profile.id)

        if (updateError) throw updateError;

        // 5. LocalStorage에 세션 정보 저장
        localStorage.setItem('user', JSON.stringify({
          id: profile.id, // DB 크로스체크를 위해 ID 저장 필수
          user_name: profile.full_name,
          login_id: profile.login_id,
          session_token: newSessionToken, // 내가 발급받은 고유 토큰
          rememberMe: rememberMe // 로그인 유지 여부 저장
        }))

        router.push('/dashboard')
      }
    } catch (err) {
      console.error(err)
      alert('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

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
        <h2 style={{ 
          textAlign: 'center', marginBottom: '30px', color: '#333', fontSize: '26px', 
          letterSpacing: '-1px', lineHeight: '1.2' 
        }}><b>폐기물 감사 정보 시스템</b></h2>
        
        <form onSubmit={handleLogin}>
          <input 
            type="text" placeholder="아이디" value={loginId} 
            onChange={(e) => setLoginId(e.target.value)} 
            style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} required 
          />
          <input 
            type="password" placeholder="비밀번호" value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} required 
          />

          {/* 로그인 유지 체크박스 추가 */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', paddingLeft: '2px' }}>
            <input 
              type="checkbox" 
              id="rememberMe" 
              checked={rememberMe} 
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
            />
            <label htmlFor="rememberMe" style={{ marginLeft: '8px', fontSize: '14px', color: '#666', cursor: 'pointer' }}>
              로그인 상태 유지
            </label>
          </div>
          
          <button type="submit" disabled={loading} style={{ 
            width: '100%', padding: '14px', backgroundColor: '#007bff', color: '#fff', 
            border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' 
          }}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span onClick={() => router.push('/signup')} style={menuLinkStyle}>회원가입</span>
          <span style={dividerStyle}>|</span>
          <span onClick={() => router.push('/find-id')} style={menuLinkStyle}>아이디 찾기</span>
          <span style={dividerStyle}>|</span>
          <span onClick={() => router.push('/find-pw')} style={menuLinkStyle}>비밀번호 찾기</span>
        </div>
      </div>
    </div>
  )
}