import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Loader2, PanelLeft, Plus } from "lucide-react";
import { ThemeProvider } from "next-themes";
import { useCallback, useState } from "react";
import { Toaster } from "sonner";
import { createActor } from "./backend";
import { EditorPanel } from "./components/EditorPanel";
import { GraphView } from "./components/GraphView";
import { LandingPage } from "./components/LandingPage";
import { ProfileSetupDialog } from "./components/ProfileSetupDialog";
import { Sidebar } from "./components/Sidebar";
import {
  useCreateDocument,
  useDocuments,
  useProfile,
} from "./hooks/useQueries";

function AuthenticatedApp() {
  const isMobile = useIsMobile();
  const [selectedDocId, setSelectedDocId] = useState<bigint | null>(null);
  const [showGraphView, setShowGraphView] = useState(false);
  const [sidebarOpen, setSidebarOpenState] = useState(() => !isMobile);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const selectDoc = useCallback((id: bigint | null) => {
    setSelectedDocId(id);
    setShowGraphView(false);
  }, []);

  const openGraphView = useCallback(() => {
    setShowGraphView(true);
  }, []);

  const closeGraphView = useCallback(() => {
    setShowGraphView(false);
  }, []);

  const setSidebarOpen = useCallback((open: boolean) => {
    setSidebarOpenState(open);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpenState((prev) => !prev);
  }, []);

  const {
    data: profile,
    isLoading: isLoadingProfile,
    isError: isProfileError,
  } = useProfile();
  const { data: documents } = useDocuments();
  const { mutate: createDocument, isPending: isCreating } = useCreateDocument();
  const hasProfile = profile?.name;
  const hasDocuments = documents && documents.length > 0;

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isProfileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive">Failed to load profile.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-muted-foreground underline"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ProfileSetupDialog open={!hasProfile} />
      <ProfileSetupDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        currentName={profile?.name}
      />
      {hasProfile && (
        <div className="h-screen flex bg-background">
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            selectedDocId={selectedDocId}
            selectDoc={selectDoc}
            openGraphView={openGraphView}
            profileName={profile.name}
            onEditProfile={() => setEditProfileOpen(true)}
          />
          <div className="flex-1 flex flex-col min-w-0">
            <div className="shrink-0 border-b border-border px-2 py-1.5 flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleSidebar}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </div>
            {showGraphView ? (
              <GraphView
                selectDoc={selectDoc}
                closeGraphView={closeGraphView}
              />
            ) : selectedDocId !== null ? (
              <EditorPanel docId={selectedDocId} selectDoc={selectDoc} />
            ) : (
              <main className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                {hasDocuments ? (
                  <p>Select a document to start editing</p>
                ) : (
                  <Button
                    onClick={() =>
                      createDocument(
                        { title: "Untitled" },
                        { onSuccess: (doc) => selectDoc(doc.id) },
                      )
                    }
                    disabled={isCreating}
                    size="sm"
                  >
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Create your first document
                  </Button>
                )}
              </main>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching, actor } = useActor(createActor);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!identity) {
    return <LandingPage />;
  }

  if (!actor || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AppContent />
      <Toaster position="bottom-right" />
    </ThemeProvider>
  );
}
