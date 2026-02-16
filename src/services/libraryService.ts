import { supabase } from '../lib/supabase';
import { LibraryContentItem, LibraryTabType } from '../types/library';

export const libraryService = {
  /**
   * Fetches library content based on the tab type (created or saved).
   */
  async getLibraryContent(
    tabType: LibraryTabType,
    searchQuery: string | null = null,
    filterSubjectId: number | null = null,
    sortBy: string = 'newest',
    limitCount: number = 20,
    offsetCount: number = 0
  ): Promise<LibraryContentItem[]> {
    const { data, error } = await supabase.rpc('c_get_library_content', {
      tab_type: tabType,
      search_query: searchQuery,
      filter_subject_id: filterSubjectId,
      sort_by: sortBy,
      limit_count: limitCount,
      offset_count: offsetCount,
    });

    if (error) {
      console.error('Error fetching library content:', error);
      throw error;
    }

    return (data || []) as LibraryContentItem[];
  },
};
