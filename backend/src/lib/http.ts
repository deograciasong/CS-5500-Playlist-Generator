import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";

const DEFAULT_TIMEOUT = 10_000;

const BASE_CONFIG: AxiosRequestConfig = {
  timeout: DEFAULT_TIMEOUT,
  validateStatus: (status: number) => status >= 200 && status < 500,
};

export function createHttpClient(
  config: AxiosRequestConfig = {},
): AxiosInstance {
  return axios.create({
    ...BASE_CONFIG,
    ...config,
    headers: {
      ...(BASE_CONFIG.headers ?? {}),
      ...(config.headers ?? {}),
    },
  });
}

export function postForm<TResponse>(
  client: AxiosInstance,
  url: string,
  form: Record<string, string>,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<TResponse>> {
  const body = new URLSearchParams(form).toString();

  return client.post<TResponse>(url, body, {
    ...config,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(config?.headers ?? {}),
    },
  });
}

export const spotifyAuthHttp = createHttpClient({
  baseURL: "https://accounts.spotify.com",
});
