import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "../hooks/useDebounce";
import { useCreateDocument, useDocuments } from "../hooks/useQueries";
import type { SortBy } from "../utils/types";
import { BrandHeader } from "./BrandHeader";
import { DesktopSidebar } from "./DesktopSidebar";
import { DocumentListCollapsed } from "./DocumentListCollapsed";
import { DocumentListExpanded } from "./DocumentListExpanded";
import { ProfileFooter } from "./ProfileFooter";
import { QuickActions } from "./QuickActions";
import { SortFilterBar } from "./SortFilterBar";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  selectedDocId: bigint | null;
  selectDoc: (id: bigint | null) => void;
  openGraphView: () => void;
  profileName: string;
  onEditProfile: () => void;
}

export function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  selectedDocId,
  selectDoc,
  openGraphView,
  profileName,
  onEditProfile,
}: SidebarProps) {
  const isMobile = useIsMobile();
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  // Search & filter state (owned by Sidebar)
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [sortBy, setSortByState] = useState<SortBy>("updated");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterTagIds, setFilterTagIds] = useState<bigint[]>([]);

  // Reset search state when sidebar closes
  useEffect(() => {
    if (!sidebarOpen) {
      setIsSearchActive(false);
      setSearchQuery("");
    }
  }, [sidebarOpen]);

  const activateSearch = useCallback(() => {
    setIsSearchActive(true);
    setSidebarOpen(true);
  }, [setSidebarOpen]);

  const closeSearch = useCallback(() => {
    setIsSearchActive(false);
    setSearchQuery("");
  }, []);

  const setSortBy = useCallback((sort: SortBy) => {
    setSortByState(sort);
  }, []);

  const toggleFilter = useCallback(() => {
    setIsFilterOpen((prev) => {
      if (!prev) {
        setSidebarOpen(true);
      }
      return !prev;
    });
  }, [setSidebarOpen]);

  const toggleFilterTag = useCallback((tagId: bigint) => {
    setFilterTagIds((prev) =>
      prev.some((id) => id === tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSortByState("updated");
    setFilterTagIds([]);
  }, []);

  const handleLogout = () => {
    queryClient.clear();
    clear();
  };

  const debouncedQuery = useDebounce(searchQuery, 300);
  const {
    data: searchResults,
    isLoading: isSearching,
    isError: isSearchError,
  } = useDocuments(debouncedQuery, filterTagIds, sortBy);

  const { mutate: createDocument, isPending: isCreating } = useCreateDocument();

  const handleNewDocument = () => {
    createDocument(
      { title: "Untitled" },
      {
        onSuccess: (doc) => {
          selectDoc(doc.id);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to create document");
        },
      },
    );
  };

  // Shared children for both mobile and desktop
  const sidebarChildren = (
    <>
      <BrandHeader collapsed={!sidebarOpen} />
      <QuickActions
        onNewDocument={handleNewDocument}
        isCreating={isCreating}
        sidebarOpen={sidebarOpen}
        isSearchActive={isSearchActive}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activateSearch={activateSearch}
        closeSearch={closeSearch}
        isFilterOpen={isFilterOpen}
        toggleFilter={toggleFilter}
        openGraphView={openGraphView}
        setSidebarOpen={setSidebarOpen}
      />
      {sidebarOpen && (
        <SortFilterBar
          isFilterOpen={isFilterOpen}
          sortBy={sortBy}
          setSortBy={setSortBy}
          filterTagIds={filterTagIds}
          toggleFilterTag={toggleFilterTag}
          clearFilters={clearFilters}
        />
      )}
      <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
        {sidebarOpen ? (
          <DocumentListExpanded
            searchResults={searchResults}
            isSearching={isSearching}
            isSearchError={isSearchError}
            selectedDocId={selectedDocId}
            selectDoc={selectDoc}
            searchQuery={searchQuery}
            isSearchActive={isSearchActive}
            filterTagIds={filterTagIds}
            setSidebarOpen={setSidebarOpen}
          />
        ) : (
          <DocumentListCollapsed
            selectedDocId={selectedDocId}
            selectDoc={selectDoc}
            sortBy={sortBy}
          />
        )}
      </div>
      <ProfileFooter
        name={profileName}
        onEditProfile={onEditProfile}
        onLogout={handleLogout}
        sidebarOpen={sidebarOpen}
      />
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="w-72 p-0 gap-0 bg-sidebar flex flex-col overflow-hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Documents</SheetTitle>
          </SheetHeader>
          {sidebarChildren}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <DesktopSidebar sidebarOpen={sidebarOpen}>{sidebarChildren}</DesktopSidebar>
  );
}
