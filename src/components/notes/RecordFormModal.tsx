
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type RecordData = {
  title: string;
  content: string;
  chapterNumber: number;
  description: string;
};

type Props = {
  visible: boolean;
  title: string;
  mode: "point" | "chapter";
  initialTitle?: string;
  initialContent?: string;
  initialNumber?: number;
  initialDescription?: string;
  submitting: boolean;
  onClose: () => void;
  onSave: (data: RecordData) => void;
  onAutoSave?: (data: RecordData) => Promise<void> | void;
};

export default function RecordFormModal({
  visible,
  title,
  mode,
  initialTitle = "",
  initialContent = "",
  initialNumber = 1,
  initialDescription = "",
  submitting,
  onClose,
  onSave,
  onAutoSave,
}: Props) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [number, setNumber] = useState("1");
  const [description, setDescription] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialized = useRef(false);
  const saving = useRef(false);

  useEffect(() => {
    if (!visible) {
      initialized.current = false;
      return;
    }

    setName(initialTitle);
    setContent(initialContent);
    setNumber(String(initialNumber));
    setDescription(initialDescription);
    setSaveStatus("saved");
    initialized.current = true;
  }, [visible, initialTitle, initialContent, initialNumber, initialDescription]);

  const getData = (): RecordData => ({
    title: name.trim(),
    content: content.trim(),
    chapterNumber: Number(number),
    description: description.trim(),
  });

  useEffect(() => {
    if (!visible || !initialized.current || !onAutoSave) return;

    const valid =
      name.trim().length > 0 &&
      (mode === "point"
        ? content.trim().length > 0
        : Number.isInteger(Number(number)) && Number(number) > 0);

    if (!valid) {
      setSaveStatus("unsaved");
      return;
    }

    if (timer.current) clearTimeout(timer.current);

    setSaveStatus("unsaved");

    timer.current = setTimeout(async () => {
      if (saving.current) return;

      try {
        saving.current = true;
        setSaveStatus("saving");
        await onAutoSave(getData());
        setSaveStatus("saved");
      } catch (error) {
        console.error("Auto-save error:", error);
        setSaveStatus("unsaved");
      } finally {
        saving.current = false;
      }
    }, 2000);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [name, content, number, description, visible, mode, onAutoSave]);

  const handleContentChange = (value: string) => {
    if (mode !== "point") {
      setContent(value);
      return;
    }

    const lines = value.split("\n");
    const previous = lines[lines.length - 2];

    // Add a bullet automatically after Enter.
    if (value.endsWith("\n") && previous?.trim()) {
      lines[lines.length - 1] = "• ";
      setContent(lines.join("\n"));
    } else {
      setContent(value);
    }
  };

  const handleSave = () => {
    if (timer.current) clearTimeout(timer.current);
    onSave(getData());
  };

  const valid =
    name.trim().length > 0 &&
    (mode === "point"
      ? content.split(/\r?\n/).some((line) => line.trim())
      : Number.isInteger(Number(number)) && Number(number) > 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modal}>
          <Text style={styles.heading}>{title}</Text>

          <ScrollView keyboardShouldPersistTaps="handled">
            {mode === "chapter" && (
              <>
                <Text style={styles.label}>Chapter Number</Text>
                <TextInput
                  style={styles.input}
                  value={number}
                  onChangeText={setNumber}
                  keyboardType="number-pad"
                  placeholder="Chapter number"
                />
              </>
            )}

            <Text style={styles.label}>
              {mode === "point" ? "Topic Name" : "Chapter Title"}
            </Text>

            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={mode === "point" ? "e.g. Bhajans" : "Chapter title"}
              maxLength={120}
            />

            {mode === "point" ? (
              <>
                <Text style={styles.label}>Bullet Points</Text>
                <Text style={styles.helper}>
                  Press Enter to create your next bullet point.
                </Text>

                <TextInput
                  style={[styles.input, styles.multiline]}
                  value={content}
                  onChangeText={handleContentChange}
                  placeholder={"• Achyutam Keshavam\n• Hare Krishna Hare Rama\n• Radhe Radhe"}
                  multiline
                  textAlignVertical="top"
                />
              </>
            ) : (
              <>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.multiline]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Short chapter description..."
                  multiline
                  textAlignVertical="top"
                />
              </>
            )}
          </ScrollView>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                saveStatus === "saved" ? styles.savedDot : styles.pendingDot,
              ]}
            />
            <Text style={styles.statusText}>
              {saveStatus === "saving"
                ? "Saving..."
                : saveStatus === "saved"
                  ? "All changes saved"
                  : "Unsaved changes"}
            </Text>
          </View>

          <Pressable
            style={[styles.save, (!valid || submitting) && styles.disabled]}
            disabled={!valid || submitting}
            onPress={handleSave}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </Pressable>

          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    maxHeight: "90%",
  },
  heading: {
    fontSize: 21,
    fontWeight: "700",
    color: "#172033",
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginTop: 13,
    marginBottom: 8,
  },
  helper: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: "#172033",
  },
  multiline: { minHeight: 150 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  savedDot: { backgroundColor: "#16A34A" },
  pendingDot: { backgroundColor: "#F59E0B" },
  statusText: {
    fontSize: 12,
    color: "#64748B",
  },
  save: {
    height: 49,
    backgroundColor: "#635BFF",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  disabled: { opacity: 0.5 },
  saveText: { color: "#FFFFFF", fontWeight: "700" },
  cancel: { alignItems: "center", padding: 13 },
  cancelText: { color: "#64748B", fontWeight: "600" },
});
