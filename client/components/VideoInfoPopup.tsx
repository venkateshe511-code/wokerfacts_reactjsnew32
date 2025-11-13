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
  if (!video) return null;

  const handleWatchClick = () => {
    window.open(video.youtubeUrl, "_blank", "noopener,noreferrer");
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
          <Button
            onClick={handleWatchClick}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 h-auto flex items-center justify-center gap-2 group"
          >
            <ExternalLink className="h-5 w-5" />
            <span>Open on YouTube</span>
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 font-semibold py-2 h-auto"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
