import { randomUUID } from "node:crypto";

import {
  getAdminMarketingCampaignPageData,
  sendNewEventsCampaignAction,
} from "@/admin/server/marketing-campaigns";
import { AdminMarketingView } from "@/views/admin-marketing/AdminMarketingView";

type AdminMarketingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type CampaignStatus = "duplicate" | "failed" | "no_events" | "partial_failed" | "sent";

function readStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function readNumberParam(value: string | string[] | undefined) {
  const numberValue = Number(readStringParam(value));

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function isCampaignStatus(status: string): status is CampaignStatus {
  return (
    status === "duplicate" ||
    status === "failed" ||
    status === "no_events" ||
    status === "partial_failed" ||
    status === "sent"
  );
}

function readLastResult(params: Record<string, string | string[] | undefined>) {
  const status = readStringParam(params.status);

  if (!isCampaignStatus(status)) {
    return undefined;
  }

  return {
    campaignId: readStringParam(params.campaign) || undefined,
    failed: readNumberParam(params.failed),
    recipients: readNumberParam(params.recipients),
    sent: readNumberParam(params.sent),
    status,
  };
}

export default async function AdminMarketingPage({ searchParams }: AdminMarketingPageProps) {
  const [data, params] = await Promise.all([
    getAdminMarketingCampaignPageData(),
    searchParams,
  ]);

  return (
    <AdminMarketingView
      campaignId={randomUUID()}
      data={data}
      lastResult={readLastResult(params)}
      sendAction={sendNewEventsCampaignAction}
    />
  );
}
