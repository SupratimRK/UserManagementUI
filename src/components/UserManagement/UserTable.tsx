import { FirebaseUser } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Shield, 
  ShieldOff,
  Mail,
  MailX,
  AlertCircle // Add AlertCircle icon
} from 'lucide-react';
import { format } from 'date-fns';

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
  pageSize,
  sortDirection,
}: UserTableProps) => {
  // Only allow sorting by creationTime
  // Remove local sortDirection state; use parent prop instead

  const getProviderBadge = (user: FirebaseUser) => {
    const provider = user.providerData[0]?.providerId || 'email';
    const colors = {
      'email': 'default',
      'google.com': 'destructive',
      'facebook.com': 'secondary',
    } as const;
    
    return (
      <Badge variant={colors[provider as keyof typeof colors] || 'outline'}>
        {provider === 'google.com' ? 'Google' : 
         provider === 'facebook.com' ? 'Facebook' : 'Email'}
      </Badge>
    );
  };

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
            <TableHead>User</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>
              Created
              <span style={{ marginLeft: 4 }}>
                {typeof sortDirection !== 'undefined' && sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            </TableHead>
            <TableHead>Last Sign In</TableHead>
            <TableHead>Suspicious</TableHead> {/* New column for suspicious users */}
            <TableHead className="w-12">
              <Checkbox
                checked={selectedUsers.length === users.length && users.length > 0}
                onCheckedChange={onSelectAll}
                aria-label="Select all users"
              />
            </TableHead>
            <TableHead className="w-12">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => (
            <TableRow key={user.uid} className={user.isSuspicious ? "bg-yellow-100/50 hover:bg-yellow-100" : "hover:bg-muted/50"}> {/* Highlight suspicious users */}
              <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback>
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {user.displayName || 'No name'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Badge variant={user.disabled ? 'destructive' : 'default'}>
                    {user.disabled ? 'Disabled' : 'Active'}
                  </Badge>
                  {user.emailVerified ? (
                    <Mail className="h-4 w-4 text-green-600" />
                  ) : (
                    <MailX className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                {getProviderBadge(user)}
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
                {user.isSuspicious ? (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Suspicious
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell>
                <Checkbox
                  checked={selectedUsers.includes(user.uid)}
                  onCheckedChange={(checked) => onSelectUser(user.uid, !!checked)}
                  aria-label={`Select user ${user.displayName || user.email}`}
                />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted border border-transparent hover:border-border">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditUser(user)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleUserStatus(user)}>
                      {user.disabled ? (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Enable
                        </>
                      ) : (
                        <>
                          <ShieldOff className="mr-2 h-4 w-4" />
                          Disable
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDeleteUser(user)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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