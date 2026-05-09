'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  item: any
  mainList: any[]
  onClose: () => void
  onSave: () => void
}

export default function CategoryEditModal({ item, mainList, onClose, onSave }: Props) {
  const [loading, setLoading] = useState(false)
  const [midList, setMidList] = useState<any[]>([])

  // 1. 상태 관리 (사라졌던 상태들 포함)
  const [mainId, setMainId] = useState(item.main_id ? String(item.main_id) : '')
  const [newMainName, setNewMainName] = useState('')
  const [mainOrder, setMainOrder] = useState<string | null>(item.main_order ? String(item.main_order).padStart(2, '0') : null)
  const [customOrder, setCustomOrder] = useState('')
  const [isAddingOrder, setIsAddingOrder] = useState(false)

  const [midId, setMidId] = useState(item.mid_category_id ? String(item.mid_category_id) : '')
  const [newMidName, setNewMidName] = useState('')
  const [detailName, setDetailName] = useState(item.detail_name || '')
  
  // [복구] 확인 여부 및 등록 건수
  const [isConfirmed, setIsConfirmed] = useState(item.is_confirmed || 'N')
  const itemCount = item.item_count || 0

  const existingOrders = useMemo(() => {
    const orders = mainList.map((m: any) => m.display_order).filter(Boolean)
    return Array.from(new Set(orders)).sort((a: any, b: any) => Number(a) - Number(b))
  }, [mainList])

  useEffect(() => {
    if (mainId === 'NEW') {
      setMidId('NEW')
      setMidList([])
      setMainOrder(null)
    } else if (mainId) {
      const selectedMain = mainList.find((m: any) => String(m.id) === mainId)
      if (selectedMain) setMainOrder(selectedMain.display_order ? String(selectedMain.display_order).padStart(2, '0') : null)
      loadMidCategories(mainId)
    }
  }, [mainId, mainList])

  const loadMidCategories = async (mId: string) => {
    const { data } = await supabase.from('mid_categories').select('id, name_ko').eq('main_category_id', mId).order('name_ko')
    setMidList(data || [])
  }

  // 삭제 로직 복구
  const handleDelete = async () => {
    if (itemCount > 0) return alert(`등록된 건(${itemCount}건)이 있어 삭제할 수 없습니다.`)
    if (!confirm('정말 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.')) return

    setLoading(true)
    try {
      const { error } = await supabase.from('detail_categories').delete().eq('id', item.detail_id)
      if (error) throw error
      alert('삭제되었습니다.')
      onSave()
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    const finalOrder = isAddingOrder ? customOrder.padStart(2, '0') : mainOrder

    // 2. 유효성 검사 (대분류 이름/순서 -> 중분류 -> 상세분류)
    if (mainId === 'NEW') {
      if (!newMainName.trim()) return alert('새 대분류 이름을 입력해주세요.')
      if (!finalOrder) return alert('대분류 순서를 선택하거나 입력해주세요.')
    } else if (!mainId) return alert('대분류를 선택해주세요.')

    if (midId === 'NEW') {
      if (!newMidName.trim()) return alert('새 중분류 이름을 입력해주세요.')
    } else if (!midId) return alert('중분류를 선택해주세요.')

    if (!detailName.trim()) return alert('상세 분류명을 입력해주세요.')

    setLoading(true)
    try {
      let finalMainId = mainId
      let finalMidId = midId

      if (mainId === 'NEW') {
        const { data: nm, error: ne } = await supabase.from('main_categories').insert([{ name_ko: newMainName.trim(), display_order: finalOrder }]).select().single()
        if (ne) throw ne
        finalMainId = nm.id
      } else {
        await supabase.from('main_categories').update({ display_order: finalOrder }).eq('id', mainId)
      }

      if (midId === 'NEW') {
        const { data: nmid, error: nmide } = await supabase.from('mid_categories').insert([{ main_category_id: finalMainId, name_ko: newMidName.trim() }]).select().single()
        if (nmide) throw nmide
        finalMidId = nmid.id
      }

      const payload = { mid_category_id: parseInt(finalMidId), name_ko: detailName, is_confirmed: isConfirmed }
      const { error } = item.detail_id === 0 
        ? await supabase.from('detail_categories').insert([payload])
        : await supabase.from('detail_categories').update(payload).eq('id', item.detail_id)

      if (error) throw error
      alert('저장되었습니다.')
      onSave()
    } catch (err) {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <div style={modalHeaderStyle}>
          <h3 style={{ margin: 0 }}>카테고리 정보 {item.detail_id === 0 ? '등록' : '수정'}</h3>
        </div>
        
        <div style={modalBodyStyle}>
          {/* 대분류 및 순서 */}
          <div style={formRowStyle}>
            <label style={formLabelStyle}>대분류 & 순서 <span style={{ color: 'red' }}>*</span></label>
            <div style={{ display: 'flex', gap: '10px' }}>
             <select 
                style={{...modalInputStyle, flex: 2}} 
                value={mainId} 
                onChange={e => setMainId(e.target.value)}
                >
                <option value="">대분류 선택</option>
                {mainList.map((m: any) => (
                    <option key={m.id} value={String(m.id)}>
                    {/* order값이 null이면 숫자를 보여주지 않음 */}
                    {m.display_order ? `(${String(m.display_order).padStart(2, '0')}) ` : ''}{m.name_ko}
                    </option>
                ))}
                <option value="NEW">-- 새로운 대분류 추가 --</option>
            </select>
              <div style={{ flex: 1 }}>
                {!isAddingOrder ? (
                  <select style={modalInputStyle} value={mainOrder || ''} onChange={e => e.target.value === 'ADD_NEW' ? setIsAddingOrder(true) : setMainOrder(e.target.value || null)}>
                    <option value="">순서선택</option>
                    {existingOrders.map((o: any) => <option key={o} value={String(o).padStart(2, '0')}>{String(o).padStart(2, '0')}</option>)}
                    <option value="ADD_NEW">-- 순서 추가 --</option>
                  </select>
                ) : (
                  <input style={modalInputStyle} placeholder="숫자 2자리" value={customOrder} onChange={e => setCustomOrder(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))} autoFocus />
                )}
              </div>
            </div>
            {mainId === 'NEW' && <input style={{...modalInputStyle, marginTop: '8px', borderColor: '#28a745'}} placeholder="새 대분류명 입력" value={newMainName} onChange={e => setNewMainName(e.target.value)} />}
          </div>

          {/* 중분류 */}
          <div style={formRowStyle}>
            <label style={formLabelStyle}>중분류 <span style={{ color: 'red' }}>*</span></label>
            <select style={modalInputStyle} value={midId} onChange={e => setMidId(e.target.value)} disabled={mainId === 'NEW'}>
              <option value="">중분류 선택</option>
              {midList.map((m: any) => <option key={m.id} value={String(m.id)}>{m.name_ko}</option>)}
              <option value="NEW">-- 새로운 중분류 추가 --</option>
            </select>
            {(midId === 'NEW' || mainId === 'NEW') && (
              <input style={{...modalInputStyle, marginTop: '8px', borderColor: '#28a745'}} placeholder="새 중분류명 입력" value={newMidName} onChange={e => setNewMidName(e.target.value)} />
            )}
          </div>

          {/* 상세분류 */}
          <div style={formRowStyle}>
            <label style={formLabelStyle}>상세 분류명 <span style={{ color: 'red' }}>*</span></label>
            <input style={modalInputStyle} value={detailName} onChange={e => setDetailName(e.target.value)} />
          </div>

          {/* [복구] 확인 여부 및 등록 건수 */}
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={formLabelStyle}>확인 상태</label>
              <select style={modalInputStyle} value={isConfirmed} onChange={e => setIsConfirmed(e.target.value)}>
                <option value="Y">Y</option>
                <option value="N">N</option>
              </select>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={formLabelStyle}>등록 건수</label>
              <div style={countBadgeStyle}><span style={{ color: '#007bff' }}>{itemCount}</span> 건</div>
            </div>
          </div>
        </div>

        {/* [복구] 하단 푸터 및 삭제 버튼 */}
        <div style={modalFooterStyle}>
          {item.detail_id !== 0 && (
            <button style={deleteBtnStyle} onClick={handleDelete} disabled={loading}>삭제</button>
          )}
          <div style={{ flex: 1 }} />
          <button style={cancelBtnStyle} onClick={onClose}>취소</button>
          <button style={saveBtnStyle} onClick={handleSave} disabled={loading}>저장</button>
        </div>
      </div>
    </div>
  )
}

// 스타일 시트
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }
const modalContentStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '12px', width: '500px', overflow: 'hidden' }
const modalHeaderStyle: React.CSSProperties = { padding: '20px', borderBottom: '1px solid #eee', backgroundColor: '#f8f9fa' }
const modalBodyStyle: React.CSSProperties = { padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }
const modalFooterStyle: React.CSSProperties = { padding: '15px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '10px' }
const formRowStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '5px' }
const formLabelStyle: React.CSSProperties = { fontSize: '14px', fontWeight: 'bold' }
const modalInputStyle: React.CSSProperties = { padding: '10px', border: '1px solid #ddd', borderRadius: '6px', width: '100%' }
const countBadgeStyle: React.CSSProperties = { padding: '10px', backgroundColor: '#e9ecef', borderRadius: '6px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }
const saveBtnStyle: React.CSSProperties = { padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
const cancelBtnStyle: React.CSSProperties = { padding: '10px 20px', backgroundColor: '#e9ecef', color: '#495057', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
const deleteBtnStyle: React.CSSProperties = { padding: '10px 15px', backgroundColor: 'transparent', color: '#dc3545', border: '1px solid #dc3545', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }