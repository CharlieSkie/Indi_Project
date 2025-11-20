import React, { useEffect, useState, useCallback } from "react";
import {
  FlatList,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const db = useSQLiteContext();

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const results = await db.getAllAsync("SELECT * FROM users ORDER BY id DESC");
      setUsers(results);
    } catch (error) {
      console.error("Database error:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [db]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadUsers();
  };

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.userCard}>
          <Text style={styles.name}>{`${item.firstName} ${item.lastName}`}</Text>
          <Text style={styles.email}>{item.email}</Text>
          <Text style={styles.phone}>{item.phone}</Text>
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No users found. Try adding one!</Text>
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#4a90e2"
        />
      }
      contentContainerStyle={
        users.length === 0 && { flex: 1, justifyContent: "center" }
      }
    />
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  userCard: {
    padding: 16,
    backgroundColor: "#1e1e1e",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    borderRadius: 10,
    marginHorizontal: 10,
    marginVertical: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  email: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 2,
  },
  phone: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
    fontSize: 16,
  },
});

export default UserList;
