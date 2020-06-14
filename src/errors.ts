import { Option, none, some } from '@krumpled/krumi/std';

export type ServerError = {
  message: string;
};

function isErrorResponse(response: any): boolean {
  const { status, data } = response || {};
  return status === 400 && typeof data === 'string';
}

export function extractServerError(error: any): Option<ServerError> {
  const { isAxiosError, response } = error || {};

  if (!isAxiosError || !response || !isErrorResponse(response)) {
    return none();
  }

  return some({ message: response.data as string });
}
