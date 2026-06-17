export interface Project {
  id: string;
  title: string;
  tags: string[];
  role: string;
  summary: string;
  description: string;
  screenshot: string;
  links: { github?: string; demo?: string };
  status: "completed" | "wip";
}

export interface PersonalInfo {
  name: string;
  brandTags: string[];
  tagline: string;
  university: string;
  graduation: string;
  direction: string;
  bio: string;
  contact: {
    wechat: string;
    email: string;
    github: string;
  };
}
