/**
 * Profile Page
 * User profile with avatar picker and interests management
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AvatarPicker } from '@/components/generic';
import { trpc } from '@/lib/trpc';
import { User, Mail, Briefcase, BadgeCheck, Heart, X, Plus, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { getAvatarSrc } from '../../../shared';
import { usePageMeta } from '@/components/layout/page-meta-context';
import { formatValidationErrors } from '@/lib/format-errors';

// Suggested interests based on event types
const SUGGESTED_INTERESTS = [
  'Technology', 'AI/ML', 'Business', 'Sports', 'Music', 
  'Art', 'Science', 'Engineering', 'Entrepreneurship', 'Social',
  'Gaming', 'Fitness', 'Photography', 'Film', 'Literature',
  'Career', 'Networking', 'Research', 'Workshops', 'Competitions'
];

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const { setPageMeta } = usePageMeta();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showInterestsPicker, setShowInterestsPicker] = useState(false);
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [newInterest, setNewInterest] = useState('');
  const [avatarValue, setAvatarValue] = useState<{
    type: 'preset' | 'upload';
    data: string;
  } | undefined>(
    user?.avatar
      ? { type: (user.avatarType as 'preset' | 'upload') || 'preset', data: user.avatar }
      : undefined
  );

  useEffect(() => {
    setPageMeta({
      title: 'Profile',
      description: 'Manage your account settings',
    });
  }, [setPageMeta]);

  // Reset interests when user changes
  useEffect(() => {
    if (user?.interests) {
      setInterests(user.interests);
    }
  }, [user?.interests]);

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
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, {
        style: { whiteSpace: 'pre-line' },
      });
    },
  });

  const updateInterestsMutation = trpc.auth.updateInterests.useMutation({
    onSuccess: (data) => {
      toast.success('Interests updated successfully!');
      setShowInterestsPicker(false);
      
      if (user) {
        setUser({
          ...user,
          interests: data.interests,
        });
      }
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, {
        style: { whiteSpace: 'pre-line' },
      });
    },
  });

  const handleAvatarSave = () => {
    if (!avatarValue) return;
    updateAvatarMutation.mutate({
      avatar: avatarValue.data,
      avatarType: avatarValue.type,
    });
  };

  const handleInterestsSave = () => {
    updateInterestsMutation.mutate({ interests });
  };

  const addInterest = (interest: string) => {
    const trimmed = interest.trim().toLowerCase();
    if (trimmed && interests.length < 10 && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed]);
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  if (!user) {
    return null;
  }

  const getInitials = () => {
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  const avatarSrc = getAvatarSrc(user.avatar, user.avatarType as 'upload' | 'preset');

  return (
    <div className="flex flex-col gap-6 p-6">
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
              <AvatarFallback className="text-2xl bg-muted text-foreground">
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
              <label className="text-sm text-neutral-500 dark:text-neutral-400">Status</label>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  user.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : user.status === 'BLOCKED'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                }`}>
                  {user.status}
                </span>
                {user.isVerified && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">• Email verified</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interests Section - Only for students */}
      {user.role === 'STUDENT' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              My Interests
            </CardTitle>
            <CardDescription>
              Help us personalize your event recommendations by selecting your interests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Interests */}
            <div className="flex flex-wrap gap-2">
              {user.interests && user.interests.length > 0 ? (
                user.interests.map((interest) => (
                  <Badge 
                    key={interest} 
                    variant="secondary"
                    className="capitalize"
                  >
                    {interest}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No interests selected yet. Add some to get better event recommendations!
                </p>
              )}
            </div>

            {/* Edit Interests Button */}
            <Dialog open={showInterestsPicker} onOpenChange={setShowInterestsPicker}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  {user.interests && user.interests.length > 0 ? 'Edit Interests' : 'Add Interests'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Select Your Interests
                  </DialogTitle>
                  <DialogDescription>
                    Choose up to 10 interests to personalize your event recommendations
                  </DialogDescription>
                </DialogHeader>

                {/* Current Selected Interests */}
                {interests.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                    {interests.map((interest) => (
                      <Badge 
                        key={interest} 
                        variant="secondary"
                        className="capitalize gap-1 pr-1"
                      >
                        {interest}
                        <button
                          onClick={() => removeInterest(interest)}
                          className="ml-1 rounded-full hover:bg-background/50 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Add Custom Interest */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom interest..."
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addInterest(newInterest);
                      }
                    }}
                    maxLength={50}
                  />
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={() => addInterest(newInterest)}
                    disabled={!newInterest.trim() || interests.length >= 10}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Suggested Interests */}
                <div>
                  <p className="text-sm font-medium mb-2">Suggested Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_INTERESTS.filter(
                      s => !interests.includes(s.toLowerCase())
                    ).map((suggestion) => (
                      <Badge
                        key={suggestion}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                        onClick={() => addInterest(suggestion)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {interests.length}/10 interests selected
                </p>

                <div className="flex gap-2 justify-end mt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setInterests(user.interests || []);
                      setShowInterestsPicker(false);
                    }}
                    disabled={updateInterestsMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleInterestsSave}
                    disabled={updateInterestsMutation.isPending}
                  >
                    {updateInterestsMutation.isPending ? 'Saving...' : 'Save Interests'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
