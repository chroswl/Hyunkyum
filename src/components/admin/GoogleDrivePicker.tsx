import { useState, useEffect } from 'react';
import { getGoogleAccessToken, loginWithGoogle } from '../../firebase';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface Props {
  onPick: (url: string, metadata?: any) => void;
}

export const GoogleDrivePicker = ({ onPick }: Props) => {
  const [pickerApiLoaded, setPickerApiLoaded] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    // Check environment variables in development
    if (import.meta.env.DEV) {
      if (!import.meta.env.VITE_GOOGLE_API_KEY) console.warn("Missing VITE_GOOGLE_API_KEY");
      if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) console.warn("Missing VITE_GOOGLE_CLIENT_ID");
      if (!import.meta.env.VITE_GOOGLE_PROJECT_NUMBER) console.warn("Missing VITE_GOOGLE_PROJECT_NUMBER");
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.gapi.load('client:picker', () => {
        setPickerApiLoaded(true);
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const validateToken = async (token: string) => {
    try {
      const res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);
      if (!res.ok) return false;
      const data = await res.json();
      return Number(data.expires_in) > 0;
    } catch {
      return false;
    }
  };

  const openPicker = async () => {
    if (!pickerApiLoaded || !window.google?.picker) {
      alert("Google Picker API is still loading. Please try again in a moment.");
      return;
    }

    setIsOpening(true);

    try {
      let token = getGoogleAccessToken();
      let isValid = token ? await validateToken(token) : false;

      if (!isValid) {
        console.log("Token expired or missing, requesting fresh token...");
        try {
          await loginWithGoogle();
          token = getGoogleAccessToken();
          isValid = token ? await validateToken(token) : false;
        } catch (e: any) {
          console.error("Auth error:", e);
          alert(`Authentication required: ${e.message || 'Please log in with Google Drive.'}`);
          setIsOpening(false);
          return;
        }
      }

      if (!isValid || !token) {
        alert("Failed to obtain a valid Google Drive access token.");
        setIsOpening(false);
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      if (!apiKey) {
        alert("Google API Key is not configured.");
        setIsOpening(false);
        return;
      }
      
      const appId = import.meta.env.VITE_GOOGLE_PROJECT_NUMBER;

      const view = new window.google.picker.DocsView()
        .setIncludeFolders(true)
        .setSelectFolderEnabled(false);

      const pickerBuilder = new window.google.picker.PickerBuilder()
        .addView(view)
        .addView(window.google.picker.ViewId.FOLDERS)
        .setOAuthToken(token)
        .setDeveloperKey(apiKey)
        .setCallback((data: any) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const doc = data.docs[0];
            console.log("Selected file metadata:", doc);
            // Construct a stable direct view URL instead of relying on the default preview URL
            const directUrl = `https://lh3.googleusercontent.com/d/${doc.id}`;
            onPick(directUrl, {
              id: doc.id,
              mimeType: doc.mimeType,
              name: doc.name,
              thumbnailUrl: doc.thumbnails?.[0]?.url || doc.iconUrl,
              url: directUrl
            });
          }
        });
        
      if (appId) {
          pickerBuilder.setAppId(appId);
      }

      const picker = pickerBuilder.build();
      picker.setVisible(true);

    } catch (e: any) {
      console.error("Picker initialization error:", e);
      alert(`Failed to open Google Picker: ${e.message}`);
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <button
      onClick={openPicker}
      disabled={!pickerApiLoaded || isOpening}
      className={`text-xs bg-[var(--color-bg)] border border-[var(--color-text)] text-[var(--color-text)] px-2 py-1 rounded transition-colors ${
        (!pickerApiLoaded || isOpening) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--color-bg)]/80'
      }`}
    >
      {isOpening ? 'Loading...' : 'Google Drive'}
    </button>
  );
};
