'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewAuditPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
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
    bag_spec_id: '',    
    total_weight: 0,
    remarks: '' // [추가] 비고 항목 초기값
  })

  useEffect(() => {
    fetchBagSpecs();

    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        if (user && user.id) {
          const stringId = String(user.id);
          setUserId(stringId)
          fetchHistory(stringId)
        } 
      } catch (e) {
        console.error("세션 파싱 에러:", e)
      }
    } 
  }, [])

  const fetchBagSpecs = async () => {
    const { data: specs, error: specError } = await supabase
      .from('bag_specs')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: true })
    
    if (specs) setBagSpecs(specs)
  }

  const fetchHistory = async (uid: string) => {
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
  }

  const handleSessionExpired = () => {
    alert('로그인 세션이 만료되었습니다. 다시 로그인해주세요.')
    router.replace('/login')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) return handleSessionExpired()

    if (!formData.bag_spec_id || formData.total_weight <= 0) {
      alert("봉투 종류와 무게를 정확히 입력해주세요.")
      return
    }

    setLoading(true)
    const currentAuditTime = new Date().toTimeString().slice(0, 5);

    const insertData = {
      discharge_date: formData.discharge_date,
      discharge_confirm_time: formData.discharge_confirm_time || null,
      discharge_location: formData.discharge_location,
      audit_location: formData.audit_location,
      audit_date: formData.audit_date,
      audit_time: currentAuditTime,
      total_weight: Math.floor(formData.total_weight), 
      bag_spec_id: Number(formData.bag_spec_id),
      user_id: userId, 
      residual_weight: 0,
      remarks: formData.remarks // [추가] 비고 데이터 전송
    }

    const { data, error } = await supabase
      .from('waste_bags')
      .insert([insertData])
      .select()

    if (error) {
      alert(`저장 실패: ${error.message}`)
      setLoading(false)
    } else {
      alert('등록되었습니다!')
      if (data && data[0]) {
        router.push(`/dashboard/analysis/${data[0].id}`)
      }
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
        
        {/* 1. 배출 정보 섹션 */}
        <div style={{ padding: '15px', border: '1px solid #eee', borderRadius: '10px', backgroundColor: '#fafafa' }}>
          <p style={{ marginTop: 0, marginBottom: '15px', fontWeight: 'bold', color: '#007bff' }}>1. 배출 정보 (Discharge)</p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
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
            <input 
              type="text" 
              list="recent-d-locs" 
              required 
              style={inputStyle} 
              placeholder="장소 입력 또는 선택"
              maxLength={50} // [추가] 길이 제한
              value={formData.discharge_location} 
              onChange={e => setFormData({...formData, discharge_location: e.target.value})} 
            />
            <datalist id="recent-d-locs">
              {recentDischargeLocs.map(loc => <option key={loc} value={loc} />)}
            </datalist>
          </div>
        </div>

        {/* 2. 감사 정보 섹션 */}
        <div style={{ padding: '15px', border: '1px solid #eee', borderRadius: '10px', backgroundColor: '#fff' }}>
          <p style={{ marginTop: 0, marginBottom: '15px', fontWeight: 'bold', color: '#28a745' }}>2. 감사 정보 (Audit)</p>
          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>감사일<Required /></label>
            <input type="date" required style={inputStyle} value={formData.audit_date} 
              onChange={e => setFormData({...formData, audit_date: e.target.value})} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>조사 장소<Required /></label>
            <input 
              type="text" 
              list="recent-a-locs" 
              required 
              style={inputStyle} 
              placeholder="감사 진행 장소"
              maxLength={50} // [추가] 길이 제한
              value={formData.audit_location} 
              onChange={e => setFormData({...formData, audit_location: e.target.value})} 
            />
            <datalist id="recent-a-locs">
              {recentAuditLocs.map(loc => <option key={loc} value={loc} />)}
            </datalist>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
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
              <input 
                type="number" 
                step="1" 
                required 
                style={inputStyle} 
                placeholder="0"
                onInput={(e: any) => { if(e.target.value.length > 7) e.target.value = e.target.value.slice(0, 7) }} // [추가] 무게 자릿수 제한
                value={formData.total_weight || ''} 
                onChange={e => setFormData({...formData, total_weight: parseInt(e.target.value) || 0})} 
              />
            </div>
          </div>

          {/* [추가 항목] 비고 (Remarks) */}
          <div style={{ marginTop: '5px' }}>
            <label style={labelStyle}>비고 (특이사항)</label>
            <textarea 
              placeholder="봉투 훼손 상태나 특이사항을 입력하세요 (최대 200자)"
              style={{ ...inputStyle, height: '80px', resize: 'none' }}
              maxLength={200} // [추가] 길이 제한
              value={formData.remarks}
              onChange={e => setFormData({...formData, remarks: e.target.value})}
            />
            <div style={{ textAlign: 'right', fontSize: '11px', color: '#888', marginTop: '4px' }}>
              {formData.remarks.length} / 200
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} style={{ 
          padding: '16px', backgroundColor: loading ? '#ccc' : '#28a745', color: '#fff', 
          border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer',
          marginTop: '10px'
        }}>
          {loading ? '저장 중...' : '분석 시작하기'}
        </button>
      </form>
    </div>
  )
}