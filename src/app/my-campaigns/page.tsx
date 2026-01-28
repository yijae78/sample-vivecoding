"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Calendar, Users, Edit, Eye } from "lucide-react";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useCampaignsQuery } from "@/features/campaign/hooks/useCampaignsQuery";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function MyCampaignsPage() {
  const { user, isAuthenticated } = useCurrentUser();
  
  // 광고주의 체험단 목록 조회 (임시로 모든 체험단 조회)
  // TODO: 실제로는 advertiser_id로 필터링해야 함
  const { data: campaigns, isLoading, error } = useCampaignsQuery();

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="text-center text-red-400">
            체험단 목록을 불러오는 중 오류가 발생했습니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          홈으로
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">내 체험단 관리</h1>
            <p className="mt-2 text-slate-400">
              {campaigns?.length ?? 0}개의 체험단이 있습니다.
            </p>
          </div>
          <Link
            href="/campaigns/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            새 체험단 등록
          </Link>
        </div>

        {!campaigns || campaigns.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-8 text-center">
            <p className="text-slate-400">등록한 체험단이 없습니다.</p>
            <Link
              href="/campaigns/new"
              className="mt-4 inline-block text-blue-400 hover:text-blue-300"
            >
              첫 체험단 등록하기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: any }) {
  const [showApplications, setShowApplications] = useState(false);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            <h3 className="text-lg font-semibold">{campaign.title}</h3>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                campaign.status === "recruiting"
                  ? "bg-green-500/20 text-green-400"
                  : campaign.status === "closed"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-slate-500/20 text-slate-400"
              }`}
            >
              {campaign.status === "recruiting"
                ? "모집 중"
                : campaign.status === "closed"
                  ? "모집 종료"
                  : "선정 완료"}
            </span>
          </div>

          <div className="mb-3 grid gap-2 text-sm text-slate-400 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(campaign.recruitmentStartDate), "yyyy년 M월 d일", {
                  locale: ko,
                })}{" "}
                ~{" "}
                {format(new Date(campaign.recruitmentEndDate), "yyyy년 M월 d일", {
                  locale: ko,
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>모집 인원: {campaign.maxParticipants}명</span>
            </div>
          </div>

          <p className="line-clamp-2 text-sm text-slate-300">{campaign.benefits}</p>
        </div>

        <div className="ml-4 flex gap-2">
          <Link
            href={`/campaigns/${campaign.id}`}
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setShowApplications(!showApplications)}
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            지원자 보기
          </button>
        </div>
      </div>

      {showApplications && (
        <div className="mt-4 border-t border-slate-700 pt-4">
          <ApplicationsList campaignId={campaign.id} />
        </div>
      )}
    </div>
  );
}

function ApplicationsList({ campaignId }: { campaignId: string }) {
  const { data: applications, isLoading } = useApplicationsQuery({ campaignId });

  if (isLoading) {
    return <div className="text-sm text-slate-400">로딩 중...</div>;
  }

  if (!applications || applications.length === 0) {
    return <div className="text-sm text-slate-400">아직 지원자가 없습니다.</div>;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-slate-300">
        지원자 ({applications.length}명)
      </h4>
      {applications.map((application) => (
        <div
          key={application.id}
          className="rounded-lg border border-slate-800 bg-slate-950/50 p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-200">
              지원자 #{application.id.slice(0, 8)}
            </span>
            <span
              className={`rounded-full px-2 py-1 text-xs ${
                application.status === "pending"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : application.status === "selected"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
              }`}
            >
              {application.status === "pending"
                ? "대기 중"
                : application.status === "selected"
                  ? "선정됨"
                  : "거절됨"}
            </span>
          </div>
          <p className="mb-2 text-sm text-slate-400">{application.message}</p>
          <p className="text-xs text-slate-500">
            방문 예정일:{" "}
            {format(new Date(application.plannedVisitDate), "yyyy년 M월 d일", {
              locale: ko,
            })}
          </p>
        </div>
      ))}
    </div>
  );
}
