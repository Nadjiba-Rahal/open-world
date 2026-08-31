import { useState } from "react";
import { Text, View } from "react-native";
import { CURRENT_PHASE } from "@afterlight/shared";
import { TouchControls } from "./components/TouchControls";

export default function App() {
  const [status, setStatus] = useState("Ready for a touch-enabled client.");
  return <View style={{ flex: 1, alignItems: "center", backgroundColor: "#101413", padding: 24, paddingTop: 72 }}>
    <Text style={{ color: "#d1b56b", fontSize: 12, letterSpacing: 3 }}>AFTERLIGHT</Text>
    <Text style={{ color: "#f3efe4", fontSize: 34, marginTop: 18, textAlign: "center" }}>Mobile foundation</Text>
    <Text style={{ color: "#aaa999", fontSize: 16, marginTop: 12, textAlign: "center" }}>Current phase: {CURRENT_PHASE}</Text>
    <Text style={{ color: "#829287", fontSize: 13, marginTop: 20, textAlign: "center", lineHeight: 20 }}>Shared contracts are ready. These controls establish the input boundary before native world rendering is connected.</Text>
    <Text style={{ color: "#d1b56b", fontSize: 13, marginTop: 24 }}>{status}</Text>
    <TouchControls onMove={(direction) => setStatus(direction === "stop" ? "Ready for a touch-enabled client." : `Movement input: ${direction}`)} onAction={(action) => setStatus(`${action} action queued for the mobile client.`)} />
    <Text style={{ color: "#829287", fontSize: 12, marginTop: 28, textAlign: "center" }}>Voice foundation: not connected{"\n"}Requires a platform audio session and server signaling.</Text>
  </View>;
}
