import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Dimensions,
  Modal,
  TextInput,
  TouchableOpacity,
  Pressable
} from 'react-native';
import { MattoniStructure } from '../../types/mattoni';

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
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMattone, setSelectedMattone] = useState<any>(null);
  const [newOrdine, setNewOrdine] = useState('');

  useEffect(() => {
    const data: MattoniStructure = require('../../assets/ordine-mattoni-sintesi-ee.json');
    setJsonData(data);
  }, []);

  const handleMattonePress = (mattone: any) => {
    setSelectedMattone(mattone);
    setNewOrdine(mattone.ordine.toString());
    setModalVisible(true);
  };

  const handleOrdineChange = () => {
    if (!jsonData || !selectedMattone || !newOrdine) return;

    const newOrdineNum = parseInt(newOrdine);
    const newData = JSON.parse(JSON.stringify(jsonData));

    // Funzione per trovare e aggiornare il mattone selezionato nei dati
    const updateSelectedMattone = (data: any): boolean => {
      if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          if (data[i].mattone === selectedMattone.mattone) {
            // Trova il mattone con cui scambiare
            const mattoneToSwap = findMattoneByOrdine(newData, newOrdineNum);
            if (mattoneToSwap) {
              // Scambia gli ordini
              const tempOrdine = data[i].ordine;
              data[i].ordine = newOrdineNum;
              mattoneToSwap.ordine = tempOrdine;
            } else {
              data[i].ordine = newOrdineNum;
            }
            return true;
          }
          if (data[i].figli) {
            const found = updateSelectedMattone(data[i].figli);
            if (found) return true;
          }
        }
      }
      return false;
    };

    // Funzione per trovare un mattone per ordine
    const findMattoneByOrdine = (data: any, ordine: number): any => {
      for (const section in data) {
        const items = data[section];
        for (const item of items) {
          if (item.ordine === ordine) {
            return item;
          }
          if (item.figli) {
            const found = findMattoneByOrdine({ section: item.figli }, ordine);
            if (found) return found;
          }
        }
      }
      return null;
    };

    // Aggiorna i dati
    Object.values(newData).forEach(section => {
      updateSelectedMattone(section);
    });

    setJsonData(newData);
    setModalVisible(false);
    setSelectedMattone(null);
    setNewOrdine('');
  };

  const renderMattone = (mattone: any, level: number = 0): JSX.Element => {
    const isContainer = mattone.tipo === 'contenitore' || mattone.tipo === 'figlio-contenitore';
    const size = SIZES[mattone.tipo as keyof typeof SIZES] || windowWidth / 3;

    return (
      <Pressable 
        key={mattone.mattone}
        onPress={() => handleMattonePress(mattone)}
      >
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
      </Pressable>
    );
  };

  const renderSection = (title: string, data: any[] | undefined) => {
    if (!data) return null;
    
    // Ordina i mattoni per la proprietà ordine
    const sortedData = [...data].sort((a, b) => {
      const ordineA = a.ordine || 0;
      const ordineB = b.ordine || 0;
      return ordineA - ordineB;
    });

    // Funzione ricorsiva per ordinare i figli
    const sortChildren = (mattone: any) => {
      if (mattone.figli && mattone.figli.length > 0) {
        mattone.figli.sort((a: any, b: any) => {
          const ordineA = a.ordine || 0;
          const ordineB = b.ordine || 0;
          return ordineA - ordineB;
        });
        mattone.figli.forEach(sortChildren);
      }
      return mattone;
    };

    // Applica l'ordinamento ricorsivo a tutti i mattoni
    sortedData.forEach(sortChildren);
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.mattoniContainer}>
          {sortedData.map(mattone => renderMattone(mattone))}
        </View>
      </View>
    );
  };

  if (!jsonData) {
    return <Text>Loading...</Text>;
  }

  return (
    <>
      <ScrollView style={styles.container}>
        {renderSection('First Page', jsonData?.firstpage)}
        {renderSection('Pre Multipod', jsonData?.preMultipod)}
        {renderSection('Multipod', jsonData?.multipod)}
        {renderSection('Post Multipod', jsonData?.postMultipod)}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifica Ordine</Text>
            <Text style={styles.modalSubtitle}>{selectedMattone?.mattone}</Text>
            
            <TextInput
              style={styles.input}
              value={newOrdine}
              onChangeText={setNewOrdine}
              keyboardType="numeric"
              placeholder="Nuovo ordine"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Annulla</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.buttonConfirm]}
                onPress={handleOrdineChange}
              >
                <Text style={styles.buttonText}>Conferma</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    width: '100%',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#ff6b6b',
  },
  buttonConfirm: {
    backgroundColor: '#51cf66',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  
});

export default JsonReader;