import axios from 'axios';

const API_BASE = '/api';

// In-memory access token storage (never kept in localStorage/sessionStorage)
let inMemoryAccessToken = null;
let authStateListeners = [];

export function getAccessToken() {
  return inMemoryAccessToken;
}

export function setAccessToken(token) {
  inMemoryAccessToken = token;
  notifyAuthChange(token);
}

export function clearAccessToken() {
  inMemoryAccessToken = null;
  notifyAuthChange(null);
}

export function subscribeAuthChange(listener) {
  authStateListeners.push(listener);
  return () => {
    authStateListeners = authStateListeners.filter((l) => l !== listener);
  };
}

function notifyAuthChange(token) {
  authStateListeners.forEach((listener) => {
    try {
      listener(token);
    } catch (e) {
      console.error('Auth listener error:', e);
    }
  });
}

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  withCredentials: true, // Passes httpOnly cookies for /api/auth/token/refresh/
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Injects in-memory Bearer token
apiClient.interceptors.request.use(
  (config) => {
    if (inMemoryAccessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: 401 Refresh Handling with queueing
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // If 401 Unauthorized and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Do not attempt refresh on auth endpoints
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/token/refresh')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axios.post(
          `${API_BASE}/auth/token/refresh/`,
          {},
          { withCredentials: true }
        );
        const newAccess = refreshRes.data.access;
        setAccessToken(newAccess);
        processQueue(null, newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearAccessToken();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Helper to download a binary file (PDF) from an endpoint with auth header
 */
export async function downloadBlob(url, filename = 'document.pdf') {
  try {
    const headers = {};
    if (inMemoryAccessToken) {
      headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    const response = await axios.get(url, {
      responseType: 'blob',
      withCredentials: true,
      headers,
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
    return true;
  } catch (error) {
    console.error(`Download failed from ${url}:`, error);
    throw error;
  }
}

// ----------------------------------------------------
// AUTHENTICATION API SERVICES
// ----------------------------------------------------
export const AuthAPI = {
  async login(username, password) {
    const res = await apiClient.post('/auth/login/', { username, password });
    if (res.data?.access) {
      setAccessToken(res.data.access);
    }
    return res.data;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout/');
    } finally {
      clearAccessToken();
    }
  },

  async getCurrentUser() {
    const res = await apiClient.get('/auth/me/');
    return res.data;
  },

  async refreshToken() {
    const res = await axios.post(`${API_BASE}/auth/token/refresh/`, {}, { withCredentials: true });
    if (res.data?.access) {
      setAccessToken(res.data.access);
    }
    return res.data;
  },
};

// ----------------------------------------------------
// STATUTORY CASE & DASHBOARD PRODUCTION APIS (Part 14 Step 6 & 7)
// ----------------------------------------------------
export const DashboardAPI = {
  async getSummary() {
    const res = await apiClient.get('/dashboard/summary/');
    return res.data;
  },
};

export const CaseAPI = {
  async getCases(params = {}) {
    const res = await apiClient.get('/cases/', { params });
    return res.data;
  },

  async getCaseDetail(caseId) {
    const res = await apiClient.get(`/cases/${caseId}/`);
    return res.data;
  },

  async executeTransition(caseId, { target_state, expected_version, reason = '', action = null, metadata = {} }, idempotencyKey = null) {
    const headers = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const res = await apiClient.post(`/cases/${caseId}/transitions/`, {
      target_state,
      expected_version,
      reason,
      action,
      metadata,
    }, { headers });
    return res.data;
  },

  async downloadSection7Notice(caseId, surveyNo = 'Survey') {
    return downloadBlob(
      `${API_BASE}/cases/${caseId}/documents/section-7/`,
      `Section7_ShowCause_Case_${caseId}_Survey_${String(surveyNo).replace(/\//g, '_')}.pdf`
    );
  },

  async downloadSection6Warrant(caseId, surveyNo = 'Survey') {
    return downloadBlob(
      `${API_BASE}/cases/${caseId}/documents/section-6/`,
      `Section6_EvictionWarrant_Case_${caseId}_Survey_${String(surveyNo).replace(/\//g, '_')}.pdf`
    );
  },

  async downloadCaseATR(caseId, writNo = 'W.P. 18251/2023') {
    return downloadBlob(
      `${API_BASE}/cases/${caseId}/documents/atr/?writ_number=${encodeURIComponent(writNo)}`,
      `HighCourt_ATR_Case_${caseId}.pdf`
    );
  },
};

export const SyncAPI = {
  async getChanges(sinceCursor = null, limit = 50) {
    const params = { limit };
    if (sinceCursor) params.since = sinceCursor;
    const res = await apiClient.get('/sync/changes/', { params });
    return res.data;
  },
};

// ----------------------------------------------------
// LEGACY BACKEND API SERVICES (For existing components)
// ----------------------------------------------------
export const LandAPI = {
  // 1. ALERTS
  async getAlerts(params = {}) {
    const res = await apiClient.get('/alerts/', { params });
    return res.data;
  },

  async getAlertDetail(alertId) {
    const res = await apiClient.get(`/alerts/${alertId}/`);
    return res.data;
  },

  async patchAlert(alertId, data) {
    const res = await apiClient.patch(`/alerts/${alertId}/`, data);
    return res.data;
  },

  async issueSection7(alertId, data = {}) {
    const res = await apiClient.post(`/alerts/${alertId}/issue_section_7/`, data);
    return res.data;
  },

  async issueSection6(alertId) {
    const res = await apiClient.post(`/alerts/${alertId}/issue_section_6/`);
    return res.data;
  },

  async lockStar3(alertId) {
    const res = await apiClient.post(`/alerts/${alertId}/star3_lock/`);
    return res.data;
  },

  async humanitarianRehab(alertId, data = {}) {
    const res = await apiClient.post(`/alerts/${alertId}/humanitarian_rehabilitation/`, data);
    return res.data;
  },

  async markFalsePositive(alertId) {
    const res = await apiClient.post(`/alerts/${alertId}/mark_false_positive/`);
    return res.data;
  },

  async getFMBSketch(alertId) {
    const res = await apiClient.get(`/alerts/${alertId}/fmb_sketch/`);
    return res.data;
  },

  async downloadSection7Notice(alertId, surveyNo = 'Survey') {
    return downloadBlob(
      `${API_BASE}/alerts/${alertId}/download_section_7/`,
      `Section7_Notice_Alert_${alertId}_Survey_${String(surveyNo).replace(/\//g, '_')}.pdf`
    );
  },

  // 2. PARCELS
  async getParcels() {
    const res = await apiClient.get('/parcels/');
    return res.data;
  },

  async getPresetParcels() {
    const res = await apiClient.get('/parcels/presets/');
    return res.data;
  },

  // 3. HIGH COURT COMPLIANCE
  async downloadHighCourtATR(district, writNo) {
    if (!district || !district.trim()) {
      throw new Error('District selection is required to generate Court ATR.');
    }
    if (!writNo || !writNo.trim()) {
      throw new Error('Writ Petition Number is required with no default.');
    }
    return downloadBlob(
      `${API_BASE}/compliance/high-court-atr/?district=${encodeURIComponent(district.trim())}&writ_no=${encodeURIComponent(writNo.trim())}`,
      `HighCourt_Compliance_ATR_${district.trim()}_${writNo.trim().replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
    );
  },

  // 4. VERIFICATIONS (VAO FIELD RECON)
  async submitVerification(formData) {
    const res = await apiClient.post('/verifications/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export default LandAPI;
