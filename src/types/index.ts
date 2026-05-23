export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type TaskType = 'Reading' | 'Assignment' | 'Exam';

export interface Task {
  id: string;
  user_id: string;
  course_id: string;
  task_title: string;
  description: string;
  due_date: string; // YYYY-MM-DD
  status: TaskStatus;
  task_type: TaskType;
}

export interface Course {
  id: string;
  user_id: string;
  course_name: string;
  uploaded_file_url?: string;
  created_at: string;
}
