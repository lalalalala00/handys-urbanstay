import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewCleaningTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch } = await searchParams;
  const params = new URLSearchParams({
    category: "cleaning",
    reporter: "manager",
  });
  if (branch) params.set("branch", branch);
  redirect(`/issues/new?${params.toString()}`);
}
