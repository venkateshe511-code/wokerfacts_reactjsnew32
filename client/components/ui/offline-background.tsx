import React, { useState, useEffect } from "react";

interface OfflineBackgroundProps {
  backgroundImage: string;
  fallbackColor?: string;
  className?: string;
  children?: React.ReactNode;
}

export const OfflineBackground: React.FC<OfflineBackgroundProps> = ({
  backgroundImage,
  fallbackColor = "bg-gradient-to-br from-slate-600 to-slate-800",
  className = "",
  children,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
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

  useEffect(() => {
    // Preload the image to check if it's available
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageError(true);
    img.src = backgroundImage;
  }, [backgroundImage]);

  // Use background image if loaded and online, otherwise use fallback
  const shouldUseBackground = imageLoaded && isOnline && !imageError;

  const style = shouldUseBackground
    ? { backgroundImage: `url('${backgroundImage}')` }
    : {};

  const combinedClassName = shouldUseBackground
    ? `${className} bg-cover bg-center`
    : `${className} ${fallbackColor}`;

  return (
    <div className={combinedClassName} style={style}>
      {children}
      {!isOnline && (
        <div className="absolute top-2 left-2 bg-yellow-500/80 text-white px-2 py-1 rounded text-xs">
          Offline Mode
        </div>
      )}
    </div>
  );
};
