import { useEffect, useState } from "react";
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
  onSave: (data: {
    title: string;
    content: string;
    chapterNumber: number;
    description: string;
  }) => void;
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
}: Props) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [number, setNumber] = useState("1");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (visible) {
      setName(initialTitle);
      setContent(initialContent);
      setNumber(String(initialNumber));
      setDescription(initialDescription);
    }
  }, [
    visible,
    initialTitle,
    initialContent,
    initialNumber,
    initialDescription,
  ]);

  const handleSave = () => {
    onSave({
      title: name.trim(),
      content: content.trim(),
      chapterNumber: Number(number),
      description: description.trim(),
    });
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
                  Write one point per line. Each line becomes a separate bullet.
                </Text>
                <TextInput
                  style={[styles.input, styles.multiline]}
                  value={content}
                  onChangeText={setContent}
                  placeholder={"Achyutam Keshavam\nHare Krishna Hare Rama\nRadhe Radhe"}
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
            <Text style={styles.cancelText}>Cancel</Text>
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