"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useCreateCampaign } from "@/features/campaign/hooks/useCreateCampaign";
import { CampaignCreateSchema } from "@/features/campaign/backend/schema";
import type { CampaignCreateInput } from "@/features/campaign/backend/schema";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";

export default function NewCampaignPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useCurrentUser();
  const createCampaign = useCreateCampaign();
  const [formState, setFormState] = useState<CampaignCreateInput>({
    title: "",
    recruitmentStartDate: "",
    recruitmentEndDate: "",
    maxParticipants: 1,
    benefits: "",
    mission: "",
    storeInfo: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [advertiserProfileId, setAdvertiserProfileId] = useState<string | null>(null);

  // 광고주 프로필 ID 가져오기
  useEffect(() => {
    if (user?.id) {
      apiClient.get(`/api/users/advertiser-profile?userId=${user.id}`)
        .then((response) => {
          if (response.data?.id) {
            setAdvertiserProfileId(response.data.id);
          }
        })
        .catch(() => {
          setErrorMessage("광고주 프로필을 찾을 수 없습니다. 먼저 온보딩을 완료해주세요.");
        });
    }
  }, [user?.id]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormState((prev) => ({
        ...prev,
        [name]: name === "maxParticipants" ? parseInt(value, 10) || 1 : value,
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user?.id || !advertiserProfileId) {
        setErrorMessage("로그인 및 광고주 프로필 등록이 필요합니다.");
        return;
      }

      setErrorMessage(null);

      const validation = CampaignCreateSchema.safeParse(formState);
      if (!validation.success) {
        setErrorMessage(validation.error.errors[0]?.message ?? "입력 정보를 확인해주세요.");
        return;
      }

      try {
        const result = await createCampaign.mutateAsync({
          userId: user.id,
          advertiserProfileId,
          ...validation.data,
        });

        router.push(`/campaigns/${result.campaignId}`);
      } catch (error) {
        const message = extractApiErrorMessage(error, "체험단 등록 중 오류가 발생했습니다.");
        setErrorMessage(message);
      }
    },
    [formState, user, advertiserProfileId, createCampaign, router]
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <p className="text-center text-slate-400">로그인이 필요합니다.</p>
          <Link href="/login" className="mt-4 block text-center text-blue-400">
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <Link
          href="/my-campaigns"
          className="mb-6 inline-flex items-center gap-2 text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          체험단 관리로 돌아가기
        </Link>

        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-8">
          <h1 className="mb-6 text-2xl font-bold">새 체험단 등록</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-300">체험단명 *</span>
              <input
                type="text"
                name="title"
                value={formState.title}
                onChange={handleChange}
                required
                maxLength={255}
                className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-slate-400 focus:outline-none"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-300">모집 시작일 *</span>
                <input
                  type="date"
                  name="recruitmentStartDate"
                  value={formState.recruitmentStartDate}
                  onChange={handleChange}
                  required
                  className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-slate-400 focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-300">모집 종료일 *</span>
                <input
                  type="date"
                  name="recruitmentEndDate"
                  value={formState.recruitmentEndDate}
                  onChange={handleChange}
                  required
                  min={formState.recruitmentStartDate}
                  className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-slate-400 focus:outline-none"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-300">모집 인원 *</span>
              <input
                type="number"
                name="maxParticipants"
                value={formState.maxParticipants}
                onChange={handleChange}
                required
                min={1}
                max={1000}
                className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-slate-400 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-300">제공 혜택 *</span>
              <textarea
                name="benefits"
                value={formState.benefits}
                onChange={handleChange}
                required
                rows={4}
                className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-slate-400 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-300">미션 *</span>
              <textarea
                name="mission"
                value={formState.mission}
                onChange={handleChange}
                required
                rows={4}
                className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-slate-400 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-300">매장 정보 *</span>
              <textarea
                name="storeInfo"
                value={formState.storeInfo}
                onChange={handleChange}
                required
                rows={3}
                className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-slate-400 focus:outline-none"
              />
            </label>

            {errorMessage && (
              <p className="text-sm text-red-400">{errorMessage}</p>
            )}

            <div className="flex gap-3">
              <Link
                href="/my-campaigns"
                className="flex-1 rounded-md border border-slate-600 px-4 py-2 text-center text-slate-300 transition hover:bg-slate-800"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={createCampaign.isPending || !advertiserProfileId}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-600"
              >
                {createCampaign.isPending ? "등록 중..." : "등록하기"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
