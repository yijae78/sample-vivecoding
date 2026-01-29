"use client";

import { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut, Calendar, Users, ArrowRight, Sparkles } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useCampaignsQuery } from "@/features/campaign/hooks/useCampaignsQuery";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function Home() {
  const { user, isAuthenticated, isLoading, refresh } = useCurrentUser();
  const router = useRouter();
  const { data: campaigns, isLoading: campaignsLoading } = useCampaignsQuery({
    status: "recruiting",
    limit: 20,
  });

  const handleSignOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    await refresh();
    router.replace("/");
  }, [refresh, router]);

  const authActions = isLoading ? (
    <span className="text-sm text-slate-500">세션 확인 중...</span>
  ) : isAuthenticated && user ? (
    <div className="flex items-center gap-3 text-sm text-slate-700">
      <span className="hidden truncate sm:inline">{user.email ?? "알 수 없는 사용자"}</span>
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:bg-slate-50"
        >
          대시보드
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-1.5 rounded-lg bg-slate-200 px-4 py-2 text-slate-800 transition hover:bg-slate-300"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:bg-slate-50"
      >
        로그인
      </Link>
      <Link
        href="/signup"
        className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-white transition hover:bg-emerald-400"
      >
        회원가입
      </Link>
    </div>
  );

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-10 sm:px-6 md:gap-16 md:py-16">
        {/* 네비게이션 */}
        <nav className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-900"
          >
            <Sparkles className="h-4 w-4 text-emerald-500" />
            블로그 체험단
          </Link>
          {authActions}
        </nav>

        {/* 히어로: VoiceOn 캐릭터 이미지 + 문구 */}
        <header className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-12">
          <div className="flex-1 space-y-5 md:space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
              모집 중인 체험단
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
              다양한 체험단에 지원하고 특별한 혜택을 받아보세요.
            </p>
          </div>
          <div className="relative h-64 w-full shrink-0 overflow-hidden rounded-2xl bg-slate-100 md:h-72 md:w-80">
            <Image
              src="/voiceon-hero.png"
              alt="VoiceOn"
              fill
              className="object-contain"
              priority
              unoptimized
            />
          </div>
        </header>

        {/* 콘텐츠 */}
        {campaignsLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
          </div>
        ) : !campaigns || campaigns.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-8 py-16 text-center">
            <p className="text-slate-600">현재 모집 중인 체험단이 없습니다.</p>
            <p className="mt-2 text-sm text-slate-500">곧 새로운 체험단이 올라올 예정입니다.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => {
              const isRecruiting =
                campaign.status === "recruiting" &&
                new Date(campaign.recruitmentEndDate) >= new Date();

              return (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="line-clamp-2 flex-1 text-lg font-semibold text-gray-900 transition group-hover:text-emerald-600">
                      {campaign.title}
                    </h2>
                    <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                  </div>

                  {campaign.advertiser && (
                    <p className="mt-3 text-sm text-slate-500">
                      {campaign.advertiser.companyName}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>
                        {format(
                          new Date(campaign.recruitmentEndDate),
                          "M월 d일까지",
                          { locale: ko }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span>모집 {campaign.maxParticipants}명</span>
                    </div>
                  </div>

                  {isRecruiting && (
                    <div className="mt-4 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      모집 중
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
