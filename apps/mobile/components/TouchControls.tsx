import { Pressable, StyleSheet, Text, View } from "react-native";

export interface TouchControlsProps {
  onMove: (direction: "up" | "down" | "left" | "right" | "stop") => void;
  onAction: (action: "interact" | "emote" | "photo") => void;
}

export function TouchControls({ onMove, onAction }: TouchControlsProps) {
  return (
    <View style={styles.controls}>
      <View style={styles.pad}>
        <Pressable style={[styles.padButton, styles.up]} onPressIn={() => onMove("up")} onPressOut={() => onMove("stop")}><Text style={styles.buttonText}>▲</Text></Pressable>
        <Pressable style={[styles.padButton, styles.left]} onPressIn={() => onMove("left")} onPressOut={() => onMove("stop")}><Text style={styles.buttonText}>◀</Text></Pressable>
        <Pressable style={[styles.padButton, styles.right]} onPressIn={() => onMove("right")} onPressOut={() => onMove("stop")}><Text style={styles.buttonText}>▶</Text></Pressable>
        <Pressable style={[styles.padButton, styles.down]} onPressIn={() => onMove("down")} onPressOut={() => onMove("stop")}><Text style={styles.buttonText}>▼</Text></Pressable>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={() => onAction("interact")}><Text style={styles.actionText}>E{"\n"}interact</Text></Pressable>
        <Pressable style={styles.action} onPress={() => onAction("emote")}><Text style={styles.actionText}>✦{"\n"}emote</Text></Pressable>
        <Pressable style={styles.action} onPress={() => onAction("photo")}><Text style={styles.actionText}>◎{"\n"}photo</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: { width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 28 },
  pad: { width: 150, height: 150, position: "relative" },
  padButton: { position: "absolute", width: 48, height: 48, borderRadius: 14, backgroundColor: "#202a25", borderWidth: 1, borderColor: "#526356", alignItems: "center", justifyContent: "center" },
  up: { top: 0, left: 51 }, left: { top: 51, left: 0 }, right: { top: 51, right: 0 }, down: { bottom: 0, left: 51 },
  buttonText: { color: "#d1b56b", fontSize: 18 },
  actions: { flexDirection: "row", gap: 8 },
  action: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#27332d", borderWidth: 1, borderColor: "#9b8754", alignItems: "center", justifyContent: "center" },
  actionText: { color: "#f3efe4", fontSize: 10, lineHeight: 14, textAlign: "center" }
});