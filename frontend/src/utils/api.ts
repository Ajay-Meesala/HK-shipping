const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Export helper to resolve media URLs like POD uploads correctly
export const resolveMediaUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  // Clean backticks or double-slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = API_BASE_URL.replace('/api', '');
  return `${base}${cleanPath}`;
};

export default API_BASE_URL;
