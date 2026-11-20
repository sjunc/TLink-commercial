"use client";

import { useState } from "react";
import {
  Sparkles,
  Settings,
  CheckCircle2,
  BookOpen,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  AlertCircle,
  Loader2,
  Clock,
} from "lucide-react";
import knowledgeBase from "@/data/tlinkKnowledge.json";
import BlurCanvas from "@/components/BlurCanvas";
import CardNewsStudio from "@/components/CardNewsStudio";
import BlogGeoPanel from "@/components/BlogGeoPanel";
import CrmMessagePanel from "@/components/CrmMessagePanel";

export default function HomePage() {
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [privacyChecked, setPrivacyChecked] = useState(true);
  const [manualIndustryId, setManualIndustryId] = useState("");
  const [productHint, setProductHint] = useState("티링크비즈레코딩 + 티링크노트 CRM");
  const [memo, setMemo] = useState("");

  // API 설정 모달 상태 (기본 모델: gemini-3.6-flash)
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("gemini-3.6-flash");

  // 분석 결과 상태
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [elapsedSec, setElapsedSec] = useState(null);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("card"); // card | blog | crm

  // 수정 가능한 결과물 상태
  const [blogData, setBlogData] = useState(null);
  const [cardData, setCardData] = useState(null);
  const [crmBody, setCrmBody] = useState("");
  const [cardCanvas, setCardCanvas] = useState(null);

  const handleAnalyze = async () => {
    if (!imageDataUrl) {
      setErrorMsg("현장 사진을 먼저 업로드해 주세요.");
      return;
    }
    if (!privacyChecked) {
      setErrorMsg("개인정보 마스킹 확인 체크박스를 선택해 주세요.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    const start = performance.now();

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imageDataUrl,
          manualIndustryId: manualIndustryId || null,
          productHint,
          memo,
          apiKey: apiKey.trim() || undefined,
          model: modelName.trim() || "gemini-3.6-flash",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error || "API 호출 실패");
      }

      setResult(data);
      setBlogData(data.blog);
      setCardData(data.card_news);
      setCrmBody(data.crm_message?.body || "");
      setElapsedSec(((performance.now() - start) / 1000).toFixed(1));
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* 상단 헤더 */}
      <header className="bg-tlink-navy text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded-lg bg-tlink-blue font-black tracking-tight text-sm">
              T·LINK
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold leading-tight">
                T-Link Pitch AI
              </h1>
              <p className="text-[11px] text-blue-200">
                A-29-차OO(4157) 프로젝트 · 현장 사진 기반 B2B 마케팅 자동화
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-xs font-semibold text-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              Model: {modelName}
            </span>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold inline-flex items-center gap-1.5 transition"
            >
              <Settings className="w-3.5 h-3.5" />
              API 설정
            </button>
          </div>
        </div>
      </header>

      {/* 메인 2컬럼 워크스페이스 */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* 좌측: 입력 & 전처리 (5컬럼) */}
        <section className="lg:col-span-5 space-y-4">
          <BlurCanvas
            onImageReady={setImageDataUrl}
            privacyChecked={privacyChecked}
            setPrivacyChecked={setPrivacyChecked}
            onSelectSampleIndustry={(id) => setManualIndustryId(id)}
          />

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-tlink-navy">
              2. 현장 정보 및 예외 프리셋 (선택)
            </h2>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                업종 선택 (자동 추론 실패 시 수동 프리셋)
              </label>
              <select
                value={manualIndustryId}
                onChange={(e) => setManualIndustryId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="">AI가 현장 사진에서 자동 추론</option>
                {knowledgeBase.industries.map((ind) => (
                  <option key={ind.industry_id} value={ind.industry_id}>
                    {ind.preset_label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                강조할 티링크 제품
              </label>
              <select
                value={productHint}
                onChange={(e) => setProductHint(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="티링크비즈레코딩 + 티링크노트 CRM">
                  티링크비즈레코딩 + 티링크노트 CRM (종합)
                </option>
                <option value="티링크모바일 (휴대폰·대면 녹취)">
                  티링크모바일 (외근 휴대폰·대면 녹취)
                </option>
                <option value="TlinkPhone (PC 소프트폰·60개국 실시간 통역)">
                  TlinkPhone (PC 소프트폰·60개국 실시간 통역)
                </option>
                <option value="티링크노트 종합리포트 (CEO 5분 브리핑·인사고과)">
                  티링크노트 종합리포트 (경영분석·인사고과·교육)
                </option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                현장 메모 (선택)
              </label>
              <input
                type="text"
                placeholder="예: 외국인 환자 문의가 많아 실시간 통역 기능 강조"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-tlink-blue hover:bg-blue-600 disabled:bg-slate-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI 분석 및 3종 콘텐츠 생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI 분석 & 홍보 콘텐츠 3종 원클릭 생성
                </>
              )}
            </button>
          </div>
        </section>

        {/* 우측: 팩트 매칭 결과 & 3종 콘텐츠 스튜디오 (7컬럼) */}
        <section className="lg:col-span-7 space-y-4">
          {!result ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-tlink-sky text-tlink-blue flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-tlink-navy">
                현장 사진 1장으로 B2B 마케팅 콘텐츠를 자동 생성하세요
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                좌측에서 샘플 사진을 선택하거나 현장 사진을 업로드한 뒤 생성 버튼을 누르면,
                티링크 매뉴얼 기반 30개 팩트 지식베이스에서 최적의 차별점을 매칭해
                카드뉴스·GEO 블로그·CRM MMS를 1분 안에 완성합니다.
              </p>
            </div>
          ) : (
            <>
              {/* 팩트 기반 매칭 근거 카드 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-tlink-navy text-white text-xs font-bold">
                      추론 업종: {result.detected_industry_name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                      {result.mode === "gemini_live"
                        ? `Live (${result.model_used})`
                        : "Demo Mode (API 키 입력 시 Live 전환)"}
                    </span>
                  </div>
                  {elapsedSec && (
                    <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {elapsedSec}초 완료
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600">{result.scene_summary}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {(result.matched_points || []).map((pt, idx) => (
                    <div
                      key={pt.id || idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1"
                    >
                      <div className="text-[11px] font-bold text-tlink-blue flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        차별점 {idx + 1} ({pt.id})
                      </div>
                      <div className="text-xs font-bold text-tlink-navy leading-snug">
                        {pt.title}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                        <BookOpen className="w-3 h-3 shrink-0" />
                        <span className="truncate" title={pt.source}>
                          {pt.source}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3종 콘텐츠 탭 스튜디오 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-200 bg-slate-50">
                  {[
                    { id: "card", label: "카드뉴스 (3종 템플릿)", icon: ImageIcon },
                    { id: "blog", label: "GEO·SEO 블로그", icon: FileText },
                    { id: "crm", label: "티링크 CRM MMS/LMS", icon: MessageSquare },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-3 px-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
                          activeTab === tab.id
                            ? "border-tlink-blue text-tlink-navy bg-white"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 sm:p-5">
                  <div className={activeTab === "card" ? "block" : "hidden"}>
                    <CardNewsStudio
                      imageDataUrl={imageDataUrl}
                      cardData={cardData}
                      setCardData={setCardData}
                      onCanvasUpdated={setCardCanvas}
                    />
                  </div>
                  <div className={activeTab === "blog" ? "block" : "hidden"}>
                    <BlogGeoPanel blogData={blogData} setBlogData={setBlogData} />
                  </div>
                  <div className={activeTab === "crm" ? "block" : "hidden"}>
                    <CrmMessagePanel
                      messageBody={crmBody}
                      setMessageBody={setCrmBody}
                      cardCanvas={cardCanvas}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {/* API 설정 모달 */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-tlink-navy">
              Gemini API 및 모델 설정
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Gemini API Key (선택: .env.local 미설정 시 여기서 입력)
                </label>
                <input
                  type="password"
                  placeholder="AIza..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  사용 모델 ID
                </label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  기본값: <code>gemini-3.6-flash</code> (.env.local의 GEMINI_MODEL과 동일하게 동작)
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-lg bg-tlink-navy text-white text-xs font-bold"
              >
                저장 후 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
