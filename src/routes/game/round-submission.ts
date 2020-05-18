import { AsyncRequest } from '@krumpled/krumi/std';

export type Submitted = {
  kind: 'submitted';
  submission: AsyncRequest<{ entry: string }>;
};
export type NotSubmitted = { kind: 'not-submitted'; value: string };
export type RoundSubmission = NotSubmitted | Submitted;

export function empty(): RoundSubmission {
  return { kind: 'not-submitted', value: '' };
}
