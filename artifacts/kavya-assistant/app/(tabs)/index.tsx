import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Svg,
  Circle,
  Ellipse,
  Path,
  Defs,
  RadialGradient,
  Stop,
  G,
  LinearGradient,
  Rect,
} from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Stage = 'welcome' | 'permissions' | 'gemini-key' | 'settings' | 'assistant';
type PermissionKey = 'microphone' | 'contacts' | 'location' | 'calendar' | 'notifications';
type PendingAction = { title: string; detail: string; uri: string };
type GeminiKeyMeta = { id: string; label: string; last4: string; createdAt: string };

const STORAGE_STAGE = '@kavya/onboarding-stage';
const STORAGE_GEMINI_KEYS = '@kavya/gemini-key-index';
const STORAGE_ACTIVE_GEMINI_KEY = '@kavya/active-gemini-key';
const GEMINI_KEY_PREFIX = 'kavya.gemini-key.';

const permissionRows: Array<{ key: PermissionKey; icon: keyof typeof Feather.glyphMap; title: string; description: string }> = [
  { key: 'microphone', icon: 'mic', title: 'Microphone & speech', description: 'Wake Kavya with “Hey Kavya”' },
  { key: 'contacts', icon: 'users', title: 'Contacts', description: 'Find people when you say “call mom”' },
  { key: 'location', icon: 'map-pin', title: 'Location', description: 'Weather and nearby places in Maps' },
  { key: 'calendar', icon: 'calendar', title: 'Calendar & reminders', description: 'Plan events and reminders on your phone' },
  { key: 'notifications', icon: 'bell', title: 'Notifications', description: 'Show reminders and assistant updates' },
];

function KavyaAvatar({ listening }: { listening: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const listenAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 2500, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 2500, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  useEffect(() => {
    Animated.timing(listenAnim, {
      toValue: listening ? 1 : 0,
      duration: 350,
      useNativeDriver: true
    }).start();
  }, [listening, listenAnim]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });
  const listenScale = listenAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.15] });
  const ringOpacity = listenAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.6] });
  
  return (
    <View style={styles.avatarContainer}>
       <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: ringScale }], opacity: ringOpacity, justifyContent: 'center', alignItems: 'center' }]}>
         <Svg width="320" height="320" viewBox="0 0 320 320">
           <Defs>
             <RadialGradient id="ringGrad" cx="50%" cy="50%" r="50%">
               <Stop offset="0%" stopColor="#7B5EF8" stopOpacity="0" />
               <Stop offset="70%" stopColor="#00E5C8" stopOpacity="0.1" />
               <Stop offset="85%" stopColor="#7B5EF8" stopOpacity="0.4" />
               <Stop offset="100%" stopColor="#7B5EF8" stopOpacity="0" />
             </RadialGradient>
             <RadialGradient id="ringGrad2" cx="50%" cy="50%" r="50%">
               <Stop offset="60%" stopColor="#FF6B8A" stopOpacity="0" />
               <Stop offset="90%" stopColor="#FF6B8A" stopOpacity="0.3" />
               <Stop offset="100%" stopColor="#FF6B8A" stopOpacity="0" />
             </RadialGradient>
           </Defs>
           <Circle cx="160" cy="160" r="140" fill="url(#ringGrad)" />
           <Circle cx="160" cy="160" r="110" fill="url(#ringGrad2)" />
         </Svg>
       </Animated.View>

       <Animated.View style={[{ transform: [{ scale: Animated.multiply(scale, listenScale) }] }, styles.avatarArt]}>
          <Svg width="220" height="260" viewBox="0 0 220 260">
             <Defs>
                <LinearGradient id="faceGrad" x1="0" y1="0" x2="0" y2="1">
                   <Stop offset="0%" stopColor="#2A2154" />
                   <Stop offset="100%" stopColor="#0F0C29" />
                </LinearGradient>
                <LinearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
                   <Stop offset="0%" stopColor="#7B5EF8" />
                   <Stop offset="100%" stopColor="#08071A" />
                </LinearGradient>
             </Defs>
             
             <Path d="M 30 140 C 10 210, 40 260, 40 260 L 180 260 C 180 260, 210 210, 190 140 C 180 50, 110 40, 110 40 C 110 40, 40 50, 30 140 Z" fill="url(#hairGrad)" opacity="0.8" />
             
             <Path d="M 60 260 L 80 220 L 140 220 L 160 260 Z" fill="#0B0924" stroke="#7B5EF8" strokeWidth="1.5" />
             <Path d="M 85 220 L 110 245 L 135 220" fill="none" stroke="#00E5C8" strokeWidth="1" />
             <Path d="M 70 260 L 90 230" fill="none" stroke="#FF6B8A" strokeWidth="1" strokeDasharray="4 4" />
             <Path d="M 150 260 L 130 230" fill="none" stroke="#FF6B8A" strokeWidth="1" strokeDasharray="4 4" />

             <Path d="M 65 110 C 65 170 85 210 110 220 C 135 210 155 170 155 110 C 155 60 135 50 110 50 C 85 50 65 60 65 110 Z" fill="url(#faceGrad)" stroke="#7B5EF8" strokeWidth="1.5" />

             <Path d="M 65 110 C 60 70 80 45 110 45 C 140 45 160 70 155 110 C 145 90 125 90 110 100 C 95 90 75 90 65 110 Z" fill="#08071A" stroke="#7B5EF8" strokeWidth="1" />

             <Path d="M 75 115 Q 90 108 100 115" fill="none" stroke="#FF6B8A" strokeWidth="1.5" strokeLinecap="round" />
             <Path d="M 145 115 Q 130 108 120 115" fill="none" stroke="#FF6B8A" strokeWidth="1.5" strokeLinecap="round" />

             <Path d="M 110 125 L 110 155 L 106 158" fill="none" stroke="#46368C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

             <Path d="M 98 175 Q 110 180 122 175" fill="none" stroke="#FF6B8A" strokeWidth="1.5" strokeLinecap="round" />
             <Path d="M 103 182 Q 110 186 117 182" fill="none" stroke="#FF6B8A" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          </Svg>

          <Animated.View style={[StyleSheet.absoluteFill, { opacity: Animated.subtract(1, listenAnim) }]}>
            <Svg width="220" height="260" viewBox="0 0 220 260">
              <Path d="M 75 133 Q 88 130 100 133" fill="none" stroke="#7B5EF8" strokeWidth="2" strokeLinecap="round" />
              <Path d="M 145 133 Q 132 130 120 133" fill="none" stroke="#7B5EF8" strokeWidth="2" strokeLinecap="round" />
            </Svg>
          </Animated.View>

          <Animated.View style={[StyleSheet.absoluteFill, { opacity: listenAnim }]}>
            <Svg width="220" height="260" viewBox="0 0 220 260">
              <Defs>
                <RadialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#00E5C8" stopOpacity="0.8"/>
                  <Stop offset="100%" stopColor="#00E5C8" stopOpacity="0"/>
                </RadialGradient>
              </Defs>
              <Path d="M 75 133 Q 88 123 100 133" fill="none" stroke="#00E5C8" strokeWidth="2" strokeLinecap="round" />
              <Ellipse cx="88" cy="130" rx="4" ry="2" fill="#FFF" />
              <Circle cx="88" cy="130" r="14" fill="url(#eyeGlow)" />
              
              <Path d="M 145 133 Q 132 123 120 133" fill="none" stroke="#00E5C8" strokeWidth="2" strokeLinecap="round" />
              <Ellipse cx="132" cy="130" rx="4" ry="2" fill="#FFF" />
              <Circle cx="132" cy="130" r="14" fill="url(#eyeGlow)" />
              
              <Ellipse cx="80" cy="155" rx="12" ry="6" fill="#FF6B8A" opacity="0.3" />
              <Ellipse cx="140" cy="155" rx="12" ry="6" fill="#FF6B8A" opacity="0.3" />
            </Svg>
          </Animated.View>
       </Animated.View>
    </View>
  );
}

const Orb = KavyaAvatar;

function PrimaryButton({ title, onPress, secondary = false }: { title: string; onPress: () => void; secondary?: boolean }) {
  const colors = useColors();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.primaryButton, { backgroundColor: secondary ? colors.secondary : colors.primary }, pressed && styles.pressed]}>
      <Text style={[styles.primaryButtonText, { color: secondary ? colors.foreground : colors.primaryForeground }]}>{title}</Text>
      <Feather name="arrow-right" size={18} color={secondary ? colors.foreground : colors.primaryForeground} />
    </Pressable>
  );
}

export default function AssistantScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState<Stage>('welcome');
  const [booting, setBooting] = useState(true);
  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>({ microphone: false, contacts: false, location: false, calendar: false, notifications: false });
  const [savedKeys, setSavedKeys] = useState<GeminiKeyMeta[]>([]);
  const [activeKeyId, setActiveKeyId] = useState<string | null>(null);
  const [newGeminiKey, setNewGeminiKey] = useState('');
  const [newGeminiLabel, setNewGeminiLabel] = useState('');
  const [listening, setListening] = useState(false);
  const [autoListen, setAutoListen] = useState(true);
  const [command, setCommand] = useState('');
  const [reply, setReply] = useState('Main ready hoon. “Hey Kavya” bolo.');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const restartVoice = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingVoice = useRef(false);
  const wakeActive = useRef(false);
  const hasSpokenInitialReply = useRef(false);
  const returnToAssistantAfterKeySave = useRef(false);
  const conversation = useRef<Array<{ role: 'user' | 'model'; text: string }>>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const lastReply = useRef(reply);

  useEffect(() => {
    if (reply !== lastReply.current) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
      lastReply.current = reply;
    }
  }, [reply, fadeAnim]);

  const grantedCount = useMemo(() => Object.values(permissions).filter(Boolean).length, [permissions]);

  const voiceErrorStreak = useRef(0);

  useSpeechRecognitionEvent('start', () => {
    if (Platform.OS !== 'web') { setListening(true); voiceErrorStreak.current = 0; }
  });
  useSpeechRecognitionEvent('end', () => {
    if (Platform.OS !== 'web') {
      setListening(false);
      if (autoListen && stage === 'assistant' && !processingVoice.current) {
        restartVoice.current = setTimeout(() => startListening(), 450);
      }
    }
  });
  useSpeechRecognitionEvent('error', (event) => {
    if (event.error !== 'aborted' && event.error !== 'no-speech' && stage === 'assistant') {
      voiceErrorStreak.current += 1;
      // First couple of failures are usually just the background wake-word
      // service still releasing the mic on app open — retry quietly.
      if (voiceErrorStreak.current >= 3) {
        setReply('Voice service ready nahi hai. Microphone aur Google voice service check karo.');
      }
    }
  });
  useSpeechRecognitionEvent('result', (event) => {
    voiceErrorStreak.current = 0;
    const transcript = event.results[0]?.transcript?.trim() ?? '';
    if (!transcript || !event.isFinal) return;
    const wakeMatch = transcript.match(/^(hey|hi|hello|हाय|हेलो)\s+kavya\b[\s,.:!?-]*(.*)$/i);
    const spokenCommand = wakeMatch?.[2].trim() ?? (wakeActive.current ? transcript : '');
    if (wakeMatch || wakeActive.current) {
      wakeActive.current = !spokenCommand;
      setReply(spokenCommand ? `Suna: “${spokenCommand}”` : 'Haan, bolo. Main sun rahi hoon.');
      if (spokenCommand) {
        setCommand(spokenCommand);
        processingVoice.current = true;
        void runCommand(spokenCommand).finally(() => { processingVoice.current = false; });
      }
    }
  });

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      try {
        const [savedStage, indexValue, activeValue] = await Promise.all([
          AsyncStorage.getItem(STORAGE_STAGE),
          AsyncStorage.getItem(STORAGE_GEMINI_KEYS),
          AsyncStorage.getItem(STORAGE_ACTIVE_GEMINI_KEY),
        ]);
        const index = indexValue ? JSON.parse(indexValue) as GeminiKeyMeta[] : [];
        const valid: GeminiKeyMeta[] = [];
        for (const meta of index) if (await SecureStore.getItemAsync(`${GEMINI_KEY_PREFIX}${meta.id}`)) valid.push(meta);
        const resolvedActiveKey = activeValue && valid.some((key) => key.id === activeValue) ? activeValue : valid[0]?.id ?? null;
        if (cancelled) return;
        setSavedKeys(valid);
        setActiveKeyId(resolvedActiveKey);
        if (savedStage === 'assistant') {
          if (resolvedActiveKey) setStage('assistant');
          else {
            returnToAssistantAfterKeySave.current = true;
            setStage('gemini-key');
          }
        } else if (resolvedActiveKey) {
          setStage('welcome');
        } else {
          setStage('gemini-key');
        }
      } catch {
        if (!cancelled) {
          setSavedKeys([]);
          setActiveKeyId(null);
          const savedStage = await AsyncStorage.getItem(STORAGE_STAGE);
          returnToAssistantAfterKeySave.current = savedStage === 'assistant';
          setStage('gemini-key');
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    };
    void hydrate();
    return () => { if (restartVoice.current) clearTimeout(restartVoice.current); };
  }, []);

  useEffect(() => {
    if (stage === 'assistant' && autoListen && Platform.OS !== 'web') {
      const timer = setTimeout(() => startListening(), 1200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [stage, autoListen]);

  useEffect(() => {
    if (Platform.OS === 'web' || stage !== 'assistant' || !hasSpokenInitialReply.current || !reply.trim()) return;
    Speech.stop();
    if (listening) ExpoSpeechRecognitionModule.abort();
    Speech.speak(reply, {
      language: 'hi-IN',
      rate: 0.95,
      onDone: () => {
        if (autoListen && stage === 'assistant' && !processingVoice.current) {
          restartVoice.current = setTimeout(() => startListening(), 450);
        }
      },
    });
  }, [reply, stage]);

  const saveStage = async (next: Stage) => {
    setStage(next);
    if (next === 'assistant') await AsyncStorage.setItem(STORAGE_STAGE, next);
  };

  const enterAssistant = async () => {
    if (activeKeyId) {
      await saveStage('assistant');
    } else {
      setStage('gemini-key');
    }
  };

  async function startListening() {
    if (Platform.OS === 'web' || !autoListen || processingVoice.current) return;
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setReply('Microphone permission ke baad “Hey Kavya” kaam karega.');
        return;
      }
      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
        setReply('Is phone par Google speech service available nahi hai.');
        return;
      }
      ExpoSpeechRecognitionModule.start({ lang: 'en-IN', interimResults: true, continuous: true, contextualStrings: ['Kavya', 'Hey Kavya', 'Hi Kavya', 'Hello Kavya'] });
    } catch {
      setReply('Voice start nahi ho payi. Mic permission check karo.');
    }
  }

  const askGemini = useCallback(async (prompt: string) => {
    if (!activeKeyId) return null;
    const apiKey = await SecureStore.getItemAsync(`${GEMINI_KEY_PREFIX}${activeKeyId}`);
    if (!apiKey) return null;
    const history = conversation.current.slice(-8);
    const contents = [
      {
        role: 'user',
        parts: [{ text: 'You are Kavya, a helpful Hindi/Hinglish Android voice assistant. Answer naturally and briefly in the language the user uses. Do not claim that you performed phone actions unless the app confirms it.' }],
      },
      ...history.map((message) => ({ role: message.role, parts: [{ text: message.text }] })),
      { role: 'user', parts: [{ text: prompt }] },
    ];
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 512 } }),
    });
    if (!response.ok) {
      if (response.status === 400 || response.status === 403) throw new Error('Gemini key invalid hai ya API enabled nahi hai.');
      throw new Error('Gemini service abhi available nahi hai.');
    }
    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
    if (!text) throw new Error('Gemini ne empty response diya.');
    conversation.current = [
      ...history,
      { role: 'user' as const, text: prompt },
      { role: 'model' as const, text },
    ].slice(-10);
    return text;
  }, [activeKeyId]);

  const requestPermission = async (key: PermissionKey) => {
    if (Platform.OS === 'web') { setPermissions((current) => ({ ...current, [key]: true })); return; }
    try {
      if (key === 'microphone') {
        const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        setPermissions((current) => ({ ...current, microphone: result.granted }));
        return;
      }
      if (key === 'location') {
        const result = await Location.requestForegroundPermissionsAsync();
        setPermissions((current) => ({ ...current, location: result.status === 'granted' }));
        return;
      }
      const androidPermission: Record<Exclude<PermissionKey, 'microphone' | 'location'>, string> = { contacts: 'android.permission.READ_CONTACTS', calendar: 'android.permission.WRITE_CALENDAR', notifications: 'android.permission.POST_NOTIFICATIONS' };
      if (Platform.OS === 'android') {
        const PermissionsAndroid = require('react-native').PermissionsAndroid;
        const result = await PermissionsAndroid.request(androidPermission[key], { title: `Kavya ko ${permissionRows.find((row) => row.key === key)?.title} access chahiye`, message: permissionRows.find((row) => row.key === key)?.description, buttonPositive: 'Allow', buttonNegative: 'Not now' });
        setPermissions((current) => ({ ...current, [key]: result === PermissionsAndroid.RESULTS.GRANTED }));
      } else setPermissions((current) => ({ ...current, [key]: true }));
    } catch { Alert.alert('Permission nahi mili', 'Aap baad mein phone Settings se permission de sakte hain.'); }
  };

  const persistKeyIndex = async (next: GeminiKeyMeta[], nextActive: string | null) => {
    setSavedKeys(next); setActiveKeyId(nextActive);
    await AsyncStorage.setItem(STORAGE_GEMINI_KEYS, JSON.stringify(next));
    if (nextActive) await AsyncStorage.setItem(STORAGE_ACTIVE_GEMINI_KEY, nextActive);
    else await AsyncStorage.removeItem(STORAGE_ACTIVE_GEMINI_KEY);
  };

  const saveGeminiKey = async () => {
    if (Platform.OS === 'web') { Alert.alert('Android APK only', 'Secure Gemini vault APK mein available hoga.'); return; }
    const value = newGeminiKey.trim();
    if (!value) { Alert.alert('API key missing', 'Pehle Gemini API key paste karo.'); return; }
    if (!/^AIza[0-9A-Za-z_-]{20,}$/.test(value)) {
      Alert.alert('Invalid Gemini API key', 'Gemini key “AIza” se start honi chahiye. Copy karke poori key dobara paste karo.');
      return;
    }
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const meta: GeminiKeyMeta = { id, label: newGeminiLabel.trim() || `Backup key ${savedKeys.length + 1}`, last4: value.slice(-4), createdAt: new Date().toLocaleDateString('en-IN') };
    try {
      await SecureStore.setItemAsync(`${GEMINI_KEY_PREFIX}${id}`, value);
      await persistKeyIndex([...savedKeys, meta], activeKeyId ?? id);
      setNewGeminiKey(''); setNewGeminiLabel('');
      if (stage === 'gemini-key') {
        if (returnToAssistantAfterKeySave.current) await saveStage('assistant');
        else setStage('welcome');
        returnToAssistantAfterKeySave.current = false;
      }
      Alert.alert('Key securely saved', `${meta.label} device mein securely save ho gayi.`);
    } catch (err) {
      console.error('SecureStore save failed:', err);
      await SecureStore.deleteItemAsync(`${GEMINI_KEY_PREFIX}${id}`).catch(() => undefined);
      Alert.alert('Key save nahi hui', 'Secure device storage available nahi hai. Android APK mein dobara try karo.');
    }
  };

  const chooseGeminiKey = async (id: string) => persistKeyIndex(savedKeys, id);
  const removeGeminiKey = async (id: string) => {
    await SecureStore.deleteItemAsync(`${GEMINI_KEY_PREFIX}${id}`);
    const next = savedKeys.filter((key) => key.id !== id);
    await persistKeyIndex(next, activeKeyId === id ? next[0]?.id ?? null : activeKeyId);
    if (next.length === 0) {
      await AsyncStorage.removeItem(STORAGE_STAGE);
      setStage('gemini-key');
    }
  };

  const runCommand = useCallback(async (input?: string) => {
    const original = (input ?? command).trim();
    const normalized = original.toLowerCase();
    if (!normalized) return;
    hasSpokenInitialReply.current = true;
    if (Platform.OS !== 'web') {
      try { ExpoSpeechRecognitionModule.abort(); } catch {}
    }
    setListening(false);
    if (normalized.includes('time')) setReply(`Abhi ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} baj rahe hain.`);
    else if (normalized.includes('date') || normalized.includes('today')) setReply(`Aaj ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} hai.`);
    else if (normalized.includes('timer')) {
      const minuteMatch = normalized.match(/(\d+)\s*(minute|min|मिनट)/);
      const secondMatch = normalized.match(/(\d+)\s*(second|sec|सेकंड)/);
      const seconds = minuteMatch ? Number(minuteMatch[1]) * 60 : secondMatch ? Number(secondMatch[1]) : 60;
      setTimerSeconds(seconds); setReply(`Timer ${minuteMatch ? `${Number(minuteMatch[1])} minute` : `${seconds} second`} ke liye set hai.`);
      setTimeout(() => { setTimerSeconds(null); setReply('Timer complete ho gaya.'); }, seconds * 1000);
    } else if (normalized.includes('alarm')) {
      const timeMatch = normalized.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
      if (!timeMatch) setReply('Alarm ka time bolo, jaise “alarm 7:30 AM”.');
      else {
        let hour = Number(timeMatch[1]); const minute = Number(timeMatch[2] ?? 0);
        if (timeMatch[3] === 'pm' && hour < 12) hour += 12;
        if (timeMatch[3] === 'am' && hour === 12) hour = 0;
        setPendingAction({ title: 'Alarm set karni hai?', detail: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ke liye Clock khulega.`, uri: Platform.OS === 'android' ? `intent:#Intent;action=android.intent.action.SET_ALARM;S.android.intent.extra.alarm.HOUR=${hour};S.android.intent.extra.alarm.MINUTES=${minute};end` : 'clock://' });
        setReply('Alarm ready hai. Confirm karne ke baad Clock khulega.');
      }
    } else if (normalized.includes('youtube') || normalized.includes('music')) {
      setPendingAction({ title: 'YouTube search kholni hai?', detail: original, uri: `https://www.youtube.com/results?search_query=${encodeURIComponent(original)}` }); setReply('YouTube search ready hai. Confirm kar do.');
    } else if (normalized.includes('map') || normalized.includes('hospital') || normalized.includes('restaurant')) {
      setPendingAction({ title: 'Google Maps search kholni hai?', detail: original, uri: `https://www.google.com/maps/search/${encodeURIComponent(original)}` }); setReply('Maps search ready hai. Confirm kar do.');
    } else if (normalized.includes('whatsapp')) {
      const messageMatch = original.match(/(?:saying|that|बोलकर|कहो)\s+(.+)$/i); const body = messageMatch?.[1] ?? original.replace(/.*whatsapp\s*/i, '').trim();
      setPendingAction({ title: 'WhatsApp message ready hai', detail: body || 'Message text missing hai.', uri: `whatsapp://send?text=${encodeURIComponent(body)}` }); setReply('WhatsApp kholne se pehle tumhari confirmation chahiye.');
    } else if (normalized.includes('call')) {
      const number = original.match(/\+?\d[\d\s-]{7,}/)?.[0]?.replace(/[^\d+]/g, '');
      if (!number) setReply('Call ke liye number bolo, jaise “call 9876543210”.');
      else { setPendingAction({ title: 'Dialer kholna hai?', detail: number, uri: `tel:${number}` }); setReply('Number mil gaya. Confirm karne ke baad dialer khulega.'); }
    } else if (normalized.includes('message') || normalized.includes('sms')) {
      const number = original.match(/\+?\d[\d\s-]{7,}/)?.[0]?.replace(/[^\d+]/g, ''); const messageMatch = original.match(/(?:saying|that|बोलकर|कहो)\s+(.+)$/i); const body = messageMatch?.[1] ?? '';
      if (!number) setReply('SMS ke liye number bolo, jaise “SMS 9876543210 saying hello”.');
      else { setPendingAction({ title: 'SMS draft kholna hai?', detail: `${number}${body ? `\n${body}` : '\n(Message text missing hai)'}`, uri: `sms:${number}${body ? `?body=${encodeURIComponent(body)}` : ''}` }); setReply('SMS draft ready hai. Send karne se pehle phone mein check kar lena.'); }
    } else if (activeKeyId) {
      try {
        const answer = await askGemini(original);
        setReply(answer ?? 'Gemini key read nahi ho pa rahi. Settings mein active key check karo.');
      } catch (error) {
        setReply(error instanceof Error ? error.message : 'Gemini se answer nahi mil paya.');
      }
    } else setReply('Is sawaal ke liye Settings mein Gemini API key add karke active select karo.');
    setCommand('');
    wakeActive.current = false;
  }, [activeKeyId, askGemini, command]);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const handleWakeUrl = (url: string | null) => {
      if (!url?.startsWith('kavya-assistant://wake')) return;
      const encodedText = url.split('?text=')[1] ?? '';
      const spokenCommand = decodeURIComponent(encodedText).trim();
      setAutoListen(true);
      setReply(spokenCommand ? `Suna: “${spokenCommand}”` : 'Haan, bolo. Main sun rahi hoon.');
      if (spokenCommand) {
        void runCommand(spokenCommand);
      }
    };
    const subscription = Linking.addEventListener('url', ({ url }) => handleWakeUrl(url));
    void Linking.getInitialURL().then(handleWakeUrl);
    return () => subscription.remove();
  }, [runCommand]);

  const confirmAction = async () => {
    if (!pendingAction) return;
    try { await Linking.openURL(pendingAction.uri); setReply(`${pendingAction.title.replace('?', '')} complete.`); }
    catch { setReply('Ye action is phone par available nahi hai.'); }
    finally { setPendingAction(null); }
  };

  if (booting) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 24, justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.brandRow}><View style={styles.brandDot} /><Text style={styles.brand}>KAVYA <Text style={styles.brandLight}>2.0</Text></Text></View>
        <Text style={styles.reply}>Secure setup check ho raha hai...</Text>
      </View>
    );
  }

  if (stage === 'welcome') {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
        <View style={styles.brandRow}><View style={styles.brandDot} /><Text style={styles.brand}>KAVYA <Text style={styles.brandLight}>2.0</Text></Text></View>
        <View style={styles.welcomeContent}>
          <Text style={styles.eyebrow}>YOUR EVERYDAY VOICE COMPANION</Text>
          <Text style={styles.heroTitle}>Bolo. Kavya{'\n'}kar degi.</Text>
          <Text style={styles.heroBody}>Hindi, English ya dono mix karke bolo. Kavya tumhari baat samjhegi aur phone par kaam karne mein help karegi.</Text>
          <View style={styles.heroOrb}><Orb listening={false} /></View>
          <View style={styles.trustLine}><Feather name="shield" size={16} color={colors.primary} /><Text style={styles.trustText}>Tumhari permission ke bina koi action nahi</Text></View>
        </View>
        <View style={[styles.bottomArea, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <PrimaryButton title="Kavya ko setup karo" onPress={() => saveStage('permissions')} />
          <Text style={styles.smallCenter}>Setup mein lagbhag 2 minute lagenge</Text>
        </View>
      </View>
    );
  }

  if (stage === 'permissions') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}><Pressable onPress={() => setStage('welcome')}><Feather name="arrow-left" size={22} color={colors.foreground} /></Pressable><Text style={styles.pageTitle}>Phone access</Text><Text style={styles.step}>1 / 1</Text></View>
        <Text style={styles.sectionTitle}>Kavya ko aapki awaaz sunni hai</Text>
        <Text style={styles.sectionBody}>Sirf wahi permissions allow karo jo tum use karna chahte ho. Gemini optional hai aur setup ke baad Settings mein add hoga.</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(18, (grantedCount / permissionRows.length) * 100)}%` }]} /></View>
        <Text style={styles.progressLabel}>{grantedCount} of {permissionRows.length} ready</Text>
        <View style={styles.permissionList}>
          {permissionRows.map((row) => (
            <Pressable key={row.key} onPress={() => requestPermission(row.key)} style={styles.permissionRow}>
              <View style={styles.permissionIcon}><Feather name={row.icon} size={19} color={colors.primary} /></View>
              <View style={styles.permissionCopy}><Text style={styles.permissionTitle}>{row.title}</Text><Text style={styles.permissionDescription}>{row.description}</Text></View>
              <View style={[styles.statusPill, permissions[row.key] && styles.statusPillReady]}><Feather name={permissions[row.key] ? 'check' : 'plus'} size={15} color={permissions[row.key] ? '#081B18' : colors.primary} /></View>
            </Pressable>
          ))}
        </View>
        <View style={styles.note}><Feather name="info" size={16} color={colors.primary} /><Text style={styles.noteText}>Microphone ke bina voice assistant kaam nahi karega. Baaki access optional commands ke liye hai.</Text></View>
        <PrimaryButton title="Kavya start karo" onPress={() => void enterAssistant()} />
        <Text style={styles.privacyCopy}>Permissions baad mein phone Settings se badli ja sakti hain.</Text>
      </ScrollView>
    );
  }

  if (stage === 'settings' || stage === 'gemini-key') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>{stage === 'settings' ? <Pressable onPress={() => setStage('assistant')}><Feather name="arrow-left" size={22} color={colors.foreground} /></Pressable> : <View style={styles.headerSpacer} />}<Text style={styles.pageTitle}>{stage === 'gemini-key' ? 'Gemini setup' : 'Settings'}</Text><Text style={styles.step}>KAVYA 2.0</Text></View>
        <View style={styles.geminiBadge}><Feather name="zap" size={18} color={colors.primary} /><Text style={styles.geminiBadgeText}>{stage === 'gemini-key' ? 'REQUIRED FOR GEMINI CHAT' : 'GEMINI BRAIN'}</Text></View>
        <Text style={styles.sectionTitle}>{stage === 'gemini-key' ? 'Pehle Gemini API key add karo' : 'Gemini key vault'}</Text>
        <Text style={styles.sectionBody}>{stage === 'gemini-key' ? 'Key sirf isi phone ke secure storage mein save hogi. Kavya ko Gemini conversation ke liye ek valid key chahiye.' : 'Multiple backup keys save karo, active key choose karo, aur keys ko device ke secure storage mein rakho. Actual key screen par kabhi show nahi hoti.'}</Text>
        <View style={styles.keyCard}>
          <Text style={styles.inputLabel}>LABEL</Text>
          <TextInput value={newGeminiLabel} onChangeText={setNewGeminiLabel} placeholder="Personal / backup" placeholderTextColor={colors.mutedForeground} style={styles.keyInput} />
          <Text style={[styles.inputLabel, { marginTop: 18 }]}>GEMINI API KEY</Text>
          <TextInput value={newGeminiKey} onChangeText={setNewGeminiKey} placeholder="AIza..." placeholderTextColor={colors.mutedForeground} secureTextEntry autoCapitalize="none" style={styles.keyInput} />
          <View style={styles.keyHint}><Feather name="lock" size={14} color={colors.mutedForeground} /><Text style={styles.keyHintText}>Key expo-secure-store mein encrypted device storage ke saath save hogi.</Text></View>
          <Pressable onPress={saveGeminiKey} style={styles.addKeyButton}><Feather name="plus" size={16} color={colors.primaryForeground} /><Text style={styles.addKeyText}>Securely save key</Text></Pressable>
        </View>
        <Text style={styles.inputLabel}>SAVED BACKUPS ({savedKeys.length})</Text>
        {savedKeys.length === 0 ? (
          <View style={styles.emptyKeyCard}><Feather name="key" size={18} color={colors.mutedForeground} /><Text style={styles.keyHintText}>Abhi koi Gemini key saved nahi hai. Kavya ke local commands phir bhi kaam karenge.</Text></View>
        ) : savedKeys.map((meta) => (
          <View key={meta.id} style={styles.savedKeyRow}>
            <Pressable onPress={() => chooseGeminiKey(meta.id)} style={styles.savedKeySelect}><View style={[styles.radio, activeKeyId === meta.id && styles.radioActive]}>{activeKeyId === meta.id && <View style={styles.radioDot} />}</View><View style={styles.savedKeyCopy}><Text style={styles.permissionTitle}>{meta.label}</Text><Text style={styles.permissionDescription}>•••• {meta.last4} · {meta.createdAt}{activeKeyId === meta.id ? ' · Active' : ''}</Text></View></Pressable>
            <Pressable onPress={() => removeGeminiKey(meta.id)} accessibilityLabel={`Delete ${meta.label}`} style={styles.deleteButton}><Feather name="trash-2" size={17} color="#FF8D88" /></Pressable>
          </View>
        ))}
        <Text style={styles.privacyCopy}>{stage === 'gemini-key' ? 'Key save hone ke baad Kavya assistant open ho jayegi. Key kabhi plain text mein store nahi hoti.' : 'Gemini key device ke secure storage mein encrypted form mein save hoti hai.'}</Text>
      </ScrollView>
    );
  }

  return (
    <View style={[styles.screen, styles.assistantScreen, { paddingTop: insets.top + 16 }]}>
      <View style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="bgGrad" cx="50%" cy="30%" r="60%">
              <Stop offset="0%" stopColor="#2A1B54" stopOpacity="0.5" />
              <Stop offset="100%" stopColor="#08071A" stopOpacity="1" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#bgGrad)" />
        </Svg>
      </View>

      <View style={styles.topNav}>
        <View style={styles.greetingBox}>
          <Text style={styles.helloText}>GOOD MORNING</Text>
          <View style={styles.nameRow}>
            <Text style={styles.kavyaText}>Kavya</Text>
            <View style={styles.onlineDot} />
          </View>
        </View>
        <View style={styles.topRightActions}>
          <Pressable onPress={() => setStage('gemini-key')} style={[styles.geminiChip, activeKeyId && styles.geminiChipActive]}>
            <Feather name="zap" size={12} color={activeKeyId ? '#00E5C8' : '#7B5EF8'} />
            <Text style={[styles.geminiChipText, { color: activeKeyId ? '#00E5C8' : '#7B5EF8' }]}>
              {activeKeyId ? 'Gemini active' : 'Add key'}
            </Text>
          </Pressable>
          <Pressable onPress={() => { if (listening) ExpoSpeechRecognitionModule.abort(); setStage('settings'); }} style={styles.gearButton}>
            <Feather name="settings" size={18} color="#F0EEFF" />
          </Pressable>
        </View>
      </View>

      <View style={styles.avatarStage}>
        <KavyaAvatar listening={listening} />
        
        <View style={styles.avatarLabelContainer}>
          <Text style={styles.avatarLabel}>KAVYA</Text>
        </View>

        <View style={styles.speechBubble}>
          <Animated.Text style={[styles.replyText, listening && styles.replyTextListening, { opacity: fadeAnim }]}>
            {reply}
          </Animated.Text>
        </View>

        {timerSeconds !== null && (
          <View style={styles.timerChip}>
            <Feather name="clock" size={14} color="#FF6B8A" />
            <Text style={styles.timerText}>{Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}</Text>
          </View>
        )}
      </View>

      <View style={[styles.bottomDock, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {pendingAction && (
          <View style={styles.actionCard}>
            <View style={styles.actionCardContent}>
              <Text style={styles.actionTitle}>{pendingAction.title}</Text>
              <Text style={styles.actionDetail}>{pendingAction.detail}</Text>
            </View>
            <View style={styles.actionButtons}>
              <Pressable style={styles.actionCancel} onPress={() => { setPendingAction(null); setReply('Action cancel kar di.'); }}>
                <Feather name="x" size={20} color="#F0EEFF" />
              </Pressable>
              <Pressable style={styles.actionConfirm} onPress={() => void confirmAction()}>
                <Feather name="check" size={20} color="#08071A" />
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.inputPill}>
          <Pressable 
            onPress={() => {
              if (listening) { setListening(false); try { ExpoSpeechRecognitionModule.abort(); } catch {} } 
              else { setAutoListen(true); void startListening(); }
            }} 
            style={[styles.micButton, listening && styles.micButtonActive]}
          >
            <Feather name={listening ? 'pause' : 'mic'} size={20} color={listening ? '#08071A' : '#F0EEFF'} />
          </Pressable>
          <TextInput
            value={command}
            onChangeText={setCommand}
            onSubmitEditing={() => void runCommand()}
            placeholder="Type or speak..."
            placeholderTextColor="rgba(240, 238, 255, 0.4)"
            style={styles.pillInput}
          />
          <Pressable 
            onPress={() => void runCommand()}
            style={[styles.sendPillButton, !command.trim() && { opacity: 0.5 }]}
            disabled={!command.trim()}
          >
            <Feather name="arrow-up" size={18} color="#08071A" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0A0920', paddingHorizontal: 22 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  headerSpacer: { width: 22, height: 22 },
  brandDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF8D88' },
  brand: { color: '#F6F7FF', fontSize: 15, fontWeight: '700', letterSpacing: 2.4 },
  brandLight: { color: '#A7A4C1', fontWeight: '400' },
  welcomeContent: { flex: 1, justifyContent: 'center' },
  eyebrow: { color: '#A7A4C1', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 14 },
  heroTitle: { color: '#F6F7FF', fontSize: 45, lineHeight: 50, fontWeight: '700', letterSpacing: -1.2 },
  heroBody: { color: '#B9B6D0', fontSize: 16, lineHeight: 25, marginTop: 18, maxWidth: 340 },
  heroOrb: { alignItems: 'center', marginVertical: 34 },
  orbWrap: { width: 194, height: 194, justifyContent: 'center', alignItems: 'center' },
  orbGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#6E60E8' },
  orbOuter: { width: 144, height: 144, borderRadius: 72, backgroundColor: '#5142C1', justifyContent: 'center', alignItems: 'center', shadowColor: '#8C7CFF', shadowOpacity: 0.6, shadowRadius: 28, elevation: 15 },
  orbMiddle: { width: 112, height: 112, borderRadius: 56, backgroundColor: '#7669EF', justifyContent: 'center', alignItems: 'center' },
  orbCore: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#9B8CFF', justifyContent: 'center', alignItems: 'center' },
  trustLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  trustText: { color: '#A7A4C1', fontSize: 12 },
  bottomArea: { gap: 13 },
  primaryButton: { minHeight: 56, borderRadius: 17, paddingHorizontal: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  primaryButtonText: { fontWeight: '700', fontSize: 15 },
  pressed: { opacity: 0.72 },
  smallCenter: { textAlign: 'center', color: '#777394', fontSize: 12 },
  pageTitle: { color: '#F6F7FF', fontSize: 17, fontWeight: '700', flex: 1 },
  step: { color: '#A7A4C1', fontSize: 12 },
  sectionTitle: { color: '#F6F7FF', fontSize: 29, lineHeight: 35, fontWeight: '700', marginTop: 39 },
  sectionBody: { color: '#A7A4C1', fontSize: 15, lineHeight: 23, marginTop: 11 },
  progressTrack: { height: 6, backgroundColor: '#211D49', borderRadius: 3, marginTop: 27 },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: '#9B8CFF' },
  progressLabel: { color: '#A7A4C1', fontSize: 11, marginTop: 8, textAlign: 'right' },
  permissionList: { gap: 10, marginTop: 16, marginBottom: 18 },
  permissionRow: { backgroundColor: '#151333', borderRadius: 17, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  permissionIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#211D49', alignItems: 'center', justifyContent: 'center' },
  permissionCopy: { flex: 1 },
  permissionTitle: { color: '#F6F7FF', fontSize: 15, fontWeight: '600' },
  permissionDescription: { color: '#85819F', fontSize: 11, marginTop: 4 },
  statusPill: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#514A87', justifyContent: 'center', alignItems: 'center' },
  statusPillReady: { backgroundColor: '#82E4C2', borderColor: '#82E4C2' },
  note: { backgroundColor: '#151333', borderRadius: 14, padding: 13, flexDirection: 'row', gap: 9, marginBottom: 18 },
  noteText: { flex: 1, color: '#A7A4C1', fontSize: 12, lineHeight: 18 },
  geminiBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 36, backgroundColor: '#211D49', borderRadius: 20, paddingVertical: 9, paddingHorizontal: 12 },
  geminiBadgeText: { color: '#C0B8FF', fontSize: 10, letterSpacing: 1.1, fontWeight: '700' },
  keyCard: { marginTop: 26, backgroundColor: '#151333', borderRadius: 19, padding: 17, marginBottom: 24 },
  inputLabel: { color: '#A7A4C1', fontSize: 10, letterSpacing: 1.4, fontWeight: '700' },
  keyInput: { color: '#F6F7FF', borderBottomWidth: 1, borderBottomColor: '#3B356A', paddingVertical: 13, fontSize: 16 },
  keyHint: { flexDirection: 'row', gap: 7, marginTop: 12 },
  keyHintText: { color: '#85819F', flex: 1, fontSize: 11, lineHeight: 16 },
  addKeyButton: { backgroundColor: '#9B8CFF', minHeight: 45, borderRadius: 13, marginTop: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  addKeyText: { color: '#0A0920', fontWeight: '700', fontSize: 13 },
  emptyKeyCard: { backgroundColor: '#151333', borderRadius: 16, padding: 15, flexDirection: 'row', gap: 9, marginTop: 12 },
  savedKeyRow: { backgroundColor: '#151333', borderRadius: 16, padding: 14, marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  savedKeySelect: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  savedKeyCopy: { flex: 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: '#514A87', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#82E4C2' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#82E4C2' },
  deleteButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  privacyCopy: { color: '#777394', textAlign: 'center', fontSize: 11, lineHeight: 17, marginTop: 17 },
  assistantHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hello: { color: '#85819F', fontSize: 10, letterSpacing: 1.7, fontWeight: '700' },
  assistantTitle: { color: '#F6F7FF', fontSize: 28, fontWeight: '700', marginTop: 5 },
  assistantTitleLight: { color: '#A7A4C1', fontWeight: '400' },
  settingsButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#151333', justifyContent: 'center', alignItems: 'center' },
  listeningArea: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  listeningLabel: { color: '#C0B8FF', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 5 },
  reply: { color: '#A7A4C1', textAlign: 'center', fontSize: 14, lineHeight: 21, maxWidth: 285, marginTop: 14 },
  timerBadge: { color: '#82E4C2', marginTop: 14, fontSize: 12, fontWeight: '700' },
  timerChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,107,138,0.15)', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, marginTop: 10 },
  timerText: { color: '#FF6B8A', fontSize: 13, fontWeight: '700' as const },
  confirmCard: { backgroundColor: '#211D49', borderRadius: 17, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  confirmIcon: { width: 35, height: 35, borderRadius: 12, backgroundColor: '#342B6B', alignItems: 'center', justifyContent: 'center' },
  confirmCopy: { flex: 1 },
  confirmTitle: { color: '#F6F7FF', fontSize: 13, fontWeight: '700' },
  confirmDetail: { color: '#B9B6D0', fontSize: 11, marginTop: 4 },
  confirmButtons: { gap: 7 },
  cancelButton: { paddingVertical: 7, paddingHorizontal: 10 },
  cancelText: { color: '#A7A4C1', fontSize: 11, fontWeight: '700' },
  confirmButton: { backgroundColor: '#82E4C2', borderRadius: 9, paddingVertical: 8, paddingHorizontal: 10 },
  confirmText: { color: '#081B18', fontSize: 11, fontWeight: '800' },
  commandBox: { height: 56, borderRadius: 17, backgroundColor: '#151333', flexDirection: 'row', alignItems: 'center', paddingLeft: 17, paddingRight: 7, marginBottom: 12 },
  commandInput: { flex: 1, color: '#F6F7FF', fontSize: 14 },
  sendButton: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#9B8CFF', alignItems: 'center', justifyContent: 'center' },
  quickRow: { flexDirection: 'row', gap: 10 },
  listenButton: { flex: 1, height: 52, borderRadius: 16, backgroundColor: '#9B8CFF', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  listenButtonActive: { backgroundColor: '#FF8D88' },
  listenButtonText: { color: '#0A0920', fontWeight: '700', fontSize: 14 },
  quickButton: { flex: 1, height: 52, borderRadius: 16, backgroundColor: '#211D49', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  quickButtonText: { color: '#D1CEE1', fontSize: 12, fontWeight: '600' },
  capabilityCard: { backgroundColor: '#151333', borderRadius: 18, marginTop: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  capabilityEyebrow: { color: '#85819F', fontSize: 10, letterSpacing: 1.3, fontWeight: '700', marginBottom: 7 },
  capabilityText: { color: '#D1CEE1', fontSize: 13, marginTop: 4 },
  footerText: { textAlign: 'center', color: '#625E7C', fontSize: 10, marginTop: 13 },
  assistantScreen: { flex: 1, justifyContent: 'space-between' },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10 },
  greetingBox: { gap: 4 },
  helloText: { fontSize: 10, fontWeight: '800', color: '#00E5C8', letterSpacing: 1.5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kavyaText: { fontSize: 24, fontWeight: '300', color: '#F0EEFF', letterSpacing: 0.5 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00E5C8', shadowColor: '#00E5C8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 },
  topRightActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  geminiChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(123, 94, 248, 0.1)', borderWidth: 1, borderColor: 'rgba(123, 94, 248, 0.3)' },
  geminiChipActive: { backgroundColor: 'rgba(0, 229, 200, 0.1)', borderColor: 'rgba(0, 229, 200, 0.3)' },
  geminiChipText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  gearButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(240, 238, 255, 0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(240, 238, 255, 0.1)' },
  avatarStage: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  avatarContainer: { width: 320, height: 320, justifyContent: 'center', alignItems: 'center' },
  avatarArt: { width: 220, height: 260 },
  avatarLabelContainer: { marginTop: -20, alignItems: 'center', justifyContent: 'center' },
  avatarLabel: { fontSize: 14, fontWeight: '900', color: '#F0EEFF', letterSpacing: 8, opacity: 0.8, textShadowColor: '#7B5EF8', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  speechBubble: { marginTop: 24, paddingHorizontal: 32, alignItems: 'center', maxWidth: '90%' },
  replyText: { fontSize: 18, fontWeight: '400', color: '#F0EEFF', textAlign: 'center', lineHeight: 26, opacity: 0.9 },
  replyTextListening: { color: '#00E5C8', textShadowColor: 'rgba(0, 229, 200, 0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  bottomDock: { zIndex: 10, gap: 16 },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(20, 15, 40, 0.85)', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(123, 94, 248, 0.3)' },
  actionCardContent: { flex: 1, paddingRight: 16 },
  actionTitle: { fontSize: 14, fontWeight: '700', color: '#F0EEFF', marginBottom: 4 },
  actionDetail: { fontSize: 13, color: 'rgba(240, 238, 255, 0.6)' },
  actionButtons: { flexDirection: 'row', gap: 8 },
  actionCancel: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(240, 238, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
  actionConfirm: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00E5C8', justifyContent: 'center', alignItems: 'center', shadowColor: '#00E5C8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8 },
  inputPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(20, 15, 40, 0.85)', borderRadius: 32, padding: 6, borderWidth: 1, borderColor: 'rgba(123, 94, 248, 0.3)' },
  micButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(240, 238, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
  micButtonActive: { backgroundColor: '#FF6B8A', shadowColor: '#FF6B8A', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10 },
  pillInput: { flex: 1, height: 44, paddingHorizontal: 16, color: '#F0EEFF', fontSize: 16 },
  sendPillButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0EEFF', justifyContent: 'center', alignItems: 'center' },
});