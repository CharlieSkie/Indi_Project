import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";

export default function AboutScreen({ route }) {
  const db = useSQLiteContext();
  const { userId, image } = route.params;
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [address, setAddress] = useState("");
  const [showImage, setShowImage] = useState(true); // Toggle profile image

  useEffect(() => {
    const initDb = async () => {
      try {
        await db.runAsync(`
          CREATE TABLE IF NOT EXISTS user_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            bio TEXT,
            address TEXT,
            FOREIGN KEY(user_id) REFERENCES auth_users(id)
          );
        `);
        await loadUserProfile();
      } catch (err) {
        console.error("Error initializing database:", err);
      }
    };
    initDb();
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = await db.getFirstAsync(
        "SELECT name FROM auth_users WHERE id = ?",
        [userId]
      );
      if (user) setName(user.name);

      const profile = await db.getFirstAsync(
        "SELECT bio, address FROM user_profiles WHERE user_id = ?",
        [userId]
      );
      if (profile) {
        setBio(profile.bio || "");
        setAddress(profile.address || "");
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  };

  const saveProfile = async () => {
    try {
      const existingProfile = await db.getFirstAsync(
        "SELECT id FROM user_profiles WHERE user_id = ?",
        [userId]
      );

      if (existingProfile) {
        await db.runAsync(
          "UPDATE user_profiles SET bio = ?, address = ? WHERE user_id = ?",
          [bio, address, userId]
        );
      } else {
        await db.runAsync(
          "INSERT INTO user_profiles (user_id, bio, address) VALUES (?, ?, ?)",
          [userId, bio, address]
        );
      }

      Alert.alert("Saved", "Bio and address updated successfully!");
      await loadUserProfile();
    } catch (err) {
      console.error("Error saving profile:", err);
      Alert.alert("Error", "Failed to save profile. Inputs cleared.");
      setBio("");
      setAddress("");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Picture with toggle */}
      <TouchableOpacity onPress={() => setShowImage(!showImage)}>
        {showImage ? (
          image ? (
            <Image source={{ uri: image }} style={styles.profileImage} />
          ) : (
            <Image
              source={require("../assets/default1.png")}
              style={styles.profileImage}
            />
          )
        ) : (
          <View style={[styles.profileImage, styles.hiddenImage]}>
            <Text style={styles.hiddenText}>Hidden</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Name */}
      <Text style={styles.name}>{name || "Your Name"}</Text>

      {/* Display bio and address */}
      {bio ? <Text style={styles.displayText}>Bio: {bio}</Text> : null}
      {address ? <Text style={styles.displayText}>Address: {address}</Text> : null}

      {/* Editable Bio */}
      <Text style={styles.label}>Bio:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your bio"
        placeholderTextColor="#888"
        value={bio}
        onChangeText={setBio}
        multiline
      />

      {/* Editable Address */}
      <Text style={styles.label}>Address:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your address"
        placeholderTextColor="#888"
        value={address}
        onChangeText={setAddress}
      />

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
        <Text style={styles.saveButtonText}>Save Details</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#121212",
    padding: 20,
    paddingTop: 40,
  },
  profileImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: "#bb00ff",
    marginBottom: 10,
  },
  hiddenImage: {
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  hiddenText: {
    color: "#bb00ff",
    fontWeight: "700",
    fontSize: 18,
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(187, 0, 255, 0.7)",
    textShadowRadius: 10,
    marginBottom: 20,
    textAlign: "center",
  },
  displayText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 5,
    textAlign: "center",
  },
  label: {
    alignSelf: "flex-start",
    color: "#fff",
    fontWeight: "700",
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    width: "100%",
    backgroundColor: "#1e1e1e",
    color: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#bb00ff",
    marginBottom: 10,
    textAlignVertical: "top",
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: "#bb00ff",
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
