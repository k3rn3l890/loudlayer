const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";

async function request<T = any>(
  method: string,
  path: string,
  body?: any,
  formData?: boolean
): Promise<T> {
  const headers: Record<string, string> = {};
  if (!formData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: "include",
    body: formData ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  get: <T = any>(path: string) => request<T>("GET", path),
  post: <T = any>(path: string, body?: any) => request<T>("POST", path, body),
  put: <T = any>(path: string, body?: any) => request<T>("PUT", path, body),
  patch: <T = any>(path: string, body?: any) => request<T>("PATCH", path, body),
  del: <T = any>(path: string) => request<T>("DELETE", path),
  upload: <T = any>(path: string, formData: FormData) => request<T>("POST", path, formData, true),
};
