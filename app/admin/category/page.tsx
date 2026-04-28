'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface CategoryItem {
  detail_id: number
  main_name: string
  main_id: string
  mid_name: string
  mid_id: string
  detail_name: string
  description: string
  is_confirmed: string
  mid_category_id: number
  item_count: number
}

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [filteredData, setFilteredData] = useState<CategoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [confirmFilter, setConfirmFilter] = useState('ALL')
  
  const [selectedItem, setSelectedItem] = useState<CategoryItem | null>(null)
  const [isNewRegistration, setIsNewRegistration] = useState(false) // 등록 모드 구분
  const [mainList, setMainList] = useState<any[]>([])
  const [midList, setMidList] = useState<any[]>([]) 
  
  const [editForm, setEditForm] = useState({ 
    main_id: '', 
    mid_category_id: '', 
    detail_name: '', 
    description: '', 
    is_confirmed: 'N' 
  })

  useEffect(() => {
    fetchData()
    loadMainCategories()
  }, [])

  const fetchData = async () => {
    const { data } = await supabase.from('v_category_management').select('*')
    setCategories(data || [])
    setFilteredData(data || [])
  }

  const loadMainCategories = async () => {
    const { data } = await supabase.from('main_categories').select('id, name_ko').order('name_ko')
    setMainList(data || [])
  }

  const loadMidCategories = async (mainId: string) => {
    if (!mainId) { setMidList([]); return; }
    const { data } = await supabase
      .from('mid_categories')
      .select('id, name_ko')
      .eq('main_category_id', mainId)
      .neq('id', 9999)
      .order('name_ko')
    setMidList(data || [])
  }

  // 검색 필터링
  useEffect(() => {
    const result = categories.filter(item => {
      const matchText = (item.main_name || '').includes(searchTerm) || 
                        (item.mid_name || '').includes(searchTerm) || 
                        (item.detail_name || '').includes(searchTerm)
      const matchConfirm = confirmFilter === 'ALL' ? true : item.is_confirmed === confirmFilter
      return matchText && matchConfirm
    })
    setFilteredData(result)
  }, [searchTerm, confirmFilter, categories])

  // [신규] 등록 버튼 클릭 시 호출
  const openRegisterModal = () => {
    setIsNewRegistration(true)
    setSelectedItem({ detail_id: 0 } as CategoryItem) // 빈 아이템 객체 생성
    setEditForm({ main_id: '', mid_category_id: '', detail_name: '', description: '', is_confirmed: 'N' })
    setMidList([])
  }

  // 수정 모달 열기
  const openEditModal = async (item: CategoryItem) => {
    setIsNewRegistration(false)
    setSelectedItem(item)
    setEditForm({
      main_id: item.main_id ? String(item.main_id) : '',
      mid_category_id: item.mid_category_id ? String(item.mid_category_id) : '',
      detail_name: item.detail_name,
      description: item.description || '',
      is_confirmed: item.is_confirmed || 'N'
    })
    if (item.main_id) await loadMidCategories(String(item.main_id))
  }

  // 저장 (등록 및 수정 통합)
  const handleSave = async () => {
    if (!editForm.main_id || !editForm.mid_category_id || !editForm.detail_name) {
      return alert('필수 항목(*)을 모두 입력해주세요.')
    }

    const payload = {
      mid_category_id: parseInt(editForm.mid_category_id),
      name_ko: editForm.detail_name,
      description: editForm.description,
      is_confirmed: editForm.is_confirmed
    }

    let error;
    if (isNewRegistration) {
      // 등록 로직
      const { error: insErr } = await supabase.from('detail_categories').insert([payload])
      error = insErr
    } else {
      // 수정 로직
      const { error: updErr } = await supabase.from('detail_categories').update(payload).eq('id', selectedItem?.detail_id)
      error = updErr
    }

    if (error) {
      alert('저장 실패: ' + error.message)
    } else {
      alert(isNewRegistration ? '성공적으로 등록되었습니다.' : '수정되었습니다.')
      setSelectedItem(null)
      fetchData()
    }
  }

  // 삭제 로직
  const handleDelete = async () => {
    if (isNewRegistration || !selectedItem) return
    if (selectedItem.item_count > 0) {
      alert(`아이템이 ${selectedItem.item_count}건 있어 삭제할 수 없습니다.`)
      return
    }
    if (!confirm("정말로 삭제하시겠습니까?")) return

    const { error } = await supabase.from('detail_categories').delete().eq('id', selectedItem.detail_id)
    if (error) alert('삭제 실패')
    else { alert('삭제되었습니다.'); setSelectedItem(null); fetchData(); }
  }

  return (
    <div style={containerStyle}>
      <h2 style={pageTitleStyle}>폐기물 카테고리 관리</h2>

      {/* 검색 바 영역 */}
      <div style={filterAreaStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>통합 검색</label>
          <input placeholder="검색어 입력..." style={inputStyle} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>확인 상태</label>
          <select style={selectStyle} value={confirmFilter} onChange={e => setConfirmFilter(e.target.value)}>
            <option value="ALL">전체 보기</option>
            <option value="Y">확인 완료(Y)</option>
            <option value="N">미확인(N)</option>
          </select>
        </div>
      </div>

      {/* [추가] 추가 버튼 영역 */}
      <div style={actionRowStyle}>
        <button style={registerBtnStyle} onClick={openRegisterModal}>
          + 새 카테고리 등록
        </button>
      </div>

      {/* 테이블 영역 */}
      <table style={tableStyle}>
        <thead>
          <tr style={theadTrStyle}>
            <th style={thStyle}>번호</th>
            <th style={thStyle}>대분류</th>
            <th style={thStyle}>중분류</th>
            <th style={thStyle}>상세분류</th>
            <th style={thStyle}>아이템 수</th>
            <th style={thStyle}>확인</th>
            <th style={thStyle}>관리</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, idx) => (
            <tr key={item.detail_id} style={tbodyTrStyle}>
              <td style={tdStyle}>{idx + 1}</td>
              <td style={tdStyle}>{item.main_name}</td>
              <td style={tdStyle}>{item.mid_name}</td>
              <td style={tdStyle}><strong>{item.detail_name}</strong></td>
              <td style={tdStyle}>{item.item_count}건</td>
              <td style={tdStyle}>{item.is_confirmed}</td>
              <td style={tdStyle}>
                <button style={editBtnStyle} onClick={() => openEditModal(item)}>수정</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 등록/수정 모달 */}
      {selectedItem && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0 }}>{isNewRegistration ? '새 카테고리 등록' : '카테고리 상세 수정'}</h3>
            </div>
            <div style={modalBodyStyle}>
              <div style={formRowStyle}>
                <label style={formLabelStyle}>대분류 <span style={{color:'red'}}>*</span></label>
                <select style={modalInputStyle} value={editForm.main_id} onChange={async (e) => {
                  const mid = e.target.value;
                  setEditForm({...editForm, main_id: mid, mid_category_id: ''});
                  await loadMidCategories(mid);
                }}>
                  <option value="">대분류 선택</option>
                  {mainList.map(m => <option key={m.id} value={String(m.id)}>{m.name_ko}</option>)}
                </select>
              </div>

              <div style={formRowStyle}>
                <label style={formLabelStyle}>중분류 <span style={{color:'red'}}>*</span></label>
                <select style={modalInputStyle} value={editForm.mid_category_id} onChange={e => setEditForm({...editForm, mid_category_id: e.target.value})}>
                  <option value="">중분류 선택</option>
                  {midList.map(m => <option key={m.id} value={String(m.id)}>{m.name_ko}</option>)}
                </select>
              </div>

              <div style={formRowStyle}>
                <label style={formLabelStyle}>상세분류명 <span style={{color:'red'}}>*</span></label>
                <input style={modalInputStyle} value={editForm.detail_name} onChange={e => setEditForm({...editForm, detail_name: e.target.value})} />
              </div>

              <div style={formRowStyle}>
                <label style={formLabelStyle}>상세 설명</label>
                <textarea style={{...modalInputStyle, height: '60px', resize: 'none'}} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={formLabelStyle}>확인 상태</label>
                  <select style={modalInputStyle} value={editForm.is_confirmed} onChange={e => setEditForm({...editForm, is_confirmed: e.target.value})}>
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                  </select>
                </div>
                {!isNewRegistration && (
                  <div style={{ flex: 1 }}>
                    <label style={formLabelStyle}>아이템 수</label>
                    <div style={{ padding: '10px 0', fontWeight: 'bold' }}>{selectedItem.item_count} 건</div>
                  </div>
                )}
              </div>
            </div>
            <div style={modalFooterStyle}>
              {!isNewRegistration && <button style={deleteBtnStyle} onClick={handleDelete}>삭제</button>}
              <div style={{ flex: 1 }} />
              <button style={cancelBtnStyle} onClick={() => setSelectedItem(null)}>취소</button>
              <button style={saveBtnStyle} onClick={handleSave}>{isNewRegistration ? '등록하기' : '저장하기'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Styles ---
// 모든 스타일 객체에 React.CSSProperties를 명시하여 TS 빌드 에러를 방지합니다.
const containerStyle: React.CSSProperties = { padding: '40px', maxWidth: '1100px', margin: '0 auto' }
const pageTitleStyle: React.CSSProperties = { marginBottom: '30px', fontSize: '24px', fontWeight: 'bold' }
const filterAreaStyle: React.CSSProperties = { display: 'flex', gap: '20px', marginBottom: '15px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '10px' }

// [수정] 에러가 발생했던 지점
const inputGroupStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '5px' }

const labelStyle: React.CSSProperties = { fontSize: '13px', fontWeight: 'bold', color: '#666' }
const inputStyle: React.CSSProperties = { padding: '10px', border: '1px solid #ddd', borderRadius: '6px', width: '300px' }
const selectStyle: React.CSSProperties = { padding: '10px', border: '1px solid #ddd', borderRadius: '6px', width: '160px' }

const actionRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }
const registerBtnStyle: React.CSSProperties = { padding: '10px 20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }
const theadTrStyle: React.CSSProperties = { backgroundColor: '#f1f3f5', borderTop: '2px solid #dee2e6' }
const thStyle: React.CSSProperties = { padding: '15px', textAlign: 'left', fontSize: '14px' }
const tbodyTrStyle: React.CSSProperties = { borderBottom: '1px solid #eee' }
const tdStyle: React.CSSProperties = { padding: '15px', fontSize: '14px' }
const editBtnStyle: React.CSSProperties = { padding: '6px 12px', cursor: 'pointer', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px' }

const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }
const modalContentStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '12px', width: '480px', overflow: 'hidden' }
const modalHeaderStyle: React.CSSProperties = { padding: '20px 25px', borderBottom: '1px solid #eee', backgroundColor: '#f8f9fa' }

// [수정] 여기도 flexDirection: 'column'을 사용하므로 타입을 명시해야 합니다.
const modalBodyStyle: React.CSSProperties = { padding: '25px', display: 'flex', flexDirection: 'column', gap: '18px' }

const modalFooterStyle: React.CSSProperties = { padding: '15px 25px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', backgroundColor: '#f8f9fa' }

// [수정] 여기도 마찬가지입니다.
const formRowStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '6px' }

const formLabelStyle: React.CSSProperties = { fontSize: '14px', fontWeight: 'bold' }
const modalInputStyle: React.CSSProperties = { padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }
const saveBtnStyle: React.CSSProperties = { padding: '12px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
const cancelBtnStyle: React.CSSProperties = { padding: '12px 20px', backgroundColor: '#e9ecef', color: '#495057', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
const deleteBtnStyle: React.CSSProperties = { padding: '12px 15px', backgroundColor: 'transparent', color: '#dc3545', border: '1px solid #dc3545', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }