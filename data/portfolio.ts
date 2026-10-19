/**
 * Single source of truth for the portfolio.
 *
 * The 3D network, the scroll journey and the content panels are all derived
 * from this file. To add a section: add a node (with a `content` block), give
 * it a `parent` or a `links` entry so it is connected, and put its id in
 * `journey`. Camera poses, edge traversal paths and panel timing are computed.
 */

export type Vec3 = [number, number, number];

export type NodeKind = "root" | "section" | "hub" | "leaf";

export interface LinkItem {
  label: string;
  href: string;
}

export type NodeContent =
  | {
      type: "education";
      institution: string;
      degree: string;
      period: string;
      location: string;
      focus: string[];
    }
  | {
      type: "experience";
      roles: {
        company: string;
        title: string;
        period: string;
        location: string;
        summary: string;
        stack: string[];
      }[];
    }
  | {
      type: "project";
      name: string;
      domain: string;
      summary: string;
      stack: string[];
      link: LinkItem;
    }
  | {
      type: "skills";
      groups: { name: string; items: string[] }[];
    }
  | {
      type: "certifications";
      items: { name: string; issuer: string; link: LinkItem }[];
    }
  | {
      type: "about";
      statement: string;
      traits: string[];
    }
  | {
      type: "contact";
      headline: string;
      email: string;
      location: string;
      links: LinkItem[];
    };

export interface PortfolioNode {
  id: string;
  /** Short label rendered in 3D next to the node and in the journey rail. */
  title: string;
  kind: NodeKind;
  position: Vec3;
  /** Visual radius in world units. Hierarchy comes from this. */
  size: number;
  /** Tree parent. Creates an edge. */
  parent?: string;
  /** Extra non-tree connections ("synapses"). Creates edges. */
  links?: string[];
  /** Which side of the node the content panel opens on (desktop). */
  panelSide?: "left" | "right";
  /** Optional camera hint: direction from the node towards the camera. */
  cameraDir?: Vec3;
  /** Optional camera distance multiplier. */
  cameraDistance?: number;
  content?: NodeContent;
}

export const profile = {
  name: "Saumil Jain",
  firstName: "Saumil",
  lastName: "Jain",
  roles: ["AI Engineer", "Machine Learning", "Agentic Systems"],
  location: "Ahmedabad, India",
  email: "saumiljain715@gmail.com",
  github: "https://github.com/jsaumil",
  linkedin: "https://www.linkedin.com/in/saumil-jain-b9b579252/",
  resume: "/Saumil-Jain-Resume.pdf",
  tagline:
    "I build voice agents, RAG systems and computer vision models, and ship them to production.",
};

export const nodes: PortfolioNode[] = [
  {
    id: "root",
    title: profile.name,
    kind: "root",
    position: [0, 3.1, -2.2],
    size: 1,
  },

  // Education
  {
    id: "education",
    title: "Education",
    kind: "section",
    position: [-5.4, 0.9, 1.4],
    size: 0.55,
    parent: "root",
    links: ["experience"],
    panelSide: "right",
    cameraDir: [-0.35, 0.18, 1],
    content: {
      type: "education",
      institution: "Silver Oak College of Technology",
      degree: "B.Tech in Computer Engineering",
      period: "2022 - 2026",
      location: "Ahmedabad, India",
      focus: ["Mathematics", "Machine Learning", "Data Science", "Systems"],
    },
  },

  // Experience
  {
    id: "experience",
    title: "Experience",
    kind: "section",
    position: [4.8, 1.5, -0.8],
    size: 0.62,
    parent: "root",
    links: ["projects"],
    panelSide: "left",
    cameraDir: [0.45, 0.12, 1],
    cameraDistance: 1.15,
    content: {
      type: "experience",
      roles: [
        {
          company: "Tusker AI",
          title: "AI Engineer Intern",
          period: "Dec 2025 - Apr 2026",
          location: "Ahmedabad",
          summary:
            "Built a voice-based AI calling agent that automates customer conversations and scheduling. Designed the conversational pipeline and shipped it with Docker.",
          stack: ["Voice AI", "LLM pipelines", "Docker"],
        },
        {
          company: "Shweta Technologies",
          title: "AI Engineer Intern",
          period: "Jul 2025 - Sep 2025",
          location: "Ahmedabad",
          summary:
            "Built AI calling agents for several business use cases and RAG chatbots for website integrations. Automated lead generation and scraping workflows.",
          stack: ["RAG", "Calling agents", "Playwright"],
        },
      ],
    },
  },
  {
    id: "exp-tusker",
    title: "Tusker AI",
    kind: "leaf",
    position: [6.9, 3.0, -2.4],
    size: 0.24,
    parent: "experience",
  },
  {
    id: "exp-shweta",
    title: "Shweta Technologies",
    kind: "leaf",
    position: [6.6, 0.0, 0.6],
    size: 0.22,
    parent: "experience",
  },

  // Projects
  {
    id: "projects",
    title: "Projects",
    kind: "hub",
    position: [1.4, -2.0, 1.6],
    size: 0.42,
    parent: "root",
  },
  {
    id: "proj-gunfire",
    title: "Gun Fire Posture",
    kind: "section",
    position: [-1.9, -3.6, 3.4],
    size: 0.42,
    parent: "projects",
    links: ["proj-textcad"],
    panelSide: "right",
    cameraDir: [-0.4, 0.25, 1],
    content: {
      type: "project",
      name: "Gun Fire Posture Assessment",
      domain: "Computer vision",
      summary:
        "A YOLO model that judges whether a shooter's firing posture is correct. Collected and annotated a custom dataset, applied augmentation, and runs real-time inference.",
      stack: ["YOLO", "Custom dataset", "Augmentation", "Real-time inference"],
      link: {
        label: "View on GitHub",
        href: "https://github.com/V-GEN-25/Gun_Position_Detection",
      },
    },
  },
  {
    id: "proj-textcad",
    title: "Text to CAD",
    kind: "section",
    position: [2.2, -4.8, 4.3],
    size: 0.42,
    parent: "projects",
    links: ["proj-sincnet"],
    panelSide: "left",
    cameraDir: [0.3, 0.3, 1],
    content: {
      type: "project",
      name: "Text to CAD",
      domain: "Generative 3D",
      summary:
        "A browser tool that turns natural-language prompts into 3D CAD models. A local LLM writes the model, it compiles in the browser through WebAssembly and renders with Three.js.",
      stack: ["Local LLM", "WebAssembly", "Three.js"],
      link: { label: "View on GitHub", href: "https://github.com/jsaumil/CAD" },
    },
  },
  {
    id: "proj-sincnet",
    title: "SincNet",
    kind: "section",
    position: [5.9, -3.1, 5.2],
    size: 0.4,
    parent: "projects",
    links: ["proj-diarization"],
    panelSide: "left",
    cameraDir: [0.55, 0.15, 1],
    content: {
      type: "project",
      name: "SincNet",
      domain: "Audio signal processing",
      summary:
        "Turns raw audio into meaningful features with classic signal processing, from waveform visualisation to pre-emphasis and framing. Built for speech and audio analysis experiments.",
      stack: ["Python", "DSP", "Speech features"],
      link: { label: "View on GitHub", href: "https://github.com/jsaumil/Sinc" },
    },
  },
  {
    id: "proj-diarization",
    title: "Speaker Diarization",
    kind: "section",
    position: [3.2, -6.4, 7.4],
    size: 0.44,
    parent: "projects",
    links: ["skills"],
    panelSide: "right",
    cameraDir: [-0.2, 0.35, 1],
    content: {
      type: "project",
      name: "Speaker Diarization",
      domain: "Speech AI",
      summary:
        "A web app that detects each speaker in a recording and produces speaker-wise transcripts, so meeting minutes and interviews no longer need manual cleanup.",
      stack: ["Whisper", "PyAnnote", "Streamlit", "Python"],
      link: {
        label: "View on GitHub",
        href: "https://github.com/jsaumil/speaker-diarization",
      },
    },
  },

  // Skills
  {
    id: "skills",
    title: "Skills",
    kind: "section",
    position: [-4.6, -3.2, -3.4],
    size: 0.6,
    parent: "root",
    links: ["certifications"],
    panelSide: "right",
    cameraDir: [-0.5, 0.1, 1],
    cameraDistance: 1.1,
    content: {
      type: "skills",
      groups: [
        {
          name: "AI and ML",
          items: [
            "LLMs",
            "RAG",
            "Agentic AI",
            "NLP",
            "Computer Vision",
            "Transformers",
            "Fine-tuning",
            "Neural Networks",
            "Prompt Engineering",
          ],
        },
        {
          name: "Frameworks",
          items: ["LangChain", "LangGraph", "FastAPI", "TensorFlow", "Streamlit"],
        },
        {
          name: "Tools",
          items: ["Docker", "MCP", "Ollama", "Hugging Face", "Playwright", "GitHub"],
        },
        { name: "Languages", items: ["Python", "Node.js", "MongoDB"] },
      ],
    },
  },

  // Certifications
  {
    id: "certifications",
    title: "Certifications",
    kind: "section",
    position: [-9.2, -2.4, -4.6],
    size: 0.42,
    parent: "skills",
    links: ["about"],
    panelSide: "right",
    cameraDir: [-0.2, 0.15, 1],
    content: {
      type: "certifications",
      items: [
        {
          name: "Machine Learning Internship",
          issuer: "Cognifyz Technologies",
          link: {
            label: "View certificate",
            href: "https://www.linkedin.com/in/saumil-jain-b9b579252/details/certifications/",
          },
        },
        {
          name: "Intro to Machine Learning",
          issuer: "Kaggle",
          link: {
            label: "View certificate",
            href: "https://www.kaggle.com/learn/certification/jainsaumil/intro-to-machine-learning",
          },
        },
      ],
    },
  },

  // About
  {
    id: "about",
    title: "About",
    kind: "section",
    position: [-3.6, 5.4, -6.4],
    size: 0.5,
    parent: "root",
    links: ["contact"],
    panelSide: "right",
    cameraDir: [-0.25, 0.05, 1],
    content: {
      type: "about",
      statement:
        "I work across data science, machine learning and agentic AI, with a strong base in mathematics and computer science. Lately that means MCP tool integrations, voice agents and retrieval systems that hold up outside a notebook.",
      traits: ["Leadership", "Teamwork", "Problem solving", "Public speaking", "Adaptability"],
    },
  },

  // Contact
  {
    id: "contact",
    title: "Contact",
    kind: "section",
    position: [3.8, 5.8, -6.8],
    size: 0.5,
    parent: "root",
    panelSide: "left",
    cameraDir: [0.3, 0.05, 1],
    content: {
      type: "contact",
      headline: "Open to AI engineering roles and collaborations.",
      email: profile.email,
      location: profile.location,
      links: [
        { label: "GitHub", href: profile.github },
        { label: "LinkedIn", href: profile.linkedin },
        { label: "Resume", href: profile.resume },
      ],
    },
  },
];

/**
 * The order the camera travels. The journey always starts with a wide shot of
 * the root and ends back at the root (the finale), so only list the stops in
 * between. Paths between stops are found through the graph automatically.
 */
export const journey: string[] = [
  "education",
  "experience",
  "proj-gunfire",
  "proj-textcad",
  "proj-sincnet",
  "proj-diarization",
  "skills",
  "certifications",
  "about",
  "contact",
];
