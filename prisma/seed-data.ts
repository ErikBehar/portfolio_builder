export const SITE_SETTINGS_ID = "default";

export const DEFAULT_SITE_SETTINGS = {
  title: "Your Name's Portfolio",
  description: "A professional portfolio.",
  footerText: "",
  commentsEnabled: true,
  projectCommentsEnabled: true,
  homeHeaderColor: "#5b9fd4",
  siteTitleColor: "#e8edf5",
};

export const DEFAULT_HEADER_LINKS = [
  {
    label: "Email",
    url: "mailto:you@example.com",
    icon: "envelope",
    sortOrder: 0,
  },
  {
    label: "CV",
    url: "#",
    icon: "file",
    sortOrder: 1,
  },
];

export const DEFAULT_SECTIONS = [
  {
    slug: "code",
    title: "Code",
    description: "Code samples, repositories, and technical work.",
    categories: [],
    sortOrder: 0,
  },
  {
    slug: "video-games",
    title: "Video Games",
    description: "Professional releases, personal projects, and game jam work.",
    categories: [
      { slug: "professional", title: "Professional" },
      { slug: "personal", title: "Personal Projects" },
      { slug: "jam", title: "Game Jams" },
    ],
    sortOrder: 1,
  },
  {
    slug: "design",
    title: "Design",
    description: "Game design, level design, and app flow documentation.",
    categories: [],
    sortOrder: 2,
  },
  {
    slug: "writing",
    title: "Writing",
    description: "Scripts, screenplays, and writing samples.",
    categories: [],
    sortOrder: 3,
  },
  {
    slug: "animation",
    title: "Animation",
    description: "Animation work, shorts, and motion design.",
    categories: [],
    sortOrder: 4,
  },
];
