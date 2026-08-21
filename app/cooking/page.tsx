import { Suspense } from "react";
import { CookingModeView } from "@/components/cooking/CookingModeView";

export default function CookingPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-gray-500">레시피를 확인하는 중입니다...</p>}>
      <CookingModeView />
    </Suspense>
  );
}
