
export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  // New fields for student info
  college?: string;
  major?: string;
  className?: string;
  stats?: {
    solved: number;
    rank: number;
    accuracy: number;
  };
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export interface TestCase {
  input: string;
  output: string;
  isHidden?: boolean; // Whether to hide this case from students
}

export interface ProblemBank {
  id: string;
  title: string;
  description: string;
  count?: number; // Calculated field
  cover?: string; // Optional cover color/icon
  isVirtual?: boolean; // For frontend-only categories like "Uncategorized"
}

export interface Problem {
  id: string;
  bankId?: string; // Link to a ProblemBank
  title: string;
  difficulty: Difficulty;
  description: string; // Markdown
  tags: string[];
  passRate: number;
  inputExample?: string;
  outputExample?: string;
  // New fields for validation
  testCases?: TestCase[];
  referenceCode?: string;
  isSolved?: boolean; // New field for student status
  language?: string; // For language specific problems
  source?: 'manual' | 'auto-fetch'; // Source of the problem
}

export enum ContestType {
  CODING = 'CODING',    // Traditional ACM/OI style
  PROJECT = 'PROJECT'   // Creative submission style
}

export interface ProjectSubmission {
  userId: string;
  userName: string;
  codeUrl?: string;     // URL to zip
  docUrl?: string;      // URL to pdf
  videoUrl?: string;    // External link
  submittedAt: string;
  score?: number;       // 0-100
  feedback?: string;
}

export interface CertificateConfig {
  bgUrl: string; // Background Image URL
  sealUrl?: string; // Seal Image URL
  items: {
    id: string; // unique id for selection
    type: 'static-text' | 'variable-text'; // Static = Title, Variable = Name/Award
    field?: 'name' | 'award' | 'date' | 'contestName'; // If variable
    text?: string; // If static
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontFamily: string;
    fontWeight?: string;
  }[];
}

export interface ContestResult {
  userId?: string; // Frontend Mock / Camel
  user_id?: string; // Backend
  userName?: string;
  rank?: number;
  score?: number;
  awardName?: string;
  award_name?: string; // Backend
  certificateCode?: string; // Frontend Mock / Camel
  certificate_code?: string; // Backend
  isPublished?: boolean;
  is_published?: boolean; // Backend
}

export interface Contest {
  id: string;
  type: ContestType; // New field
  title: string;
  startTime: string; // ISO date
  endTime: string; // ISO date
  status: 'UPCOMING' | 'LIVE' | 'ENDED';
  participantCount: number;
  isRegistered: boolean; // Current user registration status
  isSubmitted: boolean; // Whether the user has submitted the exam
  registeredStudentIds?: string[]; // List of student IDs who registered
  isLeaderboardOpen: boolean; // Teacher authorization for leaderboard
  description?: string;
  problemIds?: string[]; // For CODING contests
  projectSubmissions?: ProjectSubmission[]; // For PROJECT contests

  // Certificate & Results
  certificateConfig?: CertificateConfig;
  results?: ContestResult[]; // Store final awards here
}

export interface AiAnalysisResult {
  type: 'concept' | 'hint' | 'flowchart';
  content: string;
}

export interface Notification {
  id: number;
  title: string;
  content: string;
  type: 'system' | 'contest' | 'judge';
  is_read: boolean;
  created_at: string;
}

export interface KnowledgeNode {
  id: string;
  name: string;
  category: string; // e.g., 'Algorithm', 'Data Structure', 'Syntax'
  description?: string;
  prerequisites?: string[];
}

export interface StudentMastery {
  user_id: string;
  node_id: string;
  mastery_score: number; // 0-100
  total_attempts: number;
  correct_count: number;
  last_updated: string;
  node?: KnowledgeNode; // Optional include
}