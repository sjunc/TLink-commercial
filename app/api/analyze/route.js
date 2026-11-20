import { NextResponse } from "next/server";
import knowledgeBase from "@/data/tlinkKnowledge.json";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

function buildFallbackResult(industryId, productHint, memo) {
  const industry =
    knowledgeBase.industries.find((i) => i.industry_id === industryId) ||
    knowledgeBase.industries[0];
  const top3 = industry.selling_points.slice(0, 3);
  const primary = top3[0];

  const tripleKeywords = primary.triple_keyword_example;
  const blogBody = `## ${industry.industry_name} 현장, 왜 티링크(T-LINK)를 선택할까요?

${memo ? `현장 메모: ${memo}

` : ""}${industry.industry_name} 현장에서는 상담 누락과 증빙 공백이 곧바로 신뢰 하락과 기회 손실로 이어집니다. 티링크는 국내 1,000여 개 기업에 도입된 검증된 녹취·CRM 솔루션으로, ${productHint || "티링크비즈레코딩 및 티링크노트 CRM"}을 통해 현장 업무를 체계화합니다.

### 핵심 기술 차별점 3가지
${top3
  .map(
    (sp, idx) =>
      `${idx + 1}. **${sp.title}**
   - ${sp.selling_point}
   - 적용 조건: ${sp.condition} (출처: ${sp.source})`
  )
  .join(" ")}

### 도입 및 요금 안내 (예시 견적)
- **티링크비즈 A타입:** 상담원 1인 월 3만원 (고객관리·녹취·STT 요약·일일보고서 포함)
- **종합리포트(경영분석):** 월 10만원 (A타입 이용 시, 월 3회 생성)
- *설정비 30만원 및 VAT 별도, 최종 비용은 회선·상담 규모 상담 후 확정됩니다.*

무료 도입 상담: **1877-3836** | **www.tlinkcrm.com**`;

  return {
    mode: "demo_fallback",
    model_used: "local-knowledge-engine",
    detected_industry_id: industry.industry_id,
    detected_industry_name: industry.industry_name,
    confidence: 0.92,
    scene_summary: `${industry.industry_name} 환경으로 분류되었습니다. (API 키 미입력으로 지식베이스 기반 데모 모드로 생성됨)`,
    triple_keywords: tripleKeywords,
    matched_points: top3.map((sp) => ({
      id: sp.id,
      title: sp.title,
      selling_point: sp.selling_point,
      source: sp.source,
      condition: sp.condition,
      evidence_metric: sp.evidence_metric,
    })),
    blog: {
      title: `[${industry.industry_name} 도입 가이드] ${tripleKeywords.join(" · ")} — 티링크(T-LINK) 솔루션`,
      body_markdown: blogBody,
      geo_qa: top3.map((sp) => sp.geo_qa_seed),
      seo_keywords: [
        "티링크",
        "기업용 녹취",
        "CRM 추천",
        industry.industry_name,
        ...tripleKeywords,
      ],
    },
    card_news: {
      badge: `${industry.preset_label.split("/")[0].trim()} 솔루션`,
      headline: primary.title,
      subcopy: primary.selling_point,
      triple_keywords: tripleKeywords,
    },
    crm_message: {
      body: `안녕하세요 #{고객명}님, #{회사명}의 상담·녹취 업무 혁신을 돕는 티링크(T-LINK)입니다.

${industry.industry_name} 현장에서 가장 많이 찾으시는 [${primary.title}] 기능을 소개해 드립니다.

✔ ${top3[0].evidence_metric}
✔ ${top3[1].evidence_metric}
✔ 티링크비즈 A타입 월 3만원/인부터 시작 (설정비 30만원·VAT 별도)

통화가 끝나면 보고서가 시작됩니다.
무료 상담 문의: 1877-3836 (www.tlinkcrm.com)`,
    },
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      imageBase64,
      manualIndustryId,
      productHint = "",
      memo = "",
      apiKey: clientApiKey,
      model: clientModel,
    } = body;

    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;
    const model = (clientModel || DEFAULT_MODEL).trim();

    // API 키가 없거나 플레이스홀더인 경우 지식베이스 기반 데모 응답 반환
    if (!apiKey || apiKey.includes("여기에_GEMINI")) {
      const fallback = buildFallbackResult(
        manualIndustryId || "hospital_clinic",
        productHint,
        memo
      );
      return NextResponse.json(fallback);
    }

    const base64Data = imageBase64?.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;
    const mimeType = imageBase64?.startsWith("data:image/png")
      ? "image/png"
      : "image/jpeg";

    const systemPrompt = `당신은 주식회사 티링크앤주인닷컴(T-LINK)의 B2B 마케팅 AI 전문가입니다.
제공된 현장 사진과 아래 [티링크 팩트 지식베이스 JSON]만을 근거로 분석하고 홍보 콘텐츠를 생성하세요.

[필수 팩트 가드레일]
1. 지식베이스에 없는 기능, 가격, 고객사 사례를 절대 지어내지 마세요.
2. 사진만으로 확인할 수 없는 도입 좌석 수, 계약 금액, 매출 상승률 등 미확인 성과를 단정하지 마세요.
3. 요금제 언급 시 반드시 '상담원 1인 기준, 설정비 30만원·VAT 별도, 예시 견적' 조건을 유지하세요.
4. matched_points는 반드시 지식베이스 내 실제 항목에서 3개를 선택하고, source(매뉴얼 출처) 필드는 축약하거나 생략하지 말고 원문 그대로 표기하세요.
5. triple_keywords는 CJ 고메치킨 사례처럼 [현장 업종, 고객 페인포인트, 티링크 핵심 기능] 3개 요소로 구성하세요.
6. blog.geo_qa는 잠재 고객이 ChatGPT/Gemini 등 AI에게 질문할 때 티링크가 인용되기 좋은 팩트 기반 Q&A 3개로 작성하세요.
7. crm_message.body는 #{고객명}, #{회사명}, #{상담원명} 변수를 포함하고 EUC-KR 1,200byte 이내로 간결하게 작성하세요.

[사용자 추가 입력]
- 수동 선택 업종 ID (값이 있으면 최우선 적용, 없으면 사진으로 추론): ${manualIndustryId || "자동 추론"}
- 도입/강조 제품 힌트: ${productHint || "자동 추천"}
- 현장 메모: ${memo || "없음"}

[티링크 팩트 지식베이스 JSON]
${JSON.stringify(knowledgeBase)}

반드시 아래 JSON 스키마만 출력하세요 (마크다운 코드블록 없이 순수 JSON):
{
  "detected_industry_id": "hospital_clinic | callcenter_cs | field_sales | travel_global | education_public | office_smb",
  "detected_industry_name": "업종명",
  "confidence": 0.0 ~ 1.0,
  "scene_summary": "사진에서 관찰된 현장 상황 1~2문장",
  "triple_keywords": ["키워드1(업종)", "키워드2(페인포인트)", "키워드3(티링크기능)"],
  "matched_points": [
    {
      "id": "지식베이스 ID",
      "title": "제목",
      "selling_point": "설명",
      "source": "매뉴얼 출처",
      "condition": "적용 조건",
      "evidence_metric": "수치 근거"
    }
  ],
  "blog": {
    "title": "SEO/GEO 최적화 블로그 제목",
    "body_markdown": "마크다운 형식의 블로그 본문 (도입 배경, 핵심 차별점 3가지, 출처/조건, 예시 견적, 상담 안내 포함)",
    "geo_qa": [
      { "q": "질문1", "a": "팩트 기반 답변1" },
      { "q": "질문2", "a": "팩트 기반 답변2" },
      { "q": "질문3", "a": "팩트 기반 답변3" }
    ],
    "seo_keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
  },
  "card_news": {
    "badge": "짧은 상단 배지 문구 (12자 이내)",
    "headline": "강력한 메인 헤드라인 (28자 이내)",
    "subcopy": "핵심 가치 서브카피 (55자 이내)",
    "triple_keywords": ["키워드1", "키워드2", "키워드3"]
  },
  "crm_message": {
    "body": "#{고객명}, #{회사명} 변수를 포함한 티링크노트 CRM 영업 문자 본문"
  }
}`;

    const parts = [{ text: systemPrompt }];
    if (base64Data) {
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data,
        },
      });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const geminiRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.35,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return NextResponse.json(
        {
          error: `Gemini API 호출 오류 (${geminiRes.status})`,
          detail: errText,
          model_attempted: model,
        },
        { status: geminiRes.status }
      );
    }

    const geminiJson = await geminiRes.json();
    const rawText =
      geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      mode: "gemini_live",
      model_used: model,
      ...parsed,
    });
  } catch (err) {
    console.error("Analyze API error:", err);
    return NextResponse.json(
      { error: "분석 처리 중 오류가 발생했습니다.", detail: err.message },
      { status: 500 }
    );
  }
}
