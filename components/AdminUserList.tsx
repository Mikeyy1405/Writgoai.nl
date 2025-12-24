'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  credits_remaining: number;
  monthly_credits: number;
  subscription_tier: string | null;
  subscription_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export default function AdminUserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editCredits, setEditCredits] = useState<number>(0);
  const [editMonthlyCredits, setEditMonthlyCredits] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUserId(user.user_id);
    setEditCredits(user.credits_remaining);
    setEditMonthlyCredits(user.monthly_credits);
  };

  const handleCancel = () => {
    setEditingUserId(null);
    setEditCredits(0);
    setEditMonthlyCredits(0);
  };

  const handleSave = async (userId: string) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          credits: editCredits,
          monthlyCredits: editMonthlyCredits,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update credits');
      }

      // Refresh the user list
      await fetchUsers();
      setEditingUserId(null);
      setEditCredits(0);
      setEditMonthlyCredits(0);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update credits');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
        <div className="text-gray-400">Gebruikers laden...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-xl p-8 text-center">
        <div className="text-red-400">{error}</div>
        <button
          onClick={fetchUsers}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
        >
          Opnieuw proberen
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Naam</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Credits</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Maandelijks</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Tier</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Admin</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Aangemaakt</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map((user) => {
              const isEditing = editingUserId === user.user_id;

              return (
                <tr key={user.user_id} className="hover:bg-gray-800/30">
                  <td className="px-6 py-4 text-sm text-white">
                    {user.email}
                    {user.is_admin && (
                      <span className="ml-2 text-xs bg-purple-600 px-2 py-1 rounded">ADMIN</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{user.name || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editCredits}
                        onChange={(e) => setEditCredits(parseInt(e.target.value) || 0)}
                        className="w-24 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white"
                        min="0"
                      />
                    ) : (
                      <span className="text-white font-semibold">{user.credits_remaining}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editMonthlyCredits}
                        onChange={(e) => setEditMonthlyCredits(parseInt(e.target.value) || 0)}
                        className="w-24 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white"
                        min="0"
                      />
                    ) : (
                      <span className="text-gray-300">{user.monthly_credits}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="capitalize text-gray-300">
                      {user.subscription_tier || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {user.subscription_active ? (
                      <span className="text-green-400">Actief</span>
                    ) : (
                      <span className="text-red-400">Inactief</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {user.is_admin ? (
                      <span className="text-purple-400">Ja</span>
                    ) : (
                      <span className="text-gray-500">Nee</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(user.user_id)}
                          disabled={saving}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded text-xs"
                        >
                          {saving ? 'Bezig...' : 'Opslaan'}
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={saving}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white rounded text-xs"
                        >
                          Annuleren
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(user)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                      >
                        Bewerk
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="p-8 text-center text-gray-400">
          Geen gebruikers gevonden
        </div>
      )}
    </div>
  );
}
