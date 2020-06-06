import * as std from '@krumpled/krumi/std';
import { Session } from '@krumpled/krumi/session';

export type State = {
  session: std.AsyncRequest<Session>;
};

export function init(): State {
  return { session: std.notAsked() };
}
