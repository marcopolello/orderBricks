import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { MattoniStructure } from '../types/mattoni';

const COLORS = {
  standalone: '#FFB6C1',
  contenitore: '#98FB98',
  'figlio-contenitore': '#87CEEB',
  figlio: '#DDA0DD',
};

const windowWidth = Dimensions.get('window').width;

const SIZES = {
  standalone: windowWidth / 2 - 20,
  figlio: windowWidth / 2 - 20,
  contenitore: windowWidth - 40,
  'figlio-contenitore': windowWidth - 60,
};

const JsonReader = () => {
  const [jsonData, setJsonData] = useState<MattoniStructure | null>(null);

  useEffect(() => {
    const data: MattoniStructure = require('../../assets/ordine-mattoni-sintesi-ee.json');
    setJsonData(data);
  }, []);

  const renderMattone = (mattone: any, level: number = 0): JSX.Element => {
    const isContainer = mattone.tipo === 'contenitore' || mattone.tipo === 'figlio-contenitore';
    const size = SIZES[mattone.tipo as keyof typeof SIZES] || windowWidth / 3;

    return (
      <View 
        key={mattone.mattone} 
        style={[
          styles.mattoneSquare,
          { 
            backgroundColor: COLORS[mattone.tipo as keyof typeof COLORS] || '#FFA500',
            width: size,
            minHeight: isContainer ? size : size,
            padding: isContainer ? 15 : 10,
          }
        ]}
      >
        <Text style={styles.mattoneName}>{mattone.mattone}</Text>
        <View style={styles.propertyContainer}>
          {mattone.tipo && (
            <Text style={styles.property}>Tipo: {mattone.tipo}</Text>
          )}
          {mattone.sezione && (
            <Text style={styles.property}>Sezione: {mattone.sezione}</Text>
          )}
          {mattone.ordine && (
            <Text style={styles.property}>Ordine: {mattone.ordine}</Text>
          )}
        </View>
        
        {mattone.figli && (
          <View style={styles.figliContainer}>
            {mattone.figli.map((figlio: any) => renderMattone(figlio, level + 1))}
          </View>
        )}
      </View>
    );
  };

  const renderSection = (title: string, data: any[] | undefined) => {
    if (!data) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.mattoniContainer}>
          {data.map(mattone => renderMattone(mattone))}
        </View>
      </View>
    );
  };

  if (!jsonData) {
    return <Text>Loading...</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      {renderSection('First Page', jsonData.firstpage)}
      {renderSection('Pre Multipod', jsonData.preMultipod)}
      {renderSection('Multipod', jsonData.multipod)}
      {renderSection('Post Multipod', jsonData.postMultipod)}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  mattoniContainer: {
    flexDirection: 'column',
    gap: 15,
  },
  mattoneSquare: {
    margin: 5,
    borderRadius: 10,
    justifyContent: 'flex-start',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mattoneName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  propertyContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  property: {
    fontSize: 14,
    color: '#444',
    marginVertical: 2,
  },
  figliContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    padding: 5,
  },
});

export default JsonReader;