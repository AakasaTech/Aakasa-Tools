/**
 * Pure validation logic feeding the extracted-tags status table and the
 * recommendations checklist. No DOM, no React.
 */

import type { MetaTagData } from './parseMetaTags';

export type FieldStatus = 'missing' | 'ok' | 'warning';

export interface FieldCheck {
  status: FieldStatus;
  value: string | null;
  message: string;
}

const TITLE_RECOMMENDED_MAX = 60;
const DESCRIPTION_RECOMMENDED_MAX = 160;

export function checkTitle(title: string | null): FieldCheck {
  if (!title) {
    return { status: 'missing', value: null, message: 'No <title> tag found.' };
  }
  if (title.length > TITLE_RECOMMENDED_MAX) {
    return {
      status: 'warning',
      value: title,
      message: `${title.length} characters — most search results truncate titles around ${TITLE_RECOMMENDED_MAX}.`,
    };
  }
  return { status: 'ok', value: title, message: `${title.length} characters.` };
}

export function checkDescription(description: string | null): FieldCheck {
  if (!description) {
    return { status: 'missing', value: null, message: 'No meta description found.' };
  }
  if (description.length > DESCRIPTION_RECOMMENDED_MAX) {
    return {
      status: 'warning',
      value: description,
      message: `${description.length} characters — most platforms truncate descriptions around ${DESCRIPTION_RECOMMENDED_MAX}.`,
    };
  }
  return { status: 'ok', value: description, message: `${description.length} characters.` };
}

export function checkOgImage(ogImageUrl: string | null): FieldCheck {
  if (!ogImageUrl) {
    return {
      status: 'missing',
      value: null,
      message: 'No og:image found — most platforms won\'t render a rich preview without one.',
    };
  }
  return {
    status: 'ok',
    value: ogImageUrl,
    message: 'Present. Actual dimensions can\'t be verified from markup alone — 1200×630px is the widely-used standard.',
  };
}

export function checkCanonical(canonicalUrl: string | null): FieldCheck {
  if (!canonicalUrl) {
    return { status: 'missing', value: null, message: 'No canonical URL found.' };
  }
  return { status: 'ok', value: canonicalUrl, message: 'Present.' };
}

export function checkTwitterCard(twitterCard: string | undefined): FieldCheck {
  if (!twitterCard) {
    return {
      status: 'missing',
      value: null,
      message: 'No twitter:card tag found — Twitter will fall back to Open Graph tags.',
    };
  }
  return { status: 'ok', value: twitterCard, message: 'Present.' };
}

/** Short, actionable recommendation strings for the checklist UI. */
export function buildRecommendations(data: MetaTagData): string[] {
  const recommendations: string[] = [];

  const title = checkTitle(data.title);
  if (title.status === 'missing') {
    recommendations.push('No <title> tag found — this is what shows as the clickable headline in search results.');
  } else if (title.status === 'warning') {
    recommendations.push(`Title is ${title.message}`);
  }

  const description = checkDescription(data.description);
  if (description.status === 'missing') {
    recommendations.push('No meta description found — search results and some share previews will show fallback text instead.');
  } else if (description.status === 'warning') {
    recommendations.push(`Description is ${description.message}`);
  }

  if (checkOgImage(data.ogTags['og:image'] ?? null).status === 'missing') {
    recommendations.push("No og:image found — most platforms won't render a rich preview without one.");
  }

  if (checkCanonical(data.canonicalUrl).status === 'missing') {
    recommendations.push('No canonical URL found — recommended so search engines know the preferred version of this page.');
  }

  if (checkTwitterCard(data.twitterTags['twitter:card']).status === 'missing') {
    recommendations.push('No twitter:card tag found — Twitter will fall back to Open Graph tags.');
  }

  if (!data.ogTags['og:title'] && !data.ogTags['og:description']) {
    recommendations.push('No og:title/og:description found — Facebook and LinkedIn will fall back to <title> and the meta description, which are often not written for a share context.');
  }

  return recommendations;
}
