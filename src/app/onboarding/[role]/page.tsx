"use client";

import { use, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { InfluencerOnboardingForm } from "@/features/user/components/InfluencerOnboardingForm";
import {
  AdvertiserOnboardingSchema,
} from "@/features/user/backend/schema";
import type {
  AdvertiserOnboardingInput,
} from "@/features/user/backend/schema";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";

type OnboardingPageProps = {
  params: Promise<{ role: "influencer" | "advertiser" }>;
};

export default function OnboardingPage({ params }: OnboardingPageProps) {
  const { role } = use(params);
  const router = useRouter();
  const { user, isAuthenticated } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 광고주 폼 상태
  const [advertiserForm, setAdvertiserForm] = useState<AdvertiserOnboardingInput>({
    companyName: "",
    location: "",
    category: "",
    businessRegistrationNumber: "",
  });

  const handleAdvertiserSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user?.id) return;

      setIsSubmitting(true);
      setErrorMessage(null);

      const validation = AdvertiserOnboardingSchema.safeParse(advertiserForm);
      if (!validation.success) {
        setErrorMessage(validation.error.errors[0]?.message ?? "입력 정보를 확인해주세요.");
        setIsSubmitting(false);
        return;
      }

      try {
        await apiClient.post("/api/users/onboarding/advertiser", {
          userId: user.id,
          ...validation.data,
        });

        router.replace("/");
      } catch (error) {
        const message = extractApiErrorMessage(error, "온보딩 처리 중 오류가 발생했습니다.");
        setErrorMessage(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [advertiserForm, user, router]
  );


  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <p className="text-center text-slate-400">로그인이 필요합니다.</p>
          <Link href="/login" className="mt-4 block text-center text-blue-400">
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  if (role !== "influencer" && role !== "advertiser") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <p className="text-center text-slate-400">잘못된 경로입니다.</p>
          <Link href="/" className="mt-4 block text-center text-blue-400">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          홈으로
        </Link>

        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-8">
          <h1 className="mb-6 text-2xl font-bold">
            {role === "influencer" ? "인플루언서 정보 등록" : "광고주 정보 등록"}
          </h1>

          {role === "influencer" ? (
            <InfluencerOnboardingForm />
          ) : (
            <form onSubmit={handleAdvertiserSubmit} className="space-y-6">
              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-300">업체명 *</span>
                <input
                  type="text"
                  value={advertiserForm.companyName}
                  onChange={(e) =>
                    setAdvertiserForm((prev) => ({
                      ...prev,
                      companyName: e.target.value,
                    }))
                  }
                  required
                  className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-slate-400 focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-300">위치</span>
                <input
                  type="text"
                  value={advertiserForm.location}
                  onChange={(e) =>
                    setAdvertiserForm((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-slate-400 focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-300">카테고리</span>
                <input
                  type="text"
                  value={advertiserForm.category}
                  onChange={(e) =>
                    setAdvertiserForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-slate-400 focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-300">사업자등록번호 *</span>
                <input
                  type="text"
                  value={advertiserForm.businessRegistrationNumber}
                  onChange={(e) =>
                    setAdvertiserForm((prev) => ({
                      ...prev,
                      businessRegistrationNumber: e.target.value,
                    }))
                  }
                  required
                  placeholder="123-45-67890"
                  className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
                />
              </label>

              {errorMessage && (
                <p className="text-sm text-red-400">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-600"
              >
                {isSubmitting ? "저장 중..." : "완료"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
