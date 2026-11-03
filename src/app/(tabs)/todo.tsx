import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Plus,
  Check,
  Trash2,
  CalendarDays,
  Circle,
  X,
  ListTodo,
  Clock3,
} from "lucide-react-native";

type Task = {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  priority: "High" | "Medium" | "Low";
  date: string;
};

const today = new Date().toISOString().slice(0, 10);

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Complete React Native UI",
    description: "Finish the main screens of Sharper Notes",
    completed: false,
    priority: "High",
    date: today,
  },
  {
    id: 2,
    title: "Study Java 8 features",
    description: "Revise Stream API and Lambda expressions",
    completed: false,
    priority: "Medium",
    date: today,
  },
  {
    id: 3,
    title: "Read database notes",
    description: "Revise SQLite basics",
    completed: true,
    priority: "Low",
    date: today,
  },
  {
    id: 4,
    title: "Plan upcoming features",
    description: "Prepare the next development milestone",
    completed: false,
    priority: "Medium",
    date: "2099-12-31",
  },
];

export default function TodoScreen() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<"Today" | "Upcoming" | "Completed">(
    "Today"
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("Medium");

  const completedCount = tasks.filter((task) => task.completed).length;
  const progress =
    tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const filteredTasks = useMemo(() => {
    if (filter === "Completed") {
      return tasks.filter((task) => task.completed);
    }

    if (filter === "Upcoming") {
      return tasks.filter(
        (task) => !task.completed && task.date > today
      );
    }

    return tasks.filter(
      (task) => !task.completed && task.date <= today
    );
  }, [tasks, filter]);

  const addTask = () => {
    if (!title.trim()) return;

    const newTask: Task = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim(),
      completed: false,
      priority,
      date: today,
    };

    setTasks((previous) => [newTask, ...previous]);
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setModalVisible(false);
    setFilter("Today");
  };

  const toggleTask = (id: number) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: number) => {
    setTasks((previous) => previous.filter((task) => task.id !== id));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Tasks</Text>
            <Text style={styles.headerSubtitle}>
              Stay focused. Get things done.
            </Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Task</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Progress */}
          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <View>
                <Text style={styles.progressLabel}>YOUR PROGRESS</Text>
                <Text style={styles.progressTitle}>Keep it going!</Text>
              </View>

              <View style={styles.progressIcon}>
                <ListTodo size={23} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.progressStats}>
              <Text style={styles.progressNumber}>
                {completedCount}
                <Text style={styles.progressTotal}> / {tasks.length} tasks</Text>
              </Text>
              <Text style={styles.progressPercent}>
                {Math.round(progress)}%
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${progress}%` }]}
              />
            </View>
          </View>

          {/* Filters */}
          <View style={styles.filterContainer}>
            {(["Today", "Upcoming", "Completed"] as const).map((item) => (
              <Pressable
                key={item}
                onPress={() => setFilter(item)}
                style={[
                  styles.filterButton,
                  filter === item && styles.activeFilter,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === item && styles.activeFilterText,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Task heading */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{filter} Tasks</Text>
            <Text style={styles.taskCount}>
              {filteredTasks.length} tasks
            </Text>
          </View>

          {/* Task list */}
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Check size={28} color="#635BFF" />
              </View>
              <Text style={styles.emptyTitle}>Nothing here!</Text>
              <Text style={styles.emptyDescription}>
                {filter === "Completed"
                  ? "Completed tasks will appear here."
                  : "You're all caught up. Add a task when you're ready."}
              </Text>
            </View>
          ) : (
            filteredTasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <Pressable
                  style={styles.checkButton}
                  onPress={() => toggleTask(task.id)}
                >
                  {task.completed ? (
                    <View style={styles.checkedCircle}>
                      <Check size={14} color="#FFFFFF" />
                    </View>
                  ) : (
                    <Circle size={23} color="#CBD5E1" />
                  )}
                </Pressable>

                <View style={styles.taskDetails}>
                  <Text
                    style={[
                      styles.taskTitle,
                      task.completed && styles.completedTaskTitle,
                    ]}
                  >
                    {task.title}
                  </Text>

                  {!!task.description && (
                    <Text style={styles.taskDescription}>
                      {task.description}
                    </Text>
                  )}

                  <View style={styles.taskMeta}>
                    <View style={styles.dateMeta}>
                      <CalendarDays size={12} color="#94A3B8" />
                      <Text style={styles.metaText}>
                        {task.date === today ? "Today" : task.date}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.priorityBadge,
                        task.priority === "High" && styles.highPriority,
                        task.priority === "Medium" && styles.mediumPriority,
                        task.priority === "Low" && styles.lowPriority,
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          task.priority === "High" && styles.highPriorityText,
                          task.priority === "Medium" &&
                            styles.mediumPriorityText,
                          task.priority === "Low" && styles.lowPriorityText,
                        ]}
                      >
                        {task.priority}
                      </Text>
                    </View>
                  </View>
                </View>

                <Pressable
                  style={styles.deleteButton}
                  onPress={() => deleteTask(task.id)}
                >
                  <Trash2 size={17} color="#94A3B8" />
                </Pressable>
              </View>
            ))
          )}

          <View style={styles.bottomHint}>
            <Clock3 size={14} color="#94A3B8" />
            <Text style={styles.bottomHintText}>
              Your tasks will be saved locally on your device.
            </Text>
          </View>
        </ScrollView>

        {/* Add task modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create a Task</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <X size={22} color="#64748B" />
                </Pressable>
              </View>

              <Text style={styles.fieldLabel}>TASK TITLE</Text>
              <TextInput
                style={styles.textInput}
                placeholder="What do you need to do?"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.fieldLabel}>DESCRIPTION (OPTIONAL)</Text>
              <TextInput
                style={[styles.textInput, styles.descriptionInput]}
                placeholder="Add more details..."
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <Text style={styles.fieldLabel}>PRIORITY</Text>
              <View style={styles.priorityOptions}>
                {(["Low", "Medium", "High"] as const).map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setPriority(item)}
                    style={[
                      styles.priorityOption,
                      priority === item && styles.selectedPriorityOption,
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityOptionText,
                        priority === item && styles.selectedPriorityText,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={[
                  styles.createButton,
                  !title.trim() && styles.createButtonDisabled,
                ]}
                onPress={addTask}
                disabled={!title.trim()}
              >
                <Plus size={18} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Create Task</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 23, fontWeight: "800", color: "#172033" },
  headerSubtitle: { fontSize: 12, color: "#94A3B8", marginTop: 4 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#635BFF",
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 12,
  },
  addButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  content: { padding: 18, paddingBottom: 30 },
  progressCard: {
    backgroundColor: "#635BFF",
    padding: 19,
    borderRadius: 20,
    marginBottom: 22,
  },
  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    color: "#DAD8FF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  progressTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "700",
    marginTop: 6,
  },
  progressIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#817AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 21,
    marginBottom: 9,
  },
  progressNumber: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" },
  progressTotal: { color: "#DAD8FF", fontSize: 12, fontWeight: "500" },
  progressPercent: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  progressTrack: {
    height: 7,
    borderRadius: 10,
    backgroundColor: "#928CFF",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#EDEFF5",
    padding: 4,
    borderRadius: 13,
    marginBottom: 25,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  activeFilter: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  activeFilterText: { color: "#635BFF" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#172033" },
  taskCount: { fontSize: 11, color: "#94A3B8" },
  taskCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8ECF2",
    borderRadius: 15,
    padding: 14,
    marginBottom: 11,
    gap: 11,
  },
  checkButton: { paddingTop: 1 },
  checkedCircle: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  taskDetails: { flex: 1 },
  taskTitle: { fontSize: 13, fontWeight: "700", color: "#172033" },
  completedTaskTitle: {
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  taskDescription: {
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  dateMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: "#94A3B8", fontSize: 10 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  highPriority: { backgroundColor: "#FEE2E2" },
  mediumPriority: { backgroundColor: "#FEF3C7" },
  lowPriority: { backgroundColor: "#DCFCE7" },
  priorityText: { fontSize: 9, fontWeight: "700" },
  highPriorityText: { color: "#DC2626" },
  mediumPriorityText: { color: "#B45309" },
  lowPriorityText: { color: "#15803D" },
  deleteButton: { padding: 5 },
  emptyState: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 30,
    borderRadius: 16,
    marginTop: 5,
  },
  emptyIcon: {
    width: 55,
    height: 55,
    borderRadius: 18,
    backgroundColor: "#EEEDFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#172033" },
  emptyDescription: {
    fontSize: 12,
    lineHeight: 19,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 6,
  },
  bottomHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
  },
  bottomHintText: { fontSize: 10, color: "#94A3B8" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    paddingBottom: 35,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#172033" },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.7,
    marginBottom: 9,
    marginTop: 14,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 13,
    fontSize: 13,
    color: "#172033",
  },
  descriptionInput: { minHeight: 75, textAlignVertical: "top" },
  priorityOptions: { flexDirection: "row", gap: 9 },
  priorityOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: 10,
  },
  selectedPriorityOption: {
    borderColor: "#635BFF",
    backgroundColor: "#F0EFFF",
  },
  priorityOptionText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  selectedPriorityText: { color: "#635BFF" },
  createButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#635BFF",
    padding: 15,
    borderRadius: 12,
    marginTop: 25,
  },
  createButtonDisabled: { opacity: 0.45 },
  createButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
