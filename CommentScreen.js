import React, { useEffect, useState, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";

const CommentScreen = ({ route }) => {
  const { user } = route.params;
  const db = useSQLiteContext();
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const flatListRef = useRef();

  // Create comments table if it doesn't exist
  const createTable = async () => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user TEXT NOT NULL,
        comment TEXT NOT NULL
      );
    `);
  };

  const loadComments = async () => {
    const results = await db.getAllAsync(
      "SELECT * FROM comments ORDER BY id ASC"
    );
    setComments(results);

    // Scroll to bottom after loading
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    await db.runAsync(
      "INSERT INTO comments (user, comment) VALUES (?, ?)",
      [user, comment]
    );
    setComment("");
    loadComments();
  };

  useEffect(() => {
    createTable().then(() => loadComments());
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={comments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.comment}>
              <Text style={styles.user}>{item.user}:</Text>
              <Text style={styles.commentText}>{item.comment}</Text>
            </View>
          )}
          contentContainerStyle={{ padding: 10 }}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment"
            placeholderTextColor="#888"
            value={comment}
            onChangeText={setComment}
          />
          <TouchableOpacity style={styles.postButton} onPress={addComment}>
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  comment: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#1e1e1e",
    borderLeftWidth: 4,
    borderLeftColor: "#bb00ff",
  },
  user: {
    fontWeight: "700",
    color: "#bb00ff",
    marginBottom: 3,
  },
  commentText: {
    color: "#e0e0e0",
    fontSize: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#333",
    backgroundColor: "#1e1e1e",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    color: "#fff",
    backgroundColor: "#2a2a2a",
  },
  postButton: {
    backgroundColor: "#bb00ff",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  postButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});

export default CommentScreen;
