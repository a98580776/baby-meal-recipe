"use client";

import { useState } from "react";
import type { BabyProfile } from "@/lib/profile/babyProfile";

interface BabyProfileFormProps {
  initialProfile?: BabyProfile | null;
  onComplete: (profile: BabyProfile) => void;
}

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2MB, stored as a data URL in localStorage

export function BabyProfileForm({ initialProfile, onComplete }: BabyProfileFormProps) {
  const [name, setName] = useState(initialProfile?.name ?? "");
  const [birthDate, setBirthDate] = useState(initialProfile?.birthDate ?? "");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(initialProfile?.photoDataUrl ?? null);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

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

    onComplete({ name: trimmedName, birthDate, photoDataUrl });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h1 className="mb-1 text-xl font-bold">아기 정보를 알려주세요</h1>
        <p className="text-sm text-gray-500">생년월일을 기준으로 이유식 단계를 추천해드려요.</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <label
          htmlFor="photo"
          className="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400"
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
          onChange={(e) => setBirthDate(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" className="w-full rounded-lg bg-blue-600 py-3 text-base font-semibold text-white">
        시작하기
      </button>
    </form>
  );
}
