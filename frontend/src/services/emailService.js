const BASE = '/api';

export const sendEmails = async (data, onProgress) => {
  const response = await fetch(`${BASE}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message || `HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n');
    buffer = parts.pop() || '';

    for (const line of parts) {
      if (line.startsWith('data: ')) {
        try {
          const event = JSON.parse(line.slice(6));
          onProgress?.(event);
        } catch {}
      }
    }
  }
};

export const testSmtp = (data) =>
  fetch(`${BASE}/test-smtp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((r) => {
    if (!r.ok) throw r;
    return r.json();
  });

export const pauseSending = () =>
  fetch(`${BASE}/pause`, { method: 'POST' }).then((r) => {
    if (!r.ok) throw r;
    return r.json();
  });

export const resumeSending = () =>
  fetch(`${BASE}/resume`, { method: 'POST' }).then((r) => {
    if (!r.ok) throw r;
    return r.json();
  });

export const cancelSending = () =>
  fetch(`${BASE}/cancel`, { method: 'POST' }).then((r) => {
    if (!r.ok) throw r;
    return r.json();
  });

export const uploadCsvFile = (file) => {
  const formData = new FormData();
  formData.append('csvFile', file);
  return fetch(`${BASE}/upload-csv`, {
    method: 'POST',
    body: formData,
  }).then((r) => {
    if (!r.ok) return r.json().then((e) => Promise.reject(new Error(e.message || 'CSV upload failed')));
    return r.json();
  });
};
