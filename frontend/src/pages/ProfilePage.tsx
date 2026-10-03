import { useSearchParams } from "react-router-dom";
import { StorageTile } from "@/components/dashboard/StorageTile";
import { AiModelSettings } from "@/components/profile/AiModelSettings";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { ErrorState } from "@/components/shared/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import type { UserProfile } from "@/types/api";

const TABS = ["account", "model", "security"] as const;
type ProfileTab = (typeof TABS)[number];

function isProfileTab(value: string | null): value is ProfileTab {
  return TABS.includes(value as ProfileTab);
}

function AccountDetails({ profile }: { profile: UserProfile }) {
  const rows: [string, string][] = [
    ["Email", profile.email],
    ["Member since", formatDate(profile.created_at)],
    ["Last sign in", formatDate(profile.last_login_at, { withTime: true })],
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-meta text-muted-foreground">{label}</dt>
                <dd className="min-w-0 break-words text-body">{value}</dd>
              </div>
            ))}
            <dt className="text-meta text-muted-foreground">Role</dt>
            <dd>
              <Badge variant={profile.role === "admin" ? "info" : "muted"}>
                {profile.role === "admin" ? "Admin" : "Member"}
              </Badge>
            </dd>
          </dl>
        </CardContent>
      </Card>

      <StorageTile
        usedMb={profile.storage_used_mb}
        limitMb={profile.storage_limit_mb}
        percentage={profile.storage_percentage}
      />
    </div>
  );
}

export function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab");
  const tab: ProfileTab = isProfileTab(requested) ? requested : "account";
  const { data: profile, isLoading, error, refetch } = useUserProfile();

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <ErrorState
          message={getApiErrorMessage(error, "Couldn't load your profile.")}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <Tabs
        value={tab}
        onValueChange={(next) =>
          setSearchParams(next === "account" ? {} : { tab: next }, {
            replace: true,
          })
        }
      >
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="model">AI model</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <AccountDetails profile={profile} />
        </TabsContent>

        <TabsContent value="model">
          <Card>
            <CardContent className="p-5">
              <AiModelSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
