import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";

import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  Plus,
  Search,
  Folder,
  NotebookPen,
  BookOpen,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Check,
  Layers,
} from "lucide-react-native";

import { useSQLiteContext } from "expo-sqlite";

import {
  Category,
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../../database/repositories/category.repository";

const COLORS = [
  "#635BFF",
  "#0D9488",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#3B82F6",
  "#8B5CF6",
  "#16A34A",
];

export default function NotesScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [categoryName, setCategoryName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const [menuCategory, setMenuCategory] = useState<Category | null>(null);

  // LOAD CATEGORIES FROM SQLITE
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);

      const result = await getCategories(db);
      setCategories(result);
    } catch (error) {
      console.error("Category loading error:", error);
      Alert.alert("Error", "Unable to load categories.");
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // SEARCH CATEGORIES
  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return categories;

    return categories.filter((category) =>
      category.name.toLowerCase().includes(query)
    );
  }, [categories, search]);

  // SUMMARY
  const totalPointNotes = categories.reduce(
    (total, item) => total + (item.point_note_count ?? 0),
    0
  );

  const totalChapters = categories.reduce(
    (total, item) => total + (item.chapter_count ?? 0),
    0
  );

  // OPEN CATEGORY
  const openCategory = (category: Category) => {
    setMenuCategory(null);

    router.push({
      pathname: "/category/[id]",
      params: { id: category.id },
    });
  };

  // OPEN CREATE MODAL
  const openCreateModal = () => {
    setEditingCategory(null);
    setCategoryName("");
    setSelectedColor(COLORS[0]);
    setModalVisible(true);
  };

  // OPEN EDIT MODAL
  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setSelectedColor(category.color);
    setMenuCategory(null);
    setModalVisible(true);
  };

  // CLOSE MODAL
  const closeModal = () => {
    if (submitting) return;

    setModalVisible(false);
    setEditingCategory(null);
    setCategoryName("");
    setSelectedColor(COLORS[0]);
  };

  // CREATE / UPDATE CATEGORY
  const handleSaveCategory = async () => {
    const cleanName = categoryName.trim();

    if (!cleanName) {
      Alert.alert("Required", "Please enter a category name.");
      return;
    }

    try {
      setSubmitting(true);

      if (editingCategory) {
        await updateCategory(
          db,
          editingCategory.id,
          cleanName,
          selectedColor
        );
      } else {
        await createCategory(db, cleanName, selectedColor);
      }

      setModalVisible(false);
      setEditingCategory(null);
      setCategoryName("");
      setSelectedColor(COLORS[0]);

      await loadCategories();

      Alert.alert(
        "Success",
        editingCategory
          ? "Category updated successfully."
          : "Category created successfully."
      );
    } catch (error) {
      console.error("Category save error:", error);

      const message = String(error).toLowerCase();

      if (
        message.includes("unique constraint") ||
        message.includes("categories.name")
      ) {
        Alert.alert(
          "Duplicate category",
          "A category with this name already exists."
        );
      } else {
        Alert.alert("Error", "Unable to save category. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE CATEGORY
  const confirmDeleteCategory = (category: Category) => {
    setMenuCategory(null);

    const pointCount = category.point_note_count ?? 0;
    const chapterCount = category.chapter_count ?? 0;

    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category.name}"?\n\nThis will also permanently delete:\n• ${pointCount} Point Notes\n• ${chapterCount} Chapters and their content`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCategory(db, category.id);
              await loadCategories();

              Alert.alert("Deleted", "Category deleted successfully.");
            } catch (error) {
              console.error("Category deletion error:", error);
              Alert.alert("Error", "Unable to delete category.");
            }
          },
        },
      ]
    );
  };

  // CATEGORY CARD
  const renderCategory = (category: Category) => (
    <View key={category.id} style={styles.categoryCard}>
      <View style={styles.categoryTop}>
        <Pressable
          style={styles.categoryMain}
          onPress={() => openCategory(category)}
        >
          <View
            style={[
              styles.categoryIcon,
              { backgroundColor: `${category.color}18` },
            ]}
          >
            <Folder color={category.color} size={23} />
          </View>

          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.categoryHint}>Open category</Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.menuButton}
          onPress={() =>
            setMenuCategory(
              menuCategory?.id === category.id ? null : category
            )
          }
          hitSlop={8}
        >
          <MoreVertical color="#64748B" size={21} />
        </Pressable>
      </View>

      <Pressable
        onPress={() => openCategory(category)}
        style={styles.categoryStats}
      >
        <View style={styles.statItem}>
          <NotebookPen size={14} color="#64748B" />
          <Text style={styles.statText}>
            {category.point_note_count ?? 0} Point Notes
          </Text>
        </View>

        <View style={styles.statItem}>
          <BookOpen size={14} color="#64748B" />
          <Text style={styles.statText}>
            {category.chapter_count ?? 0} Chapters
          </Text>
        </View>
      </Pressable>

      {menuCategory?.id === category.id && (
        <View style={styles.menuDropdown}>
          <Pressable
            style={styles.menuItem}
            onPress={() => openEditModal(category)}
          >
            <Pencil size={16} color="#475569" />
            <Text style={styles.menuText}>Edit Category</Text>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            style={styles.menuItem}
            onPress={() => confirmDeleteCategory(category)}
          >
            <Trash2 size={16} color="#DC2626" />
            <Text style={[styles.menuText, { color: "#DC2626" }]}>
              Delete Category
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <Pressable
        style={{ flex: 1 }}
        onPress={() => {
          if (menuCategory) setMenuCategory(null);
        }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.heading}>My Notes</Text>
              <Text style={styles.subtitle}>
                Organize your knowledge, one note at a time.
              </Text>
            </View>

            <View style={styles.headerIcon}>
              <NotebookPen color="#635BFF" size={25} />
            </View>
          </View>

          {/* SUMMARY */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Folder color="#635BFF" size={19} />
              </View>

              <Text style={styles.summaryNumber}>{categories.length}</Text>
              <Text style={styles.summaryLabel}>Categories</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <NotebookPen color="#0D9488" size={19} />
              </View>

              <Text style={styles.summaryNumber}>{totalPointNotes}</Text>
              <Text style={styles.summaryLabel}>Point Notes</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <BookOpen color="#F59E0B" size={19} />
              </View>

              <Text style={styles.summaryNumber}>{totalChapters}</Text>
              <Text style={styles.summaryLabel}>Chapters</Text>
            </View>
          </View>

          {/* CATEGORY HEADER */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Your Categories</Text>
              <Text style={styles.sectionSubtitle}>
                {categories.length} categories created
              </Text>
            </View>

            <Pressable
              style={styles.addButton}
              onPress={openCreateModal}
            >
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add New</Text>
            </Pressable>
          </View>

          {/* SEARCH */}
          <View style={styles.searchContainer}>
            <Search size={19} color="#94A3B8" />

            <TextInput
              style={styles.searchInput}
              placeholder="Search categories..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />

            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <X size={18} color="#64748B" />
              </Pressable>
            )}
          </View>

          {/* CATEGORY LIST */}
          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#635BFF" />
              <Text style={styles.stateText}>
                Loading your categories...
              </Text>
            </View>
          ) : filteredCategories.length > 0 ? (
            <View style={styles.categoryGrid}>
              {filteredCategories.map(renderCategory)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Layers size={34} color="#635BFF" />
              </View>

              <Text style={styles.emptyTitle}>
                {search ? "No categories found" : "No categories yet"}
              </Text>

              <Text style={styles.emptyDescription}>
                {search
                  ? "Try another search term."
                  : "Create your first category to start organizing your notes."}
              </Text>

              {!search && (
                <Pressable
                  style={styles.emptyButton}
                  onPress={openCreateModal}
                >
                  <Plus size={17} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>Create Category</Text>
                </Pressable>
              )}
            </View>
          )}

          <Text style={styles.footerText}>
            Your knowledge, organized in one place.
          </Text>
        </ScrollView>
      </Pressable>

      {/* CREATE / EDIT MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={closeModal}
          />

          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingCategory ? "Edit Category" : "Create Category"}
                </Text>

                <Text style={styles.modalSubtitle}>
                  Organize your notes by subject or topic.
                </Text>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={closeModal}
              >
                <X size={20} color="#64748B" />
              </Pressable>
            </View>

            {/* NAME */}
            <Text style={styles.inputLabel}>Category Name *</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Mathematics"
              placeholderTextColor="#94A3B8"
              value={categoryName}
              onChangeText={setCategoryName}
              maxLength={50}
              autoFocus
              editable={!submitting}
            />

            <Text style={styles.inputHint}>
              {categoryName.length}/50 characters
            </Text>

            {/* COLOR */}
            <Text style={styles.inputLabel}>Choose Category Color</Text>

            <View style={styles.colorContainer}>
              {COLORS.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColor,
                  ]}
                  onPress={() => setSelectedColor(color)}
                  disabled={submitting}
                >
                  {selectedColor === color && (
                    <Check size={19} color="#FFFFFF" />
                  )}
                </Pressable>
              ))}
            </View>

            {/* PREVIEW */}
            <Text style={styles.inputLabel}>Preview</Text>

            <View style={styles.previewCard}>
              <View
                style={[
                  styles.previewIcon,
                  { backgroundColor: `${selectedColor}18` },
                ]}
              >
                <Folder color={selectedColor} size={22} />
              </View>

              <Text style={styles.previewName}>
                {categoryName.trim() || "Category Name"}
              </Text>
            </View>

            {/* ACTIONS */}
            <Pressable
              style={[
                styles.modalSaveButton,
                (submitting || !categoryName.trim()) &&
                  styles.disabledButton,
              ]}
              onPress={handleSaveCategory}
              disabled={submitting || !categoryName.trim()}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Check size={19} color="#FFFFFF" />
                  <Text style={styles.modalSaveText}>
                    {editingCategory ? "Update Category" : "Create Category"}
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={closeModal}
              disabled={submitting}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 35,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },

  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: "#172033",
  },

  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 6,
  },

  headerIcon: {
    backgroundColor: "#F0EFFF",
    padding: 12,
    borderRadius: 14,
  },

  summaryContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 30,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  summaryIcon: {
    marginBottom: 10,
  },

  summaryNumber: {
    fontSize: 21,
    fontWeight: "700",
    color: "#172033",
  },

  summaryLabel: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 3,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#172033",
  },

  sectionSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#635BFF",
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 11,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 13,
    paddingHorizontal: 14,
    marginBottom: 18,
  },

  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: "#172033",
  },

  categoryGrid: {
    gap: 13,
  },

  categoryCard: {
    backgroundColor: "#FFFFFF",
    padding: 17,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    position: "relative",
  },

  categoryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  categoryMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  categoryInfo: {
    flex: 1,
  },

  categoryIcon: {
    padding: 12,
    borderRadius: 13,
  },

  menuButton: {
    padding: 5,
  },

  categoryName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#172033",
  },

  categoryHint: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 3,
  },

  categoryStats: {
    flexDirection: "row",
    gap: 18,
    marginTop: 4,
  },

  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  statText: {
    fontSize: 11,
    color: "#64748B",
  },

  menuDropdown: {
    position: "absolute",
    right: 15,
    top: 48,
    zIndex: 10,
    elevation: 8,
    backgroundColor: "#FFFFFF",
    width: 180,
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 11,
  },

  menuText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "500",
  },

  menuDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
  },

  centerState: {
    alignItems: "center",
    paddingVertical: 60,
  },

  stateText: {
    color: "#64748B",
    marginTop: 12,
    fontSize: 13,
  },

  emptyState: {
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 45,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  emptyIcon: {
    backgroundColor: "#F0EFFF",
    padding: 17,
    borderRadius: 18,
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#172033",
  },

  emptyDescription: {
    fontSize: 12,
    lineHeight: 19,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
  },

  emptyButton: {
    backgroundColor: "#635BFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },

  footerText: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 25,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },

  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 22,
    paddingBottom: Platform.OS === "ios" ? 35 : 25,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 25,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#172033",
  },

  modalSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 5,
  },

  closeButton: {
    backgroundColor: "#F1F5F9",
    padding: 8,
    borderRadius: 10,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 10,
    marginTop: 14,
  },

  modalInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    color: "#172033",
    fontSize: 14,
  },

  inputHint: {
    fontSize: 10,
    color: "#94A3B8",
    textAlign: "right",
    marginTop: 5,
  },

  colorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 13,
    marginVertical: 5,
  },

  colorOption: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedColor: {
    borderWidth: 3,
    borderColor: "#CBD5E1",
  },

  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8FAFC",
    padding: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  previewIcon: {
    padding: 10,
    borderRadius: 10,
  },

  previewName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#172033",
  },

  modalSaveButton: {
    backgroundColor: "#635BFF",
    height: 51,
    borderRadius: 13,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
  },

  modalSaveText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  disabledButton: {
    opacity: 0.5,
  },

  cancelButton: {
    alignItems: "center",
    padding: 14,
    marginTop: 5,
  },

  cancelText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
});