import { NODE_GITIGNORE } from './languages/node';
import { PYTHON_GITIGNORE } from './languages/python';
import { JAVA_GITIGNORE } from './languages/java';
import { GO_GITIGNORE } from './languages/go';
import { RUST_GITIGNORE } from './languages/rust';
import { RUBY_GITIGNORE } from './languages/ruby';
import { PHP_GITIGNORE } from './languages/php';
import { JETBRAINS_GITIGNORE } from './editors/jetbrains';
import { VSCODE_GITIGNORE } from './editors/visualstudiocode';
import { SUBLIME_TEXT_GITIGNORE } from './editors/sublimetext';
import { VIM_GITIGNORE } from './editors/vim';
import { EMACS_GITIGNORE } from './editors/emacs';
import { MACOS_GITIGNORE } from './os/macos';
import { WINDOWS_GITIGNORE } from './os/windows';
import { LINUX_GITIGNORE } from './os/linux';
import { TERRAFORM_GITIGNORE } from './frameworks/terraform';

export type TemplateCategory = 'languages' | 'editors' | 'os' | 'frameworks';

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  languages: 'Languages',
  editors: 'IDEs / Editors',
  os: 'Operating Systems',
  frameworks: 'Frameworks / Tools',
};

export interface GitignoreTemplate {
  /** Stable identifier, also used as the section-header label in generated output. */
  id: string;
  /** Display label, when it differs from `id` (e.g. "VS Code" for id "VisualStudioCode"). */
  label: string;
  category: TemplateCategory;
  content: string;
}

export const GITIGNORE_TEMPLATES: GitignoreTemplate[] = [
  { id: 'Node', label: 'Node', category: 'languages', content: NODE_GITIGNORE },
  { id: 'Python', label: 'Python', category: 'languages', content: PYTHON_GITIGNORE },
  { id: 'Java', label: 'Java', category: 'languages', content: JAVA_GITIGNORE },
  { id: 'Go', label: 'Go', category: 'languages', content: GO_GITIGNORE },
  { id: 'Rust', label: 'Rust', category: 'languages', content: RUST_GITIGNORE },
  { id: 'Ruby', label: 'Ruby', category: 'languages', content: RUBY_GITIGNORE },
  { id: 'PHP', label: 'PHP', category: 'languages', content: PHP_GITIGNORE },
  { id: 'JetBrains', label: 'JetBrains', category: 'editors', content: JETBRAINS_GITIGNORE },
  { id: 'VisualStudioCode', label: 'VS Code', category: 'editors', content: VSCODE_GITIGNORE },
  { id: 'SublimeText', label: 'Sublime Text', category: 'editors', content: SUBLIME_TEXT_GITIGNORE },
  { id: 'Vim', label: 'Vim', category: 'editors', content: VIM_GITIGNORE },
  { id: 'Emacs', label: 'Emacs', category: 'editors', content: EMACS_GITIGNORE },
  { id: 'macOS', label: 'macOS', category: 'os', content: MACOS_GITIGNORE },
  { id: 'Windows', label: 'Windows', category: 'os', content: WINDOWS_GITIGNORE },
  { id: 'Linux', label: 'Linux', category: 'os', content: LINUX_GITIGNORE },
  { id: 'Terraform', label: 'Terraform', category: 'frameworks', content: TERRAFORM_GITIGNORE },
];
