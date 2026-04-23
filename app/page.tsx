// 'use client'

// import { useState } from 'react'
// import { supabase } from '../lib/supabase'

// export default function LoginPage() {
//   const [loginId, setLoginId] = useState('')
//   const [password, setPassword] = useState('')
//   const [loading, setLoading] = useState(false)

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setLoading(true)

//     // 1. users 테이블에서 ID와 PW가 일치하는 사용자 찾기
//     const { data, error } = await supabase
//       .from('users')
//       .select('*')
//       .eq('login_id', loginId)
//       .eq('password', password)
//       .single()

//     if (error || !data) {
//       alert('아이디 또는 비밀번호가 틀렸습니다.')
//       setLoading(false)
//       return
//     }

//     // 2. 로그인 성공 시 브라우저에 사용자 정보 임시 저장
//     localStorage.setItem('user', JSON.stringify(data))
    
//     // 3. 환영 메시지 후 대시보드로 이동
//     //alert(`${data.user_name}님, 환영합니다! 분석을 시작합니다.`)
//     window.location.href = '/dashboard' 
//   }

//   return (
//     <div style={{ 
//       display: 'flex', justifyContent: 'center', alignItems: 'center', 
//       height: '100vh', backgroundColor: '#f5f7fa', fontFamily: 'sans-serif' 
//     }}>
//       <div style={{ 
//         padding: '40px', width: '100%', maxWidth: '400px', 
//         backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' 
//       }}>
//         <h1 style={{ marginBottom: '10px', color: '#333', textAlign: 'center' }}>쓰레기 성상 분석 시스템</h1>
//         <p style={{ marginBottom: '30px', color: '#666', fontSize: '14px', textAlign: 'center' }}>Waste Audit</p>
        
//         <form onSubmit={handleLogin}>
//           <div style={{ marginBottom: '15px' }}>
//             <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>아이디</label>
//             <input 
//               type="text" 
//               value={loginId}
//               onChange={(e) => setLoginId(e.target.value)}
//               style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
//               placeholder="아이디"
//               required
//             />
//           </div>
//           <div style={{ marginBottom: '25px' }}>
//             <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>비밀번호</label>
//             <input 
//               type="password" 
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
//               placeholder="비밀번호"
//               required
//             />
//           </div>
//           <button 
//             type="submit" 
//             disabled={loading}
//             style={{ 
//               width: '100%', padding: '14px', borderRadius: '8px', border: 'none',
//               backgroundColor: '#007bff', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'
//             }}
//           >
//             {loading ? '로그인 중...' : '로그인'}
//           </button>
//         </form>
//       </div>
//     </div>
//   )
// }


'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // 로그인 되어 있으면 대시보드나 분석 페이지로
        router.replace('/dashboard')
      } else {
        // 로그인 안 되어 있으면 로그인 페이지로
        router.replace('/login')
      }
    }
    checkUser()
  }, [router])

  // 체크하는 동안 잠깐 보여줄 로딩 화면
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>사용자 확인 중...</p>
    </div>
  )
}