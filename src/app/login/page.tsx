import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";
import Image from "next/image";

export default function LoginPage() {
  return (
    <main className="flex flex-col gap-10 min-h-screen items-center justify-center bg-linear-to-br from-gray-50 via-white to-blue-50 px-4 ">
      <Image
        className="w-[150px]"
        src="/img/logoon.svg"
        alt="Logo"
        width={200}
        height={100}
      />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
