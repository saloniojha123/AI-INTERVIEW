export const INTERVIEW_PANELS = [
  {
    id: "technical",
    shortName: "TL",
    name: "Technical Lead",
    role: "Architecture & Systems",
    focus: [
      "problem solving",
      "coding depth",
      "system design",
      "debugging",
      "technical trade-offs",
    ],
  },
  {
    id: "hiring_manager",
    shortName: "HM",
    name: "Hiring Manager",
    role: "Leadership & Strategy",
    focus: [
      "ownership",
      "leadership",
      "motivation",
      "decision making",
      "impact",
    ],
  },
  {
    id: "product",
    shortName: "PL",
    name: "Product Lead",
    role: "Product Thinking & Roadmaps",
    focus: [
      "prioritization",
      "user needs",
      "metrics",
      "roadmaps",
      "product trade-offs",
    ],
  },
  {
    id: "behavioral",
    shortName: "BL",
    name: "Behavioural Lead",
    role: "Culture & Team Fit",
    focus: [
      "communication",
      "collaboration",
      "conflict resolution",
      "resilience",
      "adaptability",
    ],
  },
  {
    id: "customer",
    shortName: "CA",
    name: "Customer Advocate",
    role: "User Empathy & Impact",
    focus: [
      "customer empathy",
      "stakeholder communication",
      "complaint handling",
      "customer impact",
      "user outcomes",
    ],
  },
];

export const DEFAULT_PANEL_ID = "technical";

export function getPanelPrompt() {
  return INTERVIEW_PANELS.map(
    (panel, index) =>
      `${index + 1}. ${panel.name} (${panel.role}) — focus on ${panel.focus.join(
        ", "
      )}.`
  ).join("\n");
}
