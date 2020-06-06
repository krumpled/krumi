import config from '@krumpled/krumi/config';
import debug from 'debug';

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import Worker from '@krumpled/krumi/logging.worker';

const context: Record<string, string> = {};

const inner = debug('krumi:logging');
const enabled = config.logging.enabled === true;

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
const worker = enabled ? new Worker() : null;

type Logger = (fmt: string, ...args: Array<unknown>) => void;

inner('preparing event logger - destination: "%s"', config.logging.url);

export function setContextValue(key: string, value: string): void {
  context[key] = value;
}

export default function logger(name: string): Logger {
  inner('creating "%s" logger', name);
  const sender = debug(name);

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  sender.useColors = false;

  if (!worker) {
    inner('logging not enabled, skipping w/o worker');
    return sender;
  }

  sender.log = (log): void => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    worker.postMessage({ log, context });
  };

  return sender;
}
