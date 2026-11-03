
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Search,
  Plus,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  Lightbulb,
  FolderOpen,
  X,
} from "lucide-react-native";

type Category = {
  id: string;
  name: string;
  description: string;
  pointCount: number;
  chapterCount: number;
  color: string;
};

const initialCategories: Category[] = [
  {
    id: "1",
    name: "Mathematics",
    description: "Formulas and concepts",
    pointCount: 12,
    chapterCount: 5,
    color: "#635BFF",
  },
  {
    id: "2",
    name: "Chemistry",
    description: "Reactions and chapters",
    pointCount: 8,
    chapterCount: 7,
    color: "#0D9488",
  },
  {
    id: "3",
    name: "Physics",
    description: "Laws and definitions",
    pointCount: 15,
    chapterCount: 4,
    color: "#EA8A24",
  },
];

export default function NotesScreen() {
  const [categories, setCategories] = useState(initialCategories);
  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);
  const [search, setSearch] = useState("");

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(search.toLowerCase())
  );

  const addCategory = () => {
    const name = newCategory.trim();

    if (!name) return;

    if (categories.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert("Already exists", "This category already exists.");
      return;
    }

    setCategories((previous) => [
      ...previous,
      {
        id: Date.now().toString(),
        name,
        description: "Your personal collection",
        pointCount: 0,
        chapterCount: 0,
        color: "#635BFF",
      },
    ]);

    setNewCategory("");
    setShowAddCategory(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.heading}>My Notes</Text>
            <Text style={styles.subtitle}>
              Your personal knowledge library.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <BookOpen color="#635BFF" size={24} />
          </View>
        </View>

        {/* CATEGORY DETAIL */}
        {selectedCategory ? (
          <>
            <Pressable
              style={styles.backButton}
              onPress={() => setSelectedCategory(null)}
            >
              <ArrowLeft size={18} color="#635BFF" />
              <Text style={styles.backText}>All Categories</Text>
            </Pressable>

            <View style={styles.categoryDetail}>
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: selectedCategory.color + "18" },
                ]}
              >
                <FolderOpen color={selectedCategory.color} size={30} />
              </View>

              <Text style={styles.detailTitle}>
                {selectedCategory.name}
              </Text>

              <Text style={styles.subtitle}>
                {selectedCategory.description}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Choose note type</Text>

            <Pressable
              style={styles.typeCard}
              onPress={() =>
                Alert.alert("Point Notes", "We'll build the point notes editor next.")
              }
            >
              <View style={[styles.typeIcon, { backgroundColor: "#EEF2FF" }]}>
                <Lightbulb color="#635BFF" size={25} />
              </View>

              <View style={styles.typeContent}>
                <Text style={styles.typeTitle}>Point Notes</Text>
                <Text style={styles.typeDescription}>
                  Short notes, ideas, definitions and important points.
                </Text>
                <Text style={styles.countText}>
                  {selectedCategory.pointCount} notes
                </Text>
              </View>

              <ChevronRight color="#94A3B8" size={21} />
            </Pressable>

            <Pressable
              style={styles.typeCard}
              onPress={() =>
                Alert.alert("Chapter Notes", "We'll build the chapter notes editor next.")
              }
            >
              <View style={[styles.typeIcon, { backgroundColor: "#E0F2FE" }]}>
                <BookOpen color="#0284C7" size={25} />
              </View>

              <View style={styles.typeContent}>
                <Text style={styles.typeTitle}>Chapter Notes</Text>
                <Text style={styles.typeDescription}>
                  Organize detailed notes chapter by chapter.
                </Text>
                <Text style={styles.countText}>
                  {selectedCategory.chapterCount} chapters
                </Text>
              </View>

              <ChevronRight color="#94A3B8" size={21} />
            </Pressable>
          </>
        ) : (
          <>
            {/* SEARCH */}
            <View style={styles.searchBox}>
              <Search color="#94A3B8" size={20} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search categories..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch("")}>
                  <X color="#94A3B8" size={18} />
                </Pressable>
              )}
            </View>

            {/* SUMMARY */}
            <View style={styles.summaryCard}>
              <View>
                <Text style={styles.summaryLabel}>YOUR LIBRARY</Text>
                <Text style={styles.summaryNumber}>
                  {categories.length} Categories
                </Text>
                <Text style={styles.summaryDescription}>
                  Keep everything organized.
                </Text>
              </View>

              <BookOpen color="#FFFFFF" size={35} />
            </View>

            {/* CATEGORY HEADER */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>

              <Pressable
                style={styles.addButton}
                onPress={() => setShowAddCategory(true)}
              >
                <Plus color="#FFFFFF" size={19} />
                <Text style={styles.addButtonText}>New</Text>
              </Pressable>
            </View>

            {/* ADD CATEGORY */}
            {showAddCategory && (
              <View style={styles.addCategoryCard}>
                <Text style={styles.addCategoryTitle}>
                  Create a category
                </Text>

                <TextInput
                  style={styles.categoryInput}
                  placeholder="Category name"
                  placeholderTextColor="#94A3B8"
                  value={newCategory}
                  onChangeText={setNewCategory}
                  autoFocus
                />

                <View style={styles.addActions}>
                  <Pressable
                    onPress={() => {
                      setShowAddCategory(false);
                      setNewCategory("");
                    }}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>

                  <Pressable style={styles.createButton} onPress={addCategory}>
                    <Text style={styles.createText}>Create</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* CATEGORY LIST */}
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <Pressable
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => setSelectedCategory(category)}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: category.color + "18" },
                    ]}
                  >
                    <FolderOpen color={category.color} size={24} />
                  </View>

                  <View style={styles.categoryContent}>
                    <Text style={styles.categoryName}>
                      {category.name}
                    </Text>

                    <Text style={styles.categoryDescription}>
                      {category.description}
                    </Text>

                    <Text style={styles.categoryCounts}>
                      {category.pointCount} point notes · {category.chapterCount} chapters
                    </Text>
                  </View>

                  <ChevronRight color="#94A3B8" size={21} />
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyText}>
                No matching categories found.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingBottom: 35 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  heading: { fontSize: 27, fontWeight: "700", color: "#172033" },
  subtitle: { fontSize: 13, color: "#64748B", marginTop: 6 },
  headerIcon: {
    backgroundColor: "#EFEEFF",
    padding: 13,
    borderRadius: 15,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 15,
    borderRadius: 14,
    height: 53,
    gap: 12,
  },
  searchInput: { flex: 1, color: "#172033", fontSize: 14 },
  summaryCard: {
    backgroundColor: "#635BFF",
    borderRadius: 18,
    padding: 20,
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: {
    color: "#DAD8FF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  summaryNumber: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "700",
    marginTop: 8,
  },
  summaryDescription: { color: "#E0DEFF", fontSize: 12, marginTop: 5 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 30,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#172033",
    marginBottom: 15,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#635BFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 11,
  },
  addButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 12 },
  categoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryIcon: {
    width: 49,
    height: 49,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryContent: { flex: 1 },
  categoryName: { color: "#172033", fontSize: 16, fontWeight: "700" },
  categoryDescription: { color: "#64748B", fontSize: 12, marginTop: 4 },
  categoryCounts: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 8,
  },
  addCategoryCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 15,
  },
  addCategoryTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: "#172033",
    marginBottom: 12,
  },
  categoryInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 11,
    padding: 13,
    color: "#172033",
  },
  addActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 20,
    marginTop: 15,
  },
  cancelText: { color: "#64748B", fontWeight: "600" },
  createButton: {
    backgroundColor: "#635BFF",
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 10,
  },
  createText: { color: "#FFFFFF", fontWeight: "600" },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 25,
  },
  backText: { color: "#635BFF", fontWeight: "600" },
  categoryDetail: { alignItems: "center", marginBottom: 30 },
  detailTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#172033",
    marginTop: 14,
  },
  typeCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 17,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 13,
  },
  typeIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  typeContent: { flex: 1 },
  typeTitle: { color: "#172033", fontSize: 16, fontWeight: "700" },
  typeDescription: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  countText: {
    color: "#635BFF",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 8,
  },
  emptyText: { textAlign: "center", color: "#64748B", marginTop: 35 },
});
