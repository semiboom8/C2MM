/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

import React from 'react';

interface ToastNotificationProps {
  message: string | null;
  show: boolean;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ message, show }) => {
  if (!show || !message) {
    return null;
  }

  return (
    <div className={`toast-notification ${show ? 'show' : ''}`} role="alert" aria-live="assertive">
      {message}
    </div>
  );
};

export default ToastNotification;
