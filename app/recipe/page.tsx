import { Suspense } from "react";
import { RecipeView } from "@/components/recipe/RecipeView";
import { LoadingState } from "@/components/common/LoadingState";

// 이 페이지는 정적 프리렌더 대상이 아니므로 강제 dynamic 처리한다.
// 그렇지 않으면 Vercel이 Cache-Control: public, max-age=0, must-revalidate로
// 서빙해 브라우저/TWA가 재검증 실패 시 배포 전 버전을 계속 캐시해서 보여줄 수 있다.
export const dynamic = "force-dynamic";

export default function RecipePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <RecipeView />
    </Suspense>
  );
}
