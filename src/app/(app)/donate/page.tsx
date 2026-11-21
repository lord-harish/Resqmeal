"use client";

import Link from "next/link";
import { DonateForm } from "@/components/donation/DonateForm";
import { ROUTES } from "@/constants/routes";

export default function DonatePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#12372A]">Donate Food</h1>
          <p className="text-[#64748B]">Share surplus food with people nearby. Takes about a minute.</p>
        </div>
        <Link
          href={ROUTES.home}
          className="inline-flex min-h-[44px] shrink-0 items-center rounded-xl px-3 text-sm font-semibold text-[#16A34A] hover:bg-[#DCFCE7]/50"
        >
          Cancel
        </Link>
      </div>
      <DonateForm />
    </div>
  );
}
