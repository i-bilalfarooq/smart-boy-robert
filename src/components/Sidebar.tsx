"use client";

import Link from "next/link";
import { LayoutDashboard, Book, LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col h-full">
      <div className="p-6 border-b border-slate-200 flex items-center gap-2">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <Book size={24} />
        </div>
        <span className="font-bold text-xl text-slate-900">S.B. Robert</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-medium transition-colors">
          <LayoutDashboard size={20} /> Dashboard
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-200">
        <form action={logout}>
          <button type="submit" className="flex w-full items-center gap-3 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl font-medium transition-colors">
            <LogOut size={20} /> Log Out
          </button>
        </form>
      </div>
    </aside>
  );
}
