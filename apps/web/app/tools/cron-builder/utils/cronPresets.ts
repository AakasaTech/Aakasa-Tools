export interface CronPreset {
  name: string;
  expression: string;
}

export const CRON_PRESETS: CronPreset[] = [
  { name: 'Every minute', expression: '* * * * *' },
  { name: 'Every hour', expression: '0 * * * *' },
  { name: 'Every day at midnight', expression: '0 0 * * *' },
  { name: 'Every Monday at 9am', expression: '0 9 * * 1' },
  { name: 'Every 15 minutes', expression: '*/15 * * * *' },
  { name: 'First of every month', expression: '0 0 1 * *' },
];
