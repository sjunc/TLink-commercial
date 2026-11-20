"use client";

import { useEffect, useRef, useState } from "react";
import { Download, LayoutTemplate, Sparkles } from "lucide-react";
import { renderCardNewsToCanvas } from "@/lib/canvasUtils";

const TEMPLATES = [
  { id: "trust", name: "신뢰형 (네이비)", desc: "현장 사진 풀배경 + 네이비 그라데이션" },
  { id: "highlight", name: "강조형 (3중 키워드)", desc: "상단 헤드라인 + 하단 3중 키워드 박스" },
  { id: "case", name: "사례형 (클린 리포트)", desc: "화이트 B2B 도입사례 카드 레이아웃" },
];

export default function CardNewsStudio({
  imageDataUrl,
  cardData,
  setCardData,
  onCanvasUpdated,
}) {
  const canvasRef = useRef(null);
  const [template, setTemplate] = useState("trust");

  useEffect(() => {
    if (!canvasRef.current || !imageDataUrl || !cardData) return;
    let active = true;
    renderCardNewsToCanvas(canvasRef.current, {
      imageDataUrl,
      template,
      tripleKeywords: cardData.triple_keywords || [],
      headline: cardData.headline || "",
      subcopy: cardData.subcopy || "",
      badgeText: cardData.badge || "T-LINK 도입 사례",
    }).then(() => {
      if (active && onCanvasUpdated && canvasRef.current) {
        onCanvasUpdated(canvasRef.current);
      }
    });
    return () => {
      active = false;
    };
  }, [imageDataUrl, template, cardData]);

  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `tlink-cardnews-${template}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const updateKeyword = (index, value) => {
    const next = [...(cardData.triple_keywords || ["", "", ""])];
    next[index] = value;
    setCardData({ ...cardData, triple_keywords: next });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* 좌측: 1080x1080 실시간 Canvas 미리보기 */}
      <div className="space-y-3">
        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900">
          <canvas ref={canvasRef} className="w-full h-auto block" />
        </div>
        <button
          type="button"
          onClick={handleDownloadPng}
          className="w-full py-2.5 rounded-xl bg-tlink-navy text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition"
        >
          <Download className="w-4 h-4" />
          카드뉴스 고화질 PNG 다운로드 (1080×1080)
        </button>
      </div>

      {/* 우측: 템플릿 선택 & 실시간 문구 수정 */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
            <LayoutTemplate className="w-4 h-4 text-tlink-blue" />
            디자인 템플릿 선택 (3종)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplate(t.id)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  template === t.id
                    ? "border-tlink-blue bg-tlink-sky ring-1 ring-tlink-blue"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="text-xs font-bold text-tlink-navy">{t.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="text-xs font-bold text-tlink-navy flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-tlink-blue" />
            3중 핵심 맥락 키워드 (실시간 반영)
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["업종", "페인포인트", "티링크 기능"].map((label, idx) => (
              <div key={label}>
                <span className="text-[11px] text-slate-500 block mb-1">{label}</span>
                <input
                  type="text"
                  value={cardData?.triple_keywords?.[idx] || ""}
                  onChange={(e) => updateKeyword(idx, e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>
            ))}
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block mb-1">메인 헤드라인</span>
            <input
              type="text"
              value={cardData?.headline || ""}
              onChange={(e) => setCardData({ ...cardData, headline: e.target.value })}
              className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 bg-white"
            />
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block mb-1">서브 카피</span>
            <textarea
              rows={2}
              value={cardData?.subcopy || ""}
              onChange={(e) => setCardData({ ...cardData, subcopy: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
