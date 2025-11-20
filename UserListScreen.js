import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useSQLiteContext } from "expo-sqlite";

const UserListScreen = () => {
  const db = useSQLiteContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const results = await db.getAllAsync("SELECT * FROM auth_users");
      setUsers(results);
    } catch (error) {
      console.error("DB Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadUsers}
            tintColor="#4a90e2"
          />
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.email}>{item.email}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No users found</Text>
        }
        contentContainerStyle={
          users.length === 0 && { flex: 1, justifyContent: "center" }
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    marginHorizontal: 10,
    borderRadius: 8,
    marginVertical: 6,
    backgroundColor: "#1e1e1e",
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#fff",
  },
  email: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    fontSize: 16,
  },
});

export default UserListScreen;
