import { Text, View } from "react-native";
import { CURRENT_PHASE } from "@afterlight/shared";

export default function App() {
  return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#101413", padding: 24 }}>
    <Text style={{ color: "#d1b56b", fontSize: 12, letterSpacing: 3 }}>AFTERLIGHT</Text>
    <Text style={{ color: "#f3efe4", fontSize: 34, marginTop: 18, textAlign: "center" }}>Mobile foundation</Text>
    <Text style={{ color: "#aaa999", fontSize: 16, marginTop: 12, textAlign: "center" }}>Current phase: {CURRENT_PHASE}</Text>
  </View>;
}
