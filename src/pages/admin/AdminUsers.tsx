import { useEffect, useState } from 'react';
import { Search, Users as UsersIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EmptyState, LoadingSpinner } from '@/components/ui';

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  mobile?: string;
  role: string;
  total_stars: number;
  rank: string;
  overall_progress: number;
  joined_date: string;
  selected_career?: { name: string };
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadUsers();
  }, [search, page]);

  const loadUsers = async () => {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select('id, full_name, email, mobile, role, total_stars, rank, overall_progress, joined_date, selected_career:careers!selected_career_id(name)')
      .order('joined_date', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data } = await query;
    if (data) setUsers(data as unknown as UserRow[]);
    setLoading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="input pl-10 max-w-md"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size={24} /></div>
        ) : users.length === 0 ? (
          <EmptyState icon={UsersIcon} title="No users found" description="No users match your search." />
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium">Email</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Career</th>
                    <th className="text-left px-4 py-3 font-medium">Role</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Stars</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Rank</th>
                    <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                            <span className="text-xs font-semibold text-primary-700">
                              {user.full_name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <span className="font-medium text-slate-900">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{user.email}</td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                        {user.selected_career?.name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${user.role === 'admin' ? 'bg-primary-50 text-primary-700' : 'bg-slate-100 text-slate-600'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{user.total_stars}</td>
                      <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{user.rank}</td>
                      <td className="px-4 py-3 text-slate-400 hidden xl:table-cell">
                        {new Date(user.joined_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">Page {page + 1}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={users.length < pageSize}
                  className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
