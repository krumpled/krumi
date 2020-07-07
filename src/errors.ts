import { Option, none, some } from '@krumpled/krumi/std';

export const HUMANIZED_ERRORS: Record<string, string> = Object.freeze({
  'errors.vote_for_self': 'Unable to vote for yourself',
});

export type ServerError = {
  message: string;
  humanized?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isErrorResponse(response: any): boolean {
  const { status, data } = response || {};
  return status === 400 && typeof data === 'string';
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export function extractServerError(error: any): Option<ServerError> {
  const { isAxiosError, response } = error || {};

  if (!isAxiosError || !response || !isErrorResponse(response)) {
    return none();
  }

  const humanized = HUMANIZED_ERRORS[response.data as string];
  return some({ message: response.data as string, humanized });
}
