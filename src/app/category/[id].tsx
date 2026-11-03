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
import { ArrowLeft, Plus, Search, NotebookPen, BookOpen } from "lucide-react-native";

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
  createChapterBlock,
  updateChapterBlock,
  deleteChapterBlock,
  reorderChapterBlocks,
  type ChapterNote,
  type ChapterBlock,
  type ChapterBlockType,
} from "../../database/repositories/chapter-notes.repository";

import NoteCard from "../../components/notes/NoteCard";
import RecordFormModal from "../../components/notes/RecordFormModal";

type Tab = "point" | "chapter";

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
  const [editingChapter, setEditingChapter] = useState<ChapterNote | null>(null);

  const [selectedChapter, setSelectedChapter] = useState<ChapterNote | null>(null);
  const [blockContent, setBlockContent] = useState("");
  const [blockType, setBlockType] = useState<ChapterBlockType>("paragraph");
  const [editingBlock, setEditingBlock] = useState<ChapterBlock | null>(null);

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
      console.error("Category workspace loading error:", error);
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
        if (!data.content) {
          Alert.alert("Required", "Please enter note content.");
          return;
        }

        if (editingPoint) {
          await updatePointNote(db, editingPoint.id, data.title, data.content);
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
      const message = String(error).toLowerCase();

      Alert.alert(
        "Unable to save",
        message.includes("unique")
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
      `Delete Chapter ${item.chapter_number}: ${item.title} and all its content blocks?`,
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
              }
              await loadData();
            } catch (error) {
              Alert.alert("Error", "Unable to delete chapter.");
            }
          },
        },
      ]
    );
  };

  const openChapter = async (item: ChapterNote) => {
    try {
      const result = await getChapterBlocks(db, item.id);
      setSelectedChapter(item);
      setBlocks(result);
    } catch {
      Alert.alert("Error", "Unable to load chapter content.");
    }
  };

  const saveBlock = async () => {
    if (!selectedChapter || !blockContent.trim()) {
      Alert.alert("Required", "Enter some content first.");
      return;
    }

    try {
      if (editingBlock) {
        await updateChapterBlock(db, editingBlock.id, blockContent);
      } else {
        await createChapterBlock(
          db,
          selectedChapter.id,
          blockType,
          blockContent,
          blocks.length
        );
      }

      setBlockContent("");
      setEditingBlock(null);
      setBlocks(await getChapterBlocks(db, selectedChapter.id));
      await loadData();
    } catch {
      Alert.alert("Error", "Unable to save content block.");
    }
  };

  const removeBlock = (block: ChapterBlock) => {
    Alert.alert("Delete block", "Delete this content block?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!selectedChapter) return;
          await deleteChapterBlock(db, block.id);
          setBlocks(await getChapterBlocks(db, selectedChapter.id));
          await loadData();
        },
      },
    ]);
  };

  const moveBlock = async (index: number, direction: -1 | 1) => {
    if (!selectedChapter) return;
    const next = [...blocks];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next);
    await reorderChapterBlocks(
      db,
      selectedChapter.id,
      next.map((item) => item.id)
    );
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
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable
            style={styles.backToChapters}
            onPress={() => setSelectedChapter(null)}
          >
            <ArrowLeft color="#635BFF" size={17} />
            <Text style={styles.backText}>Back to chapters</Text>
          </Pressable>

          <Text style={styles.chapterHeading}>
            Chapter {selectedChapter.chapter_number}: {selectedChapter.title}
          </Text>
          {!!selectedChapter.description && (
            <Text style={styles.description}>{selectedChapter.description}</Text>
          )}

          <Text style={styles.sectionTitle}>Chapter Content</Text>

          {blocks.map((block, index) => (
            <View key={block.id} style={styles.blockCard}>
              <Text style={styles.blockType}>{block.block_type.toUpperCase()}</Text>
              <Text style={block.block_type === "heading" ? styles.blockHeading : styles.blockText}>
                {block.block_type === "bullet"
                  ? `• ${block.content}`
                  : block.block_type === "numbered"
                    ? `${index + 1}. ${block.content}`
                    : block.content}
              </Text>

              <View style={styles.blockActions}>
                <Pressable onPress={() => moveBlock(index, -1)}>
                  <Text style={styles.actionText}>↑</Text>
                </Pressable>
                <Pressable onPress={() => moveBlock(index, 1)}>
                  <Text style={styles.actionText}>↓</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setEditingBlock(block);
                    setBlockType(block.block_type);
                    setBlockContent(block.content);
                  }}
                >
                  <Text style={styles.actionText}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => removeBlock(block)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}

          <Text style={styles.sectionTitle}>
            {editingBlock ? "Edit Content Block" : "Add Content Block"}
          </Text>

          <View style={styles.typeRow}>
            {(["heading", "paragraph", "bullet", "numbered"] as ChapterBlockType[]).map((type) => (
              <Pressable
                key={type}
                onPress={() => setBlockType(type)}
                style={[styles.typeButton, blockType === type && styles.typeSelected]}
              >
                <Text style={[styles.typeText, blockType === type && styles.typeTextSelected]}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Write chapter content..."
            value={blockContent}
            onChangeText={setBlockContent}
            multiline
            textAlignVertical="top"
          />

          <Pressable style={styles.primaryButton} onPress={saveBlock}>
            <Text style={styles.primaryText}>
              {editingBlock ? "Update Block" : "Add Block"}
            </Text>
          </Pressable>

          {!!editingBlock && (
            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                setEditingBlock(null);
                setBlockContent("");
              }}
            >
              <Text style={styles.backText}>Cancel editing</Text>
            </Pressable>
          )}
        </ScrollView>
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
              <NotebookPen color={tab === "point" ? "#635BFF" : "#64748B"} size={17} />
              <Text style={[styles.tabText, tab === "point" && styles.activeTabText]}>
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
              <BookOpen color={tab === "chapter" ? "#635BFF" : "#64748B"} size={17} />
              <Text style={[styles.tabText, tab === "chapter" && styles.activeTabText]}>
                Chapters ({chapters.length})
              </Text>
            </Pressable>
          </View>

          <View style={styles.searchBox}>
            <Search color="#94A3B8" size={18} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={tab === "point" ? "Search notes..." : "Search chapters..."}
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
                        { text: "Edit", onPress: () => openEditPoint(item) },
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
                        { text: "Edit", onPress: () => openEditPoint(item) },
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
                <Text style={styles.emptyText}>No Point Notes found. Create your first note.</Text>
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
                      { text: "Open content", onPress: () => openChapter(item) },
                      { text: "Edit", onPress: () => openEditChapter(item) },
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
              <Text style={styles.emptyText}>No chapters found. Create your first chapter.</Text>
            )}
          </ScrollView>
        </>
      )}

      <RecordFormModal
        visible={modalVisible}
        title={
          editingPoint || editingChapter
            ? tab === "point" ? "Edit Point Note" : "Edit Chapter"
            : tab === "point" ? "Create Point Note" : "Create Chapter"
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
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
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
  heading: { fontSize: 23, fontWeight: "800", color: "#172033" },
  subheading: { fontSize: 12, color: "#64748B", marginTop: 4 },
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
  activeTab: { backgroundColor: "#FFFFFF" },
  tabText: { color: "#64748B", fontSize: 11, fontWeight: "600" },
  activeTabText: { color: "#635BFF" },
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
  searchInput: { flex: 1, height: 46, color: "#172033" },
  listHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#172033" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#635BFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },
  content: { paddingHorizontal: 18, paddingBottom: 35 },
  emptyText: {
    textAlign: "center",
    color: "#94A3B8",
    padding: 35,
    lineHeight: 21,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  backToChapters: { flexDirection: "row", gap: 7, alignItems: "center", marginBottom: 20 },
  backText: { color: "#635BFF", fontWeight: "600" },
  chapterHeading: { fontSize: 22, fontWeight: "800", color: "#172033" },
  description: { color: "#64748B", marginTop: 8, lineHeight: 20 },
  blockCard: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 10,
  },
  blockType: { fontSize: 9, color: "#635BFF", fontWeight: "800", marginBottom: 8 },
  blockHeading: { fontSize: 18, fontWeight: "800", color: "#172033" },
  blockText: { fontSize: 14, color: "#334155", lineHeight: 22 },
  blockActions: { flexDirection: "row", gap: 20, marginTop: 12 },
  actionText: { color: "#635BFF", fontWeight: "700" },
  deleteText: { color: "#DC2626", fontWeight: "600" },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginVertical: 12 },
  typeButton: { borderWidth: 1, borderColor: "#CBD5E1", padding: 9, borderRadius: 9 },
  typeSelected: { backgroundColor: "#635BFF", borderColor: "#635BFF" },
  typeText: { fontSize: 11, color: "#475569", textTransform: "capitalize" },
  typeTextSelected: { color: "#FFFFFF" },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 13,
    color: "#172033",
  },
  multiline: { minHeight: 120, textAlignVertical: "top" },
  primaryButton: {
    backgroundColor: "#635BFF",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  primaryText: { color: "#FFFFFF", fontWeight: "700" },
  cancelButton: { alignItems: "center", padding: 12 },
});