import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VideoInfo } from "@/lib/videoData";
import { Play, ArrowLeft, ExternalLink } from "lucide-react";

interface VideoInfoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  video: VideoInfo | null;
}

export function VideoInfoPopup({
  isOpen,
  onClose,
  video,
}: VideoInfoPopupProps) {
  const [imageError, setImageError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  if (!video) return null;

  const handlePlayClick = () => {
    setIsPlaying(true);
  };

  const handleWatchClick = () => {
    window.open(video.youtubeUrl, "_blank", "noopener,noreferrer");
  };

  // Placeholder gradient colors based on video
  const getPlaceholderGradient = () => {
    if (video.id === "rouB2-VuomQ") {
      return "from-blue-600 to-blue-800";
    }
    return "from-indigo-600 to-purple-800";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center text-2xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="mr-3 p-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            {video.title}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-0 py-4">
          <div className="space-y-6 px-6">
            {/* Video Player */}
            {isPlaying ? (
              <div className="relative overflow-hidden rounded-lg aspect-video bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0"
                />
              </div>
            ) : (
              <div
                className={`relative overflow-hidden rounded-lg aspect-video flex items-center justify-center group bg-gradient-to-br cursor-pointer ${getPlaceholderGradient()}`}
                onClick={handlePlayClick}
              >
                {!imageError && (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    onError={() => setImageError(true)}
                  />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
                  <div className="bg-red-600 rounded-full p-4 group-hover:scale-110 transition-transform mb-3">
                    <Play className="h-8 w-8 text-white fill-white" />
                  </div>
                  <p className="text-white text-sm font-semibold text-center px-4">
                    {video.title}
                  </p>
                </div>
                {video.duration && (
                  <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs font-semibold">
                    {video.duration}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">
                About this video
              </h3>
              <p className="text-gray-700 leading-relaxed text-base">
                {video.description}
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 px-6 border-t flex-shrink-0">
          {isPlaying ? (
            <>
              <Button
                onClick={() => setIsPlaying(false)}
                variant="outline"
                className="flex-1 font-semibold py-2 h-auto"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Preview
              </Button>
              <Button
                onClick={handleWatchClick}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 h-auto flex items-center justify-center gap-2 group"
              >
                <ExternalLink className="h-5 w-5" />
                <span>Open on YouTube</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handlePlayClick}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 h-auto flex items-center justify-center gap-2 group"
              >
                <Play className="h-5 w-5 group-hover:animate-pulse" />
                <span>Play Video</span>
              </Button>
              <Button
                onClick={handleWatchClick}
                variant="outline"
                className="flex-1 font-semibold py-2 h-auto flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span>YouTube</span>
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 font-semibold py-2 h-auto"
              >
                Close
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
