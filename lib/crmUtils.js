// 티링크노트 CRM 문자 발송 규격 검증 유틸리티 (EUC-KR 바이트 기준)

export const CRM_LIMITS = {
  SMS_MAX: 90,
  LMS_MAX: 2000,
  MMS_IMAGE_MAX_KB: 300,
  VARIABLE_BUFFER_BYTES: 30, // #{고객명}, #{회사명} 치환 시 여유분
};

export const CRM_VARIABLES = [
  { token: "#{고객명}", sample: "홍길동", desc: "수신자 이름" },
  { token: "#{회사명}", sample: "(주)티링크파트너", desc: "고객사명" },
  { token: "#{상담원명}", sample: "김담당", desc: "발송 담당자" },
  { token: "#{고객전화}", sample: "010-1234-5678", desc: "수신자 번호" },
];

/**
 * 한글/전각 2byte, 영문/숫자/공백 1byte (EUC-KR 기준) 계산
 */
export function getEucKrByteLength(text = "") {
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code > 127) {
      bytes += 2;
    } else {
      bytes += 1;
    }
  }
  return bytes;
}

/**
 * 광고 문구 및 080 수신거부 포함 최종 발송 텍스트 생성
 */
export function formatCrmMessage(rawText = "", isAd = true, optOutNumber = "080-1234-5678") {
  const trimmed = rawText.trim();
  if (!isAd) return trimmed;
  const hasPrefix = trimmed.startsWith("(광고)");
  const prefix = hasPrefix ? "" : "(광고) ";
  const suffix = trimmed.includes("무료수신거부")
    ? ""
    : `

무료수신거부 ${optOutNumber}`;
  return `${prefix}${trimmed}${suffix}`;
}

/**
 * 변수 치환 여유분을 포함한 바이트 상태 판정
 */
export function evaluateCrmMessage(rawText = "", isAd = true, hasImage = false, optOutNumber = "080-1234-5678") {
  const finalText = formatCrmMessage(rawText, isAd, optOutNumber);
  const baseBytes = getEucKrByteLength(finalText);
  const hasVariables = CRM_VARIABLES.some((v) => finalText.includes(v.token));
  const estimatedBytes = baseBytes + (hasVariables ? CRM_LIMITS.VARIABLE_BUFFER_BYTES : 0);

  let type = "LMS";
  if (hasImage) {
    type = "MMS";
  } else if (estimatedBytes <= CRM_LIMITS.SMS_MAX) {
    type = "SMS";
  }

  const isOverLimit = estimatedBytes > CRM_LIMITS.LMS_MAX;
  const isNearLimit = !isOverLimit && estimatedBytes > 1850;

  let previewText = finalText;
  CRM_VARIABLES.forEach((v) => {
    previewText = previewText.split(v.token).join(v.sample);
  });

  return {
    finalText,
    previewText,
    baseBytes,
    estimatedBytes,
    hasVariables,
    type,
    isOverLimit,
    isNearLimit,
  };
}
