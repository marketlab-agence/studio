
import { type CreateCourseInput, type CreateCourseOutput } from '@/ai/flows/create-course-flow';

export interface CourseInfo {
  id: string;
  title: string;
  description: string;
  status: 'Publié' | 'Brouillon' | 'Plan';
  plan?: CreateCourseOutput;
  generationParams?: CreateCourseInput;
}
