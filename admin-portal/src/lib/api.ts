import type { AdminSession } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type ApiOptions = RequestInit & {
  token?: string;
};

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (options.token) {
    headers.set("authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message ?? "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  loginAdmin(email: string, password: string) {
    return request<AdminSession>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },
  getAdminCourses(token: string) {
    return request<{ courses: unknown[] }>("/api/admin/courses", { token });
  },
  createCourse(token: string, payload: unknown) {
    return request<{ course: unknown }>("/api/admin/courses", {
      method: "POST",
      token,
      body: JSON.stringify(payload)
    });
  },
  patch<T = unknown>(token: string, path: string, payload: unknown) {
    return request<T>(path, { method: "PATCH", token, body: JSON.stringify(payload) });
  },
  delete<T = unknown>(token: string, path: string) {
    return request<T>(path, { method: "DELETE", token });
  },
  post<T = unknown>(token: string, path: string, payload?: unknown) {
    return request<T>(path, {
      method: "POST",
      token,
      body: payload ? JSON.stringify(payload) : undefined
    });
  },
  upload(token: string, path: string, field: string, file: File) {
    const form = new FormData();
    form.append(field, file);
    return request<{ url: string; key: string }>(path, {
      method: "POST",
      token,
      body: form
    });
  },
  get<T>(token: string, path: string) {
    return request<T>(path, { token });
  }
};
