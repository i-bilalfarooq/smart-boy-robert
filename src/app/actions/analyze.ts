"use server";

import { Task } from "@/types";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createClient } from "@/lib/supabase/server";
import mammoth from "mammoth";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Use generateText + manual JSON parse to avoid json_schema compatibility issues
export async function analyzeSyllabus(formData: FormData): Promise<Task[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be logged in to analyze a syllabus.");
  }

  const files = formData.getAll("files") as File[];

  if (files.length === 0) {
    throw new Error("No files provided.");
  }

  let combinedText = "";
  let imageMessages: any[] = [];

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (file.type === "application/pdf") {
      // Dynamic require bypasses ESM/CJS compatibility issues on Vercel
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const parseFn = pdfParse.default ?? pdfParse;
      const data = await parseFn(buffer);
      combinedText += `\n\n--- File: ${file.name} ---\n${data.text}`;
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer });
      combinedText += `\n\n--- File: ${file.name} ---\n${result.value}`;
    } else if (file.type.startsWith("image/")) {
      const base64 = buffer.toString("base64");
      imageMessages.push({ type: "image", image: `data:${file.type};base64,${base64}` });
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }
  }

  const SYSTEM_PROMPT = `You are a smart academic task planner. The student has uploaded one or more files for the SAME module or assignment. They may include:
- An **Assignment Brief** (containing tasks, issue date, final due date)
- **Assessment Guidelines / Marking Criteria** (containing Learning Outcomes, LOs, or criteria to meet)
- A **Syllabus or Module Guide** (containing weekly schedule, readings, exams)

Your job:
1. READ ALL FILES TOGETHER as a cohesive package for the same module.
2. EXTRACT THE ISSUE DATE and FINAL DUE DATE from whichever file contains them (usually the brief). Apply these dates to ALL tasks.
3. IDENTIFY ALL TASKS from the assignment brief or syllabus.
4. MATCH Learning Outcomes (LOs) or assessment criteria from the guidelines to the relevant tasks. Include them in the task description.
5. SPACE OUT the deadlines intelligently across the timeframe (e.g., if 4 weeks: research week 1, draft week 2, refine week 3, final submission week 4).
6. DO NOT give all tasks the same final due date — spread them out so the student can complete them step by step.
7. If no explicit dates are found in any file, estimate sensible deadlines starting from today.

CRITICAL: You MUST respond with ONLY valid JSON. No explanation, no markdown, no code blocks. Just raw JSON.
The JSON must follow this exact structure:
{
  "tasks": [
    {
      "task_title": "Short clear title",
      "description": "Brief description including relevant LOs/criteria",
      "due_date": "YYYY-MM-DD",
      "task_type": "Reading" | "Assignment" | "Exam"
    }
  ]
}`;

  let messages: any[];

  if (imageMessages.length > 0 && combinedText) {
    messages = [{
      role: "user",
      content: [
        { type: "text", text: `${SYSTEM_PROMPT}\n\n--- EXTRACTED TEXT FROM UPLOADED FILES ---\n${combinedText}\n\nAlso analyse the attached image(s) as part of this same assignment package.` },
        ...imageMessages,
      ],
    }];
  } else if (imageMessages.length > 0) {
    messages = [{
      role: "user",
      content: [
        { type: "text", text: `${SYSTEM_PROMPT}\n\nAnalyse all the attached image(s) as the assignment package.` },
        ...imageMessages,
      ],
    }];
  } else {
    messages = [{
      role: "user",
      content: `${SYSTEM_PROMPT}\n\n--- CONTENT OF UPLOADED FILES ---\n${combinedText}`,
    }];
  }

  // Use generateText (works with ALL Groq models, no json_schema required)
  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    messages,
  });

  // Extract JSON from the response (handle any accidental markdown wrapping)
  let jsonStr = text.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
  const jsonStart = jsonStr.indexOf("{");
  const jsonEnd = jsonStr.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1) {
    jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
  }

  let parsed: { tasks: { task_title: string; description: string; due_date: string; task_type: string }[] };
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    console.error("Failed to parse AI response as JSON:", text);
    throw new Error("AI returned an unexpected response. Please try again.");
  }

  if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
    throw new Error("AI did not return a valid task list.");
  }

  const validTypes = ["Reading", "Assignment", "Exam"];

  const tasksToInsert = parsed.tasks.map((t) => {
    let parsedDate = new Date();
    if (t.due_date && !isNaN(Date.parse(t.due_date))) {
      parsedDate = new Date(t.due_date);
    }
    return {
      user_id: user.id,
      task_title: t.task_title || "Untitled Task",
      description: t.description || "",
      due_date: parsedDate.toISOString(),
      task_type: validTypes.includes(t.task_type) ? t.task_type : "Assignment",
      status: "To Do",
    };
  });

  if (tasksToInsert.length > 0) {
    const { data: insertedTasks, error } = await supabase
      .from("tasks")
      .insert(tasksToInsert)
      .select();

    if (error) {
      console.error("Error inserting tasks:", error);
      throw new Error("Failed to save tasks to database.");
    }

    return insertedTasks.map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      course_id: t.course_id || "",
      task_title: t.task_title,
      description: t.description,
      due_date: t.due_date,
      status: t.status as Task["status"],
      task_type: t.task_type as Task["task_type"],
    }));
  }

  return [];
}
