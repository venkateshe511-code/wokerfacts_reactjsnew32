import React from "react";
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
  if (!video) return null;

  const handleWatchClick = () => {
    window.open(video.youtubeUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
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

        <div className="space-y-6">
          {/* Video Thumbnail */}
          <div className="relative overflow-hidden rounded-lg bg-black aspect-video flex items-center justify-center group">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
              <div className="bg-red-600 rounded-full p-4 group-hover:scale-110 transition-transform">
                <Play className="h-8 w-8 text-white fill-white" />
              </div>
            </div>
            {video.duration && (
              <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs font-semibold">
                {video.duration}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              About this video
            </h3>
            <p className="text-gray-700 leading-relaxed text-base">
              {video.description}
            </p>
          </div>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              onClick={handleWatchClick}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 h-auto flex items-center justify-center gap-2 group"
            >
              <Play className="h-5 w-5 group-hover:animate-pulse" />
              <span>Watch on YouTube</span>
              <ExternalLink className="h-4 w-4 ml-auto" />
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 font-semibold py-2 h-auto"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
