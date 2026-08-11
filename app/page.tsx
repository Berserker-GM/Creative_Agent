import { ProjectCreateEntry } from "@/components/ProjectCreateEntry";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Creative Frontend Engine
      </h1>
      <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
        From vibe-coded UI to intentional design.
      </p>
      <ProjectCreateEntry />
    </main>
  );
}
