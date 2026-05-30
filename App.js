import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert } from 'react-native';

export default function App() {
  const [tvIp, setTvIp] = useState('192.168.1.15'); // Nhập IP TV LG của bạn vào đây
  const [connected, setConnected] = useState(false);
  const ws = useRef(null);

  // Hàm kết nối tới LG TV (webOS) qua WebSocket
  const connectToTV = () => {
    if (!tvIp) {
      Alert.alert("Lỗi", "Vui lòng nhập IP của LG TV");
      return;
    }
    const url = `ws://${tvIp}:3000`;
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      // Gửi gói tin đăng ký quyền điều khiển với TV
      const handshakePayload = {
        type: 'register',
        id: 'register_gamepad',
        payload: {
          "forcePairing": false,
          "manifest": { "permissions": ["CONTROL_AUDIO", "CONTROL_INPUT_TEXT"] }
        }
      };
      ws.current.send(JSON.stringify(handshakePayload));
    };

    ws.current.onmessage = (e) => {
      const response = JSON.parse(e.data);
      if (response.type === 'registered') {
        setConnected(true);
        Alert.alert("Thành công", "Tay game đã kết nối! Hãy bấm 'Đồng ý' trên màn hình TV.");
      }
    };

    ws.current.onerror = () => {
      Alert.alert("Thất bại", "Không thể kết nối. Kiểm tra lại IP hoặc Wifi!");
    };

    ws.current.onclose = () => setConnected(false);
  };

  // Hàm truyền lệnh nút bấm thời gian thực (Đã tối ưu hóa phản hồi nhanh để chơi game)
  const sendButtonEvent = (buttonName) => {
    if (!connected || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    // Giao thức chuẩn hóa lệnh gửi nút bấm tới LG webOS SSAP
    const commandPayload = {
      id: 'req_button',
      type: 'request',
      uri: 'ssap://control/button',
      payload: { button: buttonName }
    };
    ws.current.send(JSON.stringify(commandPayload));
  };

  return (
    <View style={styles.container}>
      
      {/* THANH ĐIỀU KHIỂN & KẾT NỐI */}
      <View style={styles.topBar}>
        <TextInput
          style={styles.input}
          onChangeText={setTvIp}
          value={tvIp}
          placeholder="Nhập IP TV LG"
          placeholderTextColor="#666"
          keyboardType="numeric"
        />
        <TouchableOpacity 
          style={[styles.connectBtn, connected ? styles.btnSuccess : styles.btnPrimary]} 
          onPress={connectToTV}
        >
          <Text style={styles.btnText}>{connected ? "● Đã Kết Nối" : "Kết Nối Tay Cầm"}</Text>
        </TouchableOpacity>
      </View>

      {/* KHU VỰC TAY CẦM CHƠI GAME CHÍNH */}
      <View style={styles.gamepadArea}>
        
        {/* BÊN TRÁI: CỤM PHÍM DI CHUYỂN D-PAD & PHÍM VAI TRÁI */}
        <View style={styles.leftSide}>
          <View style={styles.shoulderRow}>
            <TouchableOpacity style={styles.shoulderBtn} onPressIn={() => sendButtonEvent('MENU') /* LB */}>
              <Text style={styles.textWhite}>LB</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shoulderBtn} onPressIn={() => sendButtonEvent('INFO') /* LT */}>
              <Text style={styles.textWhite}>LT</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dpad}>
            <TouchableOpacity style={[styles.dpadBtn, styles.dpadUp]} onPressIn={() => sendButtonEvent('UP')}><Text style={styles.textWhite}>▲</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.dpadBtn, styles.dpadLeft]} onPressIn={() => sendButtonEvent('LEFT')}><Text style={styles.textWhite}>◀</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.dpadBtn, styles.dpadRight]} onPressIn={() => sendButtonEvent('RIGHT')}><Text style={styles.textWhite}>▶</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.dpadBtn, styles.dpadDown]} onPressIn={() => sendButtonEvent('DOWN')}><Text style={styles.textWhite}>▼</Text></TouchableOpacity>
          </View>
        </View>

        {/* Ở GIỮA: CÁC NÚT CHỨC NĂNG (SELECT / START) */}
        <View style={styles.centerSide}>
          <TouchableOpacity style={styles.centerBtn} onPressIn={() => sendButtonEvent('DASH')}><Text style={styles.centerBtnText}>SELECT</Text></TouchableOpacity>
          <TouchableOpacity style={styles.centerBtn} onPressIn={() => sendButtonEvent('HOME')}><Text style={styles.centerBtnText}>HOME</Text></TouchableOpacity>
        </View>

        {/* BÊN PHẢI: CỤM PHÍM HÀNH ĐỘNG ABXY (ĐÃ FIX MÃ PHÍM) */}
        <View style={styles.rightSide}>
          <View style={styles.shoulderRow}>
            <TouchableOpacity style={styles.shoulderBtn} onPressIn={() => sendButtonEvent('GUIDE') /* RT */}>
              <Text style={styles.textWhite}>RT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shoulderBtn} onPressIn={() => sendButtonEvent('EXIT') /* RB */}>
              <Text style={styles.textWhite}>RB</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.abxyCluster}>
            <TouchableOpacity style={[styles.actionBtn, styles.btnY]} onPressIn={() => sendButtonEvent('YELLOW') /* Nút Y */}>
              <Text style={styles.actionText}>Y</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.btnX]} onPressIn={() => sendButtonEvent('BLUE') /* Nút X */}>
              <Text style={styles.actionText}>X</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.btnB]} onPressIn={() => sendButtonEvent('BACK') /* Nút B */}>
              <Text style={styles.actionText}>B</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.btnA]} onPressIn={() => sendButtonEvent('ENTER') /* Nút A */}>
              <Text style={styles.actionText}>A</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121214', padding: 10, justifyContent: 'space-between' },
  textWhite: { color: '#fff',尊fontWeight: 'bold' },
  topBar: { flexDirection: 'row', width: '100%', justifyContent: 'center', alignItems: 'center', marginTop: 5, paddingHorizontal: 20 },
  input: { backgroundColor: '#202024', color: '#fff', width: 160, padding: 8, borderRadius: 6, marginRight: 10, fontSize: 14, borderWidth: 1, borderColor: '#323238', textAlign: 'center' },
  connectBtn: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 6 },
  btnPrimary: { backgroundColor: '#ff0055' },
  btnSuccess: { backgroundColor: '#00cc66' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  
  gamepadArea: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 10 },
  
  leftSide: { alignItems: 'center', justifyContent: 'center', width: '40%' },
  dpad: { width: 130, height: 130, position: 'relative', marginTop: 15 },
  dpadBtn: { position: 'absolute', width: 42, height: 42, backgroundColor: '#29292e', alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#444' },
  dpadUp: { top: 0, left: 44 },
  dpadDown: { bottom: 0, left: 44 },
  dpadLeft: { left: 0, top: 44 },
  dpadRight: { right: 0, top: 44 },

  rightSide: { alignItems: 'center', justifyContent: 'center', width: '40%' },
  abxyCluster: { width: 130, height: 130, position: 'relative', marginTop: 15 },
  actionBtn: { position: 'absolute', width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21 },
  actionText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  btnY: { top: 0, left: 44, backgroundColor: '#ffcc00' },
  btnX: { left: 0, top: 44, backgroundColor: '#0099ff' },
  btnB: { right: 0, top: 44, backgroundColor: '#ff3333' },
  btnA: { bottom: 0, left: 44, backgroundColor: '#00cc66' },
  
  shoulderRow: { flexDirection: 'row', width: 120, justifyContent: 'space-between' },
  shoulderBtn: { backgroundColor: '#3e3e4a', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, minWidth: 50, alignItems: 'center' },

  centerSide: { justifyContent: 'center', alignItems: 'center', width: '20%' },
  centerBtn: { backgroundColor: '#29292e', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 15, marginVertical: 8, width: 75, alignItems: 'center', borderWidth: 1, borderColor: '#444' },
  centerBtnText: { color: '#aaa', fontSize: 10, fontWeight: 'bold' }
});