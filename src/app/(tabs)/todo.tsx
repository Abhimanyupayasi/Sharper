import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import { SafeAreaView } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";

import {
  Plus,
  Check,
  Trash2,
  CalendarDays,
  Circle,
  X,
  ListTodo,
  Bell,
  BellOff,
  ArrowRight,
  RotateCcw,
} from "lucide-react-native";

import {
  Task,
  getTasks,
  createTask,
  updateTask,
  removeTask,
} from "../../database/repositories/todo.repository";

import {
  scheduleTaskReminder,
  cancelTaskReminder,
} from "../../services/notifications";

type Filter = "Today" | "Upcoming" | "Completed";
type Priority = Task["priority"];

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getToday = () => formatDate(new Date());

const formatTime = (value: string | null) => {
  if (!value) return "";

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDisplayDate = (value: string) => {
  if (value === getToday()) return "Today";

  return new Date(`${value}T12:00:00`).toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function TodoScreen() {
  const db = useSQLiteContext();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("Today");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Create task modal
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [dueDate, setDueDate] = useState(new Date());

  // Date picker
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  // Reminder picker
  const [timePickerTask, setTimePickerTask] = useState<Task | null>(null);
  const [reminderTime, setReminderTime] = useState(new Date());

  const today = getToday();

  // Load tasks
  const loadTasks = useCallback(async () => {
    try {
      const result = await getTasks(db);
      setTasks(result);
    } catch (error) {
      console.error("Todo load error:", error);
      Alert.alert("Error", "Unable to load your tasks.");
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Progress
  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed === 1).length,
    [tasks]
  );

  const progress =
    tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (filter === "Completed") {
      return tasks.filter((task) => task.completed === 1);
    }

    if (filter === "Upcoming") {
      return tasks.filter(
        (task) => task.completed === 0 && task.date > today
      );
    }

    return tasks.filter(
      (task) => task.completed === 0 && task.date <= today
    );
  }, [tasks, filter, today]);

  // Open create task modal from either button
  const openAddTask = useCallback(() => {
    setTitle("");
    setDescription("");
    setPriority("Medium");

    const defaultDate = new Date();

    if (filter === "Upcoming") {
      defaultDate.setDate(defaultDate.getDate() + 1);
    }

    setDueDate(defaultDate);
    setDatePickerVisible(false);
    setModalVisible(true);
  }, [filter]);

  // Create task
  const addTask = async () => {
    if (!title.trim() || saving) return;

    setSaving(true);

    try {
      const task: Task = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: title.trim(),
        description: description.trim(),
        completed: 0,
        priority,
        date: formatDate(dueDate),
        reminder_at: null,
        notification_id: null,
        created_at: new Date().toISOString(),
      };

      await createTask(db, task);

      setTitle("");
      setDescription("");
      setPriority("Medium");
      setDueDate(new Date());
      setModalVisible(false);
      setDatePickerVisible(false);

      setFilter(task.date > today ? "Upcoming" : "Today");

      await loadTasks();
    } catch (error) {
      console.error("Create task error:", error);
      Alert.alert("Error", "Unable to create this task.");
    } finally {
      setSaving(false);
    }
  };

  // Complete or reopen task
  const toggleTask = async (task: Task) => {
    try {
      const completed = task.completed === 1 ? 0 : 1;

      if (completed) {
        await cancelTaskReminder(task.notification_id);

        await updateTask(db, task.id, {
          completed,
          reminder_at: null,
          notification_id: null,
        });
      } else {
        await updateTask(db, task.id, { completed });
      }

      await loadTasks();
    } catch (error) {
      console.error("Toggle task error:", error);
      Alert.alert("Error", "Unable to update this task.");
    }
  };

  // Move upcoming task to today
  const moveToToday = async (task: Task) => {
    try {
      await cancelTaskReminder(task.notification_id);

      await updateTask(db, task.id, {
        date: today,
        reminder_at: null,
        notification_id: null,
      });

      setFilter("Today");
      await loadTasks();
    } catch (error) {
      console.error("Move task error:", error);
      Alert.alert("Error", "Unable to move this task.");
    }
  };

  // Delete task
  const deleteTask = (task: Task) => {
    Alert.alert("Delete task", `Delete "${task.title}"?`, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelTaskReminder(task.notification_id);
            await removeTask(db, task.id);
            await loadTasks();
          } catch (error) {
            console.error("Delete task error:", error);
            Alert.alert("Error", "Unable to delete this task.");
          }
        },
      },
    ]);
  };

  // Open reminder picker
  const openReminderPicker = (task: Task) => {
    const initial = task.reminder_at
      ? new Date(task.reminder_at)
      : new Date();

    if (!task.reminder_at) {
      initial.setSeconds(0, 0);
      initial.setMinutes(Math.ceil(initial.getMinutes() / 5) * 5);
    }

    setReminderTime(initial);
    setTimePickerTask(task);
  };

  // Save reminder
  const saveReminder = async (task: Task, selectedTime: Date) => {
    const reminderDate = new Date(`${task.date}T00:00:00`);

    reminderDate.setHours(
      selectedTime.getHours(),
      selectedTime.getMinutes(),
      0,
      0
    );

    if (reminderDate.getTime() <= Date.now()) {
      Alert.alert("Invalid time", "Choose a reminder time in the future.");
      return;
    }

    try {
      await cancelTaskReminder(task.notification_id);

      const notificationId = await scheduleTaskReminder(
        task.title,
        task.description,
        reminderDate
      );

      await updateTask(db, task.id, {
        reminder_at: reminderDate.toISOString(),
        notification_id: notificationId,
      });

      await loadTasks();

      Alert.alert(
        "Reminder set",
        `You'll be reminded at ${formatTime(reminderDate.toISOString())}.`
      );
    } catch (error) {
      console.error("Reminder error:", error);

      Alert.alert(
        "Reminder failed",
        error instanceof Error
          ? error.message
          : "Unable to schedule reminder."
      );
    }
  };

  // Reminder time picker change
  const onReminderTimeChange = async (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === "android" && event.type !== "set") {
      setTimePickerTask(null);
      return;
    }

    if (!selectedDate) return;

    setReminderTime(selectedDate);

    if (Platform.OS === "android" && timePickerTask) {
      const task = timePickerTask;
      setTimePickerTask(null);
      await saveReminder(task, selectedDate);
    }
  };

  // Remove reminder
  const removeReminder = async (task: Task) => {
    try {
      await cancelTaskReminder(task.notification_id);

      await updateTask(db, task.id, {
        reminder_at: null,
        notification_id: null,
      });

      await loadTasks();
    } catch (error) {
      console.error("Remove reminder error:", error);
      Alert.alert("Error", "Unable to remove reminder.");
    }
  };

  // Task card
  const renderTask = (task: Task) => (
    <View key={task.id} style={styles.taskCard}>
      <Pressable
        style={styles.checkButton}
        onPress={() => toggleTask(task)}
        hitSlop={8}
      >
        {task.completed === 1 ? (
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
            task.completed === 1 && styles.completedTaskTitle,
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
              {formatDisplayDate(task.date)}
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
                task.priority === "Medium" && styles.mediumPriorityText,
                task.priority === "Low" && styles.lowPriorityText,
              ]}
            >
              {task.priority}
            </Text>
          </View>
        </View>

        {task.reminder_at && task.completed === 0 && (
          <View style={styles.reminderMeta}>
            <Bell size={12} color="#635BFF" />
            <Text style={styles.reminderText}>
              Reminder at {formatTime(task.reminder_at)}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          {filter === "Upcoming" && (
            <Pressable
              style={styles.actionButton}
              onPress={() => moveToToday(task)}
              hitSlop={6}
            >
              <ArrowRight size={13} color="#635BFF" />
              <Text style={styles.actionText}>Move to Today</Text>
            </Pressable>
          )}

          {filter !== "Completed" && (
            <Pressable
              style={styles.actionButton}
              onPress={() => toggleTask(task)}
              hitSlop={6}
            >
              <Check size={13} color="#16A34A" />
              <Text style={[styles.actionText, { color: "#16A34A" }]}>
                Complete
              </Text>
            </Pressable>
          )}

          {filter === "Completed" && (
            <Pressable
              style={styles.actionButton}
              onPress={() => toggleTask(task)}
              hitSlop={6}
            >
              <RotateCcw size={13} color="#635BFF" />
              <Text style={styles.actionText}>Reopen</Text>
            </Pressable>
          )}

          {filter === "Today" && task.completed === 0 && (
            <Pressable
              style={styles.actionButton}
              onPress={() =>
                task.reminder_at
                  ? removeReminder(task)
                  : openReminderPicker(task)
              }
              hitSlop={6}
            >
              {task.reminder_at ? (
                <BellOff size={13} color="#D97706" />
              ) : (
                <Bell size={13} color="#635BFF" />
              )}

              <Text style={styles.actionText}>
                {task.reminder_at ? "Remove alarm" : "Set alarm"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <Pressable
        style={styles.deleteButton}
        onPress={() => deleteTask(task)}
        hitSlop={8}
      >
        <Trash2 size={17} color="#94A3B8" />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Tasks</Text>
            <Text style={styles.headerSubtitle}>
              Stay focused. Get things done.
            </Text>
          </View>

          {/* Top Add Task button */}
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={openAddTask}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Task</Text>
          </Pressable>
        </View>

        {/* Task content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Progress card */}
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
                <Text style={styles.progressTotal}>
                  {" "}/ {tasks.length} tasks
                </Text>
              </Text>

              <Text style={styles.progressPercent}>
                {Math.round(progress)}%
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%` },
                ]}
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

          {/* Section heading */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{filter} Tasks</Text>
            <Text style={styles.taskCount}>
              {filteredTasks.length} tasks
            </Text>
          </View>

          {/* Task list */}
          {loading ? (
            <ActivityIndicator
              color="#635BFF"
              style={{ marginTop: 35 }}
              size="large"
            />
          ) : filteredTasks.length === 0 ? (
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
            filteredTasks.map(renderTask)
          )}
        </ScrollView>

        {/* Floating Add Task button */}
        <Pressable
          onPress={openAddTask}
          style={({ pressed }) => [
            styles.fab,
            pressed && styles.fabPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Create task"
        >
          <Plus size={29} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>

        {/* Create task modal */}
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

                <Pressable
                  onPress={() => {
                    setModalVisible(false);
                    setDatePickerVisible(false);
                  }}
                  hitSlop={10}
                >
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
                returnKeyType="next"
                maxLength={120}
              />

              <Text style={styles.fieldLabel}>
                DESCRIPTION (OPTIONAL)
              </Text>

              <TextInput
                style={[styles.textInput, styles.descriptionInput]}
                placeholder="Add more details..."
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={500}
              />

              <Text style={styles.fieldLabel}>DUE DATE</Text>

              <Pressable
                style={styles.dateButton}
                onPress={() => setDatePickerVisible(true)}
              >
                <CalendarDays size={17} color="#635BFF" />

                <Text style={styles.dateButtonText}>
                  {formatDisplayDate(formatDate(dueDate))}
                </Text>
              </Pressable>

              {datePickerVisible && (
                <DateTimePicker
                  value={dueDate}
                  mode="date"
                  minimumDate={new Date(new Date().setHours(0, 0, 0, 0))}
                  display="default"
                  onChange={(
                    event: DateTimePickerEvent,
                    selected?: Date
                  ) => {
                    if (Platform.OS === "android") {
                      setDatePickerVisible(false);
                    }

                    if (event.type === "set" && selected) {
                      setDueDate(selected);
                    }
                  }}
                />
              )}

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
                  (!title.trim() || saving) && styles.createButtonDisabled,
                ]}
                onPress={addTask}
                disabled={!title.trim() || saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Plus size={18} color="#FFFFFF" />
                    <Text style={styles.createButtonText}>
                      Create Task
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Reminder time picker */}
        {timePickerTask && (
          <Modal
            visible
            transparent
            animationType="fade"
            onRequestClose={() => setTimePickerTask(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.reminderModal}>
                <Text style={styles.modalTitle}>Set task alarm</Text>

                <Text style={styles.modalDescription}>
                  {timePickerTask.title}
                </Text>

                <DateTimePicker
                  value={reminderTime}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onReminderTimeChange}
                />

                {Platform.OS === "ios" && (
                  <Pressable
                    style={styles.createButton}
                    onPress={async () => {
                      const task = timePickerTask;
                      setTimePickerTask(null);
                      await saveReminder(task, reminderTime);
                    }}
                  >
                    <Bell size={17} color="#FFFFFF" />
                    <Text style={styles.createButtonText}>
                      Save alarm
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  style={styles.cancelButton}
                  onPress={() => setTimePickerTask(null)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#172033",
  },

  headerSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#635BFF",
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 12,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  buttonPressed: {
    opacity: 0.8,
  },

  content: {
    padding: 18,
    paddingBottom: 110,
  },

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

  progressNumber: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },

  progressTotal: {
    color: "#DAD8FF",
    fontSize: 12,
    fontWeight: "500",
  },

  progressPercent: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

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

  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },

  activeFilterText: {
    color: "#635BFF",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#172033",
  },

  taskCount: {
    fontSize: 11,
    color: "#94A3B8",
  },

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

  checkButton: {
    paddingTop: 1,
  },

  checkedCircle: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },

  taskDetails: {
    flex: 1,
  },

  taskTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#172033",
  },

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

  dateMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  metaText: {
    color: "#94A3B8",
    fontSize: 10,
  },

  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  highPriority: {
    backgroundColor: "#FEE2E2",
  },

  mediumPriority: {
    backgroundColor: "#FEF3C7",
  },

  lowPriority: {
    backgroundColor: "#DCFCE7",
  },

  priorityText: {
    fontSize: 9,
    fontWeight: "700",
  },

  highPriorityText: {
    color: "#DC2626",
  },

  mediumPriorityText: {
    color: "#B45309",
  },

  lowPriorityText: {
    color: "#15803D",
  },

  deleteButton: {
    padding: 5,
  },

  reminderMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 9,
  },

  reminderText: {
    color: "#635BFF",
    fontSize: 11,
    fontWeight: "600",
  },

  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  actionText: {
    color: "#635BFF",
    fontSize: 10,
    fontWeight: "700",
  },

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

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#172033",
  },

  emptyDescription: {
    fontSize: 12,
    lineHeight: 19,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 6,
  },

  // Floating button
  fab: {
    position: "absolute",
    right: 22,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#635BFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#635BFF",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 100,
  },

  fabPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.94 }],
  },

  // Modals
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
    marginBottom: 15,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#172033",
  },

  modalDescription: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 7,
  },

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

  descriptionInput: {
    minHeight: 75,
    textAlignVertical: "top",
  },

  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 13,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },

  dateButtonText: {
    color: "#172033",
    fontSize: 13,
    fontWeight: "600",
  },

  priorityOptions: {
    flexDirection: "row",
    gap: 9,
  },

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

  selectedPriorityText: {
    color: "#635BFF",
  },

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

  createButtonDisabled: {
    opacity: 0.45,
  },

  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  reminderModal: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },

  cancelButton: {
    alignItems: "center",
    padding: 13,
    marginTop: 5,
  },

  cancelButtonText: {
    color: "#64748B",
    fontWeight: "700",
  },
});