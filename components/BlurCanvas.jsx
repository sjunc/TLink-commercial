"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Eraser, RotateCcw, ShieldCheck, Image as ImageIcon } from "lucide-react";
import { createSampleFieldPhoto } from "@/lib/canvasUtils";

export default function BlurCanvas({
  onImageReady,
  privacyChecked,
  setPrivacyChecked,
  onSelectSampleIndustry,
}) {
  const canvasRef = useRef(null);
  const originalImgRef = useRef(null);
  const [hasImage, setHasImage] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(28);
  const [blurCount, setBlurCount] = useState(0);

  const loadImageToCanvas = (dataUrl) => {
    const img = new Image();
    img.onload = () => {
      originalImgRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const maxW = 960;
      const scale = img.width > maxW ? maxW / img.width : 1;
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setHasImage(true);
      setBlurCount(0);
      onImageReady(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.src = dataUrl;
  };

  useEffect(() => {
    // 최초 진입 시 병원 샘플 자동 로드
    const sample = createSampleFieldPhoto("hospital_clinic");
    loadImageToCanvas(sample);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => loadImageToCanvas(ev.target.result);
    reader.readAsDataURL(file);
  };

  const applyMosaicAt = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas || !hasImage) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    const ctx = canvas.getContext("2d");

    const r = brushSize;
    const startX = Math.max(0, Math.floor(x - r));
    const startY = Math.max(0, Math.floor(y - r));
    const sizeW = Math.min(canvas.width - startX, r * 2);
    const sizeH = Math.min(canvas.height - startY, r * 2);
    if (sizeW <= 0 || sizeH <= 0) return;

    const block = 10;
    const imgData = ctx.getImageData(startX, startY, sizeW, sizeH);
    const data = imgData.data;

    for (let by = 0; by < sizeH; by += block) {
      for (let bx = 0; bx < sizeW; bx += block) {
        const dx = startX + bx - x;
        const dy = startY + by - y;
        if (dx * dx + dy * dy > r * r) continue;

        const idx = (by * sizeW + bx) * 4;
        const red = data[idx];
        const green = data[idx + 1];
        const blue = data[idx + 2];

        ctx.fillStyle = `rgb(${red},${green},${blue})`;
        ctx.fillRect(startX + bx, startY + by, block, block);
      }
    }
  };

  const handlePointerDown = (e) => {
    if (!hasImage) return;
    setIsDrawing(true);
    applyMosaicAt(e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    applyMosaicAt(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setBlurCount((c) => c + 1);
    if (canvasRef.current) {
      onImageReady(canvasRef.current.toDataURL("image/jpeg", 0.9));
    }
  };

  const handleReset = () => {
    if (!originalImgRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(originalImgRef.current, 0, 0, canvas.width, canvas.height);
    setBlurCount(0);
    onImageReady(canvas.toDataURL("image/jpeg", 0.9));
  };

  const handleSample = (industryId) => {
    const sample = createSampleFieldPhoto(industryId);
    loadImageToCanvas(sample);
    if (onSelectSampleIndustry) onSelectSampleIndustry(industryId);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-tlink-navy flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-tlink-blue" />
          1. 현장 사진 업로드 & 개인정보 블러
        </h2>
        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tlink-sky text-tlink-navy text-xs font-semibold hover:bg-blue-100 transition">
          <Upload className="w-3.5 h-3.5" />
          사진 불러오기
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {/* 샘플 사진 원클릭 버튼 */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-slate-500 font-medium">빠른 샘플:</span>
        {[
          { id: "hospital_clinic", label: "병원 데스크" },
          { id: "callcenter_cs", label: "콜센터 CS" },
          { id: "field_sales", label: "외근 영업" },
        ].map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => handleSample(s.id)}
            className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 인터랙티브 모자이크 캔버스 */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-auto block cursor-crosshair touch-none"
        />
        <div className="absolute top-2 left-2 bg-tlink-navy/85 text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1">
          <Eraser className="w-3 h-3" />
          얼굴·전화번호·모니터 위를 드래그해 모자이크 처리
        </div>
      </div>

      {/* 브러시 컨트롤 */}
      <div className="flex items-center justify-between gap-3 text-xs bg-slate-50 p-2.5 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-medium">브러시 크기</span>
          <input
            type="range"
            min={14}
            max={54}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24 accent-tlink-blue"
          />
          <span className="text-slate-500 w-8">{brushSize}px</span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
        >
          <RotateCcw className="w-3 h-3" />
          원본 복구 {blurCount > 0 ? `(${blurCount})` : ""}
        </button>
      </div>

      {/* 개인정보 보호 체크리스트 */}
      <label className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 cursor-pointer">
        <input
          type="checkbox"
          checked={privacyChecked}
          onChange={(e) => setPrivacyChecked(e.target.checked)}
          className="mt-0.5 accent-tlink-navy"
        />
        <span className="text-xs text-amber-900 leading-relaxed">
          <strong className="inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            개인정보 마스킹 확인:
          </strong>{" "}
          고객사 직원 얼굴, 전화번호, 모니터 속 개인정보가 가려졌음을 확인했습니다.
        </span>
      </label>
    </div>
  );
}
