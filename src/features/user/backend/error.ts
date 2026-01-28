export const userErrorCodes = {
  createError: 'USER_CREATE_ERROR',
  updateError: 'USER_UPDATE_ERROR',
  notFound: 'USER_NOT_FOUND',
  validationError: 'USER_VALIDATION_ERROR',
  invalidParams: 'USER_INVALID_PARAMS',
  duplicateProfile: 'DUPLICATE_PROFILE',
  ageRestriction: 'AGE_RESTRICTION',
  invalidChannelUrl: 'INVALID_CHANNEL_URL',
  duplicateChannelType: 'DUPLICATE_CHANNEL_TYPE',
} as const;

type UserErrorValue = (typeof userErrorCodes)[keyof typeof userErrorCodes];

export type UserServiceError = UserErrorValue;
