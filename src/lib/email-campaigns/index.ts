import type {
  EmailCampaignProvider,
  EmailCampaignProviderAdapter,
} from "./types";
import { activeCampaignAdapter } from "./providers/activecampaign";

// Re-export types
export type {
  EmailCampaignProvider,
  EmailCampaignProviderAdapter,
  CampaignContact,
  DraftCampaignInput,
  SyncContactsResult,
  CreateDraftCampaignResult,
} from "./types";

/**
 * Get the current email campaign provider from environment
 */
export function getEmailCampaignProvider(): EmailCampaignProvider {
  // Only ActiveCampaign today; the adapter interface keeps a future
  // Mailchimp/Kit switch to a single new provider file.
  return "activecampaign";
}

/**
 * Get the adapter for the current email campaign provider
 */
export function getEmailCampaignAdapter(): EmailCampaignProviderAdapter {
  switch (getEmailCampaignProvider()) {
    case "activecampaign":
    default:
      return activeCampaignAdapter;
  }
}
