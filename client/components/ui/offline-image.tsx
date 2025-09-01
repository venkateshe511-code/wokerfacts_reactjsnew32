import React, { useState, useEffect, ImgHTMLAttributes } from "react";
import { Wifi, WifiOff } from "lucide-react";

interface OfflineImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "onError" | "onLoad"> {
  src: string;
  alt: string;
  fallbackText?: string;
  className?: string;
}

export const OfflineImage: React.FC<OfflineImageProps> = ({
  src,
  alt,
  fallbackText,
  className = "",
  ...props
}) => {
  const [imageState, setImageState] = useState<"loading" | "loaded" | "error">(
    "loading",
  );
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleImageLoad = () => {
    setImageState("loaded");
  };

  const handleImageError = () => {
    setImageState("error");
  };

  // Reset image state when src changes
  useEffect(() => {
    setImageState("loading");
  }, [src]);

  // If image failed to load or we're offline, show fallback
  if (imageState === "error" || (!isOnline && imageState !== "loaded")) {
    return (
      <div
        className={`offline-image-placeholder ${className}`}
        style={{ minHeight: "100px", minWidth: "100px" }}
        role="img"
        aria-label={alt}
      >
        <div className="flex flex-col items-center justify-center p-4 text-center">
          {isOnline ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-400 rounded" />
              <span className="text-xs">Image unavailable</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <WifiOff className="w-4 h-4" />
              <span className="text-xs">{fallbackText || "Offline"}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {imageState === "loading" && (
        <div
          className={`image-loading absolute inset-0 ${className}`}
          style={{ minHeight: "100px", minWidth: "100px" }}
        />
      )}
      <img
        {...props}
        src={src}
        alt={alt}
        className={`${className} ${imageState === "loading" ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
};

// Hook for checking online status
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
};

// Offline indicator component
export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="offline-indicator">
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="w-4 h-4" />
        <span>You are currently offline. Some features may be limited.</span>
      </div>
    </div>
  );
};
