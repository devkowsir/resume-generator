// @ts-ignore
type JSONCompatible = Record<any, any> | Array<any> | string | number | boolean | null;

/**
 * This helper only helps sending JSON data.
 */
export const fetchHelper = {
  get: async <T = any>(url: string, init: RequestInit = {}) => {
    const response = await fetch(url, { method: 'GET', ...init });
    return { response, data: (await response.json()) as T };
  },
  /**
   * This helper only helps sending JSON data.
   */
  post: async <T = any>(url: string, body: JSONCompatible, init: RequestInit = {}) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
      body: JSON.stringify(body),
      ...init,
    });
    return { response, data: (await response.json()) as T };
  },
  /**
   * This helper only helps sending JSON data.
   */
  put: async <T = any>(url: string, body: JSONCompatible, init: RequestInit = {}) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
      body: JSON.stringify(body),
      ...init,
    });
    return { response, data: (await response.json()) as T };
  },
  /**
   * This helper only helps sending JSON data.
   */
  patch: async <T = any>(url: string, body: JSONCompatible, init: RequestInit = {}) => {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
      body: JSON.stringify(body),
      ...init,
    });
    return { response, data: (await response.json()) as T };
  },
  delete: async <T = any>(url: string, init: RequestInit = {}) => {
    const response = await fetch(url, { method: 'DELETE', ...init });
    return { response, data: (await response.json()) as T };
  },
};
