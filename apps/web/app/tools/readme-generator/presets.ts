import type { ReadmeSectionData } from './utils/generateReadme';

/** Every section type appears exactly once; order here is the default display order. */
export function createDefaultSections(): ReadmeSectionData[] {
  return [
    { id: 'title', type: 'title', enabled: true, title: '', tagline: '' },
    { id: 'badges', type: 'badges', enabled: false, badges: [] },
    { id: 'toc', type: 'toc', enabled: false },
    { id: 'about', type: 'about', enabled: true, heading: 'About', content: '' },
    { id: 'features', type: 'features', enabled: false, heading: 'Features', items: [''] },
    { id: 'installation', type: 'installation', enabled: true, heading: 'Installation', content: '' },
    { id: 'usage', type: 'usage', enabled: true, heading: 'Usage', content: '' },
    { id: 'configuration', type: 'configuration', enabled: false, heading: 'Configuration', rows: [] },
    { id: 'api', type: 'api', enabled: false, heading: 'API', content: '' },
    { id: 'screenshots', type: 'screenshots', enabled: false, heading: 'Screenshots', content: '' },
    { id: 'contributing', type: 'contributing', enabled: false, heading: 'Contributing', content: '' },
    { id: 'license', type: 'license', enabled: true, heading: 'License', licenseName: 'MIT', note: 'This project is licensed under the MIT License.' },
    { id: 'contact', type: 'contact', enabled: false, heading: 'Contact', content: '' },
  ];
}

export const INSTALL_SNIPPETS: { label: string; snippet: string }[] = [
  { label: 'npm', snippet: '```bash\nnpm install my-project\n```' },
  { label: 'yarn', snippet: '```bash\nyarn add my-project\n```' },
  { label: 'pnpm', snippet: '```bash\npnpm add my-project\n```' },
  { label: 'pip', snippet: '```bash\npip install my-project\n```' },
  { label: 'Git clone', snippet: '```bash\ngit clone https://github.com/owner/repo.git\ncd repo\n```' },
];

export const CONTRIBUTING_PRESETS: { label: string; text: string }[] = [
  {
    label: 'Standard',
    text: "Contributions are welcome! Please open an issue first to discuss what you'd like to change, then submit a pull request.\n\n1. Fork the repository\n2. Create a feature branch (`git checkout -b feature/my-feature`)\n3. Commit your changes\n4. Push to your branch and open a pull request",
  },
  {
    label: 'Short',
    text: 'Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.',
  },
  {
    label: 'Not accepting contributions',
    text: 'This project is not currently accepting external contributions, but feel free to open an issue if you find a bug.',
  },
];

const OPEN_SOURCE_README: ReadmeSectionData[] = [
  { id: 'title', type: 'title', enabled: true, title: 'Project Name', tagline: 'A one-line description of what this project does and who it\'s for.' },
  {
    id: 'badges',
    type: 'badges',
    enabled: true,
    badges: [
      { type: 'build', params: { owner: 'owner', repo: 'repo', workflow: 'ci.yml' } },
      { type: 'license', params: { license: 'MIT' } },
      { type: 'npm', params: { packageName: 'project-name' } },
    ],
  },
  { id: 'toc', type: 'toc', enabled: true },
  {
    id: 'about',
    type: 'about',
    enabled: true,
    heading: 'About',
    content:
      'Describe the problem this project solves and why it exists. A couple of sentences is usually enough — save the details for Usage.',
  },
  {
    id: 'features',
    type: 'features',
    enabled: true,
    heading: 'Features',
    items: ['Fast and lightweight', 'Zero configuration required', 'Works in Node.js and the browser'],
  },
  {
    id: 'installation',
    type: 'installation',
    enabled: true,
    heading: 'Installation',
    content: '```bash\nnpm install project-name\n```',
  },
  {
    id: 'usage',
    type: 'usage',
    enabled: true,
    heading: 'Usage',
    content: '```js\nimport { doTheThing } from \'project-name\';\n\ndoTheThing();\n```',
  },
  {
    id: 'configuration',
    type: 'configuration',
    enabled: true,
    heading: 'Configuration',
    rows: [
      { name: 'API_KEY', description: 'Your API key', defaultValue: '' },
      { name: 'LOG_LEVEL', description: 'Logging verbosity', defaultValue: 'info' },
    ],
  },
  { id: 'api', type: 'api', enabled: false, heading: 'API', content: '' },
  { id: 'screenshots', type: 'screenshots', enabled: false, heading: 'Screenshots', content: '' },
  {
    id: 'contributing',
    type: 'contributing',
    enabled: true,
    heading: 'Contributing',
    content: CONTRIBUTING_PRESETS[0]!.text,
  },
  {
    id: 'license',
    type: 'license',
    enabled: true,
    heading: 'License',
    licenseName: 'MIT',
    note: 'This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.',
  },
  {
    id: 'contact',
    type: 'contact',
    enabled: true,
    heading: 'Contact',
    content: 'Questions or feedback? Open an issue, or reach out at hello@example.com.',
  },
];

const MINIMAL_README: ReadmeSectionData[] = createDefaultSections().map((section) => {
  if (section.type === 'title') return { ...section, title: 'Project Name', tagline: 'A one-line description of this project.' };
  if (section.type === 'about') return { ...section, enabled: true, content: 'What this project does, in a sentence or two.' };
  if (section.type === 'installation') return { ...section, enabled: true, content: '```bash\nnpm install project-name\n```' };
  if (section.type === 'usage') return { ...section, enabled: true, content: '```js\nrequire(\'project-name\');\n```' };
  if (section.type === 'license') return { ...section, enabled: true };
  return { ...section, enabled: false };
});

const INTERNAL_TOOL_README: ReadmeSectionData[] = createDefaultSections().map((section) => {
  if (section.type === 'title') return { ...section, title: 'Internal Tool Name', tagline: 'What this tool is for and which team owns it.' };
  if (section.type === 'about')
    return { ...section, enabled: true, content: 'What this tool does and why it exists. Link to any relevant internal docs or tickets.' };
  if (section.type === 'installation')
    return { ...section, enabled: true, heading: 'Setup', content: '```bash\ngit clone <internal-repo-url>\ncd repo\nnpm install\n```' };
  if (section.type === 'usage') return { ...section, enabled: true, content: 'How to run this tool day to day, with the common commands.' };
  if (section.type === 'configuration')
    return {
      ...section,
      enabled: true,
      rows: [{ name: 'ENVIRONMENT', description: 'Which environment to target', defaultValue: 'staging' }],
    };
  if (section.type === 'contact')
    return { ...section, enabled: true, content: 'Owned by the Platform team — reach out in #platform-support with questions.' };
  if (section.type === 'license') return { ...section, enabled: false };
  return section;
});

export interface ReadmeTemplate {
  id: string;
  label: string;
  description: string;
  sections: ReadmeSectionData[];
}

export const README_TEMPLATES: ReadmeTemplate[] = [
  { id: 'minimal', label: 'Minimal', description: 'Just the essentials: title, about, installation, usage, and license.', sections: MINIMAL_README },
  {
    id: 'open-source',
    label: 'Open Source Project',
    description: 'A full README with badges, table of contents, features, configuration, and contributing guidelines.',
    sections: OPEN_SOURCE_README,
  },
  {
    id: 'internal-tool',
    label: 'Internal Tool',
    description: 'Skips badges, license, and contributing guidelines — adds a team contact section instead.',
    sections: INTERNAL_TOOL_README,
  },
];
