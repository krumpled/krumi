import {
  AsyncRequest,
  failed as failedRequest,
  loaded,
  loading,
} from '@krumpled/krumi/std';

export type Submitted = {
  kind: 'submitted';
  submission: AsyncRequest<{ entry: string }>;
};
export type NotSubmitted = { kind: 'not-submitted'; value: string };
export type RoundSubmission = NotSubmitted | Submitted;

export function failed(error: Error): RoundSubmission {
  return { kind: 'submitted', submission: failedRequest([error]) };
}

export function done(entry: string): RoundSubmission {
  return { kind: 'submitted', submission: loaded({ entry }) };
}

export function pending(promise: Promise<{ entry: string }>): RoundSubmission {
  return { kind: 'submitted', submission: loading(promise) };
}

export function empty(value?: string): RoundSubmission {
  return { kind: 'not-submitted', value: value || '' };
}
