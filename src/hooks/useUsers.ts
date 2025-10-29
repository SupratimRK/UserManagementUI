import { useState, useEffect, useCallback } from 'react';
import { FirebaseUser, UserFilters } from '@/types/user';

const API_BASE = 'http://localhost:3001';

export const useUsers = () => {
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: 'all',
    emailVerified: 'all',
    provider: 'all',
    dateRange: { from: null, to: null },
    pageSize: 100,
    sortField: 'creationTime', // Default sort field
    sortDirection: 'desc',
    suspiciousOnly: 'all', // Default to 'all'
  });
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: filters.pageSize.toString(),
        sortField: filters.sortField,
        sortDirection: filters.sortDirection,
      });

      if (filters.search) {
        queryParams.append('search', filters.search);
      }
      if (filters.status !== 'all') {
        queryParams.append('status', filters.status);
      }
      if (filters.emailVerified !== 'all') {
        queryParams.append('emailVerified', filters.emailVerified);
      }
      if (filters.provider !== 'all') {
        queryParams.append('provider', filters.provider);
      }
      if (filters.dateRange?.from) {
        queryParams.append('dateRangeFrom', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        queryParams.append('dateRangeTo', filters.dateRange.to.toISOString());
      }
      if (filters.suspiciousOnly === 'suspicious') { // Check for 'suspicious' string
        queryParams.append('suspiciousOnly', 'true');
      }

      const res = await fetch(`${API_BASE}/users?${queryParams.toString()}`);
      const { users: fetchedUsers, total } = await res.json();
      setUsers(fetchedUsers);
      setTotalUsers(total);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const syncUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/sync-users`, { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        fetchUsers();
      } else {
        setError('Failed to sync users');
      }
    } catch (err) {
      setError('Failed to sync users');
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const updateUser = useCallback(async (uid: string, updates: Partial<FirebaseUser>) => {
    try {
      const res = await fetch(`${API_BASE}/user/${uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updatedUser = await res.json();
      setUsers(prev => prev.map(user => user.uid === uid ? updatedUser : user));
    } catch (err) {
      setError('Failed to update user');
    }
  }, []);

  const deleteUser = useCallback(async (uid: string) => {
    try {
      await fetch(`${API_BASE}/user/${uid}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(user => user.uid !== uid));
    } catch (err) {
      setError('Failed to delete user');
    }
  }, []);

  const bulkUpdateUsers = useCallback(async (userIds: string[], updates: Partial<FirebaseUser>) => {
    try {
      await fetch(`${API_BASE}/users/bulk-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, updates })
      });
      setUsers(prev => prev.map(user => userIds.includes(user.uid) ? { ...user, ...updates } : user));
    } catch (err) {
      setError('Failed to bulk update users');
    }
  }, []);

  const bulkDeleteUsers = useCallback(async (userIds: string[]) => {
    try {
      await fetch(`${API_BASE}/users/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds })
      });
      setUsers(prev => prev.filter(user => !userIds.includes(user.uid)));
    } catch (err) {
      setError('Failed to bulk delete users');
    }
  }, []);

  const autoDisableSuspiciousUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auto-disable-suspicious-users`, { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        fetchUsers(); // Re-fetch users to update their disabled status
      } else {
        setError(result.message || 'Failed to auto-disable suspicious users');
      }
    } catch (err) {
      setError('Failed to auto-disable suspicious users');
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const exportToCSV = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/users/export-csv`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export users to CSV');
    }
  }, []);

  return {
    users,
    loading,
    error,
    filters,
    setFilters,
    updateUser,
    deleteUser,
    bulkUpdateUsers,
    bulkDeleteUsers,
    refetch: fetchUsers,
    syncUsers,
    page,
    setPage,
    totalUsers,
    suspiciousUsers: users.filter(user => user.isSuspicious),
    autoDisableSuspiciousUsers,
    exportToCSV
  };
};