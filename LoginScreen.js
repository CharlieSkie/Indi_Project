import React, { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const LoginScreen = ({ navigation }) => {
  const db = useSQLiteContext();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [otherUsers, setOtherUsers] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const createProfileUriColumn = async () => {
      try {
        await db.runAsync("ALTER TABLE auth_users ADD COLUMN profileUri TEXT;");
      } catch (err) {
        if (!err.message.includes("duplicate column")) {
          console.error("Error adding profileUri column:", err);
        }
      }
    };
    createProfileUriColumn();
  }, []);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow access to your gallery.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);

      if (loggedInUser) {
        try {
          await db.runAsync(
            "UPDATE auth_users SET profileUri = ? WHERE id = ?",
            [uri, loggedInUser.id]
          );
          Alert.alert("Updated", "Profile picture updated successfully!");
        } catch (err) {
          console.error("Error saving profile:", err);
        }
      }
    }
  };

  const handleLogin = async () => {
    const { email, password } = form;

    if (!email || !password) {
      return Alert.alert("Error", "Enter email and password.");
    }

    if (!email.includes("@")) {
      return Alert.alert("Invalid Email", "Email must include '@'.");
    }

    if (password.length < 6) {
      return Alert.alert(
        "Weak Password",
        "Password must be at least 6 characters."
      );
    }

    try {
      const user = await db.getFirstAsync(
        "SELECT * FROM auth_users WHERE email = ? AND password = ?",
        [email, password]
      );

      if (user) {
        setLoggedInUser(user);
        setForm({ email: "", password: "" });
        setProfileImage(user.profileUri || null);
        loadOtherUsers(user.id);
        Alert.alert("Success", `Welcome back, ${user.name}!`);
      } else {
        Alert.alert("Error", "Invalid email or password.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert("Error", "Login failed.");
    }
  };

  const loadOtherUsers = async (userId) => {
    try {
      const users = await db.getAllAsync("SELECT * FROM auth_users WHERE id != ?", [
        userId,
      ]);
      setOtherUsers(users);
    } catch (error) {
      console.error("Load Users Error:", error);
    }
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userRow}
      onPress={() =>
        navigation.navigate("Messenger", {
          currentUser: loggedInUser,
          chatWithUser: item,
        })
      }
    >
      <Text style={styles.userName}>{item.name}</Text>
      <Text style={styles.userEmail}>{item.email}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
      >
        {!loggedInUser ? (
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.infoButtonContainer}>
              <TouchableOpacity onPress={() => setShowInfo(true)}>
                <Ionicons name="information-circle-outline" size={30} color="#b5b7c6" />
              </TouchableOpacity>
            </View>

            <View style={styles.loginContainer}>
              <Image source={require("./assets/ley.png")} style={styles.logo} />
              <Text style={styles.title}>Welcome Back</Text>

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#aaa"
                autoCapitalize="none"
                keyboardType="email-address"
                value={form.email}
                onChangeText={(text) => setForm({ ...form, email: text })}
              />

              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Password"
                  placeholderTextColor="#aaa"
                  secureTextEntry={!showPassword}
                  value={form.password}
                  onChangeText={(text) => setForm({ ...form, password: text })}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={24}
                    color="#aaa"
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.link}>Don’t have an account? Register</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.loggedInContainer}>
            <View style={styles.profileSection}>
              <TouchableOpacity onPress={pickImage}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <Ionicons name="person-circle-outline" size={110} color="#777" />
                )}
              </TouchableOpacity>

              <Text style={styles.userNameBig}>{loggedInUser.name}</Text>
              <Text style={styles.userEmail}>{loggedInUser.email}</Text>
              <Text style={styles.changePhotoText}>Tap image to change photo</Text>
            </View>

            <Text style={styles.subtitle}>Message someone</Text>

            <FlatList
              data={otherUsers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderUser}
              style={{ flex: 1, marginTop: 10 }}
              keyboardShouldPersistTaps="handled"
            />

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#4f5d75" }]}
              onPress={() =>
                navigation.navigate("About", { userId: loggedInUser.id, image: profileImage })
              }
            >
              <Text style={styles.actionButtonText}>About</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#9d4d4d" }]}
              onPress={() => {
                setLoggedInUser(null);
                setOtherUsers([]);
                setProfileImage(null);
              }}
            >
              <Text style={styles.actionButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal visible={showInfo} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Information</Text>
              <Image source={require("./assets/ley.png")} style={styles.modalImage} />
              <Text style={styles.modalText}>
                Author: Charlie N. Boyles{"\n"}
                Submitted To: Jay Ian Camelotes{"\n"}
                Bio:Hell Im Charlie Boyles, Being a fool doesn’t mean you're useless; sometimes it's just your way of hiding who you really are.{"\n"}
                Address: Cat Sur, Guindulman, Bohol
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowInfo(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#121212" },
  scrollContainer: { flexGrow: 1, padding: 20, justifyContent: "flex-start" },
  infoButtonContainer: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 10 },
  loginContainer: { flex: 1, marginTop: 20 },
  logo: { width: 110, height: 110, alignSelf: "center", marginBottom: 20, borderRadius: 60, opacity: 0.9 },
  title: { fontSize: 30, fontWeight: "700", marginBottom: 25, textAlign: "center", color: "#e0e0e0" },
  input: { backgroundColor: "#1e1e1e", padding: 14, borderRadius: 12, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: "#2a2c33", color: "#fff" },
  passwordContainer: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  loginButton: { backgroundColor: "#6b7cff", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 5 },
  loginButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  link: { color: "#7e9acb", textAlign: "center", marginTop: 18, fontWeight: "600", fontSize: 15 },
  loggedInContainer: { flex: 1, padding: 20 },
  profileSection: { alignItems: "center", marginBottom: 25, marginTop: 20, paddingVertical: 10 },
  profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: "#6b728e" },
  userNameBig: { fontSize: 22, fontWeight: "800", marginTop: 10, color: "#e0e0e0" },
  changePhotoText: { fontSize: 13, marginTop: 5, color: "#aaa" },
  subtitle: { fontSize: 19, fontWeight: "700", marginBottom: 10, textAlign: "center", color: "#dcdcdc" },
  userRow: { padding: 15, backgroundColor: "#1b1d21", borderRadius: 14, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: "#6f7db8" },
  userName: { fontSize: 17, fontWeight: "700", color: "#e6e6e6" },
  userEmail: { fontSize: 14, color: "#aaa" },
  actionButton: { paddingVertical: 14, borderRadius: 12, alignItems: "center", marginVertical: 8 },
  actionButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#1c1d22", padding: 22, borderRadius: 16, width: "85%", alignItems: "center", borderWidth: 1, borderColor: "#2a2c33" },
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#e5e5e5", marginBottom: 10 },
  modalImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 15 },
  modalText: { color: "#cfcfcf", fontSize: 15, textAlign: "center", marginBottom: 20, lineHeight: 22 },
  modalCloseButton: { backgroundColor: "#6b7cff", paddingVertical: 10, paddingHorizontal: 22, borderRadius: 12 },
  modalCloseText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

export default LoginScreen;
