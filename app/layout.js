import "./globals.css";

export const metadata = {
  title: "T-Link Pitch AI | A-29-차OO(4157) 프로젝트",
  description: "현장 사진 1장으로 티링크 기술 차별점을 자동 매칭해 GEO 블로그·카드뉴스·CRM MMS를 생성하는 B2B 마케팅 자동화 솔루션",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
