import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { ChevronDown, Shield, ShieldOff, Trash2 } from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  onBulkEnable: () => Promise<void>;
  onBulkDisable: () => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onClearSelection: () => void;
}

export const BulkActions = ({
  selectedCount,
  onBulkEnable,
  onBulkDisable,
  onBulkDelete,
  onClearSelection,
}: BulkActionsProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (selectedCount === 0) return null;

  const handleBulkAction = async (action: () => Promise<void>) => {
    setLoading(true);
    try {
      await action();
      onClearSelection();
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    await handleBulkAction(onBulkDelete);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-dashed">
        <span className="text-sm font-medium">
          {selectedCount} user{selectedCount > 1 ? 's' : ''} selected
        </span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={loading}>
              Actions
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleBulkAction(onBulkEnable)}>
              <Shield className="mr-2 h-4 w-4" />
              Enable Users
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkAction(onBulkDisable)}>
              <ShieldOff className="mr-2 h-4 w-4" />
              Disable Users
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setDeleteDialogOpen(true)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Users
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          onClick={onClearSelection}
          disabled={loading}
        >
          Clear
        </Button>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} user{selectedCount > 1 ? 's' : ''}? 
              This action cannot be undone and will permanently remove all user data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Deleting...' : 'Delete Users'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};