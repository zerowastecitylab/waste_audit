'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function NewAuditPage() {
  const [userId, setUserId] = useState<number | null>(null)
  const [recentDischargeLocs, setRecentDischargeLocs] = useState<string[]>([])
  const [recentAuditLocs, setRecentAuditLocs] = useState<string[]>([])
  const [bagSpecs, setBagSpecs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    discharge_date: new Date().toISOString().split('T')[0],
    discharge_confirm_time: '', 
    discharge_location: '',
    audit_location: '', 
    audit_date: new Date().toISOString().split('T')[0],
    // audit_time은 내부적으로 현재 시간을 생성하여 저장할 예정입니다.
    bag_spec_id: '',    
    total_weight: 0
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setUserId(user.id)
      fetchInitialData(user.id)
    }
  }, [])

  const fetchInitialData = async (uid: number) => {
    const { data: history } = await supabase
      .from('waste_bags')
      .select('discharge_location, audit_location')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (history) {
      const dLocs = Array.from(new Set(history.map(item => item.discharge_location).filter(Boolean)))
      setRecentDischargeLocs(dLocs.slice(0, 5))
      const aLocs = Array.from(new Set(history.map(item => item.audit_location).filter(Boolean)))
      setRecentAuditLocs(aLocs.slice(0, 5))
    }

    const { data: specs } = await supabase
      .from('bag_specs')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: true })
    
    if (specs) setBagSpecs(specs)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !formData.bag_spec_id) {
      return alert('필수 정보를 모두 입력해주세요.')
    }

    setLoading(true)

    // 감사 시간을 현재 시간(HH:MM)으로 생성
    const currentAuditTime = new Date().toTimeString().slice(0, 5);

    const insertData = {
      discharge_date: formData.discharge_date,
      discharge_confirm_time: formData.discharge_confirm_time || null,
      discharge_location: formData.discharge_location,
      audit_location: formData.audit_location,
      audit_date: formData.audit_date,
      audit_time: currentAuditTime, // 폼 입력 대신 현재 시간 저장
      total_weight: Number(formData.total_weight),
      bag_spec_id: Number(formData.bag_spec_id),
      user_id: userId,
      residual_weight: 0 
    }

    const { data, error } = await supabase
      .from('waste_bags')
      .insert([insertData])
      .select()

    if (error) {
      console.error(error)
      alert(`저장 실패: ${error.message}`)
      setLoading(false)
    } else {
      alert('등록되었습니다!')
      window.location.href = `/dashboard/analysis/${data[0].id}`
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc',
    backgroundColor: '#fff', fontSize: '16px', boxSizing: 'border-box', marginTop: '5px'
  }

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333' }
  const Required = () => <span style={{ color: '#ff4d4f', marginLeft: '2px' }}>*</span>;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h3 style={{ marginBottom: '25px', textAlign: 'center' }}>📦 배출 및 감사 정보 입력</h3>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* 1. 배출 정보 */}
        <div style={{ padding: '15px', border: '1px solid #eee', borderRadius: '10px', backgroundColor: '#fafafa' }}>
          <p style={{ marginTop: 0, fontWeight: 'bold', color: '#007bff' }}>1. 배출 정보 (Discharge)</p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>배출일<Required /></label>
              <input type="date" required style={inputStyle} value={formData.discharge_date} 
                onChange={e => setFormData({...formData, discharge_date: e.target.value})} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>확인 시간</label>
              <input type="time" style={inputStyle} value={formData.discharge_confirm_time} 
                onChange={e => setFormData({...formData, discharge_confirm_time: e.target.value})} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>배출 장소<Required /></label>
            <input type="text" list="recent-d-locs" required style={inputStyle} placeholder="장소 입력 또는 선택"
              value={formData.discharge_location} onChange={e => setFormData({...formData, discharge_location: e.target.value})} />
            <datalist id="recent-d-locs">
              {recentDischargeLocs.map(loc => <option key={loc} value={loc} />)}
            </datalist>
          </div>
        </div>

        {/* 2. 감사 정보 */}
        <div style={{ padding: '15px', border: '1px solid #eee', borderRadius: '10px', backgroundColor: '#fff' }}>
          <p style={{ marginTop: 0, fontWeight: 'bold', color: '#28a745' }}>2. 감사 정보 (Audit)</p>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={labelStyle}>감사일<Required /></label>
            <input type="date" required style={inputStyle} value={formData.audit_date} 
              onChange={e => setFormData({...formData, audit_date: e.target.value})} />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={labelStyle}>조사 장소<Required /></label>
            <input type="text" list="recent-a-locs" required style={inputStyle} placeholder="감사 진행 장소"
              value={formData.audit_location} onChange={e => setFormData({...formData, audit_location: e.target.value})} />
            <datalist id="recent-a-locs">
              {recentAuditLocs.map(loc => <option key={loc} value={loc} />)}
            </datalist>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>봉투 종류<Required /></label>
              <select required style={inputStyle} value={formData.bag_spec_id} 
                onChange={e => setFormData({...formData, bag_spec_id: e.target.value})}>
                <option value="">선택</option>
                {bagSpecs.map(spec => <option key={spec.id} value={spec.id}>{spec.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>무게 (g)<Required /></label>
              <input type="number" step="0.01" required style={inputStyle} placeholder="0"
                value={formData.total_weight || ''} onChange={e => setFormData({...formData, total_weight: Number(e.target.value)})} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} style={{ 
          padding: '16px', backgroundColor: loading ? '#ccc' : '#28a745', color: '#fff', 
          border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer'
        }}>
          {loading ? '저장 중...' : '분석 시작하기'}
        </button>
      </form>
    </div>
  )
}