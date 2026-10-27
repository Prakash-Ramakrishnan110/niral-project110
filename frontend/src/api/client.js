import axios from 'axios';

const API_BASE = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Helper to download a binary file (PDF) from an endpoint
 */
export async function downloadBlob(url, filename = 'document.pdf') {
  try {
    const response = await axios.get(url, { responseType: 'blob' });
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
// REAL BACKEND API SERVICES
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
      `Section7_Notice_Alert_${alertId}_Survey_${surveyNo.replace(/\//g, '_')}.pdf`
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
