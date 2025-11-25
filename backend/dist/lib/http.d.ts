import { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios";
export declare function createHttpClient(config?: AxiosRequestConfig): AxiosInstance;
export declare function postForm<TResponse>(client: AxiosInstance, url: string, form: Record<string, string>, config?: AxiosRequestConfig): Promise<AxiosResponse<TResponse>>;
export declare const spotifyAuthHttp: AxiosInstance;
//# sourceMappingURL=http.d.ts.map