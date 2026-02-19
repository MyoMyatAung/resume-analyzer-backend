/**
 * Resume Data Interfaces
 * These interfaces define the structure of resume data stored in JSON fields
 */

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string; // Format: "YYYY-MM" or "YYYY"
  endDate?: string; // null/undefined if current
  isCurrent: boolean;
  description?: string;
  achievements: string[]; // Bullet points
  technologies?: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location?: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  honors?: string;
  achievements?: string[];
}

export interface SkillsData {
  technical: string[]; // Programming languages, frameworks
  tools: string[]; // Software, platforms
  languages: string[]; // Spoken languages
  soft: string[]; // Soft skills
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
  github?: string;
  startDate?: string;
  endDate?: string;
  highlights?: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface ResumeData {
  // Personal Information
  fullName: string;
  targetTitle?: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  summary?: string;

  // Sections
  experiences: ExperienceItem[];
  education: EducationItem[];
  skills: SkillsData;
  projects: ProjectItem[];
  certifications: CertificationItem[];
}

// Default empty skills data
export const DEFAULT_SKILLS: SkillsData = {
  technical: [],
  tools: [],
  languages: [],
  soft: [],
};

// Helper to create empty resume data
export function createEmptyResumeData(
  fullName: string,
  email: string,
): ResumeData {
  return {
    fullName,
    email,
    experiences: [],
    education: [],
    skills: DEFAULT_SKILLS,
    projects: [],
    certifications: [],
  };
}
