import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, Download, CheckCircle } from "lucide-react";

export const CacheStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheStatus, setCacheStatus] = useState<
    "checking" | "available" | "unavailable"
  >("checking");
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check if service worker and cache are available
    if ("serviceWorker" in navigator && "caches" in window) {
      caches.keys().then((cacheNames) => {
        setCacheStatus(cacheNames.length > 0 ? "available" : "unavailable");
      });
    } else {
      setCacheStatus("unavailable");
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showStatus && isOnline) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm ${showStatus ? "animate-in slide-in-from-right" : ""}`}
    >
      <div
        className={`rounded-lg p-3 shadow-lg border ${
          isOnline
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}
      >
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4" />
              <span className="text-sm font-medium">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-medium">Offline</span>
            </>
          )}

          {cacheStatus === "available" && (
            <div className="flex items-center space-x-1 ml-2">
              <CheckCircle className="h-3 w-3" />
              <span className="text-xs">Cached</span>
            </div>
          )}
        </div>

        {!isOnline && cacheStatus === "available" && (
          <p className="text-xs mt-1 opacity-75">
            Images and content cached for offline viewing
          </p>
        )}

        {!isOnline && cacheStatus === "unavailable" && (
          <p className="text-xs mt-1 opacity-75">
            Limited functionality - some images may not load
          </p>
        )}
      </div>
    </div>
  );
};
