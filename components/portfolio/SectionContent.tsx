import type { NodeContent } from "@/data/portfolio";
import { About } from "./About";
import { Certifications } from "./Certifications";
import { Contact } from "./Contact";
import { Education } from "./Education";
import { Experience } from "./Experience";
import { Project } from "./Projects";
import { Skills } from "./Skills";

/** Maps a node's content block to its panel. Add a case to add a content type. */
export function SectionContent({ content }: { content: NodeContent }) {
  switch (content.type) {
    case "education":
      return <Education {...content} />;
    case "experience":
      return <Experience {...content} />;
    case "project":
      return <Project {...content} />;
    case "skills":
      return <Skills {...content} />;
    case "certifications":
      return <Certifications {...content} />;
    case "about":
      return <About {...content} />;
    case "contact":
      return <Contact {...content} />;
  }
}
