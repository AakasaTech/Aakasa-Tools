# Template provenance

All `.gitignore` template content bundled in this directory is copied verbatim from the
[github/gitignore](https://github.com/github/gitignore) repository — GitHub's official,
community-maintained collection of `.gitignore` templates, and the de facto standard source
for this kind of content.

- **Source repository**: https://github.com/github/gitignore
- **Snapshot commit**: `9e86bc12f67365b8dd974d3b3f09d166265c5530` (2026-09-08)
- **License**: [CC0 1.0 Universal](https://github.com/github/gitignore/blob/main/LICENSE) — a
  public-domain dedication. It explicitly permits reuse, modification, and redistribution "as
  freely as possible in any form whatsoever and for any purpose whatsoever, including without
  limitation commercial, advertising or promotional purposes," with no attribution required.
  Credit is given in this tool's FAQ anyway, as a courtesy to the maintainers.

## Files fetched

| Template  | Category   | Source path                          |
| --------- | ---------- | ------------------------------------- |
| Node      | languages  | `Node.gitignore`                      |
| Python    | languages  | `Python.gitignore`                    |
| Java      | languages  | `Java.gitignore`                      |
| Go        | languages  | `Go.gitignore`                        |
| Rust      | languages  | `Rust.gitignore`                      |
| Ruby      | languages  | `Ruby.gitignore`                      |
| PHP       | languages  | `Composer.gitignore`                  |
| JetBrains | editors    | `Global/JetBrains.gitignore`          |
| VS Code   | editors    | `Global/VisualStudioCode.gitignore`   |
| Sublime Text | editors | `Global/SublimeText.gitignore`        |
| Vim       | editors    | `Global/Vim.gitignore`                |
| Emacs     | editors    | `Global/Emacs.gitignore`              |
| macOS     | os         | `Global/macOS.gitignore`              |
| Windows   | os         | `Global/Windows.gitignore`            |
| Linux     | os         | `Global/Linux.gitignore`              |
| Terraform | frameworks | `Terraform.gitignore`                 |

Notes on substitutions:
- **PHP**: the repository has no root-level `PHP.gitignore` — PHP projects conventionally use
  `Composer.gitignore` (PHP's package manager) for this purpose, which is what this tool bundles
  under the "PHP" label.
- **Docker**: requested as a "handful more" candidate, but the source repository has no
  Docker-specific template (root, `Global/`, or `community/`) as of the snapshot commit above, so
  it was not bundled rather than inventing content not sourced from the upstream repo.

To refresh this snapshot later, re-fetch the same paths from
`https://raw.githubusercontent.com/github/gitignore/main/<path>` and update the commit SHA above.
