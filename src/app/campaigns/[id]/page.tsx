"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Users, MapPin, Gift, Target, X } from "lucide-react";
import { useCampaignQuery } from "@/features/campaign/hooks/useCampaignQuery";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useCreateApplication } from "@/features/application/hooks/useCreateApplication";
import { useUpdateCampaign } from "@/features/campaign/hooks/useUpdateCampaign";
import { useApplicationsQuery } from "@/features/application/hooks/useApplicationsQuery";
import { useUpdateApplicationStatus } from "@/features/application/hooks/useUpdateApplicationStatus";
import { apiClient } from "@/lib/remote/api-client";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: campaign, isLoading, error } = useCampaignQuery(id);
  const { user, isAuthenticated } = useCurrentUser();
  const createApplication = useCreateApplication();
  const updateCampaign = useUpdateCampaign();
  const updateApplicationStatus = useUpdateApplicationStatus();
  const { data: applications } = useApplicationsQuery({ campaignId: id });
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [isAdvertiser, setIsAdvertiser] = useState(false);
  const [advertiserProfileId, setAdvertiserProfileId] = useState<string | null>(null);
  const [applicationForm, setApplicationForm] = useState({
    message: "",
    plannedVisitDate: "",
  });
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const [campaignManagementError, setCampaignManagementError] = useState<string | null>(null);

  // 광고주 여부 확인
  useEffect(() => {
    if (user?.id && campaign) {
      apiClient.get(`/api/users/advertiser-profile?userId=${user.id}`)
        .then((response) => {
          if (response.data?.id) {
            setAdvertiserProfileId(response.data.id);
            setIsAdvertiser(response.data.id === campaign.advertiserProfileId);
          }
        })
        .catch(() => {
          setIsAdvertiser(false);
        });
    }
  }, [user?.id, campaign]);

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setApplicationError(null);

    try {
      await createApplication.mutateAsync({
        userId: user.id,
        campaignId: id,
        message: applicationForm.message,
        plannedVisitDate: applicationForm.plannedVisitDate,
      });

      setShowApplicationModal(false);
      setApplicationForm({ message: "", plannedVisitDate: "" });
      alert("지원이 완료되었습니다!");
    } catch (error) {
      setApplicationError(
        error instanceof Error ? error.message : "지원 처리 중 오류가 발생했습니다."
      );
    }
  };

  const handleCloseRecruitment = async () => {
    if (!user?.id || !advertiserProfileId) return;
    setCampaignManagementError(null);
    try {
      await updateCampaign.mutateAsync({
        campaignId: id,
        userId: user.id,
        advertiserProfileId,
        status: 'closed',
      });
      alert('모집이 종료되었습니다.');
    } catch (error) {
      setCampaignManagementError(error instanceof Error ? error.message : '모집 종료 처리 중 오류가 발생했습니다.');
    }
  };

  const handleSelectApplication = async (applicationId: string, status: 'selected' | 'rejected') => {
    if (!user?.id || !advertiserProfileId) return;
    setCampaignManagementError(null);
    try {
      await updateApplicationStatus.mutateAsync({
        applicationId,
        campaignId: id,
        userId: user.id,
        advertiserProfileId,
        status,
      });
      alert(status === 'selected' ? '지원자를 선정했습니다.' : '지원자를 거절했습니다.');
    } catch (error) {
      setCampaignManagementError(error instanceof Error ? error.message : '지원 상태 업데이트 중 오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="text-center text-red-400">
            체험단을 찾을 수 없습니다.
          </div>
          <Link
            href="/"
            className="mt-4 inline-block text-blue-400 hover:text-blue-300"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const isRecruiting =
    campaign.status === "recruiting" &&
    new Date(campaign.recruitmentEndDate) >= new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로 돌아가기
        </Link>

        <div className="space-y-6 rounded-xl border border-slate-700 bg-slate-900/80 p-8">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-3xl font-bold">{campaign.title}</h1>
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
            {campaign.advertiser && (
              <p className="text-slate-300">
                {campaign.advertiser.companyName}
                {campaign.advertiser.location && ` · ${campaign.advertiser.location}`}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
              <Calendar className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">모집 기간</p>
                <p className="font-medium">
                  {format(new Date(campaign.recruitmentStartDate), "yyyy년 M월 d일", {
                    locale: ko,
                  })}{" "}
                  ~{" "}
                  {format(new Date(campaign.recruitmentEndDate), "yyyy년 M월 d일", {
                    locale: ko,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
              <Users className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm text-slate-400">모집 인원</p>
                <p className="font-medium">{campaign.maxParticipants}명</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Gift className="h-5 w-5 text-yellow-400" />
              <h2 className="font-semibold">제공 혜택</h2>
            </div>
            <p className="whitespace-pre-wrap text-slate-300">
              {campaign.benefits}
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-red-400" />
              <h2 className="font-semibold">미션</h2>
            </div>
            <p className="whitespace-pre-wrap text-slate-300">{campaign.mission}</p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-400" />
              <h2 className="font-semibold">매장 정보</h2>
            </div>
            <p className="whitespace-pre-wrap text-slate-300">
              {campaign.storeInfo}
            </p>
          </div>

          {/* 광고주용 관리 섹션 */}
          {isAdvertiser && (
            <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
              <h2 className="text-lg font-semibold">체험단 관리</h2>
              
              {campaign.status === 'recruiting' && (
                <button
                  onClick={handleCloseRecruitment}
                  disabled={updateCampaign.isPending}
                  className="w-full rounded-lg bg-yellow-600 px-4 py-2 font-medium text-white transition hover:bg-yellow-700 disabled:cursor-not-allowed disabled:bg-slate-600"
                >
                  {updateCampaign.isPending ? '처리 중...' : '모집 종료'}
                </button>
              )}

              {campaign.status === 'closed' && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">모집이 종료되었습니다. 지원자를 선정해주세요.</p>
                  <button
                    onClick={async () => {
                      if (!user?.id || !advertiserProfileId) return;
                      try {
                        await updateCampaign.mutateAsync({
                          campaignId: id,
                          userId: user.id,
                          advertiserProfileId,
                          status: 'completed',
                        });
                        alert('체험단 선정이 완료되었습니다.');
                      } catch (error) {
                        setCampaignManagementError(error instanceof Error ? error.message : '오류가 발생했습니다.');
                      }
                    }}
                    disabled={updateCampaign.isPending}
                    className="w-full rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-600"
                  >
                    {updateCampaign.isPending ? '처리 중...' : '선정 완료 처리'}
                  </button>
                </div>
              )}

              {campaignManagementError && (
                <p className="text-sm text-red-400">{campaignManagementError}</p>
              )}

              {/* 지원자 리스트 */}
              {applications && applications.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-semibold text-slate-300">
                    지원자 목록 ({applications.length}명)
                  </h3>
                  {applications.map((application) => (
                    <div
                      key={application.id}
                      className="rounded-lg border border-slate-800 bg-slate-900/50 p-3"
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
                      <p className="mb-3 text-xs text-slate-500">
                        방문 예정일:{" "}
                        {format(new Date(application.plannedVisitDate), "yyyy년 M월 d일", {
                          locale: ko,
                        })}
                      </p>
                      {campaign.status === 'closed' && application.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSelectApplication(application.id, 'selected')}
                            disabled={updateApplicationStatus.isPending}
                            className="flex-1 rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-600"
                          >
                            선정
                          </button>
                          <button
                            onClick={() => handleSelectApplication(application.id, 'rejected')}
                            disabled={updateApplicationStatus.isPending}
                            className="flex-1 rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-600"
                          >
                            거절
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 인플루언서용 지원 버튼 */}
          {!isAdvertiser && isRecruiting && (
            <div className="pt-4">
              {isAuthenticated ? (
                <button
                  onClick={() => setShowApplicationModal(true)}
                  className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
                >
                  지원하기
                </button>
              ) : (
                <Link
                  href={`/login?redirectedFrom=/campaigns/${id}`}
                  className="block w-full rounded-lg bg-blue-600 px-6 py-3 text-center font-medium text-white transition hover:bg-blue-700"
                >
                  로그인 후 지원하기
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 지원 모달 */}
      {showApplicationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">체험단 지원</h2>
              <button
                onClick={() => {
                  setShowApplicationModal(false);
                  setApplicationError(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApplicationSubmit} className="space-y-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-300">각오 한마디 *</span>
                <textarea
                  value={applicationForm.message}
                  onChange={(e) =>
                    setApplicationForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                  required
                  rows={4}
                  maxLength={500}
                  placeholder="체험단 지원 각오를 작성해주세요."
                  className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
                />
                <p className="text-xs text-slate-500">
                  {applicationForm.message.length}/500
                </p>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-300">방문 예정일 *</span>
                <input
                  type="date"
                  value={applicationForm.plannedVisitDate}
                  onChange={(e) =>
                    setApplicationForm((prev) => ({
                      ...prev,
                      plannedVisitDate: e.target.value,
                    }))
                  }
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-slate-400 focus:outline-none"
                />
              </label>

              {applicationError && (
                <p className="text-sm text-red-400">{applicationError}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowApplicationModal(false);
                    setApplicationError(null);
                  }}
                  className="flex-1 rounded-md border border-slate-600 px-4 py-2 text-slate-300 transition hover:bg-slate-800"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={createApplication.isPending}
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-600"
                >
                  {createApplication.isPending ? "제출 중..." : "제출"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
