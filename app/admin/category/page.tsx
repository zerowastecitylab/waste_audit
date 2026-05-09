'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import CategoryEditModal from './CategoryEditModal'
import * as XLSX from 'xlsx'

export default function CategoryManagementPage() {
  const [list, setList] = useState<any[]>([])
  const [mainList, setMainList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  
  // 1. 검색 상태 복구 (분류명 + 확인여부)
  const [searchTerm, setSearchTerm] = useState('')
  const [confirmFilter, setConfirmFilter] = useState('ALL') // ALL, Y, N

  useEffect(() => {
    fetchData()
    loadMainCategories()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('v_category_management')
      .select('*')
      .order('main_order', { ascending: true, nullsFirst: false })
      .order('mid_name', { ascending: true })
      .order('detail_name', { ascending: true })

    if (!error) setList(data || [])
    setLoading(false)
  }

  const loadMainCategories = async () => {
    const { data } = await supabase
      .from('main_categories')
      .select('*')
      .order('display_order', { ascending: true })
    setMainList(data || [])
  }

  const downloadExcel = () => {
    // 1. 날짜 포맷팅 (MMDDHHMMSS)
    const now = new Date();
    const dateStr = [
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0'),
    ].join('');

    const worksheet = XLSX.utils.json_to_sheet(filteredList.map((item, index) => ({
      '번호': index + 1,
      '대분류': item.main_name,
      '중분류': item.mid_name,
      '상세분류': item.detail_name,
      '확인상태': item.is_confirmed,
      '등록건수': item.item_count
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "카테고리목록");
    
    // 파일명 뒤에 날짜 문자열 결합
    XLSX.writeFile(workbook, `category_list_${dateStr}.xlsx`);
  };

  const handleModalSave = async () => {
    setIsEditModalOpen(false)
    await fetchData()
    await loadMainCategories()
  }

  // 검색 필터링 로직 (분류명 AND 확인여부)
  const filteredList = list.filter(item => {
    const matchesSearch = (item.main_name + item.mid_name + item.detail_name).includes(searchTerm)
    const matchesConfirm = confirmFilter === 'ALL' || item.is_confirmed === confirmFilter
    return matchesSearch && matchesConfirm
  })

  return (
    <div style={containerStyle}>
      <div style={headerSectionStyle}>
        <h2>카테고리 관리</h2>
      </div>

      {/* 검색 바: 너비를 50%로 조정 */}
      <div style={searchWrapperStyle}>
        <div style={searchSectionStyle}>
          <input 
            type="text" 
            placeholder="분류명 입력..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            style={{ ...searchInputStyle, flex: 1 }}
          />
          <select 
            value={confirmFilter} 
            onChange={(e) => setConfirmFilter(e.target.value)}
            style={{ ...searchInputStyle, width: '150px' }}
          >
            <option value="ALL">확인여부(전체)</option>
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
      </div>

      {/* 액션 버튼 영역: 검색창 아래, 테이블 위로 이동 */}
      <div style={actionRowStyle}>
        <div style={{ flex: 1 }} /> {/* 왼쪽 공간 확보 */}
        <button onClick={downloadExcel} style={excelBtnStyle}>엑셀 저장</button>
        <button onClick={() => { setSelectedItem({ detail_id: 0, main_id: '', is_confirmed: 'N', item_count: 0 }); setIsEditModalOpen(true); }} style={addBtnStyle}>새로운 카테고리 입력</button>
      </div>

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={theadTrStyle}>
              <th style={{ ...thStyle, width: '70px' }}>번호</th>
              <th style={thStyle}>대분류</th>
              <th style={thStyle}>중분류</th>
              <th style={thStyle}>상세분류</th>
              <th style={thStyle}>확인</th>
              <th style={thStyle}>건수</th>
              <th style={thStyle}>관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map((item, idx) => (
              <tr key={item.detail_id} style={tbodyTrStyle}>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{idx + 1}</td>
                <td style={tdStyle}>{item.main_name}</td>
                <td style={tdStyle}>{item.mid_name}</td>
                <td style={tdStyle}>{item.detail_name}</td>
                <td style={tdStyle}>{item.is_confirmed}</td>
                <td style={tdStyle}>{item.item_count}</td>
                <td style={tdStyle}>
                  <button onClick={() => { setSelectedItem(item); setIsEditModalOpen(true); }} style={editBtnStyle}>수정</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isEditModalOpen && selectedItem && (
        <CategoryEditModal 
          item={selectedItem} 
          mainList={mainList} 
          onClose={() => setIsEditModalOpen(false)} 
          onSave={handleModalSave} 
        />
      )}
    </div>
  )
}

// 스타일 수정
const containerStyle: React.CSSProperties = { padding: '30px', maxWidth: '1200px', margin: '0 auto' }
const headerSectionStyle: React.CSSProperties = { marginBottom: '20px' }
const searchWrapperStyle: React.CSSProperties = { display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }
const searchSectionStyle: React.CSSProperties = { display: 'flex', gap: '10px', width: '50%' } // 너비 50%
const actionRowStyle: React.CSSProperties = { display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }
const searchInputStyle: React.CSSProperties = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' }
const tableWrapperStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' }
const theadTrStyle: React.CSSProperties = { backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }
const tbodyTrStyle: React.CSSProperties = { borderBottom: '1px solid #f1f1f1' }
const thStyle: React.CSSProperties = { padding: '15px', textAlign: 'left', fontWeight: '600', color: '#444' }
const tdStyle: React.CSSProperties = { padding: '15px', color: '#666', verticalAlign: 'middle' }
const addBtnStyle = { padding: '10px 20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
const excelBtnStyle = { padding: '10px 20px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
const editBtnStyle = { padding: '6px 12px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }