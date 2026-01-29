"use client";

import { useCallback, useState } from "react";
import { Plus, X } from "lucide-react";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useInfluencerOnboarding } from "@/features/user/hooks/useInfluencerOnboarding";
import {
  InfluencerOnboardingSchema,
  CHANNEL_TYPE_LABELS,
  type InfluencerOnboardingInput,
} from "@/features/user/backend/schema";
import { validateMinimumAge, MINIMUM_INFLUENCER_AGE } from "@/lib/validation/age";
import { validateChannelUrl as validateChannelUrlPattern, checkDuplicateChannels, type ChannelInput, type ChannelType } from "@/lib/validation/channel";

interface InfluencerOnboardingFormProps {
  onSuccess?: () => void;
}

export function InfluencerOnboardingForm({ onSuccess }: InfluencerOnboardingFormProps) {
  const { user } = useCurrentUser();
  const mutation = useInfluencerOnboarding();
  const [formState, setFormState] = useState<InfluencerOnboardingInput>({
    birthDate: "",
    channels: [],
  });
  const [errors, setErrors] = useState<{
    birthDate?: string;
    channels?: string;
    channelErrors?: Record<number, { url?: string; duplicate?: string }>;
  }>({});

  const validateBirthDate = useCallback((date: string) => {
    if (!date) {
      setErrors((prev) => ({ ...prev, birthDate: undefined }));
      return true;
    }
    if (!validateMinimumAge(date, MINIMUM_INFLUENCER_AGE)) {
      setErrors((prev) => ({ ...prev, birthDate: '만 14세 이상만 가입 가능합니다.' }));
      return false;
    }
    setErrors((prev) => ({ ...prev, birthDate: undefined }));
    return true;
  }, []);

  const validateChannelUrlField = useCallback((index: number, channelType: ChannelType, url: string) => {
    if (!url) {
      setErrors((prev) => ({
        ...prev,
        channelErrors: {
          ...prev.channelErrors,
          [index]: { ...prev.channelErrors?.[index], url: undefined },
        },
      }));
      return true;
    }
    if (!validateChannelUrlPattern(channelType, url)) {
      setErrors((prev) => ({
        ...prev,
        channelErrors: {
          ...prev.channelErrors,
          [index]: { ...prev.channelErrors?.[index], url: '채널 유형에 맞는 URL을 입력해주세요.' },
        },
      }));
      return false;
    }
    setErrors((prev) => ({
      ...prev,
      channelErrors: {
        ...prev.channelErrors,
        [index]: { ...prev.channelErrors?.[index], url: undefined },
      },
    }));
    return true;
  }, []);

  const checkDuplicate = useCallback(() => {
    if (checkDuplicateChannels(formState.channels as ChannelInput[])) {
      setErrors((prev) => ({
        ...prev,
        channels: '동일한 채널 유형을 중복으로 등록할 수 없습니다.',
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, channels: undefined }));
    return true;
  }, [formState.channels]);

  const addChannel = useCallback(() => {
    const newChannels = [
      ...formState.channels,
      { channelType: "naver" as ChannelType, channelName: "", channelUrl: "" },
    ];
    setFormState((prev) => ({ ...prev, channels: newChannels }));
    
    if (checkDuplicateChannels(newChannels as ChannelInput[])) {
      setErrors((prev) => ({
        ...prev,
        channels: '동일한 채널 유형을 중복으로 등록할 수 없습니다.',
      }));
    } else {
      setErrors((prev) => ({ ...prev, channels: undefined }));
    }
  }, [formState.channels]);

  const removeChannel = useCallback((index: number) => {
    const newChannels = formState.channels.filter((_, i) => i !== index);
    setFormState((prev) => ({ ...prev, channels: newChannels }));
    
    if (newChannels.length > 0 && checkDuplicateChannels(newChannels as ChannelInput[])) {
      setErrors((prev) => ({
        ...prev,
        channels: '동일한 채널 유형을 중복으로 등록할 수 없습니다.',
      }));
    } else {
      setErrors((prev) => ({ ...prev, channels: undefined }));
    }
  }, [formState.channels]);

  const updateChannel = useCallback(
    (index: number, field: keyof ChannelInput, value: string | ChannelType) => {
      const newChannels = formState.channels.map((channel, i) =>
        i === index ? { ...channel, [field]: value } : channel
      );
      setFormState((prev) => ({ ...prev, channels: newChannels }));

      if (field === 'channelType' || field === 'channelUrl') {
        const updatedChannel = newChannels[index];
        if (field === 'channelType') {
          validateChannelUrlField(index, value as ChannelType, updatedChannel.channelUrl);
        } else {
          validateChannelUrlField(index, updatedChannel.channelType, value as string);
        }
      }

      if (checkDuplicateChannels(newChannels as ChannelInput[])) {
        setErrors((prev) => ({
          ...prev,
          channels: '동일한 채널 유형을 중복으로 등록할 수 없습니다.',
        }));
      } else {
        setErrors((prev) => ({ ...prev, channels: undefined }));
      }
    },
    [formState.channels, validateChannelUrlField]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user?.id) return;

      setErrors({});

      const validation = InfluencerOnboardingSchema.safeParse(formState);
      if (!validation.success) {
        const firstError = validation.error.errors[0];
        if (firstError.path[0] === 'birthDate') {
          setErrors((prev) => ({ ...prev, birthDate: firstError.message }));
        } else if (firstError.path[0] === 'channels') {
          setErrors((prev) => ({ ...prev, channels: firstError.message }));
        }
        return;
      }

      try {
        await mutation.mutateAsync({
          userId: user.id,
          ...validation.data,
        });
        onSuccess?.();
      } catch (error) {
        // 에러는 mutation에서 처리됨
      }
    },
    [formState, user, mutation, onSuccess]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <label className="flex flex-col gap-2">
        <span className="text-sm text-slate-300">생년월일 *</span>
        <input
          type="date"
          value={formState.birthDate}
          onChange={(e) => {
            setFormState((prev) => ({ ...prev, birthDate: e.target.value }));
            validateBirthDate(e.target.value);
          }}
          required
          max={new Date().toISOString().split('T')[0]}
          className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-slate-400 focus:outline-none"
        />
        {errors.birthDate && (
          <p className="text-xs text-red-400">{errors.birthDate}</p>
        )}
      </label>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-slate-300">SNS 채널 *</span>
          <button
            type="button"
            onClick={addChannel}
            className="flex items-center gap-1 rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-300 transition hover:border-slate-400"
          >
            <Plus className="h-4 w-4" />
            추가
          </button>
        </div>

        {formState.channels.map((channel, index) => (
          <div
            key={index}
            className="mb-3 space-y-2 rounded-lg border border-slate-700 bg-slate-800/50 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">채널 {index + 1}</span>
              <button
                type="button"
                onClick={() => removeChannel(index)}
                className="text-slate-500 transition hover:text-red-400"
                aria-label={`채널 ${index + 1} 삭제`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <select
              value={channel.channelType}
              onChange={(e) =>
                updateChannel(index, "channelType", e.target.value as ChannelType)
              }
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-slate-400 focus:outline-none"
            >
              {Object.entries(CHANNEL_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="채널명"
              value={channel.channelName}
              onChange={(e) =>
                updateChannel(index, "channelName", e.target.value)
              }
              required
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
            />

            <div>
              <input
                type="url"
                placeholder="채널 URL"
                value={channel.channelUrl}
                onChange={(e) => {
                  updateChannel(index, "channelUrl", e.target.value);
                }}
                required
                className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
              />
              {errors.channelErrors?.[index]?.url && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.channelErrors[index].url}
                </p>
              )}
            </div>
          </div>
        ))}

        {formState.channels.length === 0 && (
          <p className="text-sm text-slate-500">
            최소 1개 이상의 SNS 채널을 등록해주세요.
          </p>
        )}
        {errors.channels && (
          <p className="mt-1 text-sm text-red-400">{errors.channels}</p>
        )}
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-400">
          {mutation.error instanceof Error ? mutation.error.message : '온보딩 처리 중 오류가 발생했습니다.'}
        </p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending || formState.channels.length === 0 || !formState.birthDate}
        className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-600"
      >
        {mutation.isPending ? "저장 중..." : "완료"}
      </button>
    </form>
  );
}
