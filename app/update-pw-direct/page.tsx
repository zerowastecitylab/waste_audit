'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function UpdatePwDirectPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = sessionStorage.getItem('reset_user_id')
      if (!id) {
        alert('인증 세션이 만료되었습니다.')
        router.push('/login')
      } else {
        setUserId(id)
      }
    }
  }, [router])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) return alert('비밀번호가 일치하지 않습니다.')

    setLoading(true)
    // handleUpdate 함수 내부
  const { error } = await supabase.rpc('force_update_password', {
    target_user_id: userId, // auth.users 테이블의 UUID여야 함
    new_password: password
  })

    if (error) {
      alert('변경 실패: ' + error.message)
    } else {
      alert('비밀번호가 변경되었습니다. 다시 로그인 해주세요.')
      if (typeof window !== 'undefined') sessionStorage.removeItem('reset_user_id')
      router.push('/login')
    }
    setLoading(false)
  }

  const cardStyle = { padding: '40px', width: '100%', maxWidth: '400px', backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }
  const inputStyle = { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' as const }
  const primaryBtnStyle = { width: '100%', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#007bff', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }
  const grayBtnStyle = { width: '100%', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#eeeeee', color: '#666', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f7fa', fontFamily: 'sans-serif' }}>
      <div style={cardStyle}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333', fontSize: '24px',      // 크기 증가
  letterSpacing: '-1px', // 글자 간격 조정
  lineHeight: '1.2' }}><b>폐기물 감사 정보 시스템</b></h2>
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>새 비밀번호 설정</h2>
        <form onSubmit={handleUpdate}>
          <input type="password" placeholder="새 비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
          <input type="password" placeholder="비밀번호 확인" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} required />
          {confirmPassword && (
            <p style={{ fontSize: '12px', color: password === confirmPassword ? 'green' : 'red', marginBottom: '10px' }}>
              {password === confirmPassword ? '✅ 일치합니다.' : '❌ 일치하지 않습니다.'}
            </p>
          )}
          <button type="submit" disabled={loading || password !== confirmPassword} style={primaryBtnStyle}>변경 완료</button>
        </form>
        <button onClick={() => router.push('/login')} style={grayBtnStyle}>취소하기</button>
      </div>
    </div>
  )
}