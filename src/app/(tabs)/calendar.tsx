
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CalendarDays,
  ChevronDown,
  Save,
  Trash2,
  FileText,
} from "lucide-react-native";

import { useSQLiteContext } from "expo-sqlite";

import {
  getDailyNote,
  getAllDailyNotes,
  saveDailyNote,
  deleteDailyNote,
} from "../../database/repositories/calendar.repository";

// Convert date to local YYYY-MM-DD.
// Avoid toISOString() because it converts to UTC.
const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function CalendarScreen() {
  const db = useSQLiteContext();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [hasSavedNote, setHasSavedNote] = useState(false);
  const [savedDaysCount, setSavedDaysCount] = useState(0);

  const dateKey = getDateKey(selectedDate);

  const formattedDate = selectedDate.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // READ: Load the note whenever the selected date changes.
  useEffect(() => {
    let isActive = true;

    const loadDailyNote = async () => {
      try {
        setLoading(true);
        setNote("");
        setHasSavedNote(false);

        const result = await getDailyNote(db, dateKey);

        if (!isActive) return;

        if (result) {
          setNote(result.content);
          setHasSavedNote(true);
        }
      } catch (error) {
        console.error("Failed to load daily note:", error);

        if (isActive) {
          Alert.alert("Error", "Could not load your daily note.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadDailyNote();

    return () => {
      isActive = false;
    };
  }, [db, dateKey]);

  // READ: Get the total number of dates containing notes.
  const refreshSavedDaysCount = useCallback(async () => {
    try {
      const notes = await getAllDailyNotes(db);
      setSavedDaysCount(notes.length);
    } catch (error) {
      console.error("Failed to load saved days:", error);
    }
  }, [db]);

  useEffect(() => {
    refreshSavedDaysCount();
  }, [refreshSavedDaysCount]);

  // CREATE / UPDATE: Save or update the selected date's note.
  const handleSave = async () => {
    const trimmedNote = note.trim();

    if (!trimmedNote) {
      Alert.alert("Empty note", "Please write something before saving.");
      return;
    }

    try {
      setSaving(true);

      await saveDailyNote(db, dateKey, trimmedNote);

      setHasSavedNote(true);
      await refreshSavedDaysCount();

      Alert.alert(
        "Success",
        hasSavedNote
          ? "Your daily note has been updated."
          : "Your daily note has been saved."
      );
    } catch (error) {
      console.error("Failed to save daily note:", error);
      Alert.alert("Error", "Could not save your daily note.");
    } finally {
      setSaving(false);
    }
  };

  // DELETE: Delete the selected date's note.
  const handleDelete = () => {
    if (!hasSavedNote) return;

    Alert.alert(
      "Delete Daily Note",
      `Are you sure you want to delete the note for ${formattedDate}?`,
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
              setDeleting(true);

              await deleteDailyNote(db, dateKey);

              setNote("");
              setHasSavedNote(false);

              await refreshSavedDaysCount();

              Alert.alert("Deleted", "Your daily note has been deleted.");
            } catch (error) {
              console.error("Failed to delete daily note:", error);
              Alert.alert("Error", "Could not delete your daily note.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.heading}>My Calendar</Text>
            <Text style={styles.subtitle}>
              Your day, your thoughts, your memories.
            </Text>
          </View>

          <CalendarDays color="#635BFF" size={27} />
        </View>

        {/* Saved notes summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <FileText color="#635BFF" size={21} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.summaryNumber}>{savedDaysCount}</Text>
            <Text style={styles.summaryLabel}>
              Days with saved notes
            </Text>
          </View>
        </View>

        {/* Date selector */}
        <Text style={styles.sectionTitle}>Select a date</Text>

        <Pressable
          style={styles.dateCard}
          onPress={() => setShowPicker(true)}
        >
          <View style={styles.dateIcon}>
            <CalendarDays color="#635BFF" size={23} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.dateLabel}>SELECTED DATE</Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>

          <ChevronDown color="#64748B" size={20} />
        </Pressable>

        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            maximumDate={new Date(2100, 11, 31)}
            onChange={(_, date) => {
              setShowPicker(false);

              if (date) {
                setSelectedDate(date);
              }
            }}
          />
        )}

        {/* Daily note editor */}
        <View style={styles.editorHeader}>
          <Text style={styles.sectionTitle}>Daily Notes</Text>

          <Text style={styles.wordCount}>
            {note.length} characters
          </Text>
        </View>

        {/* Saved status */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: hasSavedNote ? "#16A34A" : "#94A3B8",
              },
            ]}
          />

          <Text style={styles.statusText}>
            {loading
              ? "Loading note..."
              : hasSavedNote
                ? "Saved note available"
                : "No note saved for this date"}
          </Text>
        </View>

        <TextInput
          style={[
            styles.editor,
            loading && styles.disabledEditor,
          ]}
          multiline
          textAlignVertical="top"
          editable={!loading && !saving && !deleting}
          placeholder="Write anything you want to remember today..."
          placeholderTextColor="#94A3B8"
          value={note}
          onChangeText={setNote}
        />

        {/* Save / Update */}
        <Pressable
          style={[
            styles.saveButton,
            (saving || loading || deleting) && styles.disabledButton,
          ]}
          disabled={saving || loading || deleting}
          onPress={handleSave}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Save color="#FFFFFF" size={19} />
              <Text style={styles.saveText}>
                {hasSavedNote ? "Update Daily Note" : "Save Daily Note"}
              </Text>
            </>
          )}
        </Pressable>

        {/* Delete */}
        {hasSavedNote && (
          <Pressable
            style={[
              styles.deleteButton,
              deleting && styles.disabledButton,
            ]}
            disabled={deleting || saving}
            onPress={handleDelete}
          >
            {deleting ? (
              <ActivityIndicator color="#DC2626" />
            ) : (
              <>
                <Trash2 color="#DC2626" size={18} />
                <Text style={styles.deleteText}>Delete Daily Note</Text>
              </>
            )}
          </Pressable>
        )}

        <Text style={styles.footerText}>
          Your daily memories, organized in one place.
        </Text>
      </ScrollView>
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
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: "#172033",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 6,
  },
  summaryCard: {
    backgroundColor: "#F0EFFF",
    borderRadius: 16,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 27,
  },
  summaryIcon: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
  },
  summaryNumber: {
    fontSize: 21,
    fontWeight: "700",
    color: "#635BFF",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#172033",
    marginBottom: 12,
  },
  dateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dateIcon: {
    backgroundColor: "#F0EFFF",
    padding: 12,
    borderRadius: 12,
  },
  dateLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
    marginBottom: 5,
  },
  dateText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#172033",
  },
  editorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
  },
  wordCount: {
    fontSize: 11,
    color: "#94A3B8",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#64748B",
  },
  editor: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    minHeight: 250,
    padding: 17,
    fontSize: 15,
    lineHeight: 24,
    color: "#172033",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  disabledEditor: {
    opacity: 0.6,
  },
  saveButton: {
    backgroundColor: "#635BFF",
    padding: 16,
    borderRadius: 14,
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  saveText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  deleteButton: {
    backgroundColor: "#FEF2F2",
    padding: 15,
    borderRadius: 14,
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  deleteText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.6,
  },
  footerText: {
    textAlign: "center",
    marginTop: 20,
    color: "#94A3B8",
    fontSize: 12,
  },
});
 