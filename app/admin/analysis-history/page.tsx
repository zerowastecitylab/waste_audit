'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface LocationHistory {
  discharge_location: string
  audit_period: string
  recycling_count: number
  general_waste_count: number
  total_sum_weight: number
  min_audit_date: string
  max_audit_date: string
}

export default function AnalysisHistoryPage() {
  const [activeTab, setActiveTab] = useState<'location' | 'bag'>('location')
  const [locationData, setLocationData] = useState<LocationHistory[]>([])
  const [filteredData, setFilteredData] = useState<LocationHistory[]>([])
  const [loading, setLoading] = useState(true)

  // 필터 상태 (작성자 제거)
  const [searchDate, setSearchDate] = useState('')
  const [searchLocation, setSearchLocation] = useState('')

  useEffect(() => {
    if (activeTab === 'location') {
      fetchLocationData()
    }
  }, [activeTab])

  const fetchLocationData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('v_analysis_by_location')
      .select('*')
      .order('min_audit_date', { ascending: false })

    if (!error && data) {
      setLocationData(data)
      setFilteredData(data)
    }
    setLoading(false)
  }

  // 필터링 로직
  useEffect(() => {
    const filtered = locationData.filter(item => {
      const matchLocation = (item.discharge_location || '').includes(searchLocation)
      const matchDate = !searchDate || (searchDate >= item.min_audit_date && searchDate <= item.max_audit_date)
      return matchLocation && matchDate
    })
    setFilteredData(filtered)
  }, [searchDate, searchLocation, locationData])

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>과거 분석 내역 확인</h2>

      {/* 탭 메뉴 */}
      <div style={tabContainerStyle}>
        <button 
          style={activeTab === 'location' ? activeTabStyle : tabStyle} 
          onClick={() => setActiveTab('location')}
        >
          배출 장소별 요약
        </button>
        <button 
          style={activeTab === 'bag' ? activeTabStyle : tabStyle} 
          onClick={() => setActiveTab('bag')}
        >
          쓰레기 봉투별 상세
        </button>
      </div>

      {activeTab === 'location' ? (
        <>
          {/* 검색 영역 */}
          <div style={searchAreaStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>감사 날짜</label>
              <input type="date" style={inputStyle} value={searchDate} onChange={e => setSearchDate(e.target.value)} />
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>배출 장소</label>
              <input placeholder="장소명 입력..." style={inputStyle} value={searchLocation} onChange={e => setSearchLocation(e.target.value)} />
            </div>
            <button style={resetBtnStyle} onClick={() => {setSearchDate(''); setSearchLocation('');}}>초기화</button>
          </div>

          {/* 테이블 */}
          <table style={tableStyle}>
            <thead>
              <tr style={theadTrStyle}>
                <th style={thStyle}>번호</th>
                <th style={thStyle}>배출 장소</th>
                <th style={thStyle}>감사 일정</th>
                <th style={thStyle}>재활용(개)</th>
                <th style={thStyle}>종량제(개)</th>
                <th style={thStyle}>총 무게(kg)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>로딩 중...</td></tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item, idx) => (
                  <tr key={idx} style={tbodyTrStyle}>
                    <td style={tdStyle}>{idx + 1}</td>
                    <td style={tdStyle}><strong>{item.discharge_location}</strong></td>
                    <td style={tdStyle}>{item.audit_period}</td>
                    <td style={tdStyle}>{item.recycling_count}</td>
                    <td style={tdStyle}>{item.general_waste_count}</td>
                    <td style={tdStyle}>{item.total_sum_weight?.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>데이터가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </>
      ) : (
        <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
          두 번째 탭(쓰레기 봉투별 상세) 기능을 준비 중입니다.
        </div>
      )}
    </div>
  )
}

// --- 스타일 (요청하신 대로 깔끔한 디자인 유지) ---
// 모든 스타일 객체에 React.CSSProperties 타입을 명시하여 TS 에러를 방지합니다.
const containerStyle: React.CSSProperties = { padding: '30px', maxWidth: '1100px', margin: '0 auto' }
const titleStyle: React.CSSProperties = { fontSize: '22px', fontWeight: 'bold', marginBottom: '20px' }

const tabContainerStyle: React.CSSProperties = { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee' }
const tabStyle: React.CSSProperties = { padding: '10px 20px', cursor: 'pointer', backgroundColor: 'transparent', border: 'none', color: '#888' }
const activeTabStyle: React.CSSProperties = { ...tabStyle, borderBottom: '3px solid #007bff', color: '#007bff', fontWeight: 'bold' }

const searchAreaStyle: React.CSSProperties = { display: 'flex', gap: '15px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px', alignItems: 'flex-end' }

// [수정 포인트] 이 부분에 타입을 명시하면 flexDirection 에러가 해결됩니다.
const inputGroupStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '5px' }

const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 'bold', color: '#666' }
const inputStyle: React.CSSProperties = { padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }
const resetBtnStyle: React.CSSProperties = { padding: '8px 15px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' }
const theadTrStyle: React.CSSProperties = { backgroundColor: '#f1f3f5' }
const thStyle: React.CSSProperties = { padding: '12px', textAlign: 'left', fontSize: '14px', borderBottom: '2px solid #dee2e6' }
const tbodyTrStyle: React.CSSProperties = { borderBottom: '1px solid #eee' }
const tdStyle: React.CSSProperties = { padding: '12px', fontSize: '14px' }