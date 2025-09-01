import React from "react";

export const AxzoraBranding = () => {
  return (
    <div className="fixed bottom-2 right-2 z-40 opacity-60 hover:opacity-100 transition-opacity duration-300">
      <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
        <p className="text-xs text-gray-500 flex items-center gap-1">
          Powered by
          <span className="font-semibold text-gray-700">Axzora® IT</span>
        </p>
      </div>
    </div>
  );
};
