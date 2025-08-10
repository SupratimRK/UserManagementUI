import { useState } from 'react';
import { FirebaseUser } from '@/types/user';
import { useUsers } from '@/hooks/useUsers';
import { UserFilters } from './UserFilters';
import { UserTable } from './UserTable';
import { EditUserDialog } from './EditUserDialog';
import { BulkActions } from './BulkActions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export const UserManagementPortal = () => {
  const {
    users,
    loading,
    filters,
    setFilters,
    updateUser,
    deleteUser,
    bulkUpdateUsers,
    bulkDeleteUsers,
    page,
    setPage,
    totalUsers,
    autoDisableSuspiciousUsers,
  } = useUsers();

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<FirebaseUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<FirebaseUser | null>(null);

  const handleSelectUser = (uid: string, selected: boolean) => {
    setSelectedUsers(prev => 
      selected 
        ? [...prev, uid]
        : prev.filter(id => id !== uid)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedUsers(selected ? users.map(user => user.uid) : []);
  };

  const handleEditUser = (user: FirebaseUser) => {
    setEditingUser(user);
  };

  const handleSaveUser = async (uid: string, updates: Partial<FirebaseUser>) => {
    await updateUser(uid, updates);
  };

  const handleDeleteUser = (user: FirebaseUser) => {
    setDeletingUser(user);
  };

  const confirmDeleteUser = async () => {
    if (deletingUser) {
      await deleteUser(deletingUser.uid);
      setDeletingUser(null);
    }
  };

  const handleToggleUserStatus = async (user: FirebaseUser) => {
    await updateUser(user.uid, { disabled: !user.disabled });
  };

  const handleBulkEnable = async () => {
    await bulkUpdateUsers(selectedUsers, { disabled: false });
  };

  const handleBulkDisable = async () => {
    await bulkUpdateUsers(selectedUsers, { disabled: true });
  };

  const handleBulkDelete = async () => {
    await bulkDeleteUsers(selectedUsers);
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <UserFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalUsers={totalUsers}
        page={page}
        pageSize={filters.pageSize}
        onAutoDisableSuspicious={autoDisableSuspiciousUsers}
      />

      <BulkActions
        selectedCount={selectedUsers.length}
        onBulkEnable={handleBulkEnable}
        onBulkDisable={handleBulkDisable}
        onBulkDelete={handleBulkDelete}
        onClearSelection={clearSelection}
      />

      <UserTable
        users={users}
        loading={loading}
        selectedUsers={selectedUsers}
        onSelectUser={handleSelectUser}
        onSelectAll={handleSelectAll}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        onToggleUserStatus={handleToggleUserStatus}
        page={page}
        pageSize={filters.pageSize}
        sortDirection={filters.sortDirection}
      />

      <div className="flex justify-end space-x-2 mt-4">
        <Button
          onClick={() => setPage(prev => Math.max(1, prev - 1))}
          disabled={page === 1 || loading}
        >
          Previous
        </Button>
        <Button
          onClick={() => setPage(prev => prev + 1)}
          disabled={page * filters.pageSize >= totalUsers || loading}
        >
          Next
        </Button>
      </div>

      <EditUserDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onSave={handleSaveUser}
      />

      <AlertDialog
        open={!!deletingUser} 
        onOpenChange={(open) => !open && setDeletingUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingUser?.displayName || deletingUser?.email}"? 
              This action cannot be undone and will permanently remove all user data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};