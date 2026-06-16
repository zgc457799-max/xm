import React, { useState, useEffect } from 'react';
import { maskName } from '../../utils';
import { Lock, ArrowLeft, Trophy } from 'lucide-react';
import { Contest, ContestType } from '../../types';
import { MOCK_RANKINGS } from '../../data/mockData';
import { Button } from '../UiComponents';
import { useSocket } from '../../context/SocketContext';
import { getContestLeaderboard } from '../../services/api';

export const LeaderboardView = ({ contest, onBack }: { contest: Contest, onBack: () => void }) => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchLeaderboard = async () => {
    try {
      const data = await getContestLeaderboard(contest.id);
      setLeaderboard(data);
    } catch (e) {
      console.error("Failed to fetch leaderboard", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [contest.id]);

  // Real-time updates
  useEffect(() => {
    if (socket) {
      const handleUpdate = (data: any) => {
        // If the update is relevant to this contest, refresh
        // Note: The socket event currently sends problemId, we could refine this
        fetchLeaderboard();
      };

      socket.on('leaderboard_update', handleUpdate);
      return () => {
        socket.off('leaderboard_update', handleUpdate);
      };
    }
  }, [socket, contest.id]);
  if (!contest.isLeaderboardOpen) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
        <div className="bg-slate-100 h-24 w-24 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <Lock size={40} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">榜单暂未公开</h2>
          <p className="text-slate-500 mt-2">
            {contest.type === ContestType.PROJECT ? '教师评分完成后将公布成绩，请稍后。' : '该比赛的榜单需要教师授权后方可查看，请稍后再试。'}
          </p>
        </div>
        <Button variant="secondary" onClick={onBack} className="mx-auto">
          返回大厅
        </Button>
      </div>
    );
  }

  // Handle Project Contest Leaderboard
  if (contest.type === ContestType.PROJECT) {
    // Sort submissions by score desc
    const sortedSubmissions = [...(contest.projectSubmissions || [])].sort((a, b) => (b.score || 0) - (a.score || 0));

    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{contest.title} - 成绩单</h2>
            <p className="text-slate-500 text-sm">按最终得分排序</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-20">排名</th>
                <th className="px-6 py-4">选手</th>
                <th className="px-6 py-4">作品名称</th>
                <th className="px-6 py-4 text-right">最终得分</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedSubmissions.map((sub, index) => (
                <tr key={sub.userId} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">{maskName(sub.userName)}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm">学生期末作品</td>
                  <td className="px-6 py-4 text-right font-bold text-blue-600 text-lg">
                    {sub.score !== undefined ? sub.score : '-'}
                  </td>
                </tr>
              ))}
              {sortedSubmissions.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">暂无评分数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Column labels (A, B, C...)
  const problemLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{contest.title} - 排行榜</h2>
          <p className="text-slate-500 text-sm">
            {loading ? '正在同步数据...' : '最后更新: 刚刚'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 w-20">排名</th>
              <th className="px-6 py-4">选手</th>
              <th className="px-6 py-4 w-28">解题数</th>
              <th className="px-6 py-4 w-28">总罚时</th>
              {/* Dynamic Columns for Problems */}
              {leaderboard[0]?.problems?.map((p: any, idx: number) => (
                <th key={p.problemId} className="px-2 py-4 text-center w-16">
                  {problemLabels[idx] || (idx + 1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leaderboard.map((rank) => (
              <tr key={rank.userId} className={`${rank.userId === socket?.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                <td className="px-6 py-4">
                  {rank.rank === 1 ? <span className="text-xl">🥇</span> :
                    rank.rank === 2 ? <span className="text-xl">🥈</span> :
                      rank.rank === 3 ? <span className="text-xl">🥉</span> :
                        <span className="font-mono text-slate-500 pl-1">{rank.rank}</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-700 flex items-center gap-2">
                    {rank.name}
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-slate-800">{rank.solved}</td>
                <td className="px-6 py-4 font-mono text-slate-500 text-sm">{rank.time}</td>

                {/* Problem Status Cells */}
                {rank.problems.map((p: any) => (
                  <td key={p.problemId} className="px-2 py-4 text-center">
                    <div className={`w-10 h-10 mx-auto rounded flex flex-col items-center justify-center text-[10px] font-bold ${p.solved
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : (p.fails > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-300')
                      }`}>
                      <div>{p.solved ? 'AC' : (p.fails > 0 ? `-${p.fails}` : '-')}</div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
            {!loading && leaderboard.length === 0 && (
              <tr>
                <td colSpan={10} className="p-12 text-center text-slate-400">暂无选手的提交数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
