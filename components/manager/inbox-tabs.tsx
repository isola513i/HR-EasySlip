"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ApprovalInbox } from "@/components/manager/approval-inbox";
import { TimeAdjustmentInbox } from "@/components/manager/time-adjustment-inbox";
import { OvertimeInbox } from "@/components/manager/overtime-inbox";
import { useT } from "@/lib/i18n/locale-context";

export function InboxTabs() {
  const t = useT();
  return (
    <Tabs defaultValue="leave" className="gap-4">
      <TabsList>
        <TabsTrigger value="leave">{t.manager.tabs.leave}</TabsTrigger>
        <TabsTrigger value="timeAdjustment">{t.manager.tabs.timeAdjustment}</TabsTrigger>
        <TabsTrigger value="overtime">{t.manager.tabs.overtime}</TabsTrigger>
      </TabsList>
      <TabsContent value="leave"><ApprovalInbox /></TabsContent>
      <TabsContent value="timeAdjustment"><TimeAdjustmentInbox /></TabsContent>
      <TabsContent value="overtime"><OvertimeInbox /></TabsContent>
    </Tabs>
  );
}
