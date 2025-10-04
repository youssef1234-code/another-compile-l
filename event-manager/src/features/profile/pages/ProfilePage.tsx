/**
 * Profile Page
 * User profile with avatar picker
 */

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarPicker } from '@/components/generic';
import { trpc } from '@/lib/trpc';
import { User, Mail, Briefcase, BadgeCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getAvatarSrc } from '@event-manager/shared';

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarValue, setAvatarValue] = useState<{
    type: 'preset' | 'upload';
    data: string;
  } | undefined>(
    user?.avatar
      ? { type: (user.avatarType as 'preset' | 'upload') || 'preset', data: user.avatar }
      : undefined
  );

  const updateAvatarMutation = trpc.auth.updateAvatar.useMutation({
    onSuccess: () => {
      toast.success('Avatar updated successfully!');
      setShowAvatarPicker(false);
      
      if (user && avatarValue) {
        setUser({
          ...user,
          avatar: avatarValue.data,
          avatarType: avatarValue.type,
        });
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update avatar');
    },
  });

  const handleAvatarSave = () => {
    if (!avatarValue) return;
    updateAvatarMutation.mutate({
      avatar: avatarValue.data,
      avatarType: avatarValue.type,
    });
  };

  if (!user) {
    return null;
  }

  const getInitials = () => {
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  const avatarSrc = getAvatarSrc(user.avatar, user.avatarType as 'upload' | 'preset');

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-neutral-500 mt-2">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your personal information and avatar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarSrc} />
              <AvatarFallback className="text-2xl bg-neutral-100 text-neutral-900">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <Dialog open={showAvatarPicker} onOpenChange={setShowAvatarPicker}>
                <DialogTrigger asChild>
                  <Button variant="outline">Change Avatar</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Choose Avatar</DialogTitle>
                    <DialogDescription>
                      Select a preset avatar or upload your own image
                    </DialogDescription>
                  </DialogHeader>
                  <AvatarPicker
                    value={avatarValue}
                    onChange={setAvatarValue}
                    disabled={updateAvatarMutation.isPending}
                  />
                  <div className="flex gap-2 justify-end mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAvatarPicker(false)}
                      disabled={updateAvatarMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAvatarSave}
                      disabled={!avatarValue || updateAvatarMutation.isPending}
                    >
                      {updateAvatarMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* User Info */}
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-neutral-500 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  First Name
                </label>
                <p className="text-base font-medium">{user.firstName}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-neutral-500 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Last Name
                </label>
                <p className="text-base font-medium">{user.lastName}</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-neutral-500 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <p className="text-base font-medium">{user.email}</p>
            </div>

            {user.role === 'VENDOR' && user.companyName && (
              <div className="space-y-1">
                <label className="text-sm text-neutral-500 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Company Name
                </label>
                <p className="text-base font-medium">{user.companyName}</p>
              </div>
            )}

            {(user.studentId || user.staffId) && (
              <div className="space-y-1">
                <label className="text-sm text-neutral-500 flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4" />
                  {user.studentId ? 'Student ID' : 'Staff ID'}
                </label>
                <p className="text-base font-medium">{user.studentId || user.staffId}</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm text-neutral-500">Role</label>
              <p className="text-base font-medium capitalize">{user.role.toLowerCase()}</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-neutral-500">Status</label>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  user.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : user.status === 'BLOCKED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {user.status}
                </span>
                {user.isVerified && (
                  <span className="text-xs text-neutral-500">• Email verified</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
