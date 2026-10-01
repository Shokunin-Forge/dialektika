'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DebateSetup } from '@/components/DebateSetup';
import { HistoryList } from '@/components/HistoryList';
import { loadModelsCache, saveModelsCache } from '@/lib/model-cache';
import { loadDebates } from '@/lib/storage';
import type { Debate, DebateConfig, ModelOption } from '@/lib/types';

export default function SetupPage() {
  const router = useRouter();
  const [models, setModels] = useState<ModelOption[]>([]);
  const [debates, setDebates] = useState<Debate[]>([]);
  const [modelListFailed, setModelListFailed] = useState(false);
  const [keyConfigured, setKeyConfigured] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!cancelled) {
        setDebates(loadDebates());
      }

      const cached = loadModelsCache();
      if (cached.length > 0 && !cancelled) {
        setModels(cached);
      }

      try {
        const response = await fetch('/api/models', { cache: 'no-store' });
        const data = (await response.json()) as {
          models?: ModelOption[];
          keyConfigured?: boolean;
        };

        if (typeof data.keyConfigured === 'boolean' && !cancelled) {
          setKeyConfigured(data.keyConfigured);
        }

        if (response.ok && Array.isArray(data.models) && data.models.length > 0) {
          saveModelsCache(data.models);
          if (!cancelled) {
            setModels(data.models);
            setModelListFailed(false);
          }
        } else if (cached.length === 0 && !cancelled) {
          setModelListFailed(true);
        }
      } catch {
        if (cached.length === 0 && !cancelled) {
          setModelListFailed(true);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleStart(config: Omit<DebateConfig, 'id'>) {
    const id = crypto.randomUUID();
    const full: DebateConfig = { ...config, id };
    sessionStorage.setItem(`dialektika.pending.${id}`, JSON.stringify(full));
    router.push(`/debate/${id}`);
  }

  return (
    <main className="shell">
      <p className="brand">Dialektika</p>
      <h1 className="title">Two models. One arena.</h1>
      <p className="subtitle">
        Put a claim to the test: pick two models, assign the sides, and let them debate round by
        round.
      </p>
      <DebateSetup
        models={models}
        modelListFailed={modelListFailed}
        keyConfigured={keyConfigured}
        onStart={handleStart}
      />
      <HistoryList debates={debates} />
    </main>
  );
}
