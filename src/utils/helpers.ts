export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待开始',
    in_progress: '进行中',
    completed: '已完成',
    reviewing: '审核中',
    draft: '草稿',
    submitted: '已提交',
    reviewed: '已审核',
    rejected: '已退回',
    approved: '通过',
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-100 text-blue-600',
    completed: 'bg-green-100 text-green-600',
    reviewing: 'bg-yellow-100 text-yellow-600',
    draft: 'bg-gray-100 text-gray-600',
    submitted: 'bg-blue-100 text-blue-600',
    reviewed: 'bg-green-100 text-green-600',
    rejected: 'bg-red-100 text-red-600',
    approved: 'bg-green-100 text-green-600',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-600';
};

export const getRoleText = (role: string): string => {
  const roleMap: Record<string, string> = {
    admin: '管理员',
    annotator: '标注员',
    reviewer: '审核员',
  };
  return roleMap[role] || role;
};

export const getRoleColor = (role: string): string => {
  const colorMap: Record<string, string> = {
    admin: 'bg-red-100 text-red-600',
    annotator: 'bg-blue-100 text-blue-600',
    reviewer: 'bg-yellow-100 text-yellow-600',
  };
  return colorMap[role] || 'bg-gray-100 text-gray-600';
};

export const downloadJSON = (data: unknown, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadCSV = (data: unknown[], filename: string): void => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0] as Record<string, unknown>);
  const rows = data.map((item) => 
    headers.map((header) => {
      const value = (item as Record<string, unknown>)[header];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }).join(',')
  );
  
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
