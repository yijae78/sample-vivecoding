export const applicationErrorCodes = {
  createError: 'APPLICATION_CREATE_ERROR',
  updateError: 'APPLICATION_UPDATE_ERROR',
  notFound: 'APPLICATION_NOT_FOUND',
  validationError: 'APPLICATION_VALIDATION_ERROR',
  invalidParams: 'APPLICATION_INVALID_PARAMS',
  duplicateApplication: 'APPLICATION_DUPLICATE',
  campaignClosed: 'APPLICATION_CAMPAIGN_CLOSED',
  influencerNotEligible: 'APPLICATION_INFLUENCER_NOT_ELIGIBLE',
} as const;

type ApplicationErrorValue = (typeof applicationErrorCodes)[keyof typeof applicationErrorCodes];

export type ApplicationServiceError = ApplicationErrorValue;
