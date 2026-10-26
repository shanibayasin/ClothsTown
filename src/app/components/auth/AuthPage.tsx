"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Heart,
  LockKeyhole,
  Mail,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { FaFacebookF, FaGoogle } from "react-icons/fa6";

type AuthMode = "login" | "register";

const benefits = [
  { Icon: Truck, text: "Exclusive offers & discounts" },
  { Icon: PackageCheck, text: "Track your orders" },
  { Icon: Heart, text: "Manage your wishlist" },
  { Icon: ShieldCheck, text: "Secure & safe checkout" },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center text-white ${
        compact ? "gap-2" : "gap-3"
      }`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 72 56"
        className={compact ? "h-8 w-10" : "h-10 w-14"}
        fill="none"
      >
        <path
          d="M35 18c0-4.4 3.3-7.5 7.5-7.5 4 0 7 2.9 7 6.8 0 4.3-3.2 6.3-7 8.7L7.2 47c-3.2 2-1.8 6.8 2 6.8h53.6c3.8 0 5.2-4.8 2-6.8L42.5 31"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={`whitespace-nowrap font-bold tracking-tight ${
          compact ? "text-[21px] sm:text-2xl" : "text-2xl sm:text-[26px]"
        }`}
      >
        ClothesTown
      </span>
    </span>
  );
}

function MountainBackdrop() {
  return (
    <>
      <svg
        aria-hidden="true"
        viewBox="0 0 900 1100"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="mountain-sky" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#09263b" />
            <stop offset=".5" stopColor="#234c69" />
            <stop offset="1" stopColor="#42637a" />
          </linearGradient>
          <linearGradient id="mountain-lake" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#123c56" />
            <stop offset="1" stopColor="#061d30" />
          </linearGradient>
          <linearGradient id="mountain-shade" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#e8f0f2" />
            <stop offset="1" stopColor="#7894a3" />
          </linearGradient>
          <radialGradient id="mountain-haze" cx="50%" cy="45%" r="60%">
            <stop stopColor="#95b2c2" stopOpacity=".42" />
            <stop offset="1" stopColor="#173b54" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path fill="url(#mountain-sky)" d="M0 0h900v1100H0z" />
        <path fill="url(#mountain-haze)" d="M0 0h900v820H0z" />
        <g transform="translate(0 250) scale(1 .8)">
        <path
          fill="#7891a0"
          fillOpacity=".28"
          d="m0 530 90-75 80 47 107-135 74 82 99-178 81 108 79-79 115 143 68-69 107 106v322H0z"
        />
        <path
          fill="url(#mountain-shade)"
          fillOpacity=".88"
          d="m244 428 107-164 74 84-30-14-22 19-20-7-18 21-20-7-19 22-22-7-30 25z"
        />
        <path
          fill="#dce8eb"
          fillOpacity=".72"
          d="m449 382 101-228 116 176-42-22-28 20-24-12-24 22-24-9-25 25-26-9-30 28z"
        />
        <path
          fill="#31566f"
          d="m0 644 111-126 83 70 144-207 93 127 107-245 103 165 81-115 178 232v340H0z"
        />
        <path
          fill="#e6eef0"
          fillOpacity=".9"
          d="m338 381 82-119 90 123-34-18-27 21-21-9-20 20-24-7-17 17-21-7-22 20z"
        />
        <path
          fill="#cad9df"
          fillOpacity=".74"
          d="m512 337 29-66 46 73-22-11-16 14-18-6z"
        />
        <path
          fill="#1b4058"
          d="m0 765 127-120 80 70 125-164 102 126 126-175 94 136 83-92 163 153v192H0z"
        />
        <path
          fill="#b8cbd2"
          fillOpacity=".55"
          d="m333 676 72-125 67 93-28-10-20 17-18-7-17 17-20-7-18 21-21-5z"
        />
        <path
          fill="#102f46"
          d="m0 837 122-80 113 78 104-90 90 85 141-98 87 79 87-62 156 89v102H0z"
        />
        <g fill="#0a263b" fillOpacity=".88">
          <path d="m5 810 18-56 18 56h-9v28H14v-28z" />
          <path d="m36 818 13-41 14 41h-7v20H43v-20z" />
          <path d="m74 815 19-58 20 58h-10v25H84v-25z" />
          <path d="m787 812 18-55 18 55h-9v29h-18v-29z" />
          <path d="m822 819 14-43 14 43h-7v22h-14v-22z" />
          <path d="m855 810 20-60 20 60h-10v31h-20v-31z" />
        </g>
        </g>
        <path fill="url(#mountain-lake)" d="M0 910h900v190H0z" />
        <path
          fill="#6f8b9c"
          fillOpacity=".27"
          d="m0 930 122 44 113-40 104 51 90-46 141 53 87-46 87 48 156-49v13l-156 53-87-49-87 43-141-48-90 43-104-52-113 39L0 991z"
        />
        <path
          fill="#b4c6cf"
          fillOpacity=".15"
          d="m0 1046 94 24 93-17 106 27 114-20 114 24 108-28 98 20 173-26v17l-173 35-98-21-108 29-114-25-114 19-106-27-93 18-94-25z"
        />
        <g fill="#dce8ed" fillOpacity=".55">
          <circle cx="103" cy="150" r="1.5" />
          <circle cx="192" cy="222" r="1" />
          <circle cx="746" cy="145" r="1.5" />
          <circle cx="806" cy="248" r="1" />
          <circle cx="682" cy="205" r="1" />
          <circle cx="266" cy="107" r="1" />
          <circle cx="571" cy="102" r="1.5" />
        </g>
      </svg>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,32,50,0.32)_0%,rgba(8,38,59,0.2)_46%,rgba(4,24,40,0.7)_100%)]"
      />
    </>
  );
}

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const isLogin = mode === "login";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (isLogin) {
      setMessage(
        "Customer sign-in is not available yet. You can checkout as a guest and track orders with your order details."
      );
      return;
    }

    if (formData.get("password") !== formData.get("confirmPassword")) {
      setMessage("The passwords do not match.");
      return;
    }

    setMessage("Customer accounts are not available yet. Guest checkout and order tracking are available.");
  }

  function handleForgotPassword() {
    setMessage("Password recovery is not available yet.");
  }

  function handleSocialSignIn(provider: string) {
    setMessage(`${provider} sign in is not configured yet.`);
  }

  return (
    <main className="min-h-[calc(100svh-102px)] bg-white font-sans text-[#173246]">
      <div className="grid min-h-[calc(100svh-102px)] lg:grid-cols-[49.2%_50.8%]">
        <aside className="relative isolate flex min-h-[330px] flex-col justify-center overflow-hidden px-6 py-9 text-white sm:px-12 lg:min-h-0 lg:justify-start lg:px-[12%] lg:pb-12 lg:pt-[74px]">
          <MountainBackdrop />
          <div className="relative z-10 w-full max-w-[430px]">
            <Link href="/" aria-label="ClothesTown home" className="inline-flex">
              <BrandMark />
            </Link>
            <h1 className="mt-6 text-[25px] font-bold leading-tight text-white sm:text-[29px]">
              Better Style. Brighter Days.
            </h1>
            <p className="mt-2 max-w-[380px] text-[15px] leading-[1.7] text-[#d4e1e9] sm:text-base">
              {isLogin
                ? "Shop and place orders as a guest. Customer accounts are not available yet."
                : "Customer registration is not available yet. You can still shop and checkout as a guest."}
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-3 sm:mt-8 sm:gap-y-4 lg:grid-cols-1 lg:gap-y-4">
              {benefits.map(({ Icon, text }) => (
                <li
                  key={text}
                  className="flex min-w-0 items-center gap-2.5 text-[11px] font-medium text-white sm:gap-3 sm:text-[13px]"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/70 text-white sm:size-9">
                    <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="flex items-center justify-center bg-[radial-gradient(ellipse_at_center,#ffffff_0%,#f8fbfd_100%)] px-4 py-7 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="w-full max-w-[452px] rounded-lg border border-[#e2ebf2] bg-white/85 px-5 py-6 shadow-[0_10px_35px_rgba(19,55,79,0.04)] sm:px-7 sm:py-7 lg:-translate-x-2">
            <div className="mb-5 flex border-b border-[#dce6ee]">
              <Link
                href="/login"
                aria-current={isLogin ? "page" : undefined}
                className={`relative flex-1 py-2.5 text-center text-[15px] font-semibold ${
                  isLogin ? "text-[#173246]" : "text-[#7d97ab] hover:text-[#173246]"
                }`}
              >
                Login
                {isLogin && (
                  <span className="absolute inset-x-7 -bottom-px h-0.5 bg-[#0874f9] sm:inset-x-9" />
                )}
              </Link>
              <Link
                href="/register"
                aria-current={!isLogin ? "page" : undefined}
                className={`relative flex-1 py-2.5 text-center text-[15px] font-semibold ${
                  !isLogin ? "text-[#173246]" : "text-[#7d97ab] hover:text-[#173246]"
                }`}
              >
                Register
                {!isLogin && (
                  <span className="absolute inset-x-7 -bottom-px h-0.5 bg-[#0874f9] sm:inset-x-9" />
                )}
              </Link>
            </div>

            <h2 className="text-[21px] font-bold leading-tight text-[#173246] sm:text-[22px]">
              {isLogin ? "Customer Sign In" : "Create Your Account"}
            </h2>
            <p className="mt-1 text-[13px] text-[#7892a8] sm:text-sm">
              {isLogin
                ? "Customer account access is not available yet"
                : "Join ClothesTown and find your style"}
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              {!isLogin && (
                <label className="block text-[13px] font-semibold text-[#20394b]">
                  Full name
                  <span className="relative mt-1.5 block">
                    <input
                      type="text"
                      name="name"
                      autoComplete="name"
                      required
                      placeholder="Your name"
                      className="h-[40px] w-full rounded-md border border-[#d9e5ee] bg-white px-3 text-[12px] font-normal text-[#20394b] outline-none placeholder:text-[#94afc3] focus:border-[#2879cf] focus:ring-2 focus:ring-[#2879cf]/10"
                    />
                  </span>
                </label>
              )}

              <label className="block text-[13px] font-semibold text-[#20394b]">
                Email address
                <span className="relative mt-1.5 block">
                  <Mail
                    size={17}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7e9bb0]"
                  />
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    placeholder="you@example.com"
                    className="h-[40px] w-full rounded-md border border-[#d9e5ee] bg-white pl-10 pr-3 text-[12px] font-normal text-[#20394b] outline-none placeholder:text-[#94afc3] focus:border-[#2879cf] focus:ring-2 focus:ring-[#2879cf]/10"
                  />
                </span>
              </label>

              <label className="block text-[13px] font-semibold text-[#20394b]">
                Password
                <span className="relative mt-1.5 block">
                  <LockKeyhole
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7e9bb0]"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    required
                    minLength={isLogin ? undefined : 8}
                    maxLength={1024}
                    placeholder={isLogin ? "Enter your password" : "Create a password"}
                    className="h-[40px] w-full rounded-md border border-[#d9e5ee] bg-white pl-10 pr-10 text-[12px] font-normal text-[#20394b] outline-none placeholder:text-[#94afc3] focus:border-[#2879cf] focus:ring-2 focus:ring-[#2879cf]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#7e9bb0] hover:text-[#173246]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>

              {!isLogin && (
                <label className="block text-[13px] font-semibold text-[#20394b]">
                  Confirm password
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="Confirm your password"
                    className="mt-1.5 h-[40px] w-full rounded-md border border-[#d9e5ee] bg-white px-3 text-[12px] font-normal text-[#20394b] outline-none placeholder:text-[#94afc3] focus:border-[#2879cf] focus:ring-2 focus:ring-[#2879cf]/10"
                  />
                </label>
              )}

              {isLogin && (
                <div className="flex items-center justify-between gap-3 pt-0.5 text-[11px] sm:text-xs">
                  <label className="flex cursor-pointer items-center gap-2 text-[#6e879b]">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      className="size-[17px] rounded accent-[#07569a]"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="font-semibold text-[#0874e8] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="flex h-[44px] w-full items-center justify-center gap-2 rounded-md bg-[#092b40] text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#124561] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0874f9]"
              >
                {isLogin ? "Sign In" : "Create Account"}
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </form>

            {message && (
              <p
                role="status"
                className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800"
              >
                {message}
              </p>
            )}

            <div className="my-5 flex items-center gap-3 text-[11px] text-[#8aa0b2]">
              <span className="h-px flex-1 bg-[#e4edf3]" />
              or
              <span className="h-px flex-1 bg-[#e4edf3]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialSignIn("Google")}
                className="flex h-[38px] items-center justify-center gap-2 rounded-md border border-[#d9e5ee] bg-white text-[11px] font-semibold text-[#294256] transition hover:bg-[#f7fafc]"
              >
                <FaGoogle aria-hidden="true" className="text-[16px] text-[#4285f4]" />
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSocialSignIn("Facebook")}
                className="flex h-[38px] items-center justify-center gap-2 rounded-md border border-[#d9e5ee] bg-white text-[11px] font-semibold text-[#294256] transition hover:bg-[#f7fafc]"
              >
                <span className="flex size-[18px] items-center justify-center rounded-full bg-[#1877f2] text-white">
                  <FaFacebookF aria-hidden="true" className="text-[12px]" />
                </span>
                Facebook
              </button>
            </div>

            <p className="mt-6 text-center text-[11px] text-[#7892a8]">
              {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
              <Link
                href={isLogin ? "/register" : "/login"}
                className="font-semibold text-[#0874e8] hover:underline"
              >
                {isLogin ? "Create one" : "Sign in"}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
