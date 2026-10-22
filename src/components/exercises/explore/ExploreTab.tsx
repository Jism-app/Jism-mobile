import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { daySeed } from '../../../lib/exercises/dates';
import {
  buildGroupTiles,
  buildShelves,
  ListView,
  RESULT_STEP,
  searchResults,
  taglineFor,
} from '../../../lib/exercises/explore';
import { Catalog, OpenExercise } from '../../../lib/exercises/types';
import { theme } from '../../theme';
import { createThemedStyles } from '../createThemedStyles';
import { BrowseView } from './BrowseView';
import { ResultsList } from './ResultsList';
import { SearchBar } from './SearchBar';

const useStyles = createThemedStyles((colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    tagline: {
      ...theme.typography.body,
      color: colors.primary,
      marginBottom: theme.spacing.md,
    },
  }),
);

interface ExploreTabProps {
  catalog: Catalog;
  onOpen: OpenExercise;
  refreshing: boolean;
  onRefresh: () => void;
}

// "Explore": curated shelves + muscle tiles; search or a tile switches to a
// paged results list.
export function ExploreTab({ catalog, onOpen, refreshing, onRefresh }: ExploreTabProps) {
  const { styles } = useStyles();

  const [search, setSearch] = useState('');
  const [view, setView] = useState<ListView | null>(null);
  const [broaden, setBroaden] = useState(false);
  const [visible, setVisible] = useState(RESULT_STEP);

  const shelves = useMemo(() => buildShelves(catalog, daySeed()), [catalog]);
  const tiles = useMemo(() => buildGroupTiles(catalog), [catalog]);

  const listMode = view !== null || search.trim() !== '';
  const results = useMemo(
    () => (listMode ? searchResults(catalog, { search, view, broaden }) : []),
    [listMode, catalog, search, view, broaden],
  );

  const openView = useCallback((next: ListView) => {
    setView(next);
    setVisible(RESULT_STEP);
  }, []);

  const closeView = useCallback(() => {
    setView(null);
    setSearch('');
    setBroaden(false);
    setVisible(RESULT_STEP);
  }, []);

  const onSearchChange = useCallback((text: string) => {
    setSearch(text);
    setVisible(RESULT_STEP);
  }, []);

  const toggleBroaden = useCallback(() => {
    setBroaden((v) => !v);
    setVisible(RESULT_STEP);
  }, []);

  // The search bar stays mounted across both modes so typing never loses focus.
  return (
    <View style={styles.flex}>
      <Text style={styles.tagline}>{taglineFor(catalog.prefs)}</Text>
      <SearchBar value={search} onChange={onSearchChange} />
      <View style={styles.flex}>
        {listMode ? (
          <ResultsList
            results={results}
            visible={visible}
            view={view}
            broaden={broaden}
            onToggleBroaden={toggleBroaden}
            onBack={closeView}
            onShowMore={() => setVisible((v) => v + RESULT_STEP)}
            onOpen={onOpen}
          />
        ) : (
          <BrowseView
            shelves={shelves}
            tiles={tiles}
            onOpen={onOpen}
            onOpenView={openView}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        )}
      </View>
    </View>
  );
}
