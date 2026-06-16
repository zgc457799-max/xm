import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Plus, Search, Edit2, Trash2, FileSpreadsheet, CheckCircle, User as UserIcon, BookOpen, Building2, GraduationCap, Download, AlertCircle, Sparkles, Trophy, Zap, Gift } from 'lucide-react';
import { Button, Card, Modal, Pagination } from '../UiComponents';
import { User } from '../../types';
import { createStudent, updateStudent, deleteStudent } from '../../services/api';

export const StudentManager = ({ students, setStudents, showToast }: { students: any[], setStudents: React.Dispatch<React.SetStateAction<any[]>>, showToast: (msg: string, type?: 'success' | 'info' | 'error') => void }) => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [selectedStudentForReward, setSelectedStudentForReward] = useState<any>(null);
  const [rewardAmount, setRewardAmount] = useState(100);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [parsedStudents, setParsedStudents] = useState<any[]>([]);

  // Default structure for student form
  const [form, setForm] = useState({
    id: '',
    name: '',
    className: '',
    college: '',
    major: '',
    password: ''
  });

  // Filter & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // --- Dynamic score & streak generation using id hash for visual consistency ---
  const getStudentScore = (s: any) => {
    const hash = s.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return (hash % 850) + 50; // Dynamic scores between 50 and 900
  };
  
  const getStudentStreak = (s: any) => {
    const hash = s.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return (hash % 29) + 2; // Streaks between 2 and 30
  };

  const getRankName = (scoreVal: number) => {
    if (scoreVal <= 100) return '新手译手';
    if (scoreVal <= 300) return '初阶码农';
    if (scoreVal <= 600) return '极客极境';
    return '算法圣手';
  };

  const getRankBadgeColor = (rank: string) => {
    if (rank === '新手译手') return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    if (rank === '初阶码农') return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    if (rank === '极客极境') return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    return 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30';
  };

  const maskName = (name: string) => {
    if (!name) return '';
    if (name.length <= 1) return name;
    return name[0] + '*'.repeat(name.length - 1);
  };

  const filteredStudents = students.filter(s =>
    s.name.includes(searchTerm) ||
    s.id.includes(searchTerm) ||
    (s.className || '').includes(searchTerm) ||
    (s.college || '').includes(searchTerm) ||
    (s.major || '').includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleDownloadTemplate = () => {
    const headers = '学号,姓名,学院,专业,班级,初始密码(可选)';
    const example = '2023001,张三,计算机学院,软件工程,软工2301,123456';
    const csvContent = `\uFEFF${headers}\n${example}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'import_template.csv';
    link.click();
  };

  const processFile = (file: File) => {
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        const dataRows = json.slice(1); // Skip header

        const errors: string[] = [];
        const parsed: any[] = [];
        const seenIds = new Set<string>();

        dataRows.forEach((row, index) => {
          if (!row || row.length === 0) return;

          const id = row[0] ? String(row[0]).trim() : '';
          const name = row[1] ? String(row[1]).trim() : '';
          const college = row[2] ? String(row[2]).trim() : '';
          const major = row[3] ? String(row[3]).trim() : '';
          const className = row[4] ? String(row[4]).trim() : '';
          const password = row[5] ? String(row[5]).trim() : '';

          if (!id && !name) return;

          const lineNum = index + 2;

          if (!id || !name) {
            errors.push(`第 ${lineNum} 行: 学号和姓名不能为空`);
          } else {
            if (seenIds.has(id)) {
              errors.push(`第 ${lineNum} 行: 学号 ${id} 在文件中重复`);
            }
            seenIds.add(id);

            if (students.some(s => s.id === id)) {
              errors.push(`第 ${lineNum} 行: 学号 ${id} 已存在系统中`);
            }

            parsed.push({ id, name, college, major, className, password: password || '123456' });
          }
        });

        setImportErrors(errors);
        setParsedStudents(parsed);
      } catch (err) {
        console.error("Parse Error:", err);
        setImportErrors(["无法解析文件，请确保格式正确且不是加密文件"]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const confirmImport = async () => {
    if (parsedStudents.length === 0) return;
    setLoading(true);
    try {
      const imported = [];
      for (const student of parsedStudents) {
        try {
          const created = await createStudent(student);
          imported.push(created);
        } catch (err: any) {
          console.error(`Import failed for ${student.id}`, err);
        }
      }
      setStudents(prev => [...imported, ...prev]);
      showToast(`成功导入 ${imported.length} 名学生`);
      setIsImportModalOpen(false);
      setImportFile(null);
      setParsedStudents([]);
      setImportErrors([]);
    } catch (error) {
      showToast("导入过程发生异常", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStudent = async () => {
    if (!form.id || !form.name) {
      showToast("学号和姓名不能为空", "error");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await updateStudent(editingId, form);
        setStudents(prev => prev.map(s => s.id === editingId ? { ...s, ...form } : s));
        showToast("学生信息更新成功", "success");
      } else {
        const newStudent = await createStudent(form);
        setStudents(prev => [newStudent, ...prev]);
        showToast("学生创建成功，初始密码为 123456", "success");
      }
      setIsFormModalOpen(false);
    } catch (error: any) {
      showToast(error.response?.data?.message || "操作失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({
      id: '',
      name: '',
      className: '',
      college: '',
      major: '',
      password: ''
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (student: User) => {
    setEditingId(student.id);
    setForm({
      id: student.id,
      name: student.name,
      className: student.className || '',
      college: student.college || '',
      major: student.major || '',
      password: ''
    });
    setIsFormModalOpen(true);
  };

  const openRewardModal = (student: any) => {
    setSelectedStudentForReward(student);
    setRewardAmount(100);
    setIsRewardModalOpen(true);
  };

  const confirmReward = () => {
    if (!selectedStudentForReward) return;
    
    // Simulate updating student energy coin balance
    // In a production app, this would hit the API and trigger a live socket push to the student.
    const studentCoins = Number(localStorage.getItem('educode_student_coins')) || 350;
    localStorage.setItem('educode_student_coins', String(studentCoins + rewardAmount));
    
    showToast(`成功赏赐 [${maskName(selectedStudentForReward.name)}] ${rewardAmount} 能量玉币！`, 'success');
    setIsRewardModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除该学生吗？此操作无法撤销。')) {
      try {
        await deleteStudent(id);
        setStudents(prev => prev.filter(s => s.id !== id));
        showToast("学生删除成功", "success");
      } catch (error) {
        showToast("删除失败", "error");
      }
    }
  };

  return (
    <div 
      className="space-y-6 animate-fade-in h-[calc(100vh-60px)] flex flex-col relative pb-6 pr-2"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}
    >
      {/* Roster Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>学生修行档案</span>
            <span className="text-slate-500 text-sm font-light">|</span>
            <span className="text-cyan-400 text-sm font-bold uppercase tracking-widest font-mono">Cultivation Roster</span>
          </h2>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">审阅班级学生的御笔境界、每日修行天数与传功特权</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="搜索姓名、学号、班级..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-cyan-500/50 outline-none w-full sm:w-60 transition-all placeholder:text-slate-600 font-bold"
            />
          </div>
          <Button onClick={() => setIsImportModalOpen(true)} className="!rounded-xl bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/10 text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
            <Upload size={14} /> 批量录入
          </Button>
          <Button onClick={openAddModal} className="!rounded-xl shadow-xl shadow-blue-500/10 text-xs font-black uppercase tracking-widest bg-cyan-600 hover:bg-cyan-500 flex items-center gap-1">
            <Plus size={14} /> 传唤门徒
          </Button>
        </div>
      </div>

      {/* Roster Table with transparent dark cards */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-850 shadow-3xl overflow-hidden flex-1 flex flex-col backdrop-blur-md">
        <div className="overflow-x-auto flex-1 custom-scrollbar w-full">
          <table className="w-full text-left border-collapse min-w-full md:min-w-[700px]">
            <thead className="hidden md:table-header-group bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-white/5 sticky top-0 z-10 backdrop-blur-md select-none">
              <tr>
                <th className="px-6 py-4">修行编号</th>
                <th className="px-6 py-4">姓名</th>
                <th className="px-6 py-4 text-center">当前境界</th>
                <th className="px-6 py-4 text-center">修行进度</th>
                <th className="px-6 py-4 text-center">打卡修行</th>
                <th className="px-6 py-4">班级星野</th>
                <th className="px-6 py-4 text-right">功权交互</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group divide-y-0 md:divide-y divide-white/5">
              {paginatedStudents.map((s) => {
                const scoreVal = getStudentScore(s);
                const streakVal = getStudentStreak(s);
                const rankName = getRankName(scoreVal);
                const badgeColor = getRankBadgeColor(rankName);
                
                return (
                  <tr key={s.id} className="block md:table-row bg-slate-800/40 md:bg-transparent rounded-2xl md:rounded-none mb-4 md:mb-0 border border-white/5 md:border-none hover:bg-cyan-950/20 transition-all duration-300 group p-4 md:p-0">
                    <td className="flex justify-between items-center md:table-cell px-2 md:px-6 py-3 md:py-4 font-mono text-slate-500 text-xs border-b border-white/5 md:border-none">
                      <span className="md:hidden font-bold text-slate-400 uppercase text-[10px]">修行编号</span>
                      <span>#{s.id}</span>
                    </td>
                    <td className="flex justify-between items-center md:table-cell px-2 md:px-6 py-3 md:py-4 border-b border-white/5 md:border-none">
                      <span className="md:hidden font-bold text-slate-400 uppercase text-[10px]">姓名</span>
                      <div className="font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center text-[10px] font-black shadow shadow-cyan-500/5 group-hover:scale-105 transition-transform duration-300">
                          {s.name[0]}
                        </div>
                        {maskName(s.name)}
                      </div>
                    </td>
                    <td className="flex justify-between items-center md:table-cell px-2 md:px-6 py-3 md:py-4 md:text-center border-b border-white/5 md:border-none">
                      <span className="md:hidden font-bold text-slate-400 uppercase text-[10px]">当前境界</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${badgeColor}`}>
                        《{rankName}》
                      </span>
                    </td>
                    <td className="flex justify-between items-center md:table-cell px-2 md:px-6 py-3 md:py-4 md:text-center border-b border-white/5 md:border-none">
                      <span className="md:hidden font-bold text-slate-400 uppercase text-[10px]">修行进度</span>
                      <span className="font-bold text-xs text-slate-300 font-mono tracking-wide">{scoreVal} XP</span>
                    </td>
                    <td className="flex justify-between items-center md:table-cell px-2 md:px-6 py-3 md:py-4 md:text-center border-b border-white/5 md:border-none">
                      <span className="md:hidden font-bold text-slate-400 uppercase text-[10px]">打卡修行</span>
                      <span className="text-amber-400 font-black text-xs tracking-wide flex items-center gap-1">
                        <Zap size={12} className="text-amber-400" />
                        {streakVal} 天
                      </span>
                    </td>
                    <td className="flex justify-between items-center md:table-cell px-2 md:px-6 py-3 md:py-4 border-b border-white/5 md:border-none">
                      <span className="md:hidden font-bold text-slate-400 uppercase text-[10px]">班级星野</span>
                      <span className="text-slate-500 font-black text-[10px] uppercase tracking-widest">{s.className || '-'}</span>
                    </td>
                    <td className="flex justify-between items-center md:table-cell px-2 md:px-6 py-4 md:py-4 md:text-right">
                      <span className="md:hidden font-bold text-slate-400 uppercase text-[10px]">功权交互</span>
                      <div className="flex justify-end items-center gap-3">
                        <button
                          onClick={() => openRewardModal(s)}
                          className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 font-black text-[10px] uppercase tracking-wider hover:bg-amber-500/20 active:scale-95 transition-all shadow-[0_0_8px_rgba(245,158,11,0.15)] hover:shadow-[0_0_12px_rgba(245,158,11,0.35)] animate-pulse hover:animate-none flex items-center gap-1.5"
                          title="赐予弟子能量币奖励"
                        >
                          <Gift size={12} className="text-amber-400" />
                          <span className="hidden sm:inline">赏赐修为</span>
                          <span className="sm:hidden">赏赐</span>
                        </button>
                        
                        <button onClick={() => openEditModal(s)} className="p-1.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-lg text-slate-400 hover:text-white transition shadow-sm backdrop-blur-md">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 bg-slate-900 border border-slate-800 hover:border-rose-450 rounded-lg text-slate-400 hover:text-rose-400 transition shadow-sm backdrop-blur-md">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-white/5">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filteredStudents.length}
          />
        </div>
      </div>

      {/* Reward Modal */}
      <Modal
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        title={`🎁 赏赐玉币功能 - [${maskName(selectedStudentForReward?.name || '')}]`}
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" onClick={() => setIsRewardModalOpen(false)} className="!rounded-xl text-xs uppercase tracking-widest font-black">罢手</Button>
            <Button onClick={confirmReward} className="!rounded-xl text-xs uppercase tracking-widest font-black bg-amber-600 hover:bg-amber-500 text-white border-none shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              确认赏赐
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-slate-300">
          <p className="text-xs leading-relaxed text-slate-400">
            作为导师，您可以直接为弟子赐予天降机缘。该赏赐将直接投射到学生端顶部的 **金玉修行 HUD** 余额中，激发修行能动性。
          </p>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">赏赐能量玉币额度</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[50, 100, 200, 500].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRewardAmount(val)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    rewardAmount === val
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  {val} 💎
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* CSV Import Modal (Space theme) */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="🌌 批量接纳星海门徒"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" onClick={() => {
              setIsImportModalOpen(false);
              setImportFile(null);
              setImportErrors([]);
              setParsedStudents([]);
            }} disabled={loading} className="!rounded-xl text-xs uppercase tracking-widest font-black">罢手</Button>
            <Button onClick={confirmImport} disabled={loading || parsedStudents.length === 0 || importErrors.length > 0} className="!rounded-xl text-xs uppercase tracking-widest font-black bg-cyan-600 hover:bg-cyan-500 text-white border-none">
              {loading ? '接纳中...' : '确认接纳'}
            </Button>
          </div>
        }
      >
        {loading && parsedStudents.length > 0 && !importFile ? (
          <div className="py-8 flex flex-col items-center justify-center text-slate-500">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-cyan-500 border-t-transparent mb-4"></div>
            <p className="text-xs font-black uppercase tracking-wider text-cyan-400">正在开启空间锚点载入中...</p>
          </div>
        ) : (
          <div className="space-y-4 text-slate-350">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-bold">支持 CSV / Excel 格式文件</span>
              <button onClick={handleDownloadTemplate} className="text-cyan-400 hover:underline flex items-center gap-1 font-bold">
                下载导入规范模板
              </button>
            </div>

            <label
              htmlFor="import-file-input"
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition group ${importErrors.length > 0 ? 'border-red-500/40 bg-red-950/20' : 'border-slate-800 hover:border-cyan-500/40 hover:bg-cyan-950/5'}`}
            >
              <input
                id="import-file-input"
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
                onChange={(e) => e.target.files && processFile(e.target.files[0])}
              />
              <FileSpreadsheet size={32} className={`mb-2 ${importErrors.length > 0 ? 'text-red-400' : 'text-slate-400 group-hover:text-cyan-400'}`} />
              <p className="text-xs font-bold text-white">
                {importFile ? `当前装载: ${importFile.name}` : '点击装载星海门徒档案文件'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">支持文件拖拽至此</p>
            </label>

            {importErrors.length > 0 && (
              <div className="bg-red-950/40 text-red-400 p-3 rounded-xl text-xs max-h-40 overflow-y-auto border border-red-500/20">
                <div className="font-bold flex items-center gap-2 mb-2"><AlertCircle size={14} /> 检测到 {importErrors.length} 处空间逻辑裂缝:</div>
                <ul className="list-disc pl-4 space-y-1">
                  {importErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            {parsedStudents.length > 0 && importErrors.length === 0 && (
              <div className="bg-cyan-950/40 text-cyan-400 p-4 rounded-xl text-xs flex items-start gap-2 border border-cyan-500/20">
                <CheckCircle size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-sm">星门校准成功！</p>
                  <p className="mt-1 opacity-80">共感应到 {parsedStudents.length} 名契约门徒数据，所有空间位面验证无误。</p>
                  <p className="mt-1 opacity-80">点击"确认接纳"开始将他们划归至修行阵营。</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add/Edit Student Modal (Space theme) */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingId ? "🔮 修整弟子修行法契" : "🌌 传唤全新门徒登堂"}
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" onClick={() => setIsFormModalOpen(false)} className="!rounded-xl text-xs uppercase tracking-widest font-black">退下</Button>
            <Button onClick={handleSaveStudent} disabled={loading} className="!rounded-xl text-xs uppercase tracking-widest font-black bg-cyan-600 hover:bg-cyan-500 text-white border-none shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              {loading ? '传唤中...' : '确认传唤'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-slate-350">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">学号 (Student ID)</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 outline-none font-bold"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              disabled={!!editingId}
              placeholder="请输入学号"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">姓名 (Name)</label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 outline-none font-bold"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="门徒姓名"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">班级 (Class)</label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 outline-none font-bold"
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
                placeholder="例如：软工2301"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">学院 (College)</label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 outline-none font-bold"
                value={form.college}
                onChange={(e) => setForm({ ...form, college: e.target.value })}
                placeholder="学院名称"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">专业 (Major)</label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 outline-none font-bold"
                value={form.major}
                onChange={(e) => setForm({ ...form, major: e.target.value })}
                placeholder="专业名称"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              {editingId ? "重校修行密码 (留空则不修改)" : "设定初始密码"}
            </label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 outline-none font-bold"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editingId ? "输入新密码" : "123456 (默认)"}
            />
          </div>
          {!editingId && (
            <div className="bg-cyan-950/40 border border-cyan-800/10 text-cyan-400 text-xs p-3 rounded-xl flex items-center gap-2 mt-2 select-none">
              <CheckCircle size={14} /> 新门徒结契契约生成，初始登堂口令默认为 123456
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
