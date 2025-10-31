/**
 * Opens OAuth in a popup window and listens for the callback
 * @param url - The OAuth URL to open
 * @param onSuccess - Callback function when OAuth succeeds with tokens
 * @param onError - Callback function when OAuth fails
 */
export const openOAuthPopup = (
  url: string,
  onSuccess: (data: { access: string; refresh: string; user_id: string }) => void,
  onError: (error: string) => void
) => {
  const width = 600;
  const height = 700;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  const popup = window.open(
    url,
    'oauth_popup',
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
  );

  if (!popup) {
    onError('Popup blocked. Please allow popups for this site.');
    return;
  }

  // Poll to check if popup is closed
  const pollTimer = window.setInterval(() => {
    if (popup.closed) {
      window.clearInterval(pollTimer);
      window.removeEventListener('message', messageListener);
    }
  }, 500);

  // Listen for messages from the popup
  const messageListener = (event: MessageEvent) => {
    // Verify origin for security
    const allowedOrigins = [
      window.location.origin,
      import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
      'https://apnaghar-five.vercel.app',
      'https://apnaghar-2emb.onrender.com'
    ];

    if (!allowedOrigins.some(origin => event.origin === origin || event.origin.startsWith(origin))) {
      return;
    }

    if (event.data.type === 'oauth_success') {
      window.clearInterval(pollTimer);
      window.removeEventListener('message', messageListener);
      popup?.close();
      onSuccess(event.data);
    } else if (event.data.type === 'oauth_error') {
      window.clearInterval(pollTimer);
      window.removeEventListener('message', messageListener);
      popup?.close();
      onError(event.data.error || 'OAuth authentication failed');
    }
  };

  window.addEventListener('message', messageListener);
};
