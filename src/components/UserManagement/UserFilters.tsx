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
import { Search, X } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';

interface UserFiltersProps {
  filters: UserFiltersType;
  onFiltersChange: (filters: UserFiltersType) => void;
  totalUsers: number;
  page: number;
  pageSize: number;
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
}: UserFiltersProps) => {
  const { syncUsers, loading } = useUsers();
  const activeFiltersCount = [
    filters.search,
    filters.status !== 'all' ? filters.status : null,
    filters.emailVerified !== 'all' ? filters.emailVerified : null,
    filters.provider !== 'all' ? filters.provider : null,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      emailVerified: 'all',
      provider: 'all',
      dateRange: { from: null, to: null },
      pageSize: 100, // Default page size
      sortField: 'creationTime', // Default sort field
      sortDirection: 'desc', // Default sort direction
      suspiciousOnly: 'all', // Reset to 'all'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold">User Management</h2>
          <Badge variant="secondary">
            Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalUsers)} of {totalUsers} users
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={syncUsers}
            disabled={loading}
            className="h-8 ml-2"
          >
            {loading ? 'Syncing...' : 'Sync Users'}
          </Button>
        </div>
        
        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="h-8"
          >
            <X className="mr-2 h-4 w-4" />
            Clear filters ({activeFiltersCount})
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by email, name, or UID..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select
            value={filters.status}
            onValueChange={(value: typeof filters.status) =>
              onFiltersChange({ ...filters, status: value })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="enabled">Enabled</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.emailVerified}
            onValueChange={(value: typeof filters.emailVerified) =>
              onFiltersChange({ ...filters, emailVerified: value })
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Email" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Emails</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.provider}
            onValueChange={(value: typeof filters.provider) =>
              onFiltersChange({ ...filters, provider: value })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              {providerOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.pageSize.toString()}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, pageSize: Number(value) })
            }
          >
            <SelectTrigger className="w-[100px]">
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
            </SelectContent>
          </Select>

          <Select
            value={filters.sortField}
            onValueChange={(value) => onFiltersChange({ ...filters, sortField: value as any })}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="creationTime">Created Date</SelectItem>
              <SelectItem value="displayName">Name</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sortDirection}
            onValueChange={(value) => onFiltersChange({ ...filters, sortDirection: value as any })}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sort Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>

          {/* Replace Switch with Select for Suspicious Only */}
          <Select
            value={filters.suspiciousOnly || 'all'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, suspiciousOnly: value as UserFiltersType['suspiciousOnly'] })
            }
          >
            <SelectTrigger className="w-40">
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