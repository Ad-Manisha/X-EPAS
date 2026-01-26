// Toast notification utility
export const showToast = (message, type = 'success') => {
  // Create toast element
  const toast = document.createElement('div');
  
  // Define colors based on type
  const colors = {
    success: 'bg-blue-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    warning: 'bg-yellow-500 text-yellow-900'
  };
  
  toast.className = `fixed top-4 right-4 ${colors[type]} px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full`;
  toast.textContent = message;
  
  // Add to DOM
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-x-full');
  }, 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('translate-x-full');
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
};

export const showSuccessToast = (message) => showToast(message, 'success');
export const showErrorToast = (message) => showToast(message, 'error');
export const showInfoToast = (message) => showToast(message, 'info');
export const showWarningToast = (message) => showToast(message, 'warning');