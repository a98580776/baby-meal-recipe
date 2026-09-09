import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "개인정보처리방침",
};

interface Section {
  heading: string;
  body: React.ReactNode;
}

const sections: Section[] = [
  {
    heading: "1. 수집하는 정보",
    body: (
      <>
        <p>
          이 앱은 별도의 회원가입이나 로그인이 없습니다. 다음 정보는 기기(브라우저) 내부에만
          저장되며, 저희 서버로 전송되지 않습니다:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>아기 이름 (선택 입력)</li>
          <li>아기 생년월일</li>
          <li>아기 사진 (선택 입력)</li>
          <li>알레르기 선택 정보</li>
          <li>먹어본 재료 기록</li>
        </ul>
      </>
    ),
  },
  {
    heading: "2. 서버로 전송되는 정보",
    body: (
      <>
        <p>레시피를 생성할 때, 다음 정보만 저희 서버로 전송됩니다:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>이유식 단계(예: 중기)</li>
          <li>이유식 형태(예: 퓨레)</li>
          <li>선택한 재료 목록</li>
        </ul>
        <p className="mt-2">
          위 정보는 특정 개인이나 아기를 식별할 수 없는 형태이며, 서버에 영구 저장되지 않고
          레시피 생성에만 일회성으로 사용됩니다. 아기 이름, 생년월일, 사진, 알레르기 정보는 이
          요청에 포함되지 않습니다.
        </p>
      </>
    ),
  },
  {
    heading: "3. 저장하지 않는 정보",
    body: (
      <>
        <p>이 앱은 다음을 수집하거나 저장하지 않습니다:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>계정 정보(이메일, 비밀번호 등) — 회원가입 기능 자체가 없음</li>
          <li>위치 정보</li>
          <li>광고 식별자</li>
          <li>분석/추적 스크립트(Google Analytics 등) — 사용하지 않음</li>
          <li>기기 내 정보를 저희 서버나 제3자에게 전송하는 기능</li>
        </ul>
      </>
    ),
  },
  {
    heading: "4. 기기 내 정보 삭제",
    body: (
      <p>
        브라우저의 사이트 데이터/저장공간을 삭제하면 위 1번 항목의 모든 정보가 즉시 삭제됩니다.
        저희 서버에는 애초에 저장된 개인정보가 없으므로 별도 삭제 요청이 필요하지 않습니다.
      </p>
    ),
  },
  {
    heading: "5. 아동 개인정보",
    body: (
      <p>
        이 앱은 부모/보호자가 자녀의 이유식 계획을 위해 사용하는 도구이며, 아동이 직접 사용하도록
        설계되지 않았습니다. 위 1번 항목처럼 아동 관련 정보가 입력되더라도 기기 내부에만 저장되고
        외부로 전송되지 않습니다.
      </p>
    ),
  },
  {
    heading: "6. 문의",
    body: <p>a98580776@gmail.com</p>,
  },
  {
    heading: "7. 변경 이력",
    body: (
      <p>
        이 방침이 변경되는 경우 이 페이지에 최신 버전을 게시합니다.
        <br />
        최초 게시일: 2026-09-10
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="홈으로 돌아가기"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-600)]"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-serif-kr text-xl font-bold tracking-tight text-[var(--ink-900)]">
          개인정보처리방침
        </h1>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {sections.map((section) => (
          <section
            key={section.heading}
            className="rounded-2xl border border-[var(--border-warm)] bg-[var(--surface-white)] p-4 shadow-sm"
          >
            <h2 className="text-sm font-semibold text-[var(--ink-900)]">{section.heading}</h2>
            <div className="mt-2 text-sm leading-relaxed text-[var(--ink-600)]">{section.body}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
