'use client';

import { useState } from 'react';
import { Button } from '@aakasa/ui';
import { BorderRadiusTab } from './BorderRadiusTab';
import { BlobTab } from './BlobTab';

type ActiveTab = 'radius' | 'blob';

export function BorderRadiusGenerator() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('radius');

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1 rounded-md bg-ink/5 p-1 dark:bg-paper/10">
        <Button variant={activeTab === 'radius' ? 'primary' : 'ghost'} size="sm" onClick={() => setActiveTab('radius')} className="flex-1">
          Border Radius
        </Button>
        <Button variant={activeTab === 'blob' ? 'primary' : 'ghost'} size="sm" onClick={() => setActiveTab('blob')} className="flex-1">
          Blob Generator
        </Button>
      </div>

      {activeTab === 'radius' ? <BorderRadiusTab /> : <BlobTab />}

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing is uploaded or stored.</span>
    </div>
  );
}
