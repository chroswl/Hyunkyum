import { useState, useEffect } from 'react';
import { getGoogleAccessToken, loginWithGoogle } from '../../firebase';

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

  const openPicker = async () => {
    if (!pickerApiLoaded || !window.gapi) return;

    let token = getGoogleAccessToken();

    if (!token) {
        try {
            await loginWithGoogle();
            token = getGoogleAccessToken();
        } catch (e) {
            alert("Authentication required. Please log in with Google Drive.");
            return;
        }
    }

    if (!token) {
        alert("Authentication failed.");
        return;
    }

    try {
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
    } catch (e) {
        console.error("Picker error:", e);
        alert("Failed to open picker. Please check console for details.");
    }
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
