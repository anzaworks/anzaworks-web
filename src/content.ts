export const site = {
  name: "Anza Works",
  origin: "https://anzaworks.lk",
  email: "Ansafbisthamy@gmail.com",
  phone: "+94 76 618 3838",
  phoneHref: "tel:+94766183838",
  whatsapp: "https://wa.me/94766183838",
  social: { GitHub: null, Instagram: null, LinkedIn: null, WhatsApp: null } as Record<string, string | null>,
  description: "Anza Works designs and builds distinctive websites, software and digital systems for ambitious businesses."
} as const;

export type Project = {
  slug: string; title: string; category: string; subtitle: string;
  summary: string; description: string; features: string[]; design: string;
  cover: string; coverAlt: string; coverWidth: number; coverHeight: number; gallery: { src: string; alt: string }[];
  liveUrl: string; platform: string | null; featured: boolean; status: "public";
};

export const projects: Project[] = [
  {
    "slug": "hotel-bonavista",
    "title": "Hotel Bonavista",
    "category": "Hospitality website",
    "subtitle": "A quieter way to explore a hill-country stay.",
    "description": "A public hospitality website for Hotel Bonavista in Nuwara Eliya. Rooms, dining, local experiences and photography give visitors a clear picture of the stay before they enquire.",
    "features": [
      "Five room types with dedicated detail pages",
      "Dining, experiences and local setting",
      "Photo gallery and promotional films",
      "Booking enquiry entry point; online booking is marked coming soon"
    ],
    "design": "Cream surfaces, forest-green accents and editorial typography give the photography space to lead.",
    "cover": "/projects/hotel-bonavista/cover.webp",
    "coverWidth": 1280,
    "coverHeight": 879,
    "coverAlt": "Hotel Bonavista public website \u2014 A quieter way to explore a hill-country stay.",
    "gallery": [
      {
        "src": "/projects/hotel-bonavista/rooms.webp",
        "alt": "Hotel Bonavista room overview page with lounge photography and room discovery introduction"
      }
    ],
    "liveUrl": "https://hotel-bonavista.vercel.app/",
    "platform": null,
    "featured": true,
    "status": "public",
    "summary": "A public hospitality website for Hotel Bonavista in Nuwara Eliya."
  },
  {
    "slug": "archive-relay",
    "title": "Archive Relay",
    "category": "Web preservation application",
    "subtitle": "Preserve the page. Keep the evidence.",
    "description": "A public interface for web-preservation bounties. The site explains how sponsors define a preservation brief and archivists submit public captures for consensus review.",
    "features": [
      "Bounty board with status filters and search",
      "Create-bounty entry point",
      "Wallet connection for participation",
      "Three-stage commit, archive and verify explanation"
    ],
    "design": "Dark green, lime accents and a layered page illustration turn preservation into an approachable editorial story.",
    "cover": "/projects/archive-relay/cover.webp",
    "coverWidth": 1280,
    "coverHeight": 879,
    "coverAlt": "Archive Relay public website \u2014 Preserve the page. Keep the evidence.",
    "gallery": [],
    "liveUrl": "https://archiverelay-haris4587.itzanza2.chatgpt.site/",
    "platform": "GenLayer Studionet",
    "featured": true,
    "status": "public",
    "summary": "A public interface for web-preservation bounties."
  },
  {
    "slug": "brief-bond",
    "title": "Brief Bond",
    "category": "Creator campaign application",
    "subtitle": "From an agreed brief to reviewed evidence.",
    "description": "A campaign workspace for creator sponsorship terms and evidence review. Its public interface separates funding, proof submission and inspection, and explains the settlement outcomes.",
    "features": [
      "Fund, Prove and Inspect workspace tabs",
      "Campaign brief and disclosure fields",
      "SHA-256 URL/file hashing controls",
      "Settlement policy for payment, hold and refund"
    ],
    "design": "Oversized type, cream graph-paper surfaces and coral accents give a complex workflow a direct visual hierarchy.",
    "cover": "/projects/brief-bond/cover.webp",
    "coverWidth": 1280,
    "coverHeight": 823,
    "coverAlt": "Brief Bond public website \u2014 From an agreed brief to reviewed evidence.",
    "gallery": [],
    "liveUrl": "https://briefbond.ansaf1st33.chatgpt.site/",
    "platform": "GenLayer Studionet",
    "featured": false,
    "status": "public",
    "summary": "A campaign workspace for creator sponsorship terms and evidence review."
  },
  {
    "slug": "prism-jury",
    "title": "Prism Jury",
    "category": "Creative milestone application",
    "subtitle": "One artifact. A clear review path.",
    "description": "A creative milestone interface built around an agreed brief and a commit-pinned artifact. The page describes byte verification before consensus scoring and displays release, hold and refund outcomes.",
    "features": [
      "Milestone setup with agreed brief and review focus",
      "Commit-pinned artifact URL and SHA-256 controls",
      "Release threshold and escrow fields",
      "Explanation of review and settlement outcomes"
    ],
    "design": "Soft cream surfaces and spectrum accents distinguish the verification, review and settlement stages.",
    "cover": "/projects/prism-jury/cover.webp",
    "coverWidth": 762,
    "coverHeight": 476,
    "coverAlt": "Prism Jury public website \u2014 One artifact. A clear review path.",
    "gallery": [],
    "liveUrl": "https://prismjury.ansaf1st33.chatgpt.site/",
    "platform": "GenLayer Studionet",
    "featured": true,
    "status": "public",
    "summary": "A creative milestone interface built around an agreed brief and a commit-pinned artifact."
  },
  {
    "slug": "source-seal",
    "title": "Source Seal",
    "category": "Evidence verification application",
    "subtitle": "Verify. Challenge. Finalize with proof.",
    "description": "A public evidence-verification interface with a bounded challenge window. It organizes claim submission, counter-evidence, record inspection and finalization into a single tabbed workflow.",
    "features": [
      "Verify, Challenge, Inspect and Finalize tabs",
      "Claim and public evidence URL inputs",
      "Protocol monitor with fetch, compare and seal stages",
      "Seven-day challenge-window explanation"
    ],
    "design": "Near-black green surfaces, luminous restrained accents and structured panels keep the evidence workflow readable.",
    "cover": "/projects/source-seal/cover.webp",
    "coverWidth": 1280,
    "coverHeight": 879,
    "coverAlt": "Source Seal public website \u2014 Verify. Challenge. Finalize with proof.",
    "gallery": [],
    "liveUrl": "https://sourceseal.netlify.app/",
    "platform": "GenLayer Studionet",
    "featured": true,
    "status": "public",
    "summary": "A public evidence-verification interface with a bounded challenge window."
  },
  {
    "slug": "dispute-dock",
    "title": "Dispute Dock",
    "category": "Freelance arbitration prototype",
    "subtitle": "Requirements at the center of a dispute.",
    "description": "An experimental freelance escrow and arbitration interface. The public desk exposes agreement lookup and explains how locked requirements and hash-bound evidence inform a consensus verdict.",
    "features": [
      "Case desk and finalized-state lookup",
      "New agreement, lifecycle and evidence-lab navigation",
      "Requirement-by-requirement verdict area",
      "Trust-boundary explanation for evidence review"
    ],
    "design": "Dark ink surfaces, copper accents and serif headings balance a formal subject with a focused application layout.",
    "cover": "/projects/dispute-dock/cover.webp",
    "coverWidth": 960,
    "coverHeight": 600,
    "coverAlt": "Dispute Dock public website \u2014 Requirements at the center of a dispute.",
    "gallery": [],
    "liveUrl": "https://disputedock.netlify.app",
    "platform": "GenLayer Studionet",
    "featured": false,
    "status": "public",
    "summary": "An experimental freelance escrow and arbitration interface."
  },
  {
    "slug": "proof-halt",
    "title": "Proof Halt",
    "category": "Security governance prototype",
    "subtitle": "Consensus before intervention.",
    "description": "A public security-governance interface for evidence-bound HALT and RESTORE authorization. It includes architecture, public-record inspection and a wallet-confirmed transaction console. The Studio deployment explicitly records authorization rather than claiming external enforcement.",
    "features": [
      "Architecture: constitution, consensus and bound action",
      "Public finalized-contract record area",
      "Staged transaction console with wallet connection",
      "Explicit distinction between authorization and external enforcement"
    ],
    "design": "Deep green, mint accents and large sans-serif typography create a precise, calm security workspace.",
    "cover": "/projects/proof-halt/cover.webp",
    "coverWidth": 1280,
    "coverHeight": 879,
    "coverAlt": "Proof Halt public website \u2014 Consensus before intervention.",
    "gallery": [],
    "liveUrl": "https://proofhalt.netlify.app",
    "platform": "GenLayer Studionet",
    "featured": true,
    "status": "public",
    "summary": "A public security-governance interface for evidence-bound HALT and RESTORE authorization."
  }
];
export const privateSystems = [
  {
    "title": "Mr Apple.lk POS",
    "category": "Retail POS & Inventory System",
    "status": "Private System \u00b7 In Progress",
    "description": "Retail sales, inventory and invoice system. Screens and access are private while development continues.",
    "liveUrl": null
  },
  {
    "title": "Hotel Bonavista Admin",
    "category": "Hotel Operations Dashboard",
    "status": "Private System \u00b7 In Progress",
    "description": "A separate operations and admin system for Hotel Bonavista. Development is in progress; no public access is offered.",
    "liveUrl": null
  }
];
export const services = [
  [
    "Web design & development",
    "Clear structure, responsive layouts and considered interaction, built together.",
    "WEB"
  ],
  [
    "Business websites",
    "Present your offer and give people a direct route to an enquiry.",
    "BUSINESS"
  ],
  [
    "Hospitality websites",
    "Rooms, dining, place and photography, as seen in Hotel Bonavista.",
    "STAY"
  ],
  [
    "Custom web applications",
    "Focused interfaces for multi-step tasks, evidence and records.",
    "APP"
  ],
  [
    "Admin dashboards",
    "Operational views planned around the people who use them every day.",
    "DATA"
  ],
  [
    "POS & internal business systems",
    "Sales, stock and invoicing workflows. Mr Apple.lk POS is currently in progress.",
    "SYSTEMS"
  ]
] as const;
export const process = [
  [
    "Understand & define",
    "Clarify the audience, the business task and the scope before choosing features."
  ],
  [
    "Design & build",
    "Shape the content and interface, then develop the working experience in reviewable stages."
  ],
  [
    "Review & hand over",
    "Check responsive behavior, accessibility and practical use; prepare a clear handover."
  ]
] as const;
