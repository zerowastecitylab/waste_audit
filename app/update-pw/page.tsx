'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function UpdatePwPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) return alert('비밀번호가 일치하지 않습니다.')

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      alert('변경 실패: ' + error.message)
    } else {
      alert('비밀번호가 성공적으로 변경되었습니다. 다시 로그인 해주세요.')
      await supabase.auth.signOut()
      router.push('/login')
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f7fa', fontFamily: 'sans-serif' }}>
      <div style={{ padding: '40px', width: '100%', maxWidth: '400px', backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>새 비밀번호 설정</h2>
        <form onSubmit={handleUpdate}>
          <input type="password" placeholder="새 비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} required />
          <input type="password" placeholder="새 비밀번호 확인" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '25px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} required />
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            비밀번호 변경하기
          </button>
        </form>
      </div>
    </div>
  )
}