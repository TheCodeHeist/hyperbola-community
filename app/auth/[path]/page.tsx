import { auth } from "@/lib/auth";
import { AuthView } from "@daveyplate/better-auth-ui";
import { authViewPaths } from "@daveyplate/better-auth-ui/server";
import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }));
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-12 p-4 bg-linear-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-950 dark:via-blue-950 dark:to-purple-950"
      style={{
        backgroundImage: `
          radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.08) 2px, transparent 2px),
          radial-gradient(circle at 75% 75%, rgba(99, 102, 241, 0.08) 2px, transparent 2px),
          radial-gradient(circle at 25% 75%, rgba(99, 102, 241, 0.04) 1px, transparent 1px),
          radial-gradient(circle at 75% 25%, rgba(99, 102, 241, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px, 40px 40px, 20px 20px, 20px 20px",
        backgroundPosition: "0 0, 20px 20px, 0 0, 10px 10px",
      }}
    >
      <div className="flex items-center justify-center gap-4">
        <div className="h-16 w-16 rounded-[min(var(--radius-md),8px)] overflow-hidden">
          <Image
            src="/logo.svg"
            alt="Hyperbola logo"
            width={64}
            height={64}
            className="block h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col">
          <p className="text-xl font-bold md:text-2xl">
            Hyperbola Community Ed.
          </p>
          <p className="text-sm md:text-lg">Learning, Reimagined.</p>
        </div>
      </div>

      <AuthView
        path={path}
        localization={{
          SIGN_IN: "Log In",
          SIGN_UP: "Register an Account",
        }}
      />
    </main>
  );
}
