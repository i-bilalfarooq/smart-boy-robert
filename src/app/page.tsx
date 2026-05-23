import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, CheckSquare } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-3xl space-y-8">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-100 rounded-full text-blue-600">
            <BookOpen size={48} />
          </div>
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          Smart boy robert
        </h1>
        <p className="text-2xl text-blue-600 font-semibold">
          Your AI Study Manager
        </p>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Upload your syllabus and let AI instantly extract all your assignments, reading lists, and deadlines. Turn chaos into an actionable study plan.
        </p>
        
        <div className="flex items-center justify-center gap-4 pt-8">
          <Link 
            href="/signup"
            className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Get Started <ArrowRight size={20} />
          </Link>
          <Link 
            href="/login"
            className="flex items-center gap-2 px-8 py-4 bg-white text-slate-700 rounded-full font-semibold border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Log In
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-16 mt-16 border-t border-slate-100">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><CheckSquare size={24} /></div>
            <h3 className="font-semibold text-slate-900">AI Task Extraction</h3>
            <p className="text-sm text-slate-500">Automatically parse tasks from any syllabus text or document.</p>
          </div>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><Calendar size={24} /></div>
            <h3 className="font-semibold text-slate-900">Smart Calendar</h3>
            <p className="text-sm text-slate-500">Never miss a deadline with automated calendar syncing.</p>
          </div>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><BookOpen size={24} /></div>
            <h3 className="font-semibold text-slate-900">Kanban Board</h3>
            <p className="text-sm text-slate-500">Track your progress from "To Do" to "Done" effortlessly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
