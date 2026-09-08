const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const api = {
  get: async <T = any>(path: string): Promise<T> => {
    const res = await fetch(`${API_URL}/api${path}`, {
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Request failed: ${res.status}`);
    }
    return res.json();
  },

  post: async <T = any>(path: string, body?: any): Promise<T> => {
    const isFormData = body instanceof FormData;
    const res = await fetch(`${API_URL}/api${path}`, {
      method: "POST",
      headers: isFormData ? undefined : { "Content-Type": "application/json" },
      credentials: "include",
      body: isFormData ? body : JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Request failed: ${res.status}`);
    }
    return res.json();
  },

  put: async <T = any>(path: string, body?: any): Promise<T> => {
    const isFormData = body instanceof FormData;
    const res = await fetch(`${API_URL}/api${path}`, {
      method: "PUT",
      headers: isFormData ? undefined : { "Content-Type": "application/json" },
      credentials: "include",
      body: isFormData ? body : JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Request failed: ${res.status}`);
    }
    return res.json();
  },

  patch: async <T = any>(path: string, body?: any): Promise<T> => {
    const res = await fetch(`${API_URL}/api${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Request failed: ${res.status}`);
    }
    return res.json();
  },

  del: async <T = any>(path: string): Promise<T> => {
    const res = await fetch(`${API_URL}/api${path}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Request failed: ${res.status}`);
    }
    return res.json();
  },

  upload: async <T = any>(path: string, formData: FormData): Promise<T> => {
    const res = await fetch(`${API_URL}/api${path}`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Request failed: ${res.status}`);
    }
    return res.json();
  },
};
