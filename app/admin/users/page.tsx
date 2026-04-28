'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  full_name: string
  login_id: string
  role: string
  phone_number: string
  email: string
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]) // 검색용 상태 추가
  const [searchTerm, setSearchTerm] = useState('') // 검색어 상태
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [newRole, setNewRole] = useState('')
  const [loading, setLoading] = useState(true)

  // 1. 사용자 목록 불러오기 (이름 오름차순)
  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true })

    if (error) alert('데이터를 불러오지 못했습니다.')
    else {
      setUsers(data || [])
      setFilteredUsers(data || []) // 초기값 설정
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // 2. 검색 로직 (사용자 이름 부분 일치 검색)
  useEffect(() => {
    const results = users.filter(user =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(results)
  }, [searchTerm, users])

  // 3. 권한 수정 함수
  const handleUpdateRole = async () => {
    if (!selectedUser) return

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', selectedUser.id)

    if (error) {
      alert('수정 중 오류가 발생했습니다.')
    } else {
      alert(`${selectedUser.full_name}님의 권한이 ${newRole}(으)로 변경되었습니다.`)
      setSelectedUser(null)
      fetchUsers()
    }
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>사용자 권한 관리</h2>
        
        {/* 검색창 영역 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>이름 검색:</span>
          <input 
            type="text" 
            placeholder="사용자 이름 입력..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyle}
          />
        </div>
      </div>

      {/* 테이블 리스트 (filteredUsers를 사용) */}
      <table style={tableStyle}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={thStyle}>번호</th>
            <th style={thStyle}>이름</th>
            <th style={thStyle}>아이디</th>
            <th style={thStyle}>권한</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user, index) => (
              <tr key={user.id} style={trStyle}>
                <td style={tdStyle}>{index + 1}</td>
                <td style={{ ...tdStyle, color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }} 
                    onClick={() => { setSelectedUser(user); setNewRole(user.role); }}>
                  {user.full_name}
                </td>
                <td style={tdStyle}>{user.login_id}</td>
                <td style={tdStyle}>
                  <span style={roleBadgeStyle(user.role)}>{user.role === 'admin' ? '관리자' : '사용자'}</span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                검색 결과가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 상세 정보 및 수정 모달 창 (이전과 동일) */}
      {selectedUser && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>사용자 상세 정보</h3>
            </div>
            
            <div style={modalBodyStyle}>
              <div style={infoGroupStyle}>
                <label style={labelStyle}>이름</label>
                <div style={valueStyle}>{selectedUser.full_name}</div>
              </div>
              <div style={infoGroupStyle}>
                <label style={labelStyle}>아이디</label>
                <div style={valueStyle}>{selectedUser.login_id}</div>
              </div>
              <div style={infoGroupStyle}>
                <label style={labelStyle}>전화번호</label>
                <div style={valueStyle}>{selectedUser.phone_number || '-'}</div>
              </div>
              <div style={infoGroupStyle}>
                <label style={labelStyle}>이메일 주소</label>
                <div style={valueStyle}>{selectedUser.email}</div>
              </div>
              <div style={{ ...infoGroupStyle, borderBottom: 'none' }}>
                <label style={labelStyle}>권한 설정</label>
                <select style={modernSelectStyle} value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                  <option value="user">일반 사용자 (User)</option>
                  <option value="admin">시스템 관리자 (Admin)</option>
                </select>
              </div>
            </div>
            
            <div style={modalFooterStyle}>
              <button style={grayBtnStyle} onClick={() => setSelectedUser(null)}>닫기</button>
              <button style={blueBtnStyle} onClick={handleUpdateRole}>수정 사항 저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- 추가된 스타일 ---
const searchInputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '14px',
  width: '200px',
  outline: 'none'
}

// --- 기존 스타일 정의 (유지) ---
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: '10px' }
const thStyle: React.CSSProperties = { borderBottom: '2px solid #eee', padding: '12px', textAlign: 'left', fontSize: '14px' }
const tdStyle: React.CSSProperties = { borderBottom: '1px solid #eee', padding: '12px', fontSize: '14px' }
const trStyle = { transition: 'background 0.2s' }
const roleBadgeStyle = (role: string) => ({
  padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
  backgroundColor: role === 'admin' ? '#fff0f0' : '#eefaff',
  color: role === 'admin' ? '#ff4d4f' : '#007bff',
  border: role === 'admin' ? '1px solid #ffccc7' : '1px solid #91d5ff'
})
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' }
const modalContentStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '16px', width: '450px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }
const modalHeaderStyle: React.CSSProperties = { padding: '20px 25px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }
const modalBodyStyle: React.CSSProperties = { padding: '25px' }
const modalFooterStyle: React.CSSProperties = { padding: '15px 25px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#fafafa' }
const infoGroupStyle: React.CSSProperties = { marginBottom: '15px', paddingBottom: '12px', borderBottom: '1px solid #f5f5f5' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }
const valueStyle: React.CSSProperties = { fontSize: '15px', color: '#333', fontWeight: '500' }
const modernSelectStyle: React.CSSProperties = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', marginTop: '5px', outline: 'none' }
const blueBtnStyle: React.CSSProperties = { padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }
const grayBtnStyle: React.CSSProperties = { padding: '10px 20px', backgroundColor: '#e0e0e0', color: '#444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }