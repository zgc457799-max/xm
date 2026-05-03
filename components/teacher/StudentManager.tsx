
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Plus, Search, Edit2, Trash2, FileSpreadsheet, CheckCircle, User as UserIcon, BookOpen, Building2, GraduationCap, Download, AlertCircle } from 'lucide-react';
import { Button, Card, Modal, Pagination } from '../UiComponents';
import { User } from '../../types';
import { createStudent, updateStudent, deleteStudent } from '../../services/api';

export const StudentManager = ({ students, setStudents, showToast }: { students: any[], setStudents: React.Dispatch<React.SetStateAction<any[]>>, showToast: (msg: string, type?: 'success' | 'info' | 'error') => void }) => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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
    // UTF-8 BOM for Excel compatibility
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
          // Skip empty lines
          if (!row || row.length === 0) return;

          // Map columns safely
          const id = row[0] ? String(row[0]).trim() : '';
          const name = row[1] ? String(row[1]).trim() : '';
          const college = row[2] ? String(row[2]).trim() : '';
          const major = row[3] ? String(row[3]).trim() : '';
          const className = row[4] ? String(row[4]).trim() : '';
          const password = row[5] ? String(row[5]).trim() : '';

          if (!id && !name) return; // Skip largely empty rows

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
      // Sequential import to ensure stability, though parallel is faster
      for (const student of parsedStudents) {
        try {
          const created = await createStudent(student);
          imported.push(created);
        } catch (err: any) {
          console.error(`Import failed for ${student.id}`, err);
          // Should not happen given pre-validation, unless race condition
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
        // Edit
        await updateStudent(editingId, form);
        setStudents(prev => prev.map(s => s.id === editingId ? { ...s, ...form } : s));
        showToast("学生信息更新成功", "success");
      } else {
        // Add
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
      password: '' // 不回显原密码
    });
    setIsFormModalOpen(true);
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
    <div className="space-y-6 animate-fade-in h-[calc(100vh-120px)] flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">学生管理</h2>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">管理班级学生信息与学习状态</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="搜索姓名、学号、班级..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500/50 outline-none w-64 transition-all"
            />
          </div>
          <Button onClick={() => setIsImportModalOpen(true)} className="!rounded-xl bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/10">
            <Upload size={16} /> 导入学生
          </Button>
          <Button onClick={openAddModal} className="!rounded-xl shadow-xl shadow-blue-500/10">
            <Plus size={16} /> 添加学生
          </Button>
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-3xl overflow-hidden flex-1 flex flex-col backdrop-blur-md">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4">学号</th>
                <th className="px-6 py-4">姓名</th>
                <th className="px-6 py-4">学院</th>
                <th className="px-6 py-4">专业</th>
                <th className="px-6 py-4">班级</th>
                <th className="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedStudents.map((s) => (
                <tr key={s.id} className="hover:bg-white/5 transition-all group">
                  <td className="px-6 py-4 font-mono text-slate-400 text-sm">#{s.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-black text-white tracking-tight group-hover:text-blue-400 transition-colors">{s.name}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest">{s.college || '-'}</td>
                  <td className="px-6 py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest">{s.major || '-'}</td>
                  <td className="px-6 py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest">{s.className || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(s)} className="p-2 bg-white/5 border border-white/10 hover:bg-blue-500/10 rounded-xl text-slate-400 hover:text-blue-400 transition shadow-sm backdrop-blur-md">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 bg-white/5 border border-white/10 hover:bg-rose-500/10 rounded-xl text-slate-400 hover:text-rose-400 transition shadow-sm backdrop-blur-md">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="批量导入学生"
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setIsImportModalOpen(false);
              setImportFile(null);
              setImportErrors([]);
              setParsedStudents([]);
            }} disabled={loading}>取消</Button>
            <Button onClick={confirmImport} disabled={loading || parsedStudents.length === 0 || importErrors.length > 0}>
              {loading ? '导入中...' : '确认导入'}
            </Button>
          </>
        }
      >
        {loading && parsedStudents.length > 0 && !importFile ? ( // Logic check: loading is true during API call
          <div className="py-8 flex flex-col items-center justify-center text-slate-500">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <p>正在导入数据...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm text-slate-600">
              <span>支持 CSV / Excel 格式</span>
              <button onClick={handleDownloadTemplate} className="text-blue-600 hover:underline flex items-center gap-1 font-medium">
                下载导入模板
              </button>
            </div>

            <label
              htmlFor="import-file-input"
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition group ${importErrors.length > 0 ? 'border-red-300 bg-red-50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'}`}
            >
              <input
                id="import-file-input"
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
                onChange={(e) => e.target.files && processFile(e.target.files[0])}
              />
              <FileSpreadsheet size={32} className={`mb-2 ${importErrors.length > 0 ? 'text-red-400' : 'text-slate-400 group-hover:text-blue-500'}`} />
              <p className="text-sm font-medium text-slate-700">
                {importFile ? `当前文件: ${importFile.name}` : '点击上传表格文件'}
              </p>
              <p className="text-xs text-slate-400 mt-1">支持拖拽上传</p>
            </label>

            {/* Validation Errors */}
            {importErrors.length > 0 && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs max-h-40 overflow-y-auto border border-red-100">
                <div className="font-bold flex items-center gap-2 mb-2">发现 {importErrors.length} 个错误:</div>
                <ul className="list-disc pl-4 space-y-1">
                  {importErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            {/* Success Preview */}
            {parsedStudents.length > 0 && importErrors.length === 0 && (
              <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-start gap-2 border border-green-100">
                <CheckCircle size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">解析成功！</p>
                  <p className="text-xs mt-1">共检测到 {parsedStudents.length} 名学生数据，所有校验通过。</p>
                  <p className="text-xs mt-1">点击"确认导入"开始添加。</p>
                </div>
              </div>
            )}

            {!importFile && (
              <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-500 flex items-start gap-2">
                <CheckCircle size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-700 mb-1">模板格式要求：</p>
                  <p>列序：学号 | 姓名 | 学院 | 专业 | 班级 | 初始密码</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add/Edit Student Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingId ? "编辑学生信息" : "添加新学生"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsFormModalOpen(false)}>取消</Button>
            <Button onClick={handleSaveStudent} disabled={loading}>{loading ? '保存中...' : '确认'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">学号</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              disabled={!!editingId}
              placeholder="请输入学号"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">姓名</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="请输入姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">班级</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
                placeholder="例如：软工2301"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">学院</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={form.college}
                onChange={(e) => setForm({ ...form, college: e.target.value })}
                placeholder="例如：计算机学院"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">专业</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={form.major}
                onChange={(e) => setForm({ ...form, major: e.target.value })}
                placeholder="例如：软件工程"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {editingId ? "修改密码 (留空则不修改)" : "设定初始密码"}
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editingId ? "输入新密码" : "123456 (默认)"}
            />
          </div>
          {!editingId && (
            <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded-lg flex items-center gap-2 mt-2">
              <CheckCircle size={14} /> 未填写密码时，初始密码默认为 123456
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
