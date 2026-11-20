// HTML5 Canvas 기반 카드뉴스 3종 렌더링 & 300KB 이하 JPG MMS 자동 압축 유틸리티

export function wrapCanvasText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      // 단어가 maxWidth보다 길면 글자 단위로 분할
      if (ctx.measureText(word).width > maxWidth) {
        let charLine = "";
        for (const ch of word) {
          if (ctx.measureText(charLine + ch).width <= maxWidth) {
            charLine += ch;
          } else {
            lines.push(charLine);
            charLine = ch;
          }
        }
        currentLine = charLine;
      } else {
        currentLine = word;
      }
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawCoverImage(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;

  if (imgRatio > boxRatio) {
    sw = img.height * boxRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / boxRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * 1080x1080 카드뉴스 Canvas 직접 렌더링 (웹폰트 로드 완료 후 실행)
 * template: "trust" | "highlight" | "case"
 */
export async function renderCardNewsToCanvas(canvas, {
  imageDataUrl,
  template = "trust",
  tripleKeywords = ["현장 업종", "핵심 과제", "티링크 솔루션"],
  headline = "통화가 끝나면, 보고서가 시작됩니다.",
  subcopy = "유선·휴대폰·PC 통합 녹취와 AI 종합리포트로 현장 업무를 혁신합니다.",
  badgeText = "T-LINK 도입 사례",
}) {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const size = 1080;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = imageDataUrl;
  });

  ctx.clearRect(0, 0, size, size);

  if (template === "trust") {
    // 템플릿 1: 신뢰형 (네이비 오버레이 + 하단 그라데이션)
    drawCoverImage(ctx, img, 0, 0, size, size);

    const grad = ctx.createLinearGradient(0, 260, 0, size);
    grad.addColorStop(0, "rgba(22, 42, 76, 0.15)");
    grad.addColorStop(0.55, "rgba(22, 42, 76, 0.82)");
    grad.addColorStop(1, "rgba(15, 29, 54, 0.97)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // 상단 브랜드 배지
    ctx.fillStyle = "#5A8DEE";
    drawRoundedRect(ctx, 64, 60, 260, 52, 26);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 24px Pretendard, sans-serif";
    ctx.fillText("T·LINK  PITCH AI", 96, 94);

    // 3중 키워드 칩
    let chipX = 64;
    const chipY = 605;
    ctx.font = "600 24px Pretendard, sans-serif";
    tripleKeywords.slice(0, 3).forEach((kw) => {
      const label = `#${kw}`;
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = "rgba(90, 141, 238, 0.28)";
      drawRoundedRect(ctx, chipX, chipY, tw + 34, 46, 23);
      ctx.fill();
      ctx.strokeStyle = "rgba(147, 197, 253, 0.7)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#E0EEFF";
      ctx.fillText(label, chipX + 17, chipY + 31);
      chipX += tw + 48;
    });

    // 메인 헤드라인
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 56px Pretendard, sans-serif";
    const headLines = wrapCanvasText(ctx, headline, 952).slice(0, 3);
    headLines.forEach((line, idx) => {
      ctx.fillText(line, 64, 725 + idx * 72);
    });

    // 서브 카피
    ctx.fillStyle = "#CBD5E1";
    ctx.font = "500 28px Pretendard, sans-serif";
    const subStartY = 725 + headLines.length * 72 + 16;
    const subLines = wrapCanvasText(ctx, subcopy, 952).slice(0, 2);
    subLines.forEach((line, idx) => {
      ctx.fillText(line, 64, subStartY + idx * 42);
    });

    // 하단 푸터
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = "600 22px Pretendard, sans-serif";
    ctx.fillText("㈜티링크앤주인닷컴 · 1877-3836 · www.tlinkcrm.com", 64, 1028);
  } else if (template === "highlight") {
    // 템플릿 2: 강조형 (상단 3중 키워드 배너 + 중앙 사진 + 하단 포인트 바)
    ctx.fillStyle = "#162A4C";
    ctx.fillRect(0, 0, size, size);

    // 상단 블루 헤더
    ctx.fillStyle = "#5A8DEE";
    ctx.fillRect(0, 0, size, 16);

    ctx.fillStyle = "#93C5FD";
    ctx.font = "700 26px Pretendard, sans-serif";
    ctx.fillText(`T·LINK  |  ${badgeText}`, 64, 84);

    // 메인 헤드라인 상단 배치
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 52px Pretendard, sans-serif";
    const headLines = wrapCanvasText(ctx, headline, 952).slice(0, 2);
    headLines.forEach((line, idx) => {
      ctx.fillText(line, 64, 166 + idx * 68);
    });

    // 중앙 라운드 사진 영역
    ctx.save();
    drawRoundedRect(ctx, 64, 300, 952, 500, 28);
    ctx.clip();
    drawCoverImage(ctx, img, 64, 300, 952, 500);
    ctx.restore();

    // 3중 키워드 3분할 박스
    const boxW = 304;
    tripleKeywords.slice(0, 3).forEach((kw, idx) => {
      const bx = 64 + idx * 324;
      ctx.fillStyle = "rgba(90, 141, 238, 0.2)";
      drawRoundedRect(ctx, bx, 830, boxW, 88, 16);
      ctx.fill();
      ctx.fillStyle = "#93C5FD";
      ctx.font = "600 20px Pretendard, sans-serif";
      const stepLabels = ["01. 현장 업종", "02. 핵심 과제", "03. 티링크 솔루션"];
      ctx.fillText(stepLabels[idx] || `0${idx + 1}`, bx + 20, 862);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "700 24px Pretendard, sans-serif";
      const clipped = kw.length > 13 ? kw.slice(0, 13) + "…" : kw;
      ctx.fillText(clipped, bx + 20, 898);
    });

    // 하단 서브카피 & 연락처
    ctx.fillStyle = "#CBD5E1";
    ctx.font = "500 24px Pretendard, sans-serif";
    const subOne = subcopy.length > 46 ? subcopy.slice(0, 46) + "…" : subcopy;
    ctx.fillText(subOne, 64, 976);
    ctx.fillStyle = "#94A3B8";
    ctx.font = "600 22px Pretendard, sans-serif";
    ctx.fillText("무료 도입 상담 1877-3836  |  www.tlinkcrm.com", 64, 1028);
  } else {
    // 템플릿 3: 사례형 (화이트 클린 B2B 리포트 카드)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, size, size);

    // 상단 사진 영역 (54%)
    drawCoverImage(ctx, img, 0, 0, size, 560);

    // 사진 상단 반투명 바
    ctx.fillStyle = "rgba(22, 42, 76, 0.85)";
    drawRoundedRect(ctx, 56, 48, 320, 56, 12);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 24px Pretendard, sans-serif";
    ctx.fillText(`T·LINK  ${badgeText}`, 80, 84);

    // 하단 화이트 카드 본문
    let chipX = 64;
    ctx.font = "700 22px Pretendard, sans-serif";
    tripleKeywords.slice(0, 3).forEach((kw) => {
      const label = `#${kw}`;
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = "#EBF2FF";
      drawRoundedRect(ctx, chipX, 600, tw + 32, 44, 22);
      ctx.fill();
      ctx.fillStyle = "#162A4C";
      ctx.fillText(label, chipX + 16, 629);
      chipX += tw + 44;
    });

    ctx.fillStyle = "#0F172A";
    ctx.font = "800 50px Pretendard, sans-serif";
    const headLines = wrapCanvasText(ctx, headline, 952).slice(0, 2);
    headLines.forEach((line, idx) => {
      ctx.fillText(line, 64, 712 + idx * 66);
    });

    ctx.fillStyle = "#475569";
    ctx.font = "500 28px Pretendard, sans-serif";
    const subLines = wrapCanvasText(ctx, subcopy, 952).slice(0, 2);
    subLines.forEach((line, idx) => {
      ctx.fillText(line, 64, 868 + idx * 42);
    });

    // 구분선 & 푸터
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(64, 976);
    ctx.lineTo(1016, 976);
    ctx.stroke();

    ctx.fillStyle = "#162A4C";
    ctx.font = "800 24px Pretendard, sans-serif";
    ctx.fillText("T·LINK  통화가 끝나면, 보고서가 시작됩니다.", 64, 1026);
    ctx.fillStyle = "#5A8DEE";
    ctx.font = "700 24px Pretendard, sans-serif";
    ctx.fillText("1877-3836", 886, 1026);
  }
}

/**
 * 티링크노트 CRM MMS 규격(300KB 이하 JPG) 자동 압축기
 */
export async function compressToMmsJpg(sourceCanvas, maxKb = 300) {
  const maxBytes = maxKb * 1024;
  let width = Math.min(sourceCanvas.width, 960);
  let height = Math.round((sourceCanvas.height / sourceCanvas.width) * width);
  let quality = 0.88;

  const offscreen = document.createElement("canvas");
  const ctx = offscreen.getContext("2d");

  for (let attempt = 0; attempt < 12; attempt++) {
    offscreen.width = width;
    offscreen.height = height;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(sourceCanvas, 0, 0, width, height);

    const blob = await new Promise((resolve) =>
      offscreen.toBlob((b) => resolve(b), "image/jpeg", quality)
    );

    if (blob && blob.size <= maxBytes) {
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      return {
        blob,
        dataUrl,
        sizeKb: Number((blob.size / 1024).toFixed(1)),
        width,
        height,
        quality: Number(quality.toFixed(2)),
        compliant: true,
      };
    }

    if (quality > 0.45) {
      quality -= 0.1;
    } else {
      width = Math.round(width * 0.82);
      height = Math.round(height * 0.82);
      quality = 0.72;
    }
  }

  // 최후 안전 fallback
  const fallbackBlob = await new Promise((resolve) =>
    offscreen.toBlob((b) => resolve(b), "image/jpeg", 0.4)
  );
  const dataUrl = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(fallbackBlob);
  });
  return {
    blob: fallbackBlob,
    dataUrl,
    sizeKb: Number((fallbackBlob.size / 1024).toFixed(1)),
    width,
    height,
    quality: 0.4,
    compliant: fallbackBlob.size <= maxBytes,
  };
}

/**
 * 시연용 샘플 현장 사진(Canvas 생성) 반환
 */
export function createSampleFieldPhoto(type = "hospital_clinic") {
  const c = document.createElement("canvas");
  c.width = 960;
  c.height = 640;
  const ctx = c.getContext("2d");

  const configs = {
    hospital_clinic: {
      bg1: "#E0F2FE",
      bg2: "#BAE6FD",
      desk: "#0F172A",
      accent: "#0284C7",
      label: "SAMPLE 현장 사진: 병원 접수 데스크 (전화기 + 모니터)",
      sub: "외국인 환자 예약 문의 및 시술 안내 통화 현장",
    },
    callcenter_cs: {
      bg1: "#EEF2FF",
      bg2: "#C7D2FE",
      desk: "#1E293B",
      accent: "#4F46E5",
      label: "SAMPLE 현장 사진: 콜센터 CS 상담석 (헤드셋 + 듀얼 모니터)",
      sub: "다수 상담원 동시 응대 및 실시간 모니터링 현장",
    },
    field_sales: {
      bg1: "#ECFDF5",
      bg2: "#A7F3D0",
      desk: "#1E293B",
      accent: "#059669",
      label: "SAMPLE 현장 사진: 외근 B2B 영업 미팅 (스마트폰 + 노트북)",
      sub: "고객사 방문 미팅 및 모바일 통화 녹취 현장",
    },
  };

  const cfg = configs[type] || configs.hospital_clinic;
  const grad = ctx.createLinearGradient(0, 0, 960, 640);
  grad.addColorStop(0, cfg.bg1);
  grad.addColorStop(1, cfg.bg2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 960, 640);

  // 책상 실루엣
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(0, 420, 960, 220);
  ctx.fillStyle = "#CBD5E1";
  ctx.fillRect(0, 420, 960, 8);

  // 모니터
  ctx.fillStyle = cfg.desk;
  drawRoundedRect(ctx, 290, 150, 380, 230, 16);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  drawRoundedRect(ctx, 306, 166, 348, 198, 8);
  ctx.fill();
  ctx.fillStyle = cfg.accent;
  ctx.fillRect(324, 186, 140, 24);
  ctx.fillStyle = "#E2E8F0";
  ctx.fillRect(324, 224, 310, 18);
  ctx.fillRect(324, 254, 260, 18);
  ctx.fillRect(324, 284, 290, 18);
  // 모의 개인정보 텍스트 (블러 테스트용)
  ctx.fillStyle = "#EF4444";
  ctx.font = "700 18px sans-serif";
  ctx.fillText("고객연락처: 010-9876-5432 (블러 테스트)", 324, 340);

  // 모니터 스탠드
  ctx.fillStyle = "#334155";
  ctx.fillRect(455, 380, 50, 42);
  ctx.fillRect(410, 414, 140, 12);

  // 인터넷전화기
  ctx.fillStyle = "#1E293B";
  drawRoundedRect(ctx, 110, 310, 140, 116, 14);
  ctx.fill();
  ctx.fillStyle = "#38BDF8";
  ctx.fillRect(130, 330, 100, 36);

  // 스마트폰
  ctx.fillStyle = "#0F172A";
  drawRoundedRect(ctx, 730, 318, 96, 160, 16);
  ctx.fill();
  ctx.fillStyle = "#5A8DEE";
  drawRoundedRect(ctx, 740, 336, 76, 124, 8);
  ctx.fill();

  // 하단 안내 캡션
  ctx.fillStyle = "#0F172A";
  ctx.font = "700 24px sans-serif";
  ctx.fillText(cfg.label, 60, 520);
  ctx.fillStyle = "#475569";
  ctx.font = "500 20px sans-serif";
  ctx.fillText(cfg.sub, 60, 560);

  return c.toDataURL("image/jpeg", 0.9);
}
