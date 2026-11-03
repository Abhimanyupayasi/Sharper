import { Pressable, StyleSheet, Text, View } from "react-native";
import { BookOpen, MoreVertical, NotebookPen } from "lucide-react-native";

type Props = {
  title: string;
  subtitle?: string;
  type: "point" | "chapter";
  onPress: () => void;
  onMenu: () => void;
};

export default function NoteCard({
  title,
  subtitle,
  type,
  onPress,
  onMenu,
}: Props) {
  const Icon = type === "point" ? NotebookPen : BookOpen;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.icon}>
        <Icon color="#635BFF" size={21} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>

      <Pressable hitSlop={10} onPress={onMenu}>
        <MoreVertical color="#64748B" size={21} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
    marginBottom: 10,
  },
  icon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: "#F0EFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1 },
  title: { fontSize: 14, fontWeight: "700", color: "#172033" },
  subtitle: { fontSize: 11, color: "#64748B", marginTop: 5 },
});