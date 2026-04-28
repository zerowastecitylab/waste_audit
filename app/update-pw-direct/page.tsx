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
    // 클라이언트 사이드에서만 sessionStorage 접근
    if (typeof window !== 'undefined') {
      const id = sessionStorage.getItem('reset_user_id')
      if (!id) {
        alert('비정상적인 접근이거나 인증 세션이 만료되었습니다. 다시 시도해주세요.')
        router.push('/find-pw')
      } else {
        setUserId(id)
      }
    }
  }, [router])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    // 1. 유효성 검사
    if (!userId) return alert('유저 정보를 찾을 수 없습니다.')
    if (password !== confirmPassword) return alert('비밀번호가 일치하지 않습니다.')
    if (password.length < 6) return alert('비밀번호는 최소 6자 이상이어야 합니다.')

    setLoading(true)

    try {
      /** * [핵심 로직] RPC 호출
       * - target_user_id: profiles 테이블의 id (auth.users의 UUID)
       * - new_password: 평문 비밀번호
       */
      const { error } = await supabase.rpc('force_update_password', {
        target_user_id: userId,
        new_password: password
      })

      if (error) {
        throw error
      }

      alert('비밀번호가 성공적으로 변경되었습니다. 새로운 비밀번호로 로그인해주세요.')
      
      // 보안을 위해 세션 데이터 삭제
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('reset_user_id')
      }
      
      router.replace('/login')
    } catch (error: any) {
      console.error('비밀번호 변경 에러:', error)
      alert('변경 실패: ' + (error.message || '알 수 없는 오류가 발생했습니다.'))
    } finally {
      setLoading(false)
    }
  }

  // 기존 스타일 유지
  const cardStyle = { padding: '40px', width: '100%', maxWidth: '400px', backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }
  const inputStyle = { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' as const }
  const primaryBtnStyle = { 
    width: '100%', padding: '14px', borderRadius: '8px', border: 'none', 
    backgroundColor: (loading || password !== confirmPassword || !password) ? '#ccc' : '#007bff', 
    color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: (loading || password !== confirmPassword || !password) ? 'default' : 'pointer', 
    marginTop: '20px', transition: 'background-color 0.2s'
  }
  const grayBtnStyle = { width: '100%', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#eeeeee', color: '#666', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f7fa', fontFamily: 'sans-serif' }}>
      <div style={cardStyle}>
        <h2 style={{ 
          textAlign: 'center', marginBottom: '10px', color: '#333', fontSize: '26px', 
          letterSpacing: '-1px', lineHeight: '1.2' 
        }}><b>폐기물 감사 정보 시스템</b></h2>
        <h3 style={{ textAlign: 'center', marginBottom: '30px', color: '#666', fontSize: '18px' }}>새 비밀번호 설정</h3>
        
        <form onSubmit={handleUpdate}>
          <div style={{ marginBottom: '5px', fontSize: '13px', color: '#333', fontWeight: 'bold' }}>새 비밀번호</div>
          <input 
            type="password" 
            placeholder="최소 6자 이상 입력" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={inputStyle} 
            required 
          />
          
          <div style={{ marginBottom: '5px', marginTop: '10px', fontSize: '13px', color: '#333', fontWeight: 'bold' }}>비밀번호 확인</div>
          <input 
            type="password" 
            placeholder="다시 한번 입력" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            style={inputStyle} 
            required 
          />
          
          {confirmPassword && (
            <p style={{ fontSize: '12px', color: password === confirmPassword ? '#28a745' : '#ff4d4f', marginBottom: '10px', marginLeft: '2px' }}>
              {password === confirmPassword ? '✅ 비밀번호가 일치합니다.' : '❌ 비밀번호가 일치하지 않습니다.'}
            </p>
          )}

          <button 
            type="submit" 
            disabled={loading || !password || password !== confirmPassword} 
            style={primaryBtnStyle as any}
          >
            {loading ? '변경 처리 중...' : '비밀번호 변경 완료'}
          </button>
        </form>
        
        <button onClick={() => router.push('/login')} style={grayBtnStyle}>취소하고 로그인으로</button>
      </div>
    </div>
  )
}