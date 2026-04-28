'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function FindIdPage() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [foundUser, setFoundUser] = useState<{ login_id: string; id: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleFindId = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, login_id')
      .eq('email', email)
      .eq('phone_number', phone)
      .maybeSingle()

    if (error || !data) {
      alert('일치하는 정보가 없습니다.')
      setFoundUser(null)
    } else {
      setFoundUser(data)
    }
    setLoading(false)
  }

  const goToResetPw = () => {
    if (foundUser && typeof window !== 'undefined') {
      sessionStorage.setItem('reset_user_id', foundUser.id)
      router.push('/update-pw-direct')
    }
  }

  const cardStyle = { padding: '40px', width: '100%', maxWidth: '400px', backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }
  const inputStyle = { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' as const }
  const primaryBtnStyle = { width: '100%', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#007bff', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }
  const secondaryBtnStyle = { width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #007bff', backgroundColor: '#fff', color: '#007bff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }
  const grayBtnStyle = { width: '100%', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#eeeeee', color: '#666', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f7fa', fontFamily: 'sans-serif' }}>
      <div style={cardStyle}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333', fontSize: '24px',      // 크기 증가
  letterSpacing: '-1px', // 글자 간격 조정
  lineHeight: '1.2' }}><b>폐기물 감사 정보 시스템</b></h2>
  <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>아이디 찾기</h2>
        {!foundUser ? (
          <form onSubmit={handleFindId}>
            <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
            <input type="text" placeholder="전화번호" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} required />
            <button type="submit" disabled={loading} style={primaryBtnStyle}>{loading ? '찾는 중...' : '아이디 찾기'}</button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '10px', fontSize: '20px' }}>아이디: <strong>{foundUser.login_id}</strong></p>
            <button onClick={goToResetPw} style={primaryBtnStyle}>비밀번호 재설정하기</button>
          </div>
        )}
        <button onClick={() => router.push('/login')} style={grayBtnStyle}>취소하기</button>
      </div>
    </div>
  )
}