/**
 * Academic Role Approvals Page
 * Admin page to verify roles for Staff/TA/Professor (Requirement #5-6)
 */

import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/generic';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { UserCheck, Mail, Calendar, GraduationCap } from 'lucide-react';

export function AcademicRoleApprovalsPage() {
  const { data: pendingUsers, isLoading, refetch } = trpc.auth.getPendingAcademicUsers.useQuery();

  const verifyRoleMutation = trpc.auth.verifyRole.useMutation({
    onSuccess: () => {
      toast.success('Role verified successfully! Verification email sent.');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to verify role');
    },
  });

  const handleVerifyRole = (userId: string) => {
    verifyRoleMutation.mutate({ userId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Academic Role Approvals</h1>
        <p className="text-neutral-500 mt-2">
          Verify roles for Staff, TA, and Professor registrations
        </p>
      </div>

      {!pendingUsers || pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCheck className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-500">No pending role verifications</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pendingUsers.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      {user.firstName} {user.lastName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Registered {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{user.role}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {user.studentId && (
                    <div className="space-y-1">
                      <label className="text-sm text-neutral-500">GUC ID</label>
                      <p className="text-sm font-medium">{user.studentId}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-sm text-neutral-500">Status</label>
                    <Badge variant={user.isVerified ? 'default' : 'secondary'}>
                      {user.isVerified ? 'Email Verified' : 'Email Pending'}
                    </Badge>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={verifyRoleMutation.isPending}>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Verify Role
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Verify Role for {user.firstName} {user.lastName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will verify their role as <strong>{user.role}</strong> and send them a verification email.
                          They will be able to log in after verifying their email.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleVerifyRole(user.id)}
                          disabled={verifyRoleMutation.isPending}
                        >
                          {verifyRoleMutation.isPending ? 'Verifying...' : 'Confirm'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
