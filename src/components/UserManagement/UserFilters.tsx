import { UserFilters as UserFiltersType } from '@/types/user';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, X, Download } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';

interface UserFiltersProps {
  filters: UserFiltersType;
  onFiltersChange: (filters: UserFiltersType) => void;
  totalUsers: number;
  page: number;
  pageSize: number;
  onAutoDisableSuspicious: () => Promise<void>;
}

const providerOptions = [
  { value: 'all', label: 'All Providers' },
  { value: 'password', label: 'Email/Password' },
  { value: 'google.com', label: 'Google' }
];

export const UserFilters = ({
  filters,
  onFiltersChange,
  totalUsers,
  page,
  pageSize,
  onAutoDisableSuspicious,
}: UserFiltersProps) => {
  const { syncUsers, loading, exportToCSV } = useUsers();
  const activeFiltersCount = [
    filters.search,
    filters.status !== 'all' ? filters.status : null,
    filters.emailVerified !== 'all' ? filters.emailVerified : null,
    filters.provider !== 'all' ? filters.provider : null,
    filters.admin !== 'all' ? filters.admin : null,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      emailVerified: 'all',
      provider: 'all',
      admin: 'all',
      dateRange: { from: null, to: null },
      pageSize: 100, // Default page size
      sortField: 'creationTime', // Default sort field
      sortDirection: 'desc', // Default sort direction
      suspiciousOnly: 'all', // Reset to 'all'
    });
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md shadow-sm rounded-b-xl px-4 py-2 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight">User Management</h2>
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
              {totalUsers} users
            </Badge>
            <span className="text-xs text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalUsers)}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={syncUsers}
              disabled={loading}
              className="h-8 font-semibold shadow"
            >
              {loading ? 'Syncing...' : 'Sync Users'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={loading}
              className="h-8 font-semibold shadow"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onAutoDisableSuspicious}
              disabled={loading}
              className="h-8 font-semibold shadow"
            >
              Auto-Disable Suspicious
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-8"
              >
                <X className="mr-2 h-4 w-4" />
                Clear ({activeFiltersCount})
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-row gap-2 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-muted-foreground/30">
          <div className="relative min-w-[180px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search email, name, UID..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="pl-10 rounded-full text-xs"
            />
          </div>
          <Select value={filters.status} onValueChange={value => onFiltersChange({ ...filters, status: value as UserFiltersType['status'] })}>
            <SelectTrigger className="rounded-full px-3 text-xs min-w-[90px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="enabled">Enabled</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.emailVerified} onValueChange={value => onFiltersChange({ ...filters, emailVerified: value as UserFiltersType['emailVerified'] })}>
            <SelectTrigger className="rounded-full px-3 text-xs min-w-[90px]">
              <SelectValue placeholder="Email" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Emails</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.provider} onValueChange={value => onFiltersChange({ ...filters, provider: value as UserFiltersType['provider'] })}>
            <SelectTrigger className="rounded-full px-3 text-xs min-w-[90px]">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              {providerOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.admin} onValueChange={value => onFiltersChange({ ...filters, admin: value as UserFiltersType['admin'] })}>
            <SelectTrigger className="rounded-full px-3 text-xs min-w-[90px]">
              <SelectValue placeholder="Admin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="non-admin">Non-Admins</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.pageSize.toString()} onValueChange={value => onFiltersChange({ ...filters, pageSize: Number(value) })}>
            <SelectTrigger className="rounded-full px-3 text-xs min-w-[80px]">
              <SelectValue placeholder="Page Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="250">250</SelectItem>
              <SelectItem value="500">500</SelectItem>
              <SelectItem value="1000">1000</SelectItem>
              <SelectItem value="2500">2500</SelectItem>
              <SelectItem value="5000">5000</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.sortField} onValueChange={value => onFiltersChange({ ...filters, sortField: value as any })}>
            <SelectTrigger className="rounded-full px-3 text-xs min-w-[90px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="creationTime">Created Date</SelectItem>
              <SelectItem value="displayName">Name</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.sortDirection} onValueChange={value => onFiltersChange({ ...filters, sortDirection: value as any })}>
            <SelectTrigger className="rounded-full px-3 text-xs min-w-[90px]">
              <SelectValue placeholder="Sort Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.suspiciousOnly || 'all'} onValueChange={value => onFiltersChange({ ...filters, suspiciousOnly: value as UserFiltersType['suspiciousOnly'] })}>
            <SelectTrigger className="rounded-full px-3 text-xs min-w-[120px]">
              <SelectValue placeholder="Suspicious Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="suspicious">Suspicious Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};