declare const KRUMI_CONFIG: Configuration;

export type Configuration = {
  logging: {
    url: string;
    enabled?: boolean;
  };
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
