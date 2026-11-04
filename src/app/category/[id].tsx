import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Plus,
  Search,
  NotebookPen,
  BookOpen,
  Save,
} from "lucide-react-native";

import {
  getCategoryById,
  type Category,
} from "../../database/repositories/category.repository";

import {
  createPointNote,
  getPointNotes,
  updatePointNote,
  deletePointNote,
  type PointNote,
} from "../../database/repositories/point-notes.repository";

import {
  createChapter,
  getChapters,
  updateChapter,
  deleteChapter,
  getChapterBlocks,
  type ChapterNote,
  type ChapterBlock,
  type ChapterBlockType,
} from "../../database/repositories/chapter-notes.repository";

import NoteCard from "../../components/notes/NoteCard";
import RecordFormModal from "../../components/notes/RecordFormModal";

type Tab = "point" | "chapter";

const createId = () =>
  `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function CategoryDetailScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [category, setCategory] = useState<Category | null>(null);
  const [points, setPoints] = useState<PointNote[]>([]);
  const [chapters, setChapters] = useState<ChapterNote[]>([]);
  const [blocks, setBlocks] = useState<ChapterBlock[]>([]);

  const [tab, setTab] = useState<Tab>("point");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingPoint, setEditingPoint] = useState<PointNote | null>(null);
  const [editingChapter, setEditingChapter] = useState<ChapterNote | null>(
    null
  );

  const [selectedChapter, setSelectedChapter] =
    useState<ChapterNote | null>(null);
  const [chapterText, setChapterText] = useState("");
  const [savingChapter, setSavingChapter] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);

      const [categoryData, pointData, chapterData] = await Promise.all([
        getCategoryById(db, id),
        getPointNotes(db, id),
        getChapters(db, id),
      ]);

      setCategory(categoryData);
      setPoints(pointData);
      setChapters(chapterData);
    } catch (error) {
      console.error("Category loading error:", error);
      Alert.alert("Error", "Unable to load category contents.");
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPoints = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return points;

    return points.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q)
    );
  }, [points, search]);

  const filteredChapters = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chapters;

    return chapters.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        String(item.chapter_number).includes(q)
    );
  }, [chapters, search]);

  const openCreate = () => {
    setEditingPoint(null);
    setEditingChapter(null);
    setModalVisible(true);
  };

  const openEditPoint = (item: PointNote) => {
    setEditingPoint(item);
    setEditingChapter(null);
    setModalVisible(true);
  };

  const openEditChapter = (item: ChapterNote) => {
    setEditingChapter(item);
    setEditingPoint(null);
    setModalVisible(true);
  };

  const saveRecord = async (data: {
    title: string;
    content: string;
    chapterNumber: number;
    description: string;
  }) => {
    try {
      setSubmitting(true);

      if (tab === "point") {
        if (!data.content.trim()) {
          Alert.alert("Required", "Please enter note content.");
          return;
        }

        if (editingPoint) {
          await updatePointNote(
            db,
            editingPoint.id,
            data.title,
            data.content
          );
        } else {
          await createPointNote(db, id!, data.title, data.content);
        }
      } else {
        if (!Number.isInteger(data.chapterNumber) || data.chapterNumber < 1) {
          Alert.alert("Invalid chapter", "Enter a positive chapter number.");
          return;
        }

        if (editingChapter) {
          await updateChapter(
            db,
            editingChapter.id,
            data.chapterNumber,
            data.title,
            data.description
          );
        } else {
          await createChapter(
            db,
            id!,
            data.chapterNumber,
            data.title,
            data.description
          );
        }
      }

      setModalVisible(false);
      setEditingPoint(null);
      setEditingChapter(null);
      await loadData();
    } catch (error) {
      console.error("Save record error:", error);

      Alert.alert(
        "Unable to save",
        String(error).toLowerCase().includes("unique")
          ? "This chapter number already exists in this category."
          : String(error)
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeletePoint = (item: PointNote) => {
    Alert.alert("Delete note", `Delete "${item.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deletePointNote(db, item.id);
          await loadData();
        },
      },
    ]);
  };

  const confirmDeleteChapter = (item: ChapterNote) => {
    Alert.alert(
      "Delete chapter",
      `Delete Chapter ${item.chapter_number}: ${item.title} and its content?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteChapter(db, item.id);

              if (selectedChapter?.id === item.id) {
                setSelectedChapter(null);
                setBlocks([]);
                setChapterText("");
              }

              await loadData();
            } catch {
              Alert.alert("Error", "Unable to delete chapter.");
            }
          },
        },
      ]
    );
  };

  // Open chapter as one continuous document.
  const openChapter = async (item: ChapterNote) => {
    try {
      const result = await getChapterBlocks(db, item.id);

      const content = result
        .map((block) => {
          switch (block.block_type) {
            case "heading":
              return `.h ${block.content}`;
            case "bullet":
              return `.b ${block.content}`;
            case "numbered":
              return `.n ${block.content}`;
            case "paragraph":
            default:
              return block.content;
          }
        })
        .join("\n\n");

      setSelectedChapter(item);
      setBlocks(result);
      setChapterText(content);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Unable to load chapter content.");
    }
  };

  // Live shortcut conversion and numbered-list continuation.
  const handleChapterTextChange = (value: string) => {
    let text = value;

    // Convert shortcuts when followed by a space.
    text = text.replace(/^\.h\s+/gm, "# ");
    text = text.replace(/^\.b\s+/gm, "• ");
    text = text.replace(/^\.p\s+/gm, "");
    text = text.replace(/^\.n\s+/gm, "1. ");

    // Continue numbered lists when Enter is pressed.
    if (text.endsWith("\n")) {
      const lines = text.split("\n");
      const previousLine = lines[lines.length - 2] ?? "";
      const match = previousLine.match(/^(\s*)(\d+)\.\s*(.*)$/);

      if (match) {
        // Empty numbered line + Enter again exits the list.
        if (!match[3].trim()) {
          lines.splice(lines.length - 2, 1);
          text = lines.join("\n");
        } else {
          text += `${match[1]}${Number(match[2]) + 1}. `;
        }
      }
    }

    setChapterText(text);
  };

  const saveChapterPage = async () => {
    if (!selectedChapter) return;

    if (!chapterText.trim()) {
      Alert.alert("Required", "Write some chapter content first.");
      return;
    }

    try {
      setSavingChapter(true);

      const lines = chapterText.split(/\r?\n/);
      const parsed: {
        type: ChapterBlockType;
        content: string;
      }[] = [];

      let currentType: ChapterBlockType = "paragraph";
      let currentContent: string[] = [];

      const pushCurrent = () => {
        const content = currentContent.join("\n").trim();

        if (content) {
          parsed.push({
            type: currentType,
            content,
          });
        }

        currentContent = [];
        currentType = "paragraph";
      };

      for (const rawLine of lines) {
        const line = rawLine.trim();

        if (!line) {
          pushCurrent();
          continue;
        }

        if (line.startsWith("# ")) {
          pushCurrent();
          currentType = "heading";
          currentContent.push(line.slice(2).trim());
        } else if (line.startsWith("• ") || line.startsWith("- ")) {
          pushCurrent();
          currentType = "bullet";
          currentContent.push(line.slice(2).trim());
        } else if (/^\d+\.\s/.test(line)) {
          pushCurrent();
          currentType = "numbered";
          currentContent.push(line.replace(/^\d+\.\s*/, "").trim());
        } else {
          if (currentType !== "paragraph" && currentContent.length > 0) {
            pushCurrent();
          }

          currentType = "paragraph";
          currentContent.push(line);
        }
      }

      pushCurrent();

      const now = new Date().toISOString();

      // Replace all chapter content in one SQLite transaction.
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          "DELETE FROM chapter_blocks WHERE chapter_id = ?",
          selectedChapter.id
        );

        for (let index = 0; index < parsed.length; index++) {
          const block = parsed[index];

          await db.runAsync(
            `INSERT INTO chapter_blocks
              (id, chapter_id, block_type, content, position, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            createId(),
            selectedChapter.id,
            block.type,
            block.content,
            index,
            now,
            now
          );
        }

        await db.runAsync(
          "UPDATE chapter_notes SET updated_at = ? WHERE id = ?",
          now,
          selectedChapter.id
        );
      });

      setBlocks(await getChapterBlocks(db, selectedChapter.id));
      await loadData();

      Alert.alert("Saved", "Chapter updated successfully.");
    } catch (error) {
      console.error("Chapter save error:", error);
      Alert.alert("Error", "Unable to save chapter content.");
    } finally {
      setSavingChapter(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color="#635BFF" size="large" />
      </SafeAreaView>
    );
  }

  if (!category) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.emptyTitle}>Category not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#172033" size={21} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>{category.name}</Text>
          <Text style={styles.subheading}>
            {points.length} Point Notes · {chapters.length} Chapters
          </Text>
        </View>
      </View>

      {selectedChapter ? (
        <View style={styles.editorContainer}>
          <View style={styles.editorHeader}>
            <Pressable
              style={styles.backToChapters}
              onPress={() => {
                setSelectedChapter(null);
                setChapterText("");
                setBlocks([]);
              }}
            >
              <ArrowLeft color="#635BFF" size={17} />
              <Text style={styles.backText}>Back to chapters</Text>
            </Pressable>

            <Pressable
              style={styles.saveButton}
              onPress={saveChapterPage}
              disabled={savingChapter}
            >
              {savingChapter ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Save color="#FFFFFF" size={16} />
                  <Text style={styles.saveButtonText}>Save</Text>
                </>
              )}
            </Pressable>
          </View>

          <ScrollView
            style={styles.editorPage}
            contentContainerStyle={styles.editorContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.chapterNumber}>
              CHAPTER {selectedChapter.chapter_number}
            </Text>

            <Text style={styles.chapterTitle}>
              {selectedChapter.title}
            </Text>

            {!!selectedChapter.description && (
              <Text style={styles.chapterDescription}>
                {selectedChapter.description}
              </Text>
            )}

            <TextInput
              value={chapterText}
              onChangeText={handleChapterTextChange}
              multiline
              autoCorrect
              spellCheck
              textAlignVertical="top"
              placeholder={
                "Start writing your chapter...\n\n.h Heading\n.p Paragraph\n.b Bullet\n.n Numbered list"
              }
              style={styles.chapterEditor}
            />

            <Text style={styles.editorHint}>
              Shortcuts: .h heading · .p paragraph · .b bullet · .n numbered
            </Text>
          </ScrollView>
        </View>
      ) : (
        <>
          <View style={styles.tabs}>
            <Pressable
              onPress={() => {
                setTab("point");
                setSearch("");
              }}
              style={[styles.tab, tab === "point" && styles.activeTab]}
            >
              <NotebookPen
                color={tab === "point" ? "#635BFF" : "#64748B"}
                size={17}
              />
              <Text
                style={[
                  styles.tabText,
                  tab === "point" && styles.activeTabText,
                ]}
              >
                Point Notes ({points.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setTab("chapter");
                setSearch("");
              }}
              style={[styles.tab, tab === "chapter" && styles.activeTab]}
            >
              <BookOpen
                color={tab === "chapter" ? "#635BFF" : "#64748B"}
                size={17}
              />
              <Text
                style={[
                  styles.tabText,
                  tab === "chapter" && styles.activeTabText,
                ]}
              >
                Chapters ({chapters.length})
              </Text>
            </Pressable>
          </View>

          <View style={styles.searchBox}>
            <Search color="#94A3B8" size={18} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={
                tab === "point" ? "Search notes..." : "Search chapters..."
              }
              style={styles.searchInput}
            />
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>
              {tab === "point" ? "Your Point Notes" : "Your Chapters"}
            </Text>

            <Pressable style={styles.addButton} onPress={openCreate}>
              <Plus color="#FFFFFF" size={17} />
              <Text style={styles.addText}>Add New</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {tab === "point" ? (
              filteredPoints.length ? (
                filteredPoints.map((item) => (
                  <NoteCard
                    key={item.id}
                    type="point"
                    title={item.title}
                    subtitle={item.content}
                    onPress={() =>
                      Alert.alert(item.title, item.content, [
                        { text: "Close" },
                        {
                          text: "Edit",
                          onPress: () => openEditPoint(item),
                        },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => confirmDeletePoint(item),
                        },
                      ])
                    }
                    onMenu={() =>
                      Alert.alert(item.title, "Choose an action", [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Edit",
                          onPress: () => openEditPoint(item),
                        },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => confirmDeletePoint(item),
                        },
                      ])
                    }
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>
                  No Point Notes found. Create your first note.
                </Text>
              )
            ) : filteredChapters.length ? (
              filteredChapters.map((item) => (
                <NoteCard
                  key={item.id}
                  type="chapter"
                  title={`Chapter ${item.chapter_number}: ${item.title}`}
                  subtitle={item.description || "No description"}
                  onPress={() => openChapter(item)}
                  onMenu={() =>
                    Alert.alert(item.title, "Choose an action", [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Open chapter",
                        onPress: () => openChapter(item),
                      },
                      {
                        text: "Edit details",
                        onPress: () => openEditChapter(item),
                      },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => confirmDeleteChapter(item),
                      },
                    ])
                  }
                />
              ))
            ) : (
              <Text style={styles.emptyText}>
                No chapters found. Create your first chapter.
              </Text>
            )}
          </ScrollView>
        </>
      )}

      <RecordFormModal
        visible={modalVisible}
        title={
          editingPoint || editingChapter
            ? tab === "point"
              ? "Edit Point Note"
              : "Edit Chapter"
            : tab === "point"
              ? "Create Point Note"
              : "Create Chapter"
        }
        mode={tab}
        initialTitle={editingPoint?.title ?? editingChapter?.title ?? ""}
        initialContent={editingPoint?.content ?? ""}
        initialNumber={editingChapter?.chapter_number ?? chapters.length + 1}
        initialDescription={editingChapter?.description ?? ""}
        submitting={submitting}
        onClose={() => setModalVisible(false)}
        onSave={saveRecord}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 20,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  heading: {
    fontSize: 23,
    fontWeight: "800",
    color: "#172033",
  },

  subheading: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },

  tabs: {
    flexDirection: "row",
    marginHorizontal: 18,
    backgroundColor: "#EDEFF5",
    borderRadius: 13,
    padding: 4,
  },

  tab: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },

  activeTab: {
    backgroundColor: "#FFFFFF",
  },

  tabText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
  },

  activeTabText: {
    color: "#635BFF",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 15,
    paddingHorizontal: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
  },

  searchInput: {
    flex: 1,
    height: 46,
    color: "#172033",
  },

  listHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#172033",
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#635BFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },

  addText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },

  content: {
    paddingHorizontal: 18,
    paddingBottom: 35,
  },

  emptyText: {
    textAlign: "center",
    color: "#94A3B8",
    padding: 35,
    lineHeight: 21,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  backText: {
    color: "#635BFF",
    fontWeight: "600",
  },

  editorContainer: {
    flex: 1,
    paddingBottom: 10,
  },

  editorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  backToChapters: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
  },

  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#635BFF",
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    minWidth: 85,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  editorPage: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 14,
    borderRadius: 16,
  },

  editorContent: {
    padding: 22,
    paddingBottom: 100,
  },

  chapterNumber: {
    fontSize: 11,
    fontWeight: "800",
    color: "#635BFF",
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  chapterTitle: {
    fontSize: 27,
    fontWeight: "800",
    color: "#172033",
    marginBottom: 10,
  },

  chapterDescription: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 22,
    marginBottom: 18,
  },

  chapterEditor: {
    minHeight: 500,
    fontSize: 16,
    lineHeight: 29,
    color: "#334155",
    padding: 0,
    textAlignVertical: "top",
  },

  editorHint: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 25,
    lineHeight: 18,
  },
});