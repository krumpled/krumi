declare const KRUMI_CONFIG: Configuration;

export type Configuration = {
  session: {
    key: string;
  };
  krumnet: {
    url: string;
  };
};

export function loginUrl(): string {
  return `${KRUMI_CONFIG.krumnet.url}/auth/redirect`;
}

export default KRUMI_CONFIG;
