"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useApplicationsQuery } from "@/features/application/hooks/useApplicationsQuery";
import { useCampaignQuery } from "@/features/campaign/hooks/useCampaignQuery";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const statusConfig = {
  pending: {
    label: "대기 중",
    icon: Clock,
    color: "text-yellow-400 bg-yellow-500/20",
  },
  selected: {
    label: "선정됨",
    icon: CheckCircle,
    color: "text-green-400 bg-green-500/20",
  },
  rejected: {
    label: "거절됨",
    icon: XCircle,
    color: "text-red-400 bg-red-500/20",
  },
  completed: {
    label: "완료",
    icon: CheckCircle,
    color: "text-blue-400 bg-blue-500/20",
  },
} as const;

export default function MyApplicationsPage() {
  const { user, isAuthenticated } = useCurrentUser();
  
  // TODO: 실제로는 influencer_id를 가져와야 함
  // 임시로 userId를 사용 (나중에 수정 필요)
  const influencerId = user?.id;

  const { data: applications, isLoading, error } = useApplicationsQuery(
    influencerId ? { influencerId } : undefined
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
            지원 목록을 불러오는 중 오류가 발생했습니다.
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

        <div className="mb-6">
          <h1 className="text-3xl font-bold">내 지원 목록</h1>
          <p className="mt-2 text-slate-400">
            {applications?.length ?? 0}개의 지원 내역이 있습니다.
          </p>
        </div>

        {!applications || applications.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-8 text-center">
            <p className="text-slate-400">아직 지원한 체험단이 없습니다.</p>
            <Link
              href="/"
              className="mt-4 inline-block text-blue-400 hover:text-blue-300"
            >
              체험단 둘러보기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application, index) => (
              <ApplicationCard
                key={application.id ?? index}
                applicationId={application.campaignId ?? ""}
                application={application}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type ApplicationCardData = {
  id?: string;
  campaignId?: string;
  influencerId?: string;
  message?: string;
  plannedVisitDate?: string;
  status?: "pending" | "selected" | "rejected" | "completed";
  createdAt?: string;
  updatedAt?: string;
};

function ApplicationCard({
  applicationId,
  application,
}: {
  applicationId: string;
  application: ApplicationCardData;
}) {
  const { data: campaign } = useCampaignQuery(applicationId);
  const statusKey = application.status ?? "pending";
  const status = statusConfig[statusKey];
  const StatusIcon = status.icon;
  const message = application.message ?? "";
  const plannedVisitDate = application.plannedVisitDate ?? "";
  const createdAt = application.createdAt ?? "";

  return (
    <Link
      href={`/campaigns/${applicationId}`}
      className="block rounded-xl border border-slate-700 bg-slate-900/80 p-6 transition hover:border-slate-600"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            <h3 className="text-lg font-semibold">
              {campaign?.title ?? "로딩 중..."}
            </h3>
            <span
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${status.color}`}
            >
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
          </div>

          {campaign?.advertiser && (
            <p className="mb-2 text-sm text-slate-400">
              {campaign.advertiser.companyName}
            </p>
          )}

          <p className="mb-3 line-clamp-2 text-sm text-slate-300">
            {message}
          </p>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                방문 예정:{" "}
                {plannedVisitDate
                  ? format(new Date(plannedVisitDate), "yyyy년 M월 d일", { locale: ko })
                  : "-"}
              </span>
            </div>
            <span>
              지원일:{" "}
              {createdAt
                ? format(new Date(createdAt), "yyyy년 M월 d일", { locale: ko })
                : "-"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
