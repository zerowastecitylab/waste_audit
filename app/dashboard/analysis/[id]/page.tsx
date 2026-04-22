'use client'

import { useState, useEffect, use, useRef } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: bagId } = use(params)
  const router = useRouter()
  
  const searchWrapperRef = useRef<HTMLDivElement>(null)

  const [bagInfo, setBagInfo] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [isManualInput, setIsManualInput] = useState(false)

  const [weight, setWeight] = useState("")
  const [count, setCount] = useState("0")
  const [note, setNote] = useState("")
  const [uploading, setUploading] = useState(false)
  const [items, setItems] = useState<any[]>([])

  // 잔재 쓰레기 입력 모달 상태
  const [isFinalModalOpen, setIsFinalModalOpen] = useState(false)
  const [residualWeight, setResidualWeight] = useState("")

  useEffect(() => {
    async function fetchData() {
      const { data: bag } = await supabase.from('waste_bags').select('*, bag_specs(*)').eq('id', bagId).single()
      setBagInfo(bag)

      const { data: savedItems } = await supabase
        .from('waste_items')
        .select('*, detail_categories(*, mid_categories(*, main_categories(*)))')
        .eq('bag_id', bagId)
      
      if (savedItems) {
        const formatted = savedItems.map(item => ({
          id: item.detail_category_id,
          name: item.detail_categories?.name_ko || '알 수 없음',
          path: item.detail_categories?.mid_categories 
            ? `${item.detail_categories.mid_categories.main_categories.name_ko} > ${item.detail_categories.mid_categories.name_ko}`
            : "기타 > 신규 등록",
          weight: item.weight,
          count: item.count,
          note: item.note,
          imageUrl: item.image_url
        }))
        setItems(formatted)
      }
    }
    fetchData()

    function handleClickOutside(event: MouseEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setSearchResults([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [bagId])

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
    if (!selectedCategory && !isManualInput) {
      alert("항목을 선택하거나 신규 등록을 확정해주세요.")
      return
    }

    const w = parseFloat(weight) || 0
    const c = parseInt(count) || 0
    if (w <= 0 && c <= 0) {
      alert("무게 또는 개수를 입력해주세요.")
      return
    }

    setUploading(true)
    try {
      let finalCategoryId = selectedCategory?.id
      let finalName = selectedCategory ? selectedCategory.name_ko : searchTerm.trim()
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

      setItems(prev => [...prev, {
        id: finalCategoryId,
        name: finalName,
        path: finalPath,
        weight: w,
        count: c,
        note: note
      }])

      setSearchTerm(""); setSelectedCategory(null); setIsManualInput(false)
      setWeight(""); setCount("0"); setNote("")
    } catch (err) {
      console.error(err)
      alert("저장 중 오류가 발생했습니다.")
    } finally {
      setUploading(false)
    }
  }

  const finishAnalysis = () => {
    if (items.length === 0) {
      alert("분석된 항목이 없습니다.")
      return
    }
    setIsFinalModalOpen(true)
  }

  // [수정된 부분] 최종 제출 시 안내 문구 추가
  const handleFinalSubmit = async () => {
    if (!residualWeight) {
      alert("잔재 쓰레기의 무게를 입력해주세요.");
      return;
    }

    setUploading(true);
    try {
      const { error } = await supabase
        .from('waste_bags')
        .update({ 
          residual_weight: parseFloat(residualWeight)
        })
        .eq('id', bagId);

      if (error) throw error;

      // ✅ 성공 안내 문구 표시
      alert("성상 분석 데이터가 성공적으로 저장되었습니다.");
      
      // ✅ 확인 버튼을 누르면 대시보드로 이동
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      alert("최종 저장 실패: 데이터베이스 연결을 확인해주세요.");
    } finally {
      setUploading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px', boxSizing: 'border-box'
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
          <input type="text" value={searchTerm} style={inputStyle} placeholder="검색어를 입력하세요"
            onChange={(e) => { setSearchTerm(e.target.value); setSelectedCategory(null); setIsManualInput(false); }} />
          
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
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} style={inputStyle} placeholder="0" />
          </div>
          <div style={{ flex: 1 }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>개수</label>
            <input type="number" value={count} onChange={e => setCount(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '13px', fontWeight: 'bold' }}>비고 (특이사항)</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} style={inputStyle} placeholder="내용 입력" />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={addItem} disabled={uploading} style={{ flex: 2, padding: '15px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            {uploading ? "저장 중..." : "목록 추가"}
          </button>
          <button onClick={finishAnalysis} style={{ flex: 1, padding: '15px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            분석 완료
          </button>
        </div>
      </div>

      {/* 최종 잔재 무게 입력 모달 */}
      {isFinalModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: '#333' }}>⚖️ 최종 잔재 쓰레기 무게 입력</h3>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}><br/><b>전체 잔재 쓰레기</b>의 무게(g)를 입력해주세요.</p><br/>
            <input 
              type="number" 
              value={residualWeight} 
              onChange={e => setResidualWeight(e.target.value)} 
              style={{ ...inputStyle, textAlign: 'center', fontSize: '24px', height: '60px' }} 
              placeholder="0" 
              autoFocus 
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
              <button onClick={() => setIsFinalModalOpen(false)} style={{ flex: 1, padding: '15px', backgroundColor: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>취소</button>
              <button onClick={handleFinalSubmit} disabled={uploading} style={{ flex: 1, padding: '15px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>완료</button>
            </div>
          </div>
        </div>
      )}

      <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>📊 분석 목록</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>항목명</th>
            <th style={{ padding: '10px', textAlign: 'right' }}>무게(g)</th>
            <th style={{ padding: '10px', textAlign: 'right' }}>개수</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>
                <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                <div style={{ fontSize: '11px', color: '#999' }}>{item.path}</div>
              </td>
              <td style={{ padding: '10px', textAlign: 'right' }}>{item.weight}</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>{item.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}