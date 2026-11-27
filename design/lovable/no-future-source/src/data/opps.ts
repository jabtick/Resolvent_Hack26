export type Opp = { id: number; org: string; title: string; type: "Internship" | "Stipend" | "Grant" | "Fellowship" | "Volunteer"; field: string; location: string; remote: boolean; deadline: string; amount: string; desc: string; likes: number; color: "primary" | "secondary" | "accent" };
export const TYPES = ["Internship", "Stipend", "Grant", "Fellowship", "Volunteer"] as const;
export const FIELDS = ["Tech", "Art", "Music", "Science", "Activism", "Media"] as const;
const raw: [string, string, Opp["type"], string, string, boolean, string, string, string][] = [
  ["Riot Code Collective", "Backend Rebel Intern", "Internship", "Tech", "Berlin", true, "Dec 20", "€1,200/mo", "Break things, then fix them. Open-source infra for grassroots orgs."],
  ["Loud Canvas Fund", "Street Art Stipend", "Stipend", "Art", "Sofia", false, "Jan 05", "€800/mo", "Paint the city. Six months of funding for public murals."],
  ["Basement Records", "Sound Engineer Apprentice", "Internship", "Music", "London", false, "Dec 30", "£1,000/mo", "Mix demos for DIY bands in a sweaty basement studio."],
  ["Mutant Lab", "Open Science Fellowship", "Fellowship", "Science", "Remote", true, "Feb 01", "$15k", "Research without the ivory tower. Publish everything open."],
  ["Zine Machine", "Indie Press Grant", "Grant", "Media", "Remote", true, "Jan 15", "$5k", "Print your zine. Distribute it. Make noise."],
  ["Climate Mosh Pit", "Field Organizer", "Volunteer", "Activism", "Amsterdam", false, "Rolling", "Expenses", "Organize direct action and community workshops."],
  ["Static Pixel", "Game Dev Internship", "Internship", "Tech", "Warsaw", true, "Jan 10", "€1,000/mo", "Build weird little games for weird little people."],
  ["Anarchy Arts Council", "Young Artist Stipend", "Stipend", "Art", "Lisbon", false, "Feb 14", "€700/mo", "No portfolio rules. Just send us what you make."],
  ["Feedback Loop Radio", "Podcast Fellowship", "Fellowship", "Media", "Remote", true, "Jan 25", "$8k", "Produce a 10-episode series on underground culture."],
  ["Garage Science Club", "Citizen Research Grant", "Grant", "Science", "Plovdiv", false, "Mar 01", "€3k", "Fund your DIY experiment. Bio, electronics, whatever."],
  ["Power Chord Academy", "Music Education Volunteer", "Volunteer", "Music", "Prague", false, "Rolling", "Housing", "Teach kids three chords and the truth."],
  ["Black Flag Data", "Data Activism Intern", "Internship", "Activism", "Remote", true, "Dec 28", "$900/mo", "Use data to expose injustice. Python + rage welcome."],
];
const colors: Opp["color"][] = ["primary", "secondary", "accent"];
export const OPPS: Opp[] = raw.map((r, i) => ({ id: i + 1, org: r[0], title: r[1], type: r[2], field: r[3], location: r[4], remote: r[5], deadline: r[6], amount: r[7], desc: r[8], likes: 40 + ((i * 37) % 300), color: colors[i % 3]! }));
