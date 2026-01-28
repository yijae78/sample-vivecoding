export const campaignErrorCodes = {
  notFound: 'CAMPAIGN_NOT_FOUND',
  fetchError: 'CAMPAIGN_FETCH_ERROR',
  validationError: 'CAMPAIGN_VALIDATION_ERROR',
  invalidParams: 'CAMPAIGN_INVALID_PARAMS',
  createError: 'CAMPAIGN_CREATE_ERROR',
  updateError: 'CAMPAIGN_UPDATE_ERROR',
  forbidden: 'CAMPAIGN_FORBIDDEN',
} as const;

type CampaignErrorValue = (typeof campaignErrorCodes)[keyof typeof campaignErrorCodes];

export type CampaignServiceError = CampaignErrorValue;
