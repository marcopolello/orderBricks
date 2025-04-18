import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import JsonReader from './components/JsonReader';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <JsonReader />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});