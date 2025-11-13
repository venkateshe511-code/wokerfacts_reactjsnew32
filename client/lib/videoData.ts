export interface VideoInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  youtubeUrl: string;
  duration?: string;
}

export const VIDEOS: Record<string, VideoInfo> = {
  fce_software_tour: {
    id: "rouB2-VuomQ",
    title: "FCE Software Tour",
    description:
      "Comprehensive walkthrough of the Functional Capacity Evaluation (FCE) software platform. Learn how to navigate the system, input client data, perform various strength and range of motion tests, and generate professional reports automatically. Perfect for new users or clinics looking to understand the full capabilities of our platform.",
    thumbnail: "/video-thumbnails/fce-software-tour.jpg",
    youtubeUrl: "https://youtu.be/rouB2-VuomQ",
    duration: "12:45",
  },
  website_report_overview: {
    id: "9PK8uhjpn9A",
    title: "Website & Report Overview",
    description:
      "Detailed overview of the WorkerFacts website and the comprehensive reporting features. Discover how our platform helps clinics deliver professional, research-based evaluations that impress employers, case managers, and payors. See real examples of generated reports and understand what makes our solution stand out from the competition.",
    thumbnail: "/video-thumbnails/website-overview.jpg",
    youtubeUrl: "https://youtu.be/9PK8uhjpn9A",
    duration: "8:30",
  },
};
