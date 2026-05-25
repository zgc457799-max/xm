import axios from 'axios';
import { User } from '../types';

const isProd = import.meta.env.PROD;
const DEFAULT_API_URL = window.location.port === '5173' ? 'http://localhost:3001/api' : '/api';
const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor to add token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('educode_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Auth Services
export const login = async (id: string, password: string) => {
    const response = await api.post('/auth/login', { id, password });
    if (response.data.token) {
        localStorage.setItem('educode_token', response.data.token);
    }
    return response.data;
};

export const register = async (id: string, password: string, name: string, role: string) => {
    const response = await api.post('/auth/register', { id, password, name, role });
    return response.data;
};

export const getMe = async () => {
    const response = await api.get('/auth/me');
    return response.data; // Returns User object
};

export const getAllStudents = async () => {
    const response = await api.get('/auth/students');
    return response.data;
};

export const createStudent = async (studentData: any) => {
    const response = await api.post('/auth/students', studentData);
    return response.data;
};

export const updateStudent = async (id: string, studentData: any) => {
    const response = await api.put(`/auth/students/${id}`, studentData);
    return response.data;
};

export const deleteStudent = async (id: string) => {
    const response = await api.delete(`/auth/students/${id}`);
    return response.data;
};

export const changePassword = async (passwordData: any) => {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data;
};

// System Settings API
export const getSystemSettings = async () => {
    const response = await api.get('/settings');
    return response.data;
};

export const updateSystemSettings = async (settingsData: any) => {
    const response = await api.post('/settings', settingsData);
    return response.data;
};

// Notification Services
export const getNotifications = async () => {
    const response = await api.get('/notifications');
    return response.data;
};

export const markAsRead = async (id: number) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
};

export const markAllAsRead = async () => {
    const response = await api.post('/notifications/read-all');
    return response.data;
};

// Problem Services
export const createProblem = async (problemData: any) => {
    const response = await api.post('/problems', problemData);
    return response.data;
};

export const updateProblem = async (id: string, problemData: any) => {
    const response = await api.put(`/problems/${id}`, problemData);
    return response.data;
};

export const deleteProblem = async (id: string) => {
    const response = await api.delete(`/problems/${id}`);
    return response.data;
};

export const validateProblem = async (data: { code: string, language: string, testCases: any[] }) => {
    const response = await api.post('/problems/validate', data);
    return response.data;
};

export const getBanks = async () => {
    const response = await api.get('/problems/banks');
    return response.data;
};

export const createBank = async (data: any) => {
    const response = await api.post('/problems/banks', data);
    return response.data;
};

export const updateBank = async (id: string, data: any) => {
    const response = await api.put(`/problems/banks/${id}`, data);
    return response.data;
};

export const deleteBank = async (id: string) => {
    const response = await api.delete(`/problems/banks/${id}`);
    return response.data;
};

export const getProblems = async (params?: { bankId?: string, difficulty?: string, search?: string }) => {
    const response = await api.get('/problems', {
        params: {
            bank_id: params?.bankId,
            difficulty: params?.difficulty,
            search: params?.search
        }
    });
    return response.data;
};

export const getProblemDetail = async (id: string) => {
    const response = await api.get(`/problems/${id}`);
    return response.data;
};

export const enterContest = async (id: string) => {
    // Actually no specific API needed, just navigation
    return { success: true };
};

export const registerContest = async (id: string) => {
    const response = await api.post(`/contests/${id}/register`);
    return response.data;
};

export const submitContestExam = async (id: string) => {
    const response = await api.post(`/contests/${id}/submit-exam`);
    return response.data;
};

export const getMyContestResult = async (contestId: string) => {
    const response = await api.get(`/contests/${contestId}/my-result`);
    return response.data;
};

export const getContestLeaderboard = async (contestId: string) => {
    // Should be /contests/:id/leaderboard, using mock or existing simple endpoint
    const response = await api.get(`/contests/${contestId}/leaderboard`);
    return response.data;
};

export const getContests = async () => {
    const response = await api.get('/contests');
    return response.data;
};

export const createContest = async (data: any) => {
    const response = await api.post('/contests', data);
    return response.data;
};

export const updateContest = async (id: string, data: any) => {
    const response = await api.put(`/contests/${id}`, data);
    return response.data;
};

export const deleteContest = async (id: string) => {
    const response = await api.delete(`/contests/${id}`);
    return response.data;
};


export const getProjectSubmissions = async (contestId: string) => {
    const response = await api.get(`/contests/${contestId}/project-submissions`);
    return response.data;
};

export const gradeProjectSubmission = async (contestId: string, userId: string, data: { score: number, feedback?: string }) => {
    const response = await api.put(`/contests/${contestId}/grade/${userId}`, data);
    return response.data;
};

export const unregisterStudent = async (contestId: string, userId: string) => {
    const response = await api.delete(`/contests/${contestId}/register/${userId}`);
    return response.data;
};

export const submitProject = async (contestId: string, data: any) => {
    const isFormData = data instanceof FormData;
    // Important: When sending FormData, we must let the browser set the Content-Type with boundary.
    // We explicitly overwrite the default application/json header with undefined (or just override it).
    // Note: In some axios versions, passing "Content-Type": undefined removes the header.
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};

    // Actually, setting multipart/form-data manually is BAD because it misses boundary.
    // But axios handles it if we pass a second argument with headers?
    // Let's try just passing data. If that fails, it's the interceptor.
    // Let's try this:
    const response = await api.post(`/contests/${contestId}/submit-project`, data, {
        headers: isFormData ? { 'Content-Type': undefined } : undefined
    });
    return response.data;
};

// Submission Services
export const submitCode = async (data: {
    problem_id: string;
    language: string;
    code_content: string;
    contest_id?: string;
}) => {
    const response = await api.post('/submissions/code', data);
    return response.data;
};

export const getSubmission = async (id: string) => {
    const response = await api.get(`/submissions/${id}`);
    return response.data;
};

// Mistake Book Services
export const getMistakeBook = async () => {
    const response = await api.get('/mistakes');
    return response.data;
};

export const addToMistakeBook = async (problemId: string) => {
    const response = await api.post('/mistakes', { problemId });
    return response.data;
};

export const removeFromMistakeBook = async (problemId: string) => {
    const response = await api.delete(`/mistakes/${problemId}`);
    return response.data;
};

// Stats Services
export const getStudentStats = async () => {
    const response = await api.get('/stats/mine');
    return response.data;
};
export const checkIn = async () => {
    const response = await api.post('/stats/checkin');
    return response.data;
};

export const getTeacherDashboardStats = async () => {
    const response = await api.get('/stats/teacher');
    return response.data;
};

// Comment Services
export const getComments = async (problemId: string, page = 1, limit = 20) => {
    const response = await api.get(`/comments/${problemId}?page=${page}&limit=${limit}`);
    return response.data;
};

export const addComment = async (problemId: string, content: string, isVerified?: boolean) => {
    const response = await api.post(`/comments/${problemId}`, { content, isVerified });
    return response.data;
};

export const deleteComment = async (id: number) => {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
};

export const toggleCommentLike = async (id: number) => {
    const response = await api.post(`/comments/${id}/like`);
    return response.data;
};

// AI Services
export const analyzeProblem = async (problemDescription: string, language: string) => {
    const response = await api.post('/ai/analyze', { problemDescription, language });
    return response.data.content;
};

export const getAIHint = async (problemDescription: string, currentCode: string, language: string) => {
    const response = await api.post('/ai/hint', { problemDescription, currentCode, language });
    return response.data.content;
};

export const analyzeError = async (problemDescription: string, currentCode: string, errorMsg: string) => {
    const response = await api.post('/ai/debug', { problemDescription, currentCode, errorMsg });
    return response.data.content;
};

export const getLogicFlowchart = async (problemDescription: string, language?: string, context?: string) => {
    const response = await api.post('/ai/flowchart', { problemDescription, language, context });
    return response.data.content;
};

export const smartParseProblem = async (rawText: string) => {
    const response = await api.post('/ai/parse-problem', { rawText });
    return response.data;
};

export const smartParseBatchProblems = async (rawText: string, expectedCount?: number) => {
    const response = await api.post('/ai/parse-batch', { rawText, expectedCount });
    return response.data;
};

export const importProblemFromUrl = async (url: string, platform: string) => {
    const response = await api.post('/problems/import-from-url', { url, platform });
    return response.data;
};

export const importPresetBank = async (presetId: string, bankId: string) => {
    const response = await api.post('/problems/import-preset', { presetId, bankId });
    return response.data;
};

export const generateTestCases = async (problemDescription: string, count: number, referenceCode?: string) => {
    const response = await api.post('/ai/generate-cases', { problemDescription, count, referenceCode });
    return response.data;
};

export const generateCertificateBackground = async (title: string) => {
    const response = await api.post('/ai/generate-certificate', { title });
    return response.data.image;
};

export const generateReferenceCode = async (problemDescription: string, language: string) => {
    const response = await api.post('/ai/generate-code', { problemDescription, language });
    return response.data.code;
};

export const getContestAnalytics = async (contestId: string) => {
    const response = await api.get(`/stats/contest/${contestId}`);
    return response.data;
};

export const getStudentRadar = async (studentId: string) => {
    const response = await api.get(`/stats/student/${studentId}/radar`);
    return response.data;
};

// --- Knowledge Graph API ---
export const getKnowledgeNodes = async () => {
    const response = await api.get('/knowledge/nodes');
    return response.data;
};

export const getMyMastery = async () => {
    const response = await api.get('/knowledge/mastery');
    return response.data;
};

// --- TTS Voice Cloning API ---
export const getTtsAudio = async (text: string, voiceType: 'spongebob' | 'patrick'): Promise<Blob> => {
    const response = await api.post('/ai/tts', { text, voiceType }, {
        responseType: 'blob'
    });
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('educode_token');
    localStorage.removeItem('educode_session_user');
};

export default api;
