
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LogOut, Users, Menu } from 'lucide-react';
import { UserRole, User, Problem, Contest, ProblemBank, ProjectSubmission } from './types';
import { MOCK_USER_STUDENT, MOCK_USER_TEACHER, MOCK_PROBLEMS, INITIAL_CONTESTS, MOCK_STUDENTS_LIST, MOCK_BANKS } from './data/mockData';

// Layout & UI
import { Toast } from './components/UiComponents';
import { StudentNavbar, TeacherSidebar } from './components/Layouts';
import { LoginPage } from './components/LoginPage';
import { MobileBottomNav } from './components/common/MobileBottomNav';

// Student Pages
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentProfile } from './components/student/StudentProfile';
import { ProblemSet } from './components/student/ProblemSet';
import { ContestLobby } from './components/student/ContestLobby';
import { ContestDetail } from './components/student/ContestDetail';
import { LeaderboardView } from './components/student/LeaderboardView';
import { CodingWorkspace } from './components/student/CodingWorkspace';
import { MistakeBook } from './components/student/MistakeBook';
import { SocketProvider } from './context/SocketContext';
import { ElectronicPets } from './components/student/ElectronicPets';
import { AlgoVisualizer } from './components/student/AlgoVisualizer';
import { KnowledgeProfile } from './components/student/KnowledgeProfile';

// Teacher Pages
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { ProblemManager } from './components/teacher/ProblemManager';
import { StudentManager } from './components/teacher/StudentManager';
import { ContestManager } from './components/teacher/ContestManager';
import { AnalyticsDashboard } from './components/teacher/AnalyticsDashboard';
import { BankManager } from './components/teacher/BankManager';

import { getMe, login, logout, getProblems, getMistakeBook, addToMistakeBook, removeFromMistakeBook, getContests, getAllStudents, getBanks, registerContest as registerContestApi, submitProject as submitProjectApi, changePassword } from './services/api';

const App = () => {
  // --- Theme State ---
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('educode_theme') as 'light' | 'dark') || 'dark';
  });



  // --- Session Persistence ---
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    localStorage.setItem('educode_theme', theme);
    if (theme === 'light' && user) {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
    }
  }, [theme, user]);

  const [view, setView] = useState(() => {
    return localStorage.getItem('educode_view') || 'dashboard';
  });

  // --- Global Data State (Shared between Teacher & Student) ---
  const [problems, setProblems] = useState<Problem[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [banks, setBanks] = useState<ProblemBank[]>([]);

  // --- Student Specific State ---
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(() => {
    try {
      const saved = localStorage.getItem('educode_selected_problem_id');
      if (saved) {
        // We'll find the actual problem object later in loadData or use a temporary shell
        return { id: saved } as any;
      }
    } catch (e) { }
    return null;
  });
  const [mistakeBook, setMistakeBook] = useState<string[]>([]);
  const [activeContest, setActiveContest] = useState<Contest | null>(() => {
    try {
      const saved = localStorage.getItem('educode_active_contest_id');
      if (saved) {
        return { id: saved } as any;
      }
    } catch (e) { }
    return null;
  });
  const [contestViewMode, setContestViewMode] = useState<'detail' | 'leaderboard' | null>(() => {
    return localStorage.getItem('educode_contest_view_mode') as any || null;
  });

  // --- Teacher Mobile State ---
  const [isTeacherMobileMenuOpen, setIsTeacherMobileMenuOpen] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      const promises: Promise<any>[] = [
        getProblems(),
        getMistakeBook(),
        getContests(),
        getBanks()
      ];

      // If teacher, fetch students list
      if (localStorage.getItem('educode_token')) {
        promises.push(getAllStudents().catch(() => []));
      }

      const [probs, mistakesData, contestsData, banksData, studentsData] = await Promise.all(promises);

      setProblems(probs);
      setContests(contestsData || []);
      setBanks(banksData || []);

      if (studentsData && Array.isArray(studentsData)) {
        setStudents(studentsData);
      }

      const ids = mistakesData.mistakes.map((m: any) => m.problem_id);
      setMistakeBook(ids);
      if (studentsData && Array.isArray(studentsData)) setStudents(studentsData);

      if (mistakesData?.mistakes) {
        setMistakeBook(mistakesData.mistakes.map((m: any) => m.problem_id));
      }

      // --- State Restoration ---
      const savedProbId = localStorage.getItem('educode_selected_problem_id');
      if (savedProbId && probs) {
        const found = probs.find((p: any) => p.id === savedProbId);
        if (found) setSelectedProblem(found);
      }

      const savedContestId = localStorage.getItem('educode_active_contest_id');
      if (savedContestId && contestsData) {
        const found = contestsData.find((c: any) => c.id === savedContestId);
        if (found) setActiveContest(found);
      }
    } catch (e) {
      console.error("Failed to load data", e);
    }
  }, []);

  const handleBackFromContest = useCallback(() => {
    setActiveContest(null);
    setContestViewMode(null);
  }, []);

  // Restore session & Popstate sync
  useEffect(() => {
    const initAuth = async () => {
      let token = localStorage.getItem('educode_token');
      
      if (token) {
        try {
          const userData = await getMe();
          setUser(userData);
          loadData();
        } catch (err) {
          console.error('Session expired', err);
          localStorage.removeItem('educode_token');
          setUser(null); // Ensure user is null on session expiry
        }
      }
      setLoadingUser(false);
    };
    initAuth();

    const handlePopState = (e: PopStateEvent) => {
      // If we have state in the event, use it to restore the view
      if (e.state && e.state.view) {
        setView(e.state.view);
        if (e.state.view === 'dashboard') {
          setSelectedProblem(null);
          setActiveContest(null);
        }
      } else {
        // Fallback for simple back actions
        if (selectedProblem) setSelectedProblem(null);
        else if (activeContest) {
          setActiveContest(null);
          setContestViewMode(null);
        }
        else if (view !== 'dashboard') setView('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [loadData, selectedProblem, activeContest, view]);

  // Handle history pushes when view changes
  useEffect(() => {
    const currentState = window.history.state;
    if (!currentState || currentState.view !== view || (view === 'workspace' && currentState.problemId !== selectedProblem?.id)) {
      window.history.pushState({ 
        view, 
        problemId: selectedProblem?.id,
        contestId: activeContest?.id 
      }, '');
    }
  }, [view, selectedProblem?.id, activeContest?.id]);

  useEffect(() => {
    if (selectedProblem?.id) localStorage.setItem('educode_selected_problem_id', selectedProblem.id);
    else localStorage.removeItem('educode_selected_problem_id');
  }, [selectedProblem]);

  useEffect(() => {
    if (activeContest?.id) localStorage.setItem('educode_active_contest_id', activeContest.id);
    else localStorage.removeItem('educode_active_contest_id');
  }, [activeContest]);

  useEffect(() => {
    if (contestViewMode) localStorage.setItem('educode_contest_view_mode', contestViewMode);
    else localStorage.removeItem('educode_contest_view_mode');
  }, [contestViewMode]);

  useEffect(() => {
    localStorage.setItem('educode_view', view);
  }, [view]);

  // --- Problem Navigation Logic ---
  const contestProblems = useMemo(() => {
    if (!activeContest || !problems) return [];
    return problems.filter(p => activeContest.problemIds?.includes(p.id));
  }, [activeContest, problems]);

  const currentProbIdx = useMemo(() => {
    if (!selectedProblem || contestProblems.length === 0) return -1;
    return contestProblems.findIndex(p => p.id === selectedProblem.id);
  }, [selectedProblem, contestProblems]);

  const handlePrevProblem = () => {
    if (currentProbIdx > 0) {
      setSelectedProblem(contestProblems[currentProbIdx - 1]);
    }
  };

  const handleNextProblem = () => {
    if (currentProbIdx >= 0 && currentProbIdx < contestProblems.length - 1) {
      setSelectedProblem(contestProblems[currentProbIdx + 1]);
    }
  };

  // --- Derived State ---
  const contestsWithAuth = React.useMemo(() => {
    return contests.map(c => ({
      ...c,
      isRegistered: user ? c.registeredStudentIds?.includes(user.id) : false
    }));
  }, [contests, user]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView('dashboard');
    loadData();
    window.history.pushState({ view: 'dashboard' }, '');
  };

  const handleLogout = () => {
    localStorage.removeItem('educode_token');
    logout();
    setUser(null);
    setSelectedProblem(null);
    setActiveContest(null);
    setContestViewMode(null);
    setView('login');
    window.history.pushState({ view: 'login' }, '');
  };

  const toggleMistake = async (problemId: string) => {
    const isRemoving = mistakeBook.includes(problemId);
    setMistakeBook(prev => isRemoving ? prev.filter(id => id !== problemId) : [...prev, problemId]);
    try {
      if (isRemoving) await removeFromMistakeBook(problemId);
      else await addToMistakeBook(problemId);
    } catch (e) {
      showToast("操作失败，请重试", "error");
      setMistakeBook(prev => isRemoving ? [...prev, problemId] : prev.filter(id => id !== problemId));
    }
  };

  const mistakeProblems = problems.filter(p => mistakeBook.includes(p.id));

  const handleRegisterContest = async (id: string) => {
    if (!user) return;
    try {
      await registerContestApi(id);
      const c = contests.find(c => c.id === id);
      if (!c) return;

      setContests(prev => prev.map(item =>
        item.id === id ? {
          ...item,
          participantCount: (item.participantCount || 0) + 1,
          registeredStudentIds: [...(item.registeredStudentIds || []), user.id]
        } : item
      ));
      showToast(`报名成功: ${c.title}`, 'success');

      if (c.status === 'LIVE') {
        const updated = { ...c, isRegistered: true, registeredStudentIds: [...(c.registeredStudentIds || []), user.id] };
        handleEnterContest(updated);
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || '报名失败', 'error');
    }
  };

  const handleEnterContest = (contest: Contest) => {
    setActiveContest(contest);
    setContestViewMode('detail');
    window.history.pushState({ contestId: contest.id, mode: 'detail' }, '');
  };

  const handleViewLeaderboard = (contest: Contest) => {
    setActiveContest(contest);
    setContestViewMode('leaderboard');
    window.history.pushState({ contestId: contest.id, mode: 'leaderboard' }, '');
  };

  const handleSubmitProject = async (contestId: string, submission: any) => {
    try {
      // If submission is FormData, we send it directly
      await submitProjectApi(contestId, submission);

      // After successful upload, we should refresh the data to get the real URLs
      // But optimization: optimistically update if we had valid URLs, but here we don't know the server filenames.
      // So we must re-fetch or just simulate "Submitted" state.
      // Easiest is to reload contests.
      loadData();

      showToast('作品提交成功！', 'success');
    } catch (e) {
      showToast('提交失败', 'error');
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin text-blue-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // 3. RENDER WITH GLOBAL SOCKET PROVIDER
  return (
    <SocketProvider user={user} token={localStorage.getItem('educode_token')}>
      {/* STUDENT VIEWS */}
      {user.role === UserRole.STUDENT && (
        <>
          {/* Coding Workspace (Full Screen) */}
          {selectedProblem && (
            <>
              {/* Key is critical here to reset state when switching problems */}
              <CodingWorkspace
                key={selectedProblem.id}
                user={user}
                problem={selectedProblem}
                contest={activeContest || undefined}
                onBack={() => setSelectedProblem(null)}
                isInMistakeBook={mistakeBook.includes(selectedProblem.id)}
                onToggleMistake={() => toggleMistake(selectedProblem.id)}
                showToast={showToast}
                isContestMode={!!activeContest}
                onPrevProblem={activeContest && currentProbIdx > 0 ? handlePrevProblem : undefined}
                onNextProblem={activeContest && currentProbIdx < contestProblems.length - 1 ? handleNextProblem : undefined}
                onSubmissionComplete={() => loadData()}
                theme={theme}
              />
              {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            </>
          )}

          {/* Student Portal (if not in workspace) */}
          {!selectedProblem && (
            <div className={`min-h-screen relative overflow-hidden font-sans ${theme === 'dark' ? 'bg-[#020617]' : 'bg-gradient-to-br from-blue-50/50 via-slate-50 to-slate-100'}`}>
              <ElectronicPets onNavigate={setView} currentView={view} theme={theme} />
              
              {/* Starry Night & Aurora Background (Dark Mode Only) */}
              {theme === 'dark' && (
                <div className="fixed inset-0 z-0 pointer-events-none">
                  {/* Base Deep Blue Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#0b1120] to-[#020617]"></div>
                  
                  {/* Diffuse Aurora/Nebula Lights */}
                  <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[160px] animate-aurora opacity-60"></div>
                  <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-cyan-600/10 rounded-full blur-[140px] animate-aurora opacity-40" style={{ animationDirection: 'reverse', animationDuration: '40s' }}></div>
                  <div className="absolute top-[30%] left-[20%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] animate-aurora opacity-30" style={{ animationDuration: '50s' }}></div>

                  {/* Star Field Simulation */}
                  <div className="absolute inset-0">
                    {[...Array(50)].map((_, i) => (
                      <div 
                        key={i} 
                        className="absolute w-0.5 h-0.5 bg-white rounded-full animate-star"
                        style={{
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          '--duration': `${2 + Math.random() * 4}s`,
                          '--delay': `${Math.random() * 5}s`
                        } as any}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="relative z-10">
                <StudentNavbar user={user} activeView={view} setView={setView} onLogout={handleLogout} theme={theme} onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')} />
                <main className="py-12 pb-32 lg:pb-12 px-6 sm:px-10 lg:px-16 relative">
                  {(activeContest && contestViewMode === 'detail') ? (
                    <ContestDetail
                      user={user}
                      contest={activeContest}
                      problems={problems}
                      onBack={handleBackFromContest}
                      onSelectProblem={setSelectedProblem}
                      onSubmitProject={handleSubmitProject}
                      onSubmitExam={() => loadData()}
                      showToast={showToast}
                    />
                  ) : (activeContest && contestViewMode === 'leaderboard') ? (
                    <LeaderboardView contest={activeContest} onBack={handleBackFromContest} />
                  ) : (
                    <>
                      {view === 'dashboard' && <StudentDashboard onNavigate={setView} onSelectProblem={setSelectedProblem} mistakeCount={mistakeBook.length} contests={contestsWithAuth} problems={problems} theme={theme} />}
                      {view === 'problems' && <ProblemSet problems={problems} onSelectProblem={setSelectedProblem} banks={banks} theme={theme} />}
                      {view === 'algo_visualizer' && <AlgoVisualizer onBack={() => setView('dashboard')} theme={theme} />}
                      {view === 'knowledge' && <KnowledgeProfile theme={theme} />}
                      {view === 'playground' && (
                        <CodingWorkspace
                          key="playground"
                          user={user}
                          problem={{
                            id: 'playground',
                            title: '在线工作台',
                            description: '这是一个自由编码空间，您可以编写并测试任何代码。',
                            difficulty: '简单',
                            tags: ['自由练习'],
                            inputExample: '',
                            outputExample: ''
                          } as any}
                          onBack={() => setView('dashboard')}
                          isInMistakeBook={false}
                          onToggleMistake={() => {}}
                          showToast={showToast}
                          hideDescription={true}
                          theme={theme}
                        />
                      )}
                      {view === 'contests' && (
                        <ContestLobby
                          contests={contestsWithAuth}
                          onRegister={handleRegisterContest}
                          onEnter={handleEnterContest}
                          onViewLeaderboard={handleViewLeaderboard}
                          theme={theme}
                        />
                      )}
                      {view === 'mistakes' && (
                        <MistakeBook
                          allProblems={problems}
                          mistakeIds={mistakeBook}
                          onRemoveMistake={(id) => toggleMistake(id)}
                          onSelectProblem={setSelectedProblem}
                          theme={theme}
                        />
                      )}
                      {view === 'profile' && (
                        <StudentProfile
                          user={user}
                          contests={contests}
                          mistakeProblems={mistakeProblems}
                          onSelectProblem={setSelectedProblem}
                          onEnterContest={handleEnterContest}
                          onRemoveMistake={(id) => toggleMistake(id)}
                          onNavigate={setView}
                          theme={theme}
                        />
                      )}
                    </>
                  )}
                </main>
                <MobileBottomNav activeView={view} setView={setView} mistakeCount={mistakeBook.length} theme={theme} />
              </div>
              {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            </div>
          )}
        </>
      )}

      {/* TEACHER PORTAL */}
      {user.role === UserRole.TEACHER && (
        <div className="flex min-h-screen bg-[#020617] relative overflow-hidden font-sans">
          {/* Starry Night & Aurora Background (Shared with Student) */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#0b1120] to-[#020617]"></div>
            <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[160px] animate-aurora opacity-60"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-cyan-600/10 rounded-full blur-[140px] animate-aurora opacity-40" style={{ animationDirection: 'reverse', animationDuration: '40s' }}></div>
            <div className="absolute top-[30%] left-[20%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] animate-aurora opacity-30" style={{ animationDuration: '50s' }}></div>
            <div className="absolute inset-0">
              {[...Array(50)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute w-0.5 h-0.5 bg-white rounded-full animate-star"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    '--duration': `${2 + Math.random() * 4}s`,
                    '--delay': `${Math.random() * 5}s`
                  } as any}
                />
              ))}
            </div>
          </div>

          <div className="relative z-10 flex w-full">
            <TeacherSidebar
              activeView={view}
              setView={setView}
              onLogout={handleLogout}
              isMobileOpen={isTeacherMobileMenuOpen}
              onCloseMobile={() => setIsTeacherMobileMenuOpen(false)}
              theme={theme}
              onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            />

            <main className="flex-1 overflow-auto h-screen relative">
              <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
                {/* Mobile Header with Menu Toggle */}
                <div className="md:hidden mb-6 flex justify-between items-center tech-card-glass-dark p-4 rounded-xl shadow-sm sticky top-0 z-30">
                  <div className="font-black text-lg text-white tracking-tighter uppercase">Edu<span className="text-blue-400">Code</span></div>
                  <button onClick={() => setIsTeacherMobileMenuOpen(true)} className="p-2 bg-white/5 rounded-lg text-slate-400">
                    <Menu size={20} />
                  </button>
                </div>

              {view === 'dashboard' && (
                <TeacherDashboard
                  stats={{
                    studentCount: students.length,
                    problemCount: problems.length,
                    contestCount: contests.length
                  }}
                  contests={contests}
                  banks={banks}
                  students={students}
                  showToast={showToast}
                />
              )}
              {view === 'banks' && (
                <BankManager
                  banks={banks}
                  setBanks={setBanks}
                  problems={problems}
                  setProblems={setProblems}
                  showToast={showToast}
                />
              )}
              {view === 'problems' && (
                <ProblemManager
                  problems={problems}
                  setProblems={setProblems}
                  banks={banks}
                  showToast={showToast}
                />
              )}
              {view === 'students' && (
                <StudentManager
                  students={students}
                  setStudents={setStudents}
                  showToast={showToast}
                />
              )}
              {view === 'contests' && (
                <ContestManager
                  contests={contests}
                  setContests={setContests}
                  problems={problems}
                  banks={banks}
                  students={students}
                  showToast={showToast}
                />
              )}
              {view === 'analytics' && (
                <AnalyticsDashboard
                  contests={contests}
                  students={students}
                />
              )}
            </div>
          </main>
        </div>
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    )}
    </SocketProvider>
  );
};

export default App;
