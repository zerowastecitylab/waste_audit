'use client'

import { useState, useEffect, use, useRef } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: bagId } = use(params)
  const router = useRouter()
  
  const searchWrapperRef = useRef<HTMLDivElement>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [bagInfo, setBagInfo] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [isManualInput, setIsManualInput] = useState(false)

  const [weight, setWeight] = useState("")
  const [count, setCount] = useState("") 
  const [note, setNote] = useState("") // 비고 상태
  const [uploading, setUploading] = useState(false)
  const [items, setItems] = useState<any[]>([])

  const [isFinalModalOpen, setIsFinalModalOpen] = useState(false)
  const [residualWeight, setResidualWeight] = useState("")

  useEffect(() => {
    async function init() {
      const userData = localStorage.getItem('user')
      if (!userData) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.")
        router.replace('/login')
        return
      }
      
      const user = JSON.parse(userData)
      setUserId(user.id)

      const { data: bag } = await supabase.from('waste_bags').select('*, bag_specs(*)').eq('id', bagId).single()
      setBagInfo(bag)

      const { data: savedItems } = await supabase
        .from('waste_items')
        .select('*, detail_categories(*, mid_categories(*, main_categories(*)))')
        .eq('bag_id', bagId)
        .order('created_at', { ascending: false })
      
      if (savedItems) {
        const formatted = savedItems.map(item => ({
          id: item.detail_category_id,
          name: item.detail_categories?.name_ko || '알 수 없음',
          description: item.detail_categories?.description || '', // 설명 추가
          path: item.detail_categories?.mid_categories 
            ? `${item.detail_categories.mid_categories.main_categories.name_ko} > ${item.detail_categories.mid_categories.name_ko}`
            : "기타 > 신규 등록",
          weight: item.weight,
          count: item.count,
          note: item.note
        }))
        setItems(formatted)
      }
    }
    init()
  }, [bagId, router])

  // 검색 로직
  useEffect(() => {
    async function search() {
      if (searchTerm.length < 1 || selectedCategory || isManualInput) {
        setSearchResults([])
        return
      }
      const { data } = await supabase
        .from('detail_categories')
        .select('*, mid_categories(*, main_categories(*))')
        .ilike('name_ko', `%${searchTerm}%`)
        .limit(10)
      setSearchResults(data || [])
    }
    const timer = setTimeout(search, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, selectedCategory, isManualInput])

  const addItem = async () => {
    if (!userId) return alert("세션 만료")
    if (!selectedCategory && !isManualInput) return alert("항목을 선택해주세요.")

    const w = parseFloat(weight) || 0
    const c = parseInt(count) || 0
    if (w <= 0 && c <= 0) return alert("무게 또는 개수를 입력해주세요.")

    setUploading(true)
    try {
      let finalCategoryId = selectedCategory?.id
      let finalName = selectedCategory ? selectedCategory.name_ko : searchTerm.trim()
      let finalDesc = selectedCategory?.description || '' // 카테고리 설명 저장
      let finalPath = selectedCategory 
        ? `${selectedCategory.mid_categories.main_categories.name_ko} > ${selectedCategory.mid_categories.name_ko}` 
        : "기타 > 신규 등록"

      if (isManualInput && !selectedCategory) {
        const { data: newCat, error: catError } = await supabase
          .from('detail_categories')
          .insert([{ name_ko: finalName, mid_category_id: 9999, is_confirmed: 'N' }])
          .select().single()
        if (catError) throw catError
        finalCategoryId = newCat.id
      }

      const { error: saveError } = await supabase
        .from('waste_items')
        .insert([{
          bag_id: bagId,
          detail_category_id: finalCategoryId,
          weight: w,
          count: c,
          note: note
        }])
      if (saveError) throw saveError

      // 최신순 정렬 (새 항목을 배열 맨 앞으로)
      setItems(prev => [{
        id: finalCategoryId,
        name: finalName,
        description: finalDesc,
        path: finalPath,
        weight: w,
        count: c,
        note: note
      }, ...prev])

      setSearchTerm(""); setSelectedCategory(null); setIsManualInput(false)
      setWeight(""); setCount(""); setNote("") 
    } catch (err) {
      alert("저장 오류")
    } finally {
      setUploading(false)
    }
  }

  // 분석 완료 버튼 핸들러
  const openFinalModal = () => {
    if (items.length === 0) {
      alert("분석된 항목이 없습니다.")
      return
    }
    setIsFinalModalOpen(true)
  }

  // 스타일 에러 수정 (shorthand mix 해결)
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px', boxSizing: 'border-box'
  }

  const tableHeaderStyle: React.CSSProperties = {
    padding: '10px', textAlign: 'left', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '2px solid #333'
  }

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {bagInfo && (
        <div style={{ backgroundColor: '#e9ecef', padding: '15px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px' }}>
          <span>📅 {bagInfo.discharge_date} | 📍 {bagInfo.discharge_location}</span><br/>
          <span>📦 {bagInfo.bag_specs?.name} ({bagInfo.total_weight}kg)</span>
        </div>
      )}

      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #eee', marginBottom: '25px' }}>
        <div ref={searchWrapperRef} style={{ position: 'relative', marginBottom: '15px' }}>
          <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>쓰레기 이름 검색 <span style={{color:'red'}}>*</span></label>
          <input 
            type="text" 
            value={searchTerm} 
            style={inputStyle} 
            placeholder="검색어를 입력하세요"
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedCategory(null);
              setIsManualInput(false);
            }} 
          />
          
          {(searchResults.length > 0 || (searchTerm.length > 0 && !selectedCategory && !isManualInput)) && (
            <div style={{ position: 'absolute', width: '100%', backgroundColor: '#fff', border: '1px solid #ccc', zIndex: 10, borderRadius: '8px', marginTop: '5px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              {searchResults.map(cat => (
                <div key={cat.id} onClick={() => { setSelectedCategory(cat); setSearchTerm(cat.name_ko); setSearchResults([]); }}
                  style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                  ✅ {cat.name_ko} <span style={{fontSize:'11px', color:'#999'}}>({cat.mid_categories?.name_ko})</span>
                </div>
              ))}
              <div onClick={() => { setIsManualInput(true); setSearchResults([]); }}
                style={{ padding: '12px', cursor: 'pointer', backgroundColor: '#fdf2f2', color: '#d32f2f', textAlign: 'center', fontWeight: 'bold' }}>
                ➕ "{searchTerm}" 신규 카테고리로 등록하기
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>무게 (g)</label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} onFocus={(e) => e.target.select()} style={inputStyle} placeholder="0" />
          </div>
          <div style={{ flex: 1 }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>개수</label>
            <input type="number" value={count} onChange={e => setCount(e.target.value)} onFocus={(e) => e.target.select()} style={inputStyle} placeholder="0" />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '13px', fontWeight: 'bold' }}>비고 (특이사항)</label>
          {/* 한글 입력 최적화 적용 */}
          <input 
            type="text" 
            value={note} 
            onChange={e => setNote(e.target.value)} 
            style={inputStyle} 
            placeholder="내용 입력" 
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={addItem} disabled={uploading} style={{ flex: 2, padding: '15px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            {uploading ? "저장 중..." : "목록 추가"}
          </button>
          <button onClick={openFinalModal} style={{ flex: 1, padding: '15px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            분석 완료
          </button>
        </div>
      </div>

      <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>📊 분석 목록 (최신순)</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>항목명 / 설명</th>
            <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>무게(g)</th>
            <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>개수</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>
                <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                {/* 1. 카테고리 설명(Description) 표시 */}
                {item.description && <div style={{ fontSize: '12px', color: '#007bff', marginTop: '2px' }}>📝 {item.description}</div>}
                <div style={{ fontSize: '11px', color: '#999' }}>{item.path}</div>
                {/* 2. 입력한 비고(Note) 표시 */}
                {item.note && <div style={{ fontSize: '11px', color: '#d32f2f', fontWeight: '500' }}>[비고: {item.note}]</div>}
              </td>
              <td style={{ padding: '10px', textAlign: 'right' }}>{item.weight.toLocaleString()}</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>{item.count.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 모달 로직 등은 기존과 동일 */}
      {isFinalModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0 }}>⚖️ 최종 잔재 무게 입력</h3>
            <input 
              type="number" 
              value={residualWeight} 
              onChange={e => setResidualWeight(e.target.value)} 
              style={{ ...inputStyle, textAlign: 'center', fontSize: '24px', height: '60px' }} 
              placeholder="0" 
              autoFocus 
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
              <button onClick={() => setIsFinalModalOpen(false)} style={{ flex: 1, padding: '15px', backgroundColor: '#eee', border: 'none', borderRadius: '8px' }}>취소</button>
              <button onClick={addItem} style={{ flex: 1, padding: '15px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>완료</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}