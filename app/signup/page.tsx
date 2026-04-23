'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const router = useRouter()
  const loginIdRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({ 
    name: '', loginId: '', password: '', confirmPassword: '', phone: '', email: '' 
  })
  const [isIdChecked, setIsIdChecked] = useState(false)
  const [isEmailChecked, setIsEmailChecked] = useState(false)
  const [loading, setLoading] = useState(false)

  // --- 공통 라벨 컴포넌트 (빨간 별표 포함) ---
  const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
    <label style={labelStyle}>
      {children} <span style={{ color: '#ff4d4f', marginLeft: '2px' }}>*</span>
    </label>
  )

  // 아이디 중복 확인
  const checkDuplicateId = async () => {
    if (!formData.loginId) {
      alert('아이디를 입력해주세요.')
      loginIdRef.current?.focus()
      return
    }
    const { data: exists, error } = await supabase.rpc('check_id_exists', { p_login_id: formData.loginId })
    if (error) return alert('아이디 확인 중 오류가 발생했습니다.')
    
    if (exists) {
      alert('이미 사용 중인 아이디입니다.')
      setFormData(prev => ({ ...prev, loginId: '' }))
      setIsIdChecked(false)
      loginIdRef.current?.focus()
    } else {
      alert('사용 가능한 아이디입니다.')
      setIsIdChecked(true)
    }
  }

  // 이메일 중복 확인
  const checkDuplicateEmail = async () => {
    if (!formData.email) {
      alert('이메일을 입력해주세요.')
      emailRef.current?.focus()
      return
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', formData.email)
      .maybeSingle()

    if (error) return alert('이메일 확인 중 오류가 발생했습니다.')
    
    if (data) {
      alert('이미 등록된 이메일입니다.')
      setFormData(prev => ({ ...prev, email: '' }))
      setIsEmailChecked(false)
      emailRef.current?.focus()
    } else {
      alert('사용 가능한 이메일입니다.')
      setIsEmailChecked(true)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isIdChecked) return alert('아이디 중복 확인을 해주세요.')
    if (!isEmailChecked) return alert('이메일 중복 확인을 해주세요.')
    if (formData.password !== formData.confirmPassword) return alert('비밀번호가 일치하지 않습니다.')

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.name,
          login_id: formData.loginId,
          phone_number: formData.phone
        }
      }
    })

    if (error) {
      alert(error.message)
    } else {
      alert('회원가입이 완료되었습니다!')
      router.push('/login')
    }
    setLoading(false)
  }

  // --- 스타일 정의 ---
  const labelStyle = { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#333' }
  const inputContainerStyle = { marginBottom: '18px' }
  const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' as const }
  const checkBtnStyle = (checked: boolean) => ({
    padding: '0 15px', borderRadius: '8px', border: '1px solid #007bff', 
    backgroundColor: checked ? '#e7f3ff' : '#fff', color: '#007bff', 
    cursor: 'pointer', whiteSpace: 'nowrap' as const, fontWeight: 'bold' as const, fontSize: '12px'
  })

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f7fa', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ padding: '40px', width: '100%', maxWidth: '450px', backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>신규 회원가입</h2>
        <form onSubmit={handleSignUp}>
          
          <div style={inputContainerStyle}>
            <RequiredLabel>이름</RequiredLabel>
            <input style={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>

          <div style={inputContainerStyle}>
            <RequiredLabel>아이디</RequiredLabel>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input ref={loginIdRef} style={inputStyle} value={formData.loginId} onChange={e => {setFormData({...formData, loginId: e.target.value}); setIsIdChecked(false);}} required />
              <button type="button" onClick={checkDuplicateId} style={checkBtnStyle(isIdChecked)}>
                {isIdChecked ? '확인됨' : '중복확인'}
              </button>
            </div>
          </div>

          <div style={inputContainerStyle}>
            <RequiredLabel>이메일</RequiredLabel>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input ref={emailRef} type="email" style={inputStyle} value={formData.email} onChange={e => {setFormData({...formData, email: e.target.value}); setIsEmailChecked(false);}} required />
              <button type="button" onClick={checkDuplicateEmail} style={checkBtnStyle(isEmailChecked)}>
                {isEmailChecked ? '확인됨' : '중복확인'}
              </button>
            </div>
          </div>

          <div style={inputContainerStyle}>
            <RequiredLabel>비밀번호</RequiredLabel>
            <input style={inputStyle} type="password" value={formData.password} placeholder="6자 이상 입력" onChange={e => setFormData({...formData, password: e.target.value})} required />
          </div>

          <div style={inputContainerStyle}>
            <RequiredLabel>비밀번호 확인</RequiredLabel>
            <input style={inputStyle} type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} required />
            {formData.confirmPassword && (
              <p style={{ fontSize: '12px', color: formData.password === formData.confirmPassword ? 'green' : 'red', marginTop: '5px' }}>
                {formData.password === formData.confirmPassword ? '✅ 일치합니다.' : '❌ 일치하지 않습니다.'}
              </p>
            )}
          </div>

          <div style={inputContainerStyle}>
            <RequiredLabel>전화번호</RequiredLabel>
            <input style={inputStyle} placeholder="01012345678" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
            {loading ? '처리 중...' : '저장하기'}
          </button>
          
          <button type="button" onClick={() => router.push('/login')} style={{ width: '100%', padding: '14px', backgroundColor: '#eee', color: '#666', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}>
            취소하기
          </button>
        </form>
      </div>
    </div>
  )
}