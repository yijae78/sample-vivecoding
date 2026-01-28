"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Calendar, Users, ArrowRight } from "lucide-react";
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
    <span className="text-sm text-slate-300">세션 확인 중...</span>
  ) : isAuthenticated && user ? (
    <div className="flex items-center gap-3 text-sm text-slate-200">
      <span className="truncate">{user.email ?? "알 수 없는 사용자"}</span>
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="rounded-md border border-slate-600 px-3 py-1 transition hover:border-slate-400 hover:bg-slate-800"
        >
          대시보드
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-1 rounded-md bg-slate-100 px-3 py-1 text-slate-900 transition hover:bg-white"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-3 text-sm">
      <Link
        href="/login"
        className="rounded-md border border-slate-600 px-3 py-1 text-slate-200 transition hover:border-slate-400 hover:bg-slate-800"
      >
        로그인
      </Link>
      <Link
        href="/signup"
        className="rounded-md bg-slate-100 px-3 py-1 text-slate-900 transition hover:bg-white"
      >
        회원가입
      </Link>
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16">
        <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-4">
          <div className="text-sm font-medium text-slate-300">
            블로그 체험단 플랫폼
          </div>
          {authActions}
        </div>

        <header className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            모집 중인 체험단
          </h1>
          <p className="max-w-3xl text-base text-slate-300 md:text-lg">
            다양한 체험단에 지원하고 특별한 혜택을 받아보세요.
          </p>
        </header>

        {campaignsLoading ? (
          <div className="text-center text-slate-400">로딩 중...</div>
        ) : !campaigns || campaigns.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-12 text-center">
            <p className="text-slate-400">현재 모집 중인 체험단이 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => {
              const isRecruiting =
                campaign.status === "recruiting" &&
                new Date(campaign.recruitmentEndDate) >= new Date();

              return (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="group rounded-xl border border-slate-700 bg-slate-900/60 p-6 transition hover:border-slate-500 hover:bg-slate-900/80"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <h2 className="line-clamp-2 text-lg font-semibold group-hover:text-blue-400">
                      {campaign.title}
                    </h2>
                    <ArrowRight className="h-5 w-5 shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-blue-400" />
                  </div>

                  {campaign.advertiser && (
                    <p className="mb-4 text-sm text-slate-400">
                      {campaign.advertiser.companyName}
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span>
                        {format(
                          new Date(campaign.recruitmentEndDate),
                          "M월 d일까지",
                          { locale: ko }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-500" />
                      <span>모집 {campaign.maxParticipants}명</span>
                    </div>
                  </div>

                  {isRecruiting && (
                    <div className="mt-4 rounded-md bg-green-500/20 px-3 py-1 text-center text-xs font-medium text-green-400">
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
