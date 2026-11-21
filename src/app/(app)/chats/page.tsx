import { EmptyState } from "@/components/ui";

export default function ChatsPage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[#12372A]">Chats</h1>
        <p className="text-[#64748B]">Talk with donors and receivers about pickups.</p>
      </div>
      <EmptyState
        icon={
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#DCFCE7]">
            <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
            </svg>
          </span>
        }
        title="Conversations will appear here."
      />
    </section>
  );
}
