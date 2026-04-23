'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function FindPwPage() {
  const [formData, setFormData] = useState({ loginId: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleVerifyUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('login_id', formData.loginId)
      .eq('email', formData.email)
      .eq('phone_number', formData.phone)
      .maybeSingle()

    if (error || !profile) {
      alert('일치하는 회원 정보가 없습니다.')
      setLoading(false)
      return
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('reset_user_id', profile.id)
    }
    router.push('/update-pw-direct')
    setLoading(false)
  }

  const inputStyle = { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' as const }
  const grayBtnStyle = { width: '100%', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#eeeeee', color: '#666', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f7fa', fontFamily: 'sans-serif' }}>
      <div style={{ padding: '40px', width: '100%', maxWidth: '400px', backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333', fontSize: '24px',      // 크기 증가
  letterSpacing: '-1px', // 글자 간격 조정
  lineHeight: '1.2' }}><b>폐기물 감사 정보 시스템</b></h2>
  <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>비밀번호 찾기</h2>
        <form onSubmit={handleVerifyUser}>
          <input type="text" placeholder="아이디" value={formData.loginId} onChange={(e) => setFormData({...formData, loginId: e.target.value})} style={inputStyle} required />
          <input type="email" placeholder="이메일" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={inputStyle} required />
          <input type="text" placeholder="전화번호" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={inputStyle} required />
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#007bff', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>다음 단계</button>
        </form>
        <button onClick={() => router.push('/login')} style={grayBtnStyle}>취소하기</button>
      </div>
    </div>
  )
}