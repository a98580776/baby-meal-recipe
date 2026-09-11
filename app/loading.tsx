// App-shell fallback shown while app/page.tsx's server-side data fetch
// (getStages/getAllergens/...) is in flight, so the very first launch shows
// a minimal branded loading state instead of a blank screen.
import { LoadingState } from "@/components/common/LoadingState";

export default function Loading() {
  return <LoadingState />;
}
