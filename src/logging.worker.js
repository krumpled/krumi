import debug from 'debug';
import config from '@krumpled/krumi/config';

const inner = debug('krumi:logging-worker');
inner.enabled = true;
inner('worker booted, adding message handler');

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function encode(target) {
  return target ? encodeURIComponent(btoa(target)) : target;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function toJSON(target) {
  try {
    return target ? JSON.stringify(target) : target;
  } catch (e) {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
self.onmessage = (message) => {
  const { context: ctx, log } = message.data || {};

  if (message.isTrusted !== true || !log) {
    return;
  }

  const messagePayload = encode(log);
  const contextPayload = ctx ? encode(toJSON(ctx)) : '';
  const destination = `${config.logging.url}?m=${messagePayload}&c=${contextPayload}`;

  inner('message received - "%s"', log);

  fetch(destination)
    .then(() => inner('successfully logged'))
    .catch((e) => inner('unable to log - "%s"', e));
};
