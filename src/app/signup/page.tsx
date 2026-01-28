"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { SignupSchema } from "@/features/user/backend/schema";
import type { SignupInput } from "@/features/user/backend/schema";

const defaultFormState: SignupInput = {
  name: "",
  phone: "",
  email: "",
  password: "",
  role: "influencer",
  termsAccepted: false,
};

type SignupPageProps = {
  params: Promise<Record<string, never>>;
};

export default function SignupPage({ params }: SignupPageProps) {
  void params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, refresh, user } = useCurrentUser();
  const [formState, setFormState] = useState<SignupInput>(defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      // 이미 프로필이 완성되었는지 확인
      // 완성되었으면 홈으로, 아니면 온보딩으로
      const redirectedFrom = searchParams.get("redirectedFrom") ?? "/";
      router.replace(redirectedFrom);
    }
  }, [isAuthenticated, user, router, searchParams]);

  const isSubmitDisabled = useMemo(
    () =>
      !formState.name.trim() ||
      !formState.phone.trim() ||
      !formState.email.trim() ||
      !formState.password.trim() ||
      !formState.termsAccepted,
    [formState]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = event.target;
      setFormState((previous) => ({
        ...previous,
        [name]: type === "checkbox" ? (event.target as HTMLInputElement).checked : value,
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);
      setErrorMessage(null);
      setInfoMessage(null);

      // 스키마 검증
      const validation = SignupSchema.safeParse(formState);
      if (!validation.success) {
        setErrorMessage(validation.error.errors[0]?.message ?? "입력 정보를 확인해주세요.");
        setIsSubmitting(false);
        return;
      }

      const supabase = getSupabaseBrowserClient();

      try {
        // 1. Supabase Auth 계정 생성
        const authResult = await supabase.auth.signUp({
          email: formState.email,
          password: formState.password,
          options: {
            data: {
              name: formState.name,
              phone: formState.phone,
            },
          },
        });

        if (authResult.error) {
          setErrorMessage(authResult.error.message ?? "회원가입에 실패했습니다.");
          setIsSubmitting(false);
          return;
        }

        if (!authResult.data.user) {
          setErrorMessage("회원가입 처리 중 문제가 발생했습니다.");
          setIsSubmitting(false);
          return;
        }

        // 2. 프로필 생성 (users, user_roles, terms_acceptances)
        const profileResult = await fetch("/api/users/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: authResult.data.user.id,
            name: formState.name,
            phone: formState.phone,
            email: formState.email,
            role: formState.role,
          }),
        });

        if (!profileResult.ok) {
          const errorData = await profileResult.json();
          setErrorMessage(errorData.error?.message ?? "프로필 생성에 실패했습니다.");
          setIsSubmitting(false);
          return;
        }

        await refresh();

        // 3. 역할별 온보딩 페이지로 이동
        if (authResult.data.session) {
          router.replace(`/onboarding/${formState.role}`);
          return;
        }

        setInfoMessage(
          "확인 이메일을 보냈습니다. 이메일 인증 후 로그인해 주세요."
        );
        router.prefetch("/login");
        setFormState(defaultFormState);
      } catch (error) {
        setErrorMessage("회원가입 처리 중 문제가 발생했습니다.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState, refresh, router]
  );

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-10 px-6 py-16">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold">회원가입</h1>
        <p className="text-slate-500">
          체험단 플랫폼에 가입하고 시작하세요.
        </p>
      </header>
      <div className="grid w-full gap-8 md:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            이름
            <input
              type="text"
              name="name"
              autoComplete="name"
              required
              value={formState.name}
              onChange={handleChange}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            휴대폰 번호
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              placeholder="010-1234-5678"
              required
              value={formState.phone}
              onChange={handleChange}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            이메일
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={formState.email}
              onChange={handleChange}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            비밀번호
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              required
              value={formState.password}
              onChange={handleChange}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            역할 선택
            <select
              name="role"
              value={formState.role}
              onChange={handleChange}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            >
              <option value="influencer">인플루언서</option>
              <option value="advertiser">광고주</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formState.termsAccepted}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <span>서비스 이용약관에 동의합니다</span>
          </label>

          {errorMessage ? (
            <p className="text-sm text-rose-500">{errorMessage}</p>
          ) : null}
          {infoMessage ? (
            <p className="text-sm text-emerald-600">{infoMessage}</p>
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting || isSubmitDisabled}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "등록 중" : "회원가입"}
          </button>
          <p className="text-xs text-slate-500">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="font-medium text-slate-700 underline hover:text-slate-900"
            >
              로그인으로 이동
            </Link>
          </p>
        </form>
        <figure className="overflow-hidden rounded-xl border border-slate-200">
          <Image
            src="https://picsum.photos/seed/signup/640/640"
            alt="회원가입"
            width={640}
            height={640}
            className="h-full w-full object-cover"
            priority
          />
        </figure>
      </div>
    </div>
  );
}
