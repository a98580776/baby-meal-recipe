"use client";

import { useState } from "react";
import type { BabyProfile } from "@/lib/profile/babyProfile";
import { calculateAgeDays, formatAgeSummary, recommendStageId } from "@/lib/profile/stageRecommendation";
import type { Stage } from "@/types/domain";

interface BabyProfileFormProps {
  initialProfile?: BabyProfile | null;
  stages: Stage[];
  onComplete: (profile: BabyProfile) => void;
}

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2MB, stored as a data URL in localStorage

export function BabyProfileForm({ initialProfile, stages, onComplete }: BabyProfileFormProps) {
  const [name, setName] = useState(initialProfile?.name ?? "");
  const [birthDate, setBirthDate] = useState(initialProfile?.birthDate ?? "");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(initialProfile?.photoDataUrl ?? null);
  const [confirmedStageId, setConfirmedStageId] = useState(initialProfile?.confirmedStageId ?? "");
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const ageDays = birthDate && birthDate <= today ? calculateAgeDays(birthDate) : null;
  const recommendedStageId = ageDays !== null ? recommendStageId(ageDays, stages) : null;
  // Once the user has explicitly picked a stage this session it wins; until
  // then the fresh recommendation is shown as the default selection —
  // 인수인계 §9 "추천값과 사용자가 최종 선택한 단계값을 분리".
  const selectedStageId = confirmedStageId || recommendedStageId || "";

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoDataUrl(null);
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("사진 용량이 너무 큽니다 (최대 2MB).");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) return setError("아기 이름을 입력해주세요.");
    if (!birthDate) return setError("생년월일을 입력해주세요.");
    if (birthDate > today) return setError("생년월일이 오늘보다 이후일 수 없습니다.");
    if (!selectedStageId) return setError("이유식 단계 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");

    onComplete({ name: trimmedName, birthDate, photoDataUrl, confirmedStageId: selectedStageId });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col justify-center gap-6 py-6">
      <div>
        <h1 className="mb-1 text-xl font-bold">아기 정보를 알려주세요</h1>
        <p className="text-sm text-gray-500">생년월일을 기준으로 이유식 단계를 추천해드려요.</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <label
          htmlFor="photo"
          className="flex h-36 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400"
        >
          {photoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoDataUrl} alt="아기 사진" className="h-full w-full object-cover" />
          ) : (
            "사진 추가"
          )}
        </label>
        <input id="photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        <span className="text-xs text-gray-400">선택 사항</span>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700" htmlFor="name">
          아기 이름
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 하은"
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700" htmlFor="birthDate">
          생년월일
        </label>
        <input
          id="birthDate"
          type="date"
          value={birthDate}
          max={today}
          onChange={(e) => {
            setBirthDate(e.target.value);
            setConfirmedStageId(""); // birthdate changed: fall back to the fresh recommendation again
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      {ageDays !== null && (
        <div>
          <p className="mb-1 text-sm font-semibold text-gray-700">이유식 단계</p>
          <p className="mb-2 text-xs text-gray-500">
            {formatAgeSummary(ageDays)} 기준 추천 단계예요. 다른 단계를 원하면 직접 선택할 수 있어요.
          </p>
          <div className="flex flex-wrap gap-2">
            {stages.map((stage) => (
              <button
                key={stage.id}
                type="button"
                onClick={() => setConfirmedStageId(stage.id)}
                className={`relative rounded-full border px-4 py-2 text-sm ${
                  selectedStageId === stage.id
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-gray-700"
                }`}
              >
                {stage.name_ko}
                {recommendedStageId === stage.id && (
                  <span className="absolute -top-2 -right-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    추천
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" className="w-full rounded-lg bg-blue-600 py-3 text-base font-semibold text-white">
        {initialProfile ? "저장하기" : "시작하기"}
      </button>
    </form>
  );
}
