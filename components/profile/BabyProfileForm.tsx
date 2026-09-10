"use client";

import { useState } from "react";
import type { BabyProfile } from "@/lib/profile/babyProfile";
import { calculateAgeDays, formatAgeSummary, recommendStageId } from "@/lib/profile/stageRecommendation";
import { compressPhotoToDataUrl, RAW_UPLOAD_MAX_BYTES } from "@/lib/profile/photoCompression";
import type { Allergen, Stage } from "@/types/domain";

interface BabyProfileFormProps {
  initialProfile?: BabyProfile | null;
  stages: Stage[];
  allergens: Allergen[];
  onComplete: (profile: BabyProfile) => void;
}

export function BabyProfileForm({ initialProfile, stages, allergens, onComplete }: BabyProfileFormProps) {
  const [name, setName] = useState(initialProfile?.name ?? "");
  const [birthDate, setBirthDate] = useState(initialProfile?.birthDate ?? "");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(initialProfile?.photoDataUrl ?? null);
  const [confirmedStageId, setConfirmedStageId] = useState(initialProfile?.confirmedStageId ?? "");
  // C2 알레르기 입력 — RecipeInputForm에 있던 것을 여기로 이동(아기 정보에
  // 한 번만 선언). allergens.code를 그대로 BabyProfile.allergyCodes에
  // 저장한다 — lib/rules/safety.ts의 declaredAllergies 매칭이 이 코드 값을
  // 그대로 기대하므로 별도 변환 없이 재사용한다.
  const [allergyCodes, setAllergyCodes] = useState<string[]>(initialProfile?.allergyCodes ?? []);
  const [error, setError] = useState<string | null>(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);

  function toggleAllergy(code: string) {
    setAllergyCodes((list) => (list.includes(code) ? list.filter((x) => x !== code) : [...list, code]));
  }

  // 화면 표시 전용 축약 — allergens.name_ko에는 "국내 19개 표시대상" 법정
  // 여부를 설명하는 괄호 문구가 데이터로 그대로 박혀 있다(예: 밤/견과류,
  // 생선, 참깨, 들깨). 그 판정 데이터/로직 자체(ingredient_allergens.scope 등)는
  // 변경하지 않고, 여기서는 라벨만 줄인다. "조개류(굴·전복·홍합 등)"처럼
  // 표시대상과 무관한 예시 괄호는 건드리지 않도록 "표시대상"이 포함된
  // 괄호만 제거한다.
  function displayAllergenName(nameKo: string): string {
    return nameKo.replace(/\([^)]*표시대상[^)]*\)/g, "").trim();
  }

  const today = new Date().toISOString().slice(0, 10);

  const ageDays = birthDate && birthDate <= today ? calculateAgeDays(birthDate) : null;
  const recommendedStageId = ageDays !== null ? recommendStageId(ageDays, stages) : null;
  // Once the user has explicitly picked a stage this session it wins; until
  // then the fresh recommendation is shown as the default selection —
  // 인수인계 §9 "추천값과 사용자가 최종 선택한 단계값을 분리".
  const selectedStageId = confirmedStageId || recommendedStageId || "";

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoDataUrl(null);
      return;
    }
    if (file.size > RAW_UPLOAD_MAX_BYTES) {
      setError("사진 용량이 너무 큽니다 (최대 15MB).");
      e.target.value = "";
      return;
    }
    setError(null);
    setPhotoProcessing(true);
    try {
      const compressed = await compressPhotoToDataUrl(file);
      setPhotoDataUrl(compressed);
    } catch {
      setError("사진을 처리하지 못했습니다. 다른 사진을 선택해주세요.");
      e.target.value = "";
    } finally {
      setPhotoProcessing(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) return setError("아기 이름을 입력해주세요.");
    if (!birthDate) return setError("생년월일을 입력해주세요.");
    if (birthDate > today) return setError("생년월일이 오늘보다 이후일 수 없습니다.");
    if (!selectedStageId) return setError("이유식 단계 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");

    onComplete({ name: trimmedName, birthDate, photoDataUrl, confirmedStageId: selectedStageId, allergyCodes });
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
          {photoProcessing ? (
            "처리 중..."
          ) : photoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoDataUrl} alt="아기 사진" className="h-full w-full object-cover" />
          ) : (
            "사진 추가"
          )}
        </label>
        <input id="photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={photoProcessing} />
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

      <div>
        <p className="mb-1 text-sm font-semibold text-gray-700">알레르기 (선택)</p>
        <p className="mb-2 text-xs text-gray-500">
          해당하는 항목을 선택하면 관련 재료에 안전 경고가 표시됩니다.
        </p>
        <div className="flex flex-wrap gap-2">
          {allergens.map((a) => {
            const selected = allergyCodes.includes(a.code);
            return (
              <button
                key={a.code}
                type="button"
                onClick={() => toggleAllergy(a.code)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  selected
                    ? "border-red-600 bg-red-50 text-red-700"
                    : "border-gray-300 bg-white text-gray-700"
                }`}
              >
                {displayAllergenName(a.name_ko)}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={photoProcessing}
        className="w-full rounded-lg bg-blue-600 py-3 text-base font-semibold text-white disabled:opacity-60"
      >
        {initialProfile ? "저장하기" : "시작하기"}
      </button>
    </form>
  );
}
