import { useState, useEffect } from 'react';
import { FirebaseUser } from '@/types/user';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, User } from 'lucide-react';

interface EditUserDialogProps {
  user: FirebaseUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (uid: string, updates: Partial<FirebaseUser>) => Promise<void>;
}

export const EditUserDialog = ({
  user,
  open,
  onOpenChange,
  onSave,
}: EditUserDialogProps) => {
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Prefill local state when `user` prop changes or dialog opens
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? '');
      setPhotoURL(user.photoURL ?? '');
      setIsAdmin(user.customClaims?.admin === true);
    } else {
      setDisplayName('');
      setPhotoURL('');
      setIsAdmin(false);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const updates: Partial<FirebaseUser> = {
        displayName: displayName.trim() || null,
        photoURL: photoURL.trim() || null,
      };
      if (user.customClaims?.admin !== isAdmin) {
        updates.customClaims = isAdmin ? { admin: true } : {};
      }
      await onSave(user.uid, updates);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would upload this to Firebase Storage
      // For now, we'll just create a local URL
      const url = URL.createObjectURL(file);
      setPhotoURL(url);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Make changes to the user's profile information.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={photoURL} />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="photo-upload"
                className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Upload className="h-3 w-3" />
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="photoURL">Photo URL</Label>
            <Input
              id="photoURL"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="Enter photo URL"
            />
          </div>

          <div className="grid gap-2">
            <Label>Email</Label>
            <div className="px-3 py-2 bg-muted rounded">{user.email || '—'}</div>
            <p className="text-sm text-muted-foreground">
              Email cannot be changed from this interface
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="admin"
              checked={isAdmin}
              onCheckedChange={(checked) => setIsAdmin(checked as boolean)}
            />
            <Label htmlFor="admin">Admin privileges</Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};