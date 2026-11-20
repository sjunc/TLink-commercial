"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Download, AlertTriangle, CheckCircle2, ImageDown } from "lucide-react";
import { CRM_LIMITS, CRM_VARIABLES, evaluateCrmMessage } from "@/lib/crmUtils";
import { compressToMmsJpg } from "@/lib/canvasUtils";

export default function CrmMessagePanel({
  messageBody,
  setMessageBody,
  cardCanvas,
}) {
  const [isAd, setIsAd] = useState(true);
  const [optOut, setOptOut] = useState("080-1234-5678");
  const [mmsInfo, setMmsInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  const stats = evaluateCrmMessage(messageBody, isAd, Boolean(mmsInfo), optOut);

  const handleCompressMms = async () => {
    if (!cardCanvas) return;
    const res = await compressToMmsJpg(cardCanvas, CRM_LIMITS.MMS_IMAGE_MAX_KB);
    setMmsInfo(res);
  };

  useEffect(() => {
    if (cardCanvas) {
      handleCompressMms();
    }
  }, [cardCanvas]);

  const insertVariable = (token) => {
    setMessageBody((prev) => `${prev}${token}`);
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(stats.finalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMmsJpg = () => {
    if (!mmsInfo?.dataUrl) return;
    const link = document.createElement("a");
    link.download = `tlink-crm-mms-${mmsInfo.sizeKb}kb.jpg`;
    link.href = mmsInfo.dataUrl;
    link.click();
  };

  const pct = Math.min(100, Math.round((stats.estimatedBytes / CRM_LIMITS.LMS_MAX) * 100));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* 좌측: 티링크노트 CRM 규격 에디터 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 text-xs font-bold">
              {stats.type}
            </span>
            <span className="text-xs font-semibold text-slate-600">
              티링크노트 CRM 문자발송 규격 자동 검증
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyText}
            className="px-3 py-1.5 rounded-lg bg-tlink-navy text-white text-xs font-bold inline-flex items-center gap-1 hover:bg-slate-800"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "복사됨" : "문자 복사"}
          </button>
        </div>

        {/* 변수 삽입 버튼 */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500">변수 삽입:</span>
          {CRM_VARIABLES.map((v) => (
            <button
              key={v.token}
              type="button"
              onClick={() => insertVariable(v.token)}
              className="px-2 py-1 rounded-md border border-blue-200 bg-tlink-sky text-tlink-navy text-[11px] font-semibold hover:bg-blue-100"
            >
              {v.token}
            </button>
          ))}
        </div>

        {/* 광고 표기 옵션 */}
        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
          <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isAd}
              onChange={(e) => setIsAd(e.target.checked)}
              className="accent-tlink-navy"
            />
            광고 문자 자동 표기 ((광고) + 080 수신거부)
          </label>
          {isAd && (
            <input
              type="text"
              value={optOut}
              onChange={(e) => setOptOut(e.target.value)}
              className="w-32 px-2 py-1 text-xs border border-slate-300 rounded bg-white"
            />
          )}
        </div>

        {/* 본문 입력 */}
        <textarea
          rows={9}
          value={messageBody}
          onChange={(e) => setMessageBody(e.target.value)}
          className="w-full p-3 text-xs leading-relaxed rounded-xl border border-slate-300 bg-white"
        />

        {/* EUC-KR 바이트 게이지 */}
        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">
              EUC-KR 용량: {stats.baseBytes}B
              {stats.hasVariables && (
                <span className="text-tlink-blue ml-1">
                  (+변수 여유 {CRM_LIMITS.VARIABLE_BUFFER_BYTES}B = {stats.estimatedBytes}B)
                </span>
              )}
            </span>
            <span
              className={`font-bold ${
                stats.isOverLimit
                  ? "text-red-600"
                  : stats.isNearLimit
                  ? "text-amber-600"
                  : "text-emerald-600"
              }`}
            >
              {stats.estimatedBytes} / {CRM_LIMITS.LMS_MAX} byte
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                stats.isOverLimit
                  ? "bg-red-500"
                  : stats.isNearLimit
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {stats.isOverLimit && (
            <div className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              2,000byte를 초과했습니다. 내용을 줄여 주세요.
            </div>
          )}
        </div>
      </div>

      {/* 우측: 변수 치환 미리보기 & 300KB 이하 MMS 이미지 */}
      <div className="space-y-4">
        {/* MMS 이미지 압축 상태 */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-tlink-navy flex items-center gap-1.5">
              <ImageDown className="w-4 h-4 text-tlink-blue" />
              MMS 첨부용 300KB 이하 JPG 자동 압축
            </div>
            <button
              type="button"
              onClick={handleCompressMms}
              className="text-[11px] px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700"
            >
              다시 압축
            </button>
          </div>

          {mmsInfo ? (
            <div className="flex items-center gap-3">
              <img
                src={mmsInfo.dataUrl}
                alt="MMS Preview"
                className="w-24 h-24 object-cover rounded-lg border border-slate-200"
              />
              <div className="flex-1 space-y-1 text-xs">
                <div className="inline-flex items-center gap-1 font-bold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  규격 통과 ({mmsInfo.sizeKb} KB / 최대 300 KB)
                </div>
                <div className="text-slate-500 text-[11px]">
                  해상도: {mmsInfo.width}×{mmsInfo.height}px · 포맷: JPG (품질 {mmsInfo.quality})
                </div>
                <button
                  type="button"
                  onClick={handleDownloadMmsJpg}
                  className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tlink-blue text-white text-xs font-bold hover:bg-blue-600"
                >
                  <Download className="w-3.5 h-3.5" />
                  MMS용 JPG 다운로드
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400">카드뉴스 탭 렌더링 후 자동 압축됩니다.</div>
          )}
        </div>

        {/* 휴대폰 수신 미리보기 */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
          <div className="text-[11px] text-slate-400 font-semibold">
            변수 치환 적용 수신 미리보기 (샘플: 홍길동 / (주)티링크파트너)
          </div>
          <div className="bg-slate-800 rounded-xl p-3.5 text-xs whitespace-pre-wrap leading-relaxed text-slate-100 max-h-64 overflow-y-auto">
            {mmsInfo && (
              <img
                src={mmsInfo.dataUrl}
                alt="MMS"
                className="w-full max-w-[200px] rounded-lg mb-2.5 border border-slate-700"
              />
            )}
            {stats.previewText}
          </div>
        </div>
      </div>
    </div>
  );
}
