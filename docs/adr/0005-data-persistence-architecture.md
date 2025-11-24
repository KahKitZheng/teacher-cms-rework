# ADR 0005: Data Persistence Architecture

**Status:** Proposed

**Date:** 2025-01

**Deciders:** Development Team

**Related:**
- [Improvement Questions - Q2](../discussions/improvement-questions.md#q2-data-persistence)
- [Draft vs Published States - Q22](../discussions/improvement-questions.md#q22-content-versioning)

---

## Context

The Teaching Course builder currently has no explicit save/autosave mechanism. Users can modify course content, but changes are not persisted to the backend.

### Requirements

From improvement questions:

1. **Save Strategy**: Manual save button + considering debounced autosave
2. **Multi-user**: Conflict resolution for multi-user editing (unlikely but needed)
3. **Version Management**: Draft vs Published states (no version history needed)
4. **Data Structure**: Changes should be atomic and efficient

### Current State

```typescript
// State management
const [tileInfo, setTileInfo] = useState<Tile[]>([]);

// Changes happen locally
function handleBlockUpdate(blockId: number, updates: Partial<Block>) {
  setTileInfo(updateBlock(tileInfo, blockId, updates));
  // ❌ No persistence
}
```

**Problems:**
- Changes lost on page refresh
- No way to share with other users
- Can't switch between draft and published
- No conflict resolution

---

## Decision

We will implement a **Hybrid Save System** with:
1. **Manual Save** (primary) - User-initiated saves
2. **Debounced Autosave** (secondary) - Automatic saves after inactivity
3. **Optimistic Updates** - Instant UI feedback
4. **Conflict Detection** - Last-write-wins with conflict notification

### Architecture

```typescript
// Save manager hook
const {
  save,           // Manual save function
  isSaving,       // Save in progress
  lastSaved,      // Timestamp of last save
  hasUnsavedChanges, // Dirty flag
  saveError,      // Error state
} = useCourseAutosave({
  courseId,
  data: tileInfo,
  debounceMs: 3000, // 3 seconds of inactivity
  onConflict: handleConflict,
});
```

---

## Implementation

### Phase 1: Save Manager Hook

```typescript
// src/pages/TeachingCourse/hooks/useCourseAutosave.ts

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type UseCourseAutosaveOptions = {
  courseId: string;
  data: Tile[];
  debounceMs?: number;
  autoSaveEnabled?: boolean;
  onConflict?: (serverData: Tile[], localData: Tile[]) => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
};

type UseCourseAutosaveReturn = {
  // Save functions
  save: () => Promise<void>;
  forceSync: () => Promise<void>;

  // Status
  status: SaveStatus;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  saveError: Error | null;

  // Version info
  localVersion: number;
  serverVersion: number;
  hasConflict: boolean;
};

export function useCourseAutosave(
  options: UseCourseAutosaveOptions
): UseCourseAutosaveReturn {
  const {
    courseId,
    data,
    debounceMs = 3000,
    autoSaveEnabled = true,
    onConflict,
    onSaveSuccess,
    onSaveError,
  } = options;

  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const [localVersion, setLocalVersion] = useState(0);
  const [serverVersion, setServerVersion] = useState(0);

  // Track original data to detect changes
  const originalDataRef = useRef<Tile[]>(data);
  const hasUnsavedChanges = !isEqual(data, originalDataRef.current);

  // Save function
  const save = useCallback(async () => {
    if (!hasUnsavedChanges) return;

    setStatus('saving');
    setSaveError(null);

    try {
      const response = await api.saveCourse(courseId, {
        data,
        localVersion,
      });

      // Check for conflicts
      if (response.conflict) {
        setStatus('error');
        onConflict?.(response.serverData, data);
        return;
      }

      // Success
      originalDataRef.current = data;
      setLocalVersion(response.version);
      setServerVersion(response.version);
      setLastSaved(new Date());
      setStatus('saved');
      onSaveSuccess?.();

      // Reset status after 2 seconds
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      setStatus('error');
      setSaveError(error as Error);
      onSaveError?.(error as Error);
    }
  }, [courseId, data, localVersion, hasUnsavedChanges, onConflict, onSaveSuccess, onSaveError]);

  // Debounced autosave
  const debouncedSave = useMemo(
    () => debounce(save, debounceMs),
    [save, debounceMs]
  );

  // Trigger autosave when data changes
  useEffect(() => {
    if (autoSaveEnabled && hasUnsavedChanges) {
      debouncedSave();
    }

    return () => debouncedSave.cancel();
  }, [data, autoSaveEnabled, hasUnsavedChanges, debouncedSave]);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        // Attempt to save synchronously
        navigator.sendBeacon(`/api/courses/${courseId}/save`, JSON.stringify(data));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [courseId, data, hasUnsavedChanges]);

  // Force sync (for manual save button)
  const forceSync = useCallback(async () => {
    debouncedSave.cancel(); // Cancel any pending autosave
    await save();
  }, [save, debouncedSave]);

  return {
    save: forceSync,
    forceSync,
    status,
    isSaving: status === 'saving',
    hasUnsavedChanges,
    lastSaved,
    saveError,
    localVersion,
    serverVersion,
    hasConflict: localVersion !== serverVersion,
  };
}
```

---

### Phase 2: Save Status UI

```typescript
// SaveStatusIndicator.tsx
function SaveStatusIndicator({ saveManager }: { saveManager: UseCourseAutosaveReturn }) {
  const { status, lastSaved, hasUnsavedChanges, isSaving, saveError } = saveManager;

  return (
    <div className={styles.saveStatus}>
      {isSaving && (
        <>
          <Spinner size={16} />
          <span>Saving...</span>
        </>
      )}

      {status === 'saved' && (
        <>
          <CheckCircle size={16} color="green" />
          <span>Saved {formatRelativeTime(lastSaved)}</span>
        </>
      )}

      {hasUnsavedChanges && status === 'idle' && (
        <>
          <AlertCircle size={16} color="orange" />
          <span>Unsaved changes</span>
        </>
      )}

      {saveError && (
        <>
          <XCircle size={16} color="red" />
          <span>Save failed: {saveError.message}</span>
        </>
      )}
    </div>
  );
}
```

```typescript
// SaveButton.tsx
function SaveButton({ saveManager }: { saveManager: UseCourseAutosaveReturn }) {
  const { save, isSaving, hasUnsavedChanges } = saveManager;

  return (
    <button
      onClick={save}
      disabled={!hasUnsavedChanges || isSaving}
      className={cn(styles.saveButton, hasUnsavedChanges && styles.highlight)}
    >
      {isSaving ? (
        <>
          <Spinner size={16} />
          Saving...
        </>
      ) : (
        <>
          <Save size={16} />
          Save
        </>
      )}
    </button>
  );
}
```

---

### Phase 3: Conflict Resolution

```typescript
// ConflictResolutionModal.tsx
function ConflictResolutionModal({
  localData,
  serverData,
  onResolve,
}: {
  localData: Tile[];
  serverData: Tile[];
  onResolve: (resolution: 'local' | 'server' | 'merge') => void;
}) {
  const [showDiff, setShowDiff] = useState(false);

  return (
    <Modal title="Save Conflict Detected" size="large">
      <div className={styles.conflictModal}>
        <p>
          Someone else has modified this course while you were editing.
          Choose how to resolve the conflict:
        </p>

        <div className={styles.options}>
          <button
            className={styles.option}
            onClick={() => onResolve('local')}
          >
            <h3>Keep My Changes</h3>
            <p>Overwrite server version with your changes</p>
            <span className={styles.warning}>⚠️ This will discard other user's changes</span>
          </button>

          <button
            className={styles.option}
            onClick={() => onResolve('server')}
          >
            <h3>Use Server Version</h3>
            <p>Discard your changes and use the server version</p>
            <span className={styles.warning}>⚠️ You will lose your unsaved changes</span>
          </button>

          <button
            className={styles.option}
            onClick={() => onResolve('merge')}
            disabled
          >
            <h3>Merge Changes</h3>
            <p>Attempt to merge both versions</p>
            <span className={styles.info}>Coming soon</span>
          </button>
        </div>

        <button onClick={() => setShowDiff(!showDiff)}>
          {showDiff ? 'Hide' : 'Show'} Differences
        </button>

        {showDiff && (
          <DiffViewer
            original={serverData}
            modified={localData}
          />
        )}
      </div>
    </Modal>
  );
}
```

---

### Phase 4: Draft vs Published States

```typescript
// Course state management
type CourseState = 'draft' | 'published';

type Course = {
  id: string;
  name: string;
  state: CourseState;
  draftData: Tile[];      // Current working version
  publishedData?: Tile[]; // Last published version
  publishedAt?: Date;
  updatedAt: Date;
};

// Publishing workflow
async function publishCourse(courseId: string) {
  const response = await api.publishCourse(courseId);

  return {
    ...response.course,
    publishedData: response.course.draftData, // Freeze current draft
    publishedAt: new Date(),
    state: 'published',
  };
}

// Unpublish (revert to draft)
async function unpublishCourse(courseId: string) {
  const response = await api.unpublishCourse(courseId);

  return {
    ...response.course,
    state: 'draft',
  };
}
```

**UI Components:**

```typescript
function PublishButton({ course, onPublish }: PublishButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await onPublish();
      toast.success('Course published successfully!');
    } catch (error) {
      toast.error('Failed to publish course');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <button
      onClick={handlePublish}
      disabled={isPublishing || course.state === 'published'}
      className={styles.publishButton}
    >
      {isPublishing ? (
        <>
          <Spinner size={16} />
          Publishing...
        </>
      ) : course.state === 'published' ? (
        <>
          <CheckCircle size={16} />
          Published
        </>
      ) : (
        <>
          <Upload size={16} />
          Publish Course
        </>
      )}
    </button>
  );
}
```

---

## API Specification

### Save Endpoint

```typescript
POST /api/courses/:courseId/save

Request:
{
  data: Tile[],
  localVersion: number,
}

Response (Success):
{
  success: true,
  version: number,
  savedAt: string,
}

Response (Conflict):
{
  conflict: true,
  serverVersion: number,
  serverData: Tile[],
  message: "Course was modified by another user",
}
```

### Publish Endpoint

```typescript
POST /api/courses/:courseId/publish

Response:
{
  success: true,
  course: {
    id: string,
    state: "published",
    publishedAt: string,
    publishedData: Tile[],
  }
}
```

---

## Usage Example

```typescript
// TeachingCourseTemplate.tsx
function TeachingCourseTemplate() {
  const { courseId } = useParams();
  const [tileInfo, setTileInfo] = useState<Tile[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState<{
    local: Tile[];
    server: Tile[];
  } | null>(null);

  // Setup autosave
  const saveManager = useCourseAutosave({
    courseId,
    data: tileInfo,
    debounceMs: 3000,
    autoSaveEnabled: true,
    onConflict: (serverData, localData) => {
      setConflictData({ local: localData, server: serverData });
      setShowConflictModal(true);
    },
    onSaveSuccess: () => {
      toast.success('Changes saved');
    },
    onSaveError: (error) => {
      toast.error(`Save failed: ${error.message}`);
    },
  });

  const handleResolveConflict = async (resolution: 'local' | 'server') => {
    if (!conflictData) return;

    if (resolution === 'local') {
      // Force overwrite with local data
      await api.forceSave(courseId, conflictData.local);
    } else {
      // Use server data
      setTileInfo(conflictData.server);
    }

    setShowConflictModal(false);
    setConflictData(null);
  };

  return (
    <div>
      {/* Header with save status */}
      <header className={styles.header}>
        <h1>Edit Course</h1>
        <div className={styles.actions}>
          <SaveStatusIndicator saveManager={saveManager} />
          <SaveButton saveManager={saveManager} />
        </div>
      </header>

      {/* Course content */}
      <CourseBuilder
        tileInfo={tileInfo}
        setTileInfo={setTileInfo}
      />

      {/* Conflict resolution modal */}
      {showConflictModal && conflictData && (
        <ConflictResolutionModal
          localData={conflictData.local}
          serverData={conflictData.server}
          onResolve={handleResolveConflict}
        />
      )}
    </div>
  );
}
```

---

## Consequences

### Positive

- ✅ **Data safety**: Changes are regularly saved
- ✅ **User control**: Manual save gives users control
- ✅ **Automatic backup**: Autosave prevents data loss
- ✅ **Conflict handling**: Detects and resolves multi-user conflicts
- ✅ **Draft/Publish workflow**: Safe content management
- ✅ **Visual feedback**: Clear save status indicators
- ✅ **Offline support**: Can queue saves for when online

### Negative

- ⚠️ **Network overhead**: Regular autosave requests
- ⚠️ **Complex state**: Need to track versions and conflicts
- ⚠️ **User interruption**: Conflict modals disrupt workflow
- ⚠️ **Backend complexity**: Need versioning and conflict detection

### Trade-offs

- **Manual vs Auto**: Hybrid approach balances control and convenience
- **Last-write-wins vs Merge**: Simple but can lose changes (mergeable later)
- **Frequency vs Performance**: 3-second debounce balances both

---

## Alternatives Considered

### Alternative 1: Auto-save Only (No Manual Button)

**Rejected**: Users want control over when to save

### Alternative 2: Manual Save Only

**Rejected**: Risk of data loss if user forgets to save

### Alternative 3: Operational Transform (OT) or CRDT

**Deferred**: Complex to implement, not needed for "unlikely" multi-user editing

### Alternative 4: Lock-Based Editing

**Rejected**: Poor UX, blocks other users completely

---

## Open Questions

1. **Save frequency**: Is 3 seconds too frequent? Too slow?
2. **Offline editing**: Should we support full offline editing with sync when online?
3. **Save indicators**: Should we show what changed since last save?
4. **Merge algorithm**: How to automatically merge non-conflicting changes?
5. **Rollback**: Should users be able to "undo" to last saved state?

These will be addressed during implementation and user testing.

---

## Future Enhancements

### Version History (Later)

```typescript
type CourseVersion = {
  id: string;
  courseId: string;
  data: Tile[];
  savedAt: Date;
  savedBy: User;
  changeDescription?: string;
};

// View history
const versions = await api.getCourseVersions(courseId);

// Restore version
await api.restoreCourseVersion(courseId, versionId);

// Compare versions
const diff = compareCourseVersions(version1, version2);
```

### Real-time Collaboration (Later)

```typescript
// WebSocket connection for live updates
const { socket, collaborators } = useCollaboration(courseId);

socket.on('user-update', (update) => {
  applyRemoteUpdate(update);
});

// Show who's editing
<CollaboratorCursors collaborators={collaborators} />
```

---

## References

- [Improvement Questions - Q2](../discussions/improvement-questions.md#q2-data-persistence)
- [Draft vs Published - Q22](../discussions/improvement-questions.md#q22-content-versioning)
- [Autosave Best Practices](https://uxdesign.cc/autosave-best-practices-9a8b8c1c7fb8)
- [Conflict Resolution Patterns](https://martin.kleppmann.com/2020/07/06/crdt-hard-parts-hydra.html)
