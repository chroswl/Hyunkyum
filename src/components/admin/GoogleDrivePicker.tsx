import { useState, useEffect } from 'react';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface Props {
  onPick: (url: string) => void;
}

export const GoogleDrivePicker = ({ onPick }: Props) => {
  const [pickerApiLoaded, setPickerApiLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client:picker', () => {
        setPickerApiLoaded(true);
      });
    };
    document.body.appendChild(script);
  }, []);

  const openPicker = () => {
    if (!pickerApiLoaded || !window.gapi) return;

    const token = window.gapi.auth && window.gapi.auth.getToken ? window.gapi.auth.getToken()?.access_token : null;

    if (!token) {
        alert("Authentication required. Please log in with Google Drive first.");
        return;
    }

    const picker = new window.google.picker.PickerBuilder()
      .addView(window.google.picker.ViewId.DOCS)
      .setOAuthToken(token)
      .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const doc = data.docs[0];
          onPick(doc.url);
        }
      })
      .build();
    picker.setVisible(true);
  };

  return (
    <button
      onClick={openPicker}
      disabled={!pickerApiLoaded}
      className="text-xs bg-neutral-800 hover:bg-neutral-700 text-white px-2 py-1 rounded"
    >
      Google Drive
    </button>
  );
};
