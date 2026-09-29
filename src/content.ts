export const site = {
  name: "Anza Works",
  origin: "https://anzaworks.lk",
  email: "hello@anzaworks.lk",
  social: { GitHub: null, Instagram: null, LinkedIn: null, WhatsApp: null } as Record<string, string | null>,
  description: "Anza Works designs and builds distinctive websites, software and digital systems for ambitious businesses."
} as const;

export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  industry: string;
  client: string | null;
  year: number | null;
  description: string;
  challenge: string;
  solution: string;
  design: string;
  features: string[];
  technologies: string[];
  services: string[];
  result: string;
  theme: string;
  cover: string | null;
  gallery: string[];
  video: { mp4?: string; webm?: string; poster?: string } | null;
  liveUrl: string | null;
  githubUrl: string | null;
  featured: boolean;
  status: "concept" | "client";
};

export const projects: Project[] = [
  {
    slug: "northline-stay", title: "Northline Stay", subtitle: "A quieter way to discover a place.",
    category: "Hospitality", industry: "Hotel website", client: null, year: null,
    description: "A hospitality website concept built around rooms, atmosphere and a direct path to enquiry.",
    challenge: "Help guests compare stays while making the property's character felt.",
    solution: "Lead with place, give rooms room to breathe and keep booking intent close to every decision.",
    design: "Editorial type, spacious imagery and a calm navigation system let the property speak.",
    features: ["Room discovery", "Location story", "Direct enquiry path"],
    technologies: ["Semantic HTML", "Responsive CSS", "Progressive enhancement"],
    services: ["Website design", "Content structure", "Frontend development"],
    result: "A concept for a clear, memorable stay discovery experience. No client outcomes are claimed.",
    theme: "stay", cover: null, gallery: [], video: null, liveUrl: null, githubUrl: null, featured: true, status: "concept"
  },
  {
    slug: "saffron-table", title: "Saffron Table", subtitle: "The menu is the invitation.",
    category: "Food & beverage", industry: "Restaurant website", client: null, year: null,
    description: "A restaurant website concept that makes menu, hours and reservations easy to find.",
    challenge: "Bring the energy of a dining room to a small screen without hiding the practical details.",
    solution: "Put menu categories, opening information and a reservation action into a focused mobile journey.",
    design: "Warm color, rich type and a visual rhythm inspired by the pace of a shared table.",
    features: ["Menu-first layout", "Opening hours", "Reservation path"],
    technologies: ["Semantic HTML", "Responsive CSS", "Accessibility"],
    services: ["Website design", "Mobile UX", "Frontend development"],
    result: "A concept for a faster route from browsing to planning a visit. No client outcomes are claimed.",
    theme: "table", cover: null, gallery: [], video: null, liveUrl: null, githubUrl: null, featured: true, status: "concept"
  },
  {
    slug: "form-found", title: "Form & Found", subtitle: "A storefront with space to choose.",
    category: "Commerce", industry: "Online shop", client: null, year: null,
    description: "A considered shopping experience for a curated collection of home objects.",
    challenge: "Make product discovery feel useful and unhurried across screen sizes.",
    solution: "Create clear product categories and details, with an obvious route toward checkout.",
    design: "Quiet surfaces, tactile tones and careful hierarchy keep attention on the objects.",
    features: ["Curated categories", "Product detail", "Cart journey"],
    technologies: ["Responsive CSS", "Accessible UI", "Commerce planning"],
    services: ["Storefront design", "UX architecture", "Frontend development"],
    result: "An exploration of product-led commerce. It is not a live store or a measured client case.",
    theme: "form", cover: null, gallery: [], video: null, liveUrl: null, githubUrl: null, featured: false, status: "concept"
  },
  {
    slug: "counterpoint", title: "Counterpoint", subtitle: "Daily operations, in focus.",
    category: "Business systems", industry: "POS concept", client: null, year: null,
    description: "A point-of-sale interface concept for common transactions and stock tasks.",
    challenge: "Keep frequent actions quick without making records hard to understand.",
    solution: "Group sales, inventory and closing tasks around the operator's day.",
    design: "Precise spacing, legible data and restrained color support speed under pressure.",
    features: ["Sales surface", "Inventory view", "Daily close"],
    technologies: ["Product design", "Data modeling", "Offline planning"],
    services: ["Workflow design", "Interface design", "Software architecture"],
    result: "A workflow proposal, not a deployed POS or a claim of operational results.",
    theme: "counter", cover: null, gallery: [], video: null, liveUrl: null, githubUrl: null, featured: true, status: "concept"
  },
  {
    slug: "atlas-desk", title: "Atlas Desk", subtitle: "Know what moves next.",
    category: "Web application", industry: "Team dashboard", client: null, year: null,
    description: "A workspace concept for keeping projects, activity and next actions visible.",
    challenge: "Help a team see status without adding another layer of noise.",
    solution: "Connect overview, ownership and activity in a modular operating surface.",
    design: "A compact, high-contrast interface makes important signals easy to scan.",
    features: ["Project overview", "Activity stream", "Permission planning"],
    technologies: ["Information architecture", "Accessible UI", "Data modeling"],
    services: ["Product strategy", "Dashboard design", "Software planning"],
    result: "A concept framework for team coordination, without invented adoption or performance metrics.",
    theme: "atlas", cover: null, gallery: [], video: null, liveUrl: null, githubUrl: null, featured: false, status: "concept"
  }
];

export const services = [
  ["Website design & development", "A digital home with a distinct point of view and a clear job to do.", "WEB"],
  ["Hotel & hospitality websites", "Help guests explore rooms, place and the path to a booking enquiry.", "STAY"],
  ["Restaurant websites", "Put menus, hours and reservations where people expect them.", "DINE"],
  ["Business websites", "Present what you do with clarity, credibility and a useful contact path.", "BIZ"],
  ["E-commerce & shops", "Make browsing and buying feel straightforward from first look onward.", "SHOP"],
  ["Admin dashboards", "Give teams a clearer view of the work and data that matter.", "DATA"],
  ["POS systems", "Design focused operating surfaces for sales and daily tasks.", "POS"],
  ["Custom software", "Shape tools around a workflow instead of forcing a workflow into a tool.", "BUILD"],
  ["Web applications", "Plan and build interfaces for more involved digital products.", "APP"],
  ["AI integrations", "Explore focused automations with sensible review and safeguards.", "AI"],
  ["Maintenance & support", "Keep a working product useful as its needs change.", "CARE"]
] as const;

export const process = [
  ["Discovery", "Understand the business, the audience and the problem."],
  ["Strategy", "Define priorities, scope and a path through the work."],
  ["Design", "Shape the visual system and the user journey."],
  ["Development", "Build the experience in working stages."],
  ["Review", "Test, refine and check the details together."],
  ["Launch", "Prepare the release when the project is ready."],
  ["Support", "Keep improving as the work evolves."]
] as const;

export const faqs = [
  ["How much does a website cost?", "Cost depends on the scope, content and functionality. A project brief is the starting point for a tailored proposal."],
  ["How long does development take?", "The timeline depends on the size of the work and how quickly content and feedback are available. Milestones can be agreed before work begins."],
  ["Can you redesign an existing website?", "Yes. Reviewing what works today helps define what should be kept and what needs to change."],
  ["Can I update my site myself?", "An appropriate content editing workflow can be included in the project scope."],
  ["Do you provide hosting?", "Hosting and handover needs can be discussed as part of planning. No specific hosting package is included by default."],
  ["Do you build admin systems?", "Custom dashboards and operational tools can be scoped around your team's workflows."],
  ["Do you provide support after launch?", "Maintenance and improvement can be planned as a separate ongoing engagement."],
  ["Do you work outside Sri Lanka?", "Remote projects are possible. The communication plan and scope can be agreed before starting."]
] as const;
