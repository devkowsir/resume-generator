// @ts-ignore
type JSONCompatible =
  | Record<any, any>
  | Array<any>
  | string
  | number
  | boolean
  | null;

/**
 * This helper only helps sending JSON data.
 */
export const fetchHelper = {
  get: async (url: string, init: RequestInit = {}) => {
    const response = await fetch(url, { method: 'GET', ...init });
    await response.json();
    return response;
  },
  /**
   * This helper only helps sending JSON data.
   */
  post: async (url: string, body: JSONCompatible, init: RequestInit = {}) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
      body: JSON.stringify(body),
      ...init,
    });
    await response.json();
    return response;
  },
  /**
   * This helper only helps sending JSON data.
   */
  put: async (url: string, body: JSONCompatible, init: RequestInit = {}) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
      body: JSON.stringify(body),
      ...init,
    });
    await response.json();
    return response;
  },
  /**
   * This helper only helps sending JSON data.
   */
  patch: async (url: string, body: JSONCompatible, init: RequestInit = {}) => {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
      body: JSON.stringify(body),
      ...init,
    });
    await response.json();
    return response;
  },
  delete: async (url: string, init: RequestInit = {}) => {
    const response = await fetch(url, { method: 'DELETE', ...init });
    await response.json();
    return response;
  },
};
