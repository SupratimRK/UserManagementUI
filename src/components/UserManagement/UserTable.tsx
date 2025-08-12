import { FirebaseUser } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Edit2, 
  Trash2, 
  Shield, 
  ShieldOff,
  Mail,
  CheckCircle, 
  XCircle, 
  User 
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface UserTableProps {
  users: FirebaseUser[];
  loading: boolean;
  selectedUsers: string[];
  onSelectUser: (uid: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onEditUser: (user: FirebaseUser) => void;
  onDeleteUser: (user: FirebaseUser) => void;
  onToggleUserStatus: (user: FirebaseUser) => void;
  page: number;
  pageSize: number;
  sortDirection: 'asc' | 'desc';
}

export const UserTable = ({
  users,
  loading,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  onEditUser,
  onDeleteUser,
  onToggleUserStatus,
  page,
  pageSize
}: UserTableProps) => {
  // Only allow sorting by creationTime
  // Remove local sortDirection state; use parent prop instead


  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <div className="w-3 h-3 bg-muted animate-pulse rounded" />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Sign In</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="w-3 h-3 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
                    <div>
                      <div className="w-32 h-4 bg-muted animate-pulse rounded mb-1" />
                      <div className="w-24 h-3 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="w-16 h-6 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="w-16 h-6 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="w-20 h-4 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="w-20 h-4 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="w-8 h-8 bg-muted animate-pulse rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              Index
            </TableHead>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedUsers.length === users.length && users.length > 0}
                onCheckedChange={onSelectAll}
                aria-label="Select all users"
              />
            </TableHead>
            <TableHead className="w-24 text-center">Status</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Sign In</TableHead>
            <TableHead className="w-32 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => (
            <TableRow key={user.uid} className={user.isSuspicious ? "bg-warning/10 hover:bg-warning/20" : "hover:bg-muted/50"}> {/* Highlight suspicious users */}
              <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
              <TableCell>
                <Checkbox
                  checked={selectedUsers.includes(user.uid)}
                  onCheckedChange={(checked) => onSelectUser(user.uid, !!checked)}
                  aria-label={`Select user ${user.displayName || user.email}`}
                />
              </TableCell>
              <TableCell className="text-center">
                <div className="flex flex-row items-center justify-center space-x-2"> {/* Changed to flex-row and added justify-center */}
                  {/* Provider Icon */}
                  {user.providerData[0]?.providerId === 'password' ? (
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <User className="h-5 w-5 text-muted-foreground" /> // Using User icon as placeholder
                  )}

                  {/* Active Status Icon */}
                  {user.disabled ? (
                    <ShieldOff className="h-5 w-5 text-destructive" />
                  ) : (
                    <Shield className="h-5 w-5 text-green-600" />
                  )}

                  {/* Email Verified Icon */}
                  {user.emailVerified ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-warning-foreground" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback>
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className={cn("font-medium", user.isSuspicious ? "text-red-500" : "text-foreground")}> 
                      {user.displayName || 'No name'}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center">
                      {user.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {format(new Date(user.creationTime), 'MMM dd, yyyy')}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {user.lastSignInTime 
                    ? format(new Date(user.lastSignInTime), 'MMM dd, yyyy')
                    : 'Never'
                  }
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-row items-center gap-4 justify-center">
                  <Button variant="ghost" size="icon" onClick={() => onEditUser(user)} title="Edit User">
                    <Edit2 className="h-4 w-4 text-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onToggleUserStatus(user)} title={user.disabled ? "Enable User" : "Disable User"}>
                    {user.disabled
                      ? <Shield className="h-4 w-4 text-green-600" /> // Enable: green (non-critical)
                      : <ShieldOff className="h-4 w-4 text-blue-500" /> // Disable: blue (critical)
                    }
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDeleteUser(user)} title="Delete User">
                    <Trash2 className="h-4 w-4 text-red-500" /> {/* Delete: red (critical) */}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {users.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No users found matching your criteria
        </div>
      )}
    </div>
  );
};