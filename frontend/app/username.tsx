import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setUsername } from '../src/services/api';
import { Ionicons } from '@expo/vector-icons';

export default function UsernameScreen() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('En az 2 karakter girin');
      return;
    }
    if (trimmed.length > 20) {
      setError('En fazla 20 karakter');
      return;
    }

    setLoading(true);
    try {
      await setUsername(trimmed);
      router.replace('/');
    } catch (e) {
      setError('Bir hata oluştu');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Ionicons name="person-circle" size={80} color="#009688" />
          <Text style={styles.title}>Hoş Geldiniz!</Text>
          <Text style={styles.subtitle}>Lütfen bir kullanıcı adı seçin</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Kullanıcı adınız"
            placeholderTextColor="#666"
            value={name}
            onChangeText={(t) => {
              setName(t);
              setError('');
            }}
            maxLength={20}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Kaydediliyor...' : 'Başla'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Bu isim liderlik tablosunda görünecek
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#2d2d44',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#fff',
    borderWidth: 2,
    borderColor: '#009688',
  },
  error: {
    color: '#ff6b6b',
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#009688',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hint: {
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
});
