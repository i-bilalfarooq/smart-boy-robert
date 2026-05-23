"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, Loader2, File as FileIcon, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { Task } from "@/types";
import { analyzeSyllabus } from "@/app/actions/analyze";

const MAX_FILES = 3;
const MAX_SIZE_MB = 5;

interface UploadZoneProps {
  onTasksExtracted: (tasks: Task[]) => void;
}

export function UploadZone({ onTasksExtracted }: UploadZoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const filtered = arr.filter((f) => {
      if (!validTypes.includes(f.type)) {
        toast.error(`${f.name}: unsupported type. Use PDF, DOCX, or Image.`);
        return false;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${f.name}: too large (max ${MAX_SIZE_MB}MB).`);
        return false;
      }
      return true;
    });

    setFiles((prev) => {
      const combined = [...prev, ...filtered];
      if (combined.length > MAX_FILES) {
        toast.error(`Max ${MAX_FILES} files allowed.`);
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files) addFiles(e.target.files);
    // Reset input so same file can be re-added after removal
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (files.length === 0) {
      toast.error("Please upload at least one file.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const result = await analyzeSyllabus(formData);
      
      if (!result.success) {
        toast.error(result.error || "Failed to extract tasks. Please try again.");
        return;
      }

      onTasksExtracted(result.data);
      toast.success(`${result.data.length} tasks extracted!`);
      setFiles([]);
    } catch (error) {
      toast.error("Failed to analyze. Please try again.");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return "🖼️";
    if (type === "application/pdf") return "📄";
    return "📝";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <UploadCloud size={24} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Upload Syllabuses to Extract Tasks</h2>
          <p className="text-sm text-slate-500">Upload up to {MAX_FILES} files — PDF, Word doc, or Image.</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Drop zone — only show if fewer than MAX_FILES selected */}
        {files.length < MAX_FILES && (
          <div
            className={`w-full relative border-2 border-dashed rounded-xl transition-colors ${
              dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-400 bg-slate-50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="application/pdf,.docx,image/jpeg,image/png,image/webp"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleChange}
            />
            <div className="flex flex-col items-center justify-center py-8 pointer-events-none">
              <UploadCloud size={36} className="text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-700">Drag & drop files here or click to browse</p>
              <p className="text-xs text-slate-500 mt-1">
                PDF, DOCX, JPG, or PNG · max {MAX_SIZE_MB}MB each · up to {MAX_FILES} files
              </p>
              {files.length > 0 && (
                <p className="text-xs text-blue-500 mt-2 font-medium">
                  {files.length}/{MAX_FILES} files selected
                </p>
              )}
            </div>
          </div>
        )}

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl">{getFileIcon(file.type)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="ml-2 flex-shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Extract button */}
        <div className="flex justify-end pt-1">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || files.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing {files.length} file{files.length > 1 ? "s" : ""}...
              </>
            ) : (
              <>
                <FileText size={18} />
                Extract Tasks
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
