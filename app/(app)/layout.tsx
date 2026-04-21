import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomTabBar } from "@/components/bottom-tab-bar";

type Role = "tutor" | "caregiver" | "vet";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role: Role = (profile?.role as Role) ?? "tutor";
  const isVet = role === "vet";

  return (
    <div
      className={`min-h-screen flex justify-center ${
        isVet ? "bg-vet-surface" : "bg-background"
      }`}
    >
      <div className="w-full max-w-[430px] flex flex-col min-h-screen bg-background shadow-sm">
        <main className="flex-1 flex flex-col">{children}</main>
        <BottomTabBar role={role} />
      </div>
    </div>
  );
}
