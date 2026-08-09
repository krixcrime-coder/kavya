import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type MetadataTab = 'titles' | 'descriptions' | 'tags';

export type UploadReport = {
  id: string;
  status: 'success' | 'failed' | 'scheduled';
  filename: string;
  title: string;
  scheduledAt: string;
  publishedAt?: string;
  youtubeId?: string;
  error?: string;
  tagCount: number;
};

type PersistedState = {
  titles: string[];
  descriptions: string[];
  tagSets: string[][];
  reports: UploadReport[];
};

type UploaderContextValue = PersistedState & {
  hydrated: boolean;
  addMetadata: (kind: MetadataTab, value: string) => void;
  updateMetadata: (kind: MetadataTab, index: number, value: string) => void;
  removeMetadata: (kind: MetadataTab, index: number) => void;
  resetLocalData: () => Promise<void>;
};

const STORAGE_KEY = '@youtube-uploader-companion/state-v1';

const seedReports: UploadReport[] = [
  {
    id: 'report-1',
    status: 'scheduled',
    filename: 'short_0148.mp4',
    title: 'Wait for the ending',
    scheduledAt: 'Tonight · 8:00 PM',
    tagCount: 3,
  },
  {
    id: 'report-2',
    status: 'success',
    filename: 'short_0147.mp4',
    title: 'This happened so fast',
    scheduledAt: 'Yesterday · 8:00 PM',
    publishedAt: 'Yesterday · 8:00 PM',
    youtubeId: 'yt_0147',
    tagCount: 3,
  },
  {
    id: 'report-3',
    status: 'success',
    filename: 'short_0146.mp4',
    title: 'The perfect short clip',
    scheduledAt: 'Aug 06 · 8:00 PM',
    publishedAt: 'Aug 06 · 8:00 PM',
    youtubeId: 'yt_0146',
    tagCount: 2,
  },
  {
    id: 'report-4',
    status: 'failed',
    filename: 'short_0145.mp4',
    title: 'You will not believe what happens next',
    scheduledAt: 'Aug 06 · 8:00 AM',
    error: 'Drive download timed out',
    tagCount: 3,
  },
];

const seedState: PersistedState = {
  titles: [
    'Amazing moment you have to see',
    'Wait for the ending',
    'This happened so fast',
    'You will not believe what happens next',
    'The perfect short clip',
  ],
  descriptions: [
    'New short video every day. Subscribe for more.',
    'Watch, share, and follow for the next clip.',
    'Shorts selected and scheduled automatically.',
  ],
  tagSets: [
    ['shorts', 'viral', 'trending'],
    ['youtube shorts', 'short video', 'must watch'],
    ['shorts', 'daily shorts', 'fyp'],
  ],
  reports: seedReports,
};

const UploaderContext = createContext<UploaderContextValue | null>(null);

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function UploaderProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<PersistedState>(seedState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as PersistedState;
            setState({
              titles: parsed.titles ?? seedState.titles,
              descriptions: parsed.descriptions ?? seedState.descriptions,
              tagSets: parsed.tagSets ?? seedState.tagSets,
              reports: parsed.reports ?? seedState.reports,
            });
          } catch {
            setState(seedState);
          }
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
        // Local persistence is best effort; the editor remains usable offline.
      });
    }
  }, [hydrated, state]);

  const addMetadata = useCallback((kind: MetadataTab, value: string) => {
    const cleaned = value.trim();
    if (!cleaned) return;
    setState((current) => {
      if (kind === 'titles') return { ...current, titles: [...current.titles, cleaned] };
      if (kind === 'descriptions') {
        return { ...current, descriptions: [...current.descriptions, cleaned] };
      }
      const tags = cleaned.split(',').map((tag) => tag.trim()).filter(Boolean);
      return tags.length
        ? { ...current, tagSets: [...current.tagSets, tags] }
        : current;
    });
  }, []);

  const updateMetadata = useCallback(
    (kind: MetadataTab, index: number, value: string) => {
      const cleaned = value.trim();
      if (!cleaned) return;
      setState((current) => {
        if (kind === 'titles') {
          const titles = [...current.titles];
          titles[index] = cleaned;
          return { ...current, titles };
        }
        if (kind === 'descriptions') {
          const descriptions = [...current.descriptions];
          descriptions[index] = cleaned;
          return { ...current, descriptions };
        }
        const tags = cleaned.split(',').map((tag) => tag.trim()).filter(Boolean);
        const tagSets = [...current.tagSets];
        tagSets[index] = tags;
        return { ...current, tagSets };
      });
    },
    [],
  );

  const removeMetadata = useCallback((kind: MetadataTab, index: number) => {
    setState((current) => {
      if (kind === 'titles') {
        return { ...current, titles: current.titles.filter((_, itemIndex) => itemIndex !== index) };
      }
      if (kind === 'descriptions') {
        return {
          ...current,
          descriptions: current.descriptions.filter((_, itemIndex) => itemIndex !== index),
        };
      }
      return {
        ...current,
        tagSets: current.tagSets.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  }, []);

  const resetLocalData = useCallback(async () => {
    setState({ ...seedState, reports: seedReports.map((report) => ({ ...report })) });
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      hydrated,
      addMetadata,
      updateMetadata,
      removeMetadata,
      resetLocalData,
    }),
    [addMetadata, hydrated, removeMetadata, resetLocalData, state, updateMetadata],
  );

  return <UploaderContext.Provider value={value}>{children}</UploaderContext.Provider>;
}

export function useUploader() {
  const value = useContext(UploaderContext);
  if (!value) throw new Error('useUploader must be used inside UploaderProvider');
  return value;
}