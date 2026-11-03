import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bot,
  Plus,
  Send,
  Sparkles,
  MessageCircle,
  BookOpen,
  ListTodo,
  CalendarDays,
  Lock,
} from "lucide-react-native";

const suggestions = [
  {
    title: "My pending tasks",
    subtitle: "Find tasks I need to complete",
    icon: ListTodo,
  },
  {
    title: "Chemistry notes",
    subtitle: "Summarize my saved notes",
    icon: BookOpen,
  },
  {
    title: "Today's notes",
    subtitle: "What did I write today?",
    icon: CalendarDays,
  },
];

export default function ChatScreen() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    { id: number; text: string; sender: "user" | "ai" }[]
  >([]);

  const sendMessage = (text = message) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((previous) => [
      ...previous,
      { id: Date.now(), text: trimmed, sender: "user" },
    ]);
    setMessage("");
  };

  const startNewChat = () => {
    setMessages([]);
    setMessage("");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logo}>
              <Sparkles size={21} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>AI Assistant</Text>
              <Text style={styles.headerSubtitle}>Your personal study companion</Text>
            </View>
          </View>

          <Pressable style={styles.newChatButton} onPress={startNewChat}>
            <Plus size={19} color="#475569" />
            <Text style={styles.newChatText}>New</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* Chat content */}
        <ScrollView
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeIcon}>
                <Bot size={34} color="#635BFF" />
              </View>

              <Text style={styles.welcomeTitle}>Hello! How can I help?</Text>
              <Text style={styles.welcomeDescription}>
                Ask questions about your notes, chapters, and daily tasks.
                Your personal knowledge assistant is coming soon.
              </Text>

              <View style={styles.comingSoonBadge}>
                <Lock size={12} color="#7C3AED" />
                <Text style={styles.comingSoonText}>AI integration coming soon</Text>
              </View>

              <View style={styles.suggestionHeader}>
                <Text style={styles.suggestionHeading}>TRY ASKING</Text>
                <Text style={styles.suggestionCount}>3 suggestions</Text>
              </View>

              {suggestions.map((item) => {
                const Icon = item.icon;

                return (
                  <Pressable
                    key={item.title}
                    style={styles.suggestionCard}
                    onPress={() => sendMessage(item.title)}
                  >
                    <View style={styles.suggestionIcon}>
                      <Icon size={20} color="#635BFF" />
                    </View>

                    <View style={styles.suggestionTextContainer}>
                      <Text style={styles.suggestionTitle}>{item.title}</Text>
                      <Text style={styles.suggestionSubtitle}>
                        {item.subtitle}
                      </Text>
                    </View>

                    <MessageCircle size={17} color="#94A3B8" />
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.messagesContainer}>
              {messages.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.messageRow,
                    item.sender === "user" && styles.userMessageRow,
                  ]}
                >
                  {item.sender === "ai" && (
                    <View style={styles.smallBotIcon}>
                      <Bot size={17} color="#635BFF" />
                    </View>
                  )}

                  <View
                    style={[
                      styles.messageBubble,
                      item.sender === "user"
                        ? styles.userBubble
                        : styles.aiBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        item.sender === "user" && styles.userMessageText,
                      ]}
                    >
                      {item.text}
                    </Text>
                  </View>
                </View>
              ))}

              <View style={styles.placeholderNotice}>
                <Lock size={14} color="#7C3AED" />
                <Text style={styles.placeholderNoticeText}>
                  AI responses will be available after integration.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Message input */}
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask anything about your notes..."
              placeholderTextColor="#94A3B8"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={1000}
            />

            <Pressable
              style={[
                styles.sendButton,
                !message.trim() && styles.sendButtonDisabled,
              ]}
              onPress={() => sendMessage()}
              disabled={!message.trim()}
            >
              <Send size={19} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text style={styles.inputFooter}>
            Your notes stay on your device. AI features are not active yet.
          </Text>
        </View>
      </KeyboardAvoidingView>
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
    minHeight: 70,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#635BFF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#172033",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 3,
  },
  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  newChatText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    flexGrow: 1,
    padding: 20,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 15,
  },
  welcomeIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#EEEDFF",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#172033",
    textAlign: "center",
  },
  welcomeDescription: {
    fontSize: 13,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
    marginTop: 9,
    marginHorizontal: 10,
  },
  comingSoonBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    backgroundColor: "#F3EFFF",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 16,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#7C3AED",
  },
  suggestionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 36,
    marginBottom: 12,
  },
  suggestionHeading: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#94A3B8",
  },
  suggestionCount: {
    fontSize: 11,
    color: "#94A3B8",
  },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F0EFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#172033",
  },
  suggestionSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
  },
  messagesContainer: {
    gap: 16,
    paddingTop: 10,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  userMessageRow: {
    justifyContent: "flex-end",
  },
  smallBotIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#EEEDFF",
    alignItems: "center",
    justifyContent: "center",
  },
  messageBubble: {
    maxWidth: "82%",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: "#635BFF",
    borderBottomRightRadius: 5,
  },
  aiBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#172033",
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  placeholderNotice: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 7,
    marginTop: 12,
    padding: 10,
  },
  placeholderNoticeText: {
    fontSize: 11,
    color: "#7C3AED",
  },
  inputSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  inputContainer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingLeft: 15,
    paddingRight: 7,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 13,
    color: "#172033",
  },
  sendButton: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "#635BFF",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#B9B6FF",
  },
  inputFooter: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 9,
  },
});
