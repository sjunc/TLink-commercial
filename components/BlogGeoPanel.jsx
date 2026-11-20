"use client";

import { useState } from "react";
import { Copy, Check, Globe, Sparkles } from "lucide-react";

export default function BlogGeoPanel({ blogData, setBlogData }) {
  const [copied, setCopied] = useState(false);

  if (!blogData) return null;

  const fullTextForCopy = () => {
    const qaBlock = (blogData.geo_qa || [])
      .map((item, i) => `Q${i + 1}. ${item.q}
A${i + 1}. ${item.a}`)
      .join("\n\n");
    const tags = (blogData.seo_keywords || []).map((k) => `#${k.replace(/\s+/g, "")}`).join(" ");
    return `${blogData.title}

${blogData.body_markdown}

---
### 자주 묻는 질문 (AI 검색 인용용 Q&A)

${qaBlock}

${tags}`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullTextForCopy());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold inline-flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            GEO(AI 검색 최적화) + SEO 구조 적용
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="px-3.5 py-1.5 rounded-lg bg-tlink-navy text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-slate-800 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "복사 완료!" : "블로그 전체 복사"}
        </button>
      </div>

      {/* 제목 */}
      <div>
        <label className="text-xs font-bold text-slate-600 block mb-1">포스팅 제목</label>
        <input
          type="text"
          value={blogData.title || ""}
          onChange={(e) => setBlogData({ ...blogData, title: e.target.value })}
          className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300 bg-white"
        />
      </div>

      {/* 본문 */}
      <div>
        <label className="text-xs font-bold text-slate-600 block mb-1">도입 사례 본문 (수정 가능)</label>
        <textarea
          rows={10}
          value={blogData.body_markdown || ""}
          onChange={(e) => setBlogData({ ...blogData, body_markdown: e.target.value })}
          className="w-full px-3.5 py-3 text-xs leading-relaxed rounded-xl border border-slate-300 bg-white font-mono"
        />
      </div>

      {/* GEO AI 인용용 Q&A 블록 */}
      <div className="bg-tlink-sky/60 border border-blue-200 rounded-xl p-4 space-y-2.5">
        <div className="text-xs font-bold text-tlink-navy flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-tlink-blue" />
          GEO(생성형 AI 검색) 인용 최적화 Q&A 블록
        </div>
        <div className="space-y-2">
          {(blogData.geo_qa || []).map((item, idx) => (
            <div key={idx} className="bg-white rounded-lg p-3 border border-blue-100 text-xs space-y-1">
              <div className="font-bold text-tlink-navy">Q{idx + 1}. {item.q}</div>
              <div className="text-slate-600 leading-relaxed">A. {item.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SEO 해시태그 */}
      <div className="flex flex-wrap gap-1.5">
        {(blogData.seo_keywords || []).map((kw, i) => (
          <span
            key={i}
            className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium"
          >
            #{kw.replace(/\s+/g, "")}
          </span>
        ))}
      </div>
    </div>
  );
}
