import * as FileSystem from 'expo-file-system';
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
import * as Sharing from 'expo-sharing';
import { MattoniStructure } from '../../types/mattoni';

const COLORS = {
  standalone: '#FFB6C1',
  contenitore: '#98FB98',
  'figlio-contenitore': '#87CEEB',
  figlio: '#DDA0DD',
};

const windowWidth = Dimensions.get('window').width;

const SIZES = {
  standalone: windowWidth - 40,
  figlio: windowWidth / 2 - 60,
  contenitore: windowWidth - 40,
  'figlio-contenitore': windowWidth - 60,
};

const JsonReader = () => {
  const [jsonData, setJsonData] = useState<MattoniStructure | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMattone, setSelectedMattone] = useState<any>(null);
  const [newOrdine, setNewOrdine] = useState('');
  const [newSezione, setNewSezione] = useState('');

  useEffect(() => {
    const data: MattoniStructure = require('../../assets/ordine-mattoni-sintesi-ee.json');
    setJsonData(data);
  }, []);

  const handleMattonePress = (mattone: any) => {
    setSelectedMattone(mattone);
    setNewOrdine(mattone.ordine.toString());
    setNewSezione(mattone.sezione || '');
    setModalVisible(true);
  };

  const handleOrdineChange = () => {
    if (!jsonData || !selectedMattone || !newOrdine) return;

    const newOrdineNum = parseInt(newOrdine);
    const newData = JSON.parse(JSON.stringify(jsonData));

    const updateMattone = (data: any[]): boolean => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].mattone === selectedMattone.mattone) {
          if (newOrdine) data[i].ordine = newOrdineNum;
          if (newSezione && data[i].sezione) data[i].sezione = newSezione;
          return true;
        }
        if (data[i].figli) {
          const found = updateMattone(data[i].figli);
          if (found) return true;
        }
      }
      return false;
    };

    // Trova la sezione corrente del mattone selezionato
    const findCurrentSection = (data: any): string | null => {
      for (const [sectionName, sectionData] of Object.entries(data)) {
        const findInArray = (arr: any[]): boolean => {
          for (const item of arr) {
            if (item.mattone === selectedMattone.mattone) return true;
            if (item.figli && findInArray(item.figli)) return true;
          }
          return false;
        };
        if (findInArray(sectionData as any[])) return sectionName;
      }
      return null;
    };

    const currentSection = findCurrentSection(newData);
    if (!currentSection) return;

    // Funzione per trovare un mattone per ordine nella sezione corrente
    const findMattoneByOrdine = (data: any[], ordine: number): any => {
      for (const item of data) {
        if (item.ordine === ordine) return item;
        if (item.figli) {
          const found = findMattoneByOrdine(item.figli, ordine);
          if (found) return found;
        }
      }
      return null;
    };

    // Funzione per aggiornare il mattone selezionato
    const updateSelectedMattone = (data: any[]): boolean => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].mattone === selectedMattone.mattone) {
          const mattoneToSwap = findMattoneByOrdine(newData[currentSection] as any[], newOrdineNum);
          if (mattoneToSwap) {
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
      return false;
    };

    // Aggiorna i dati nella sezione corretta
    updateSelectedMattone(newData[currentSection] as any[]);

    // Aggiorna i dati
    Object.values(newData).forEach(section => {
      updateMattone(section as any[]);
    });

    setJsonData(newData);
    setModalVisible(false);
    setSelectedMattone(null);
    setNewOrdine('');
    setNewSezione('');
  };

  const renderMattone = (mattone: any, level: number = 0): JSX.Element => {
    const isContainer = mattone.tipo === 'contenitore' || mattone.tipo === 'figlio-contenitore';
    let size = SIZES[mattone.tipo as keyof typeof SIZES] || windowWidth / 3;

    // Gestione speciale per i figli di RecapitiContatti
    if (mattone.tipo === 'figlio' && mattone.sezione && 
        mattone.mattone.startsWith('FRContatti')) {
      size = windowWidth / 3 - 50;
    }

    // Gestione speciale per il figlio-contenitore FRConsumi
    if (mattone.tipo === 'figlio-contenitore' && mattone.sezione && 
        mattone.mattone.startsWith('FRConsumi')) {
        size = windowWidth / 2 - 60;
    }

    // Gestione speciale per i figli del figlio-contenitore FRConsumi
    if (mattone.tipo === 'figlio' && mattone.sezione && 
        mattone.mattone.startsWith('FRConsumoFatturato')) {
        size = windowWidth / 3 - 30;
    }
    if (mattone.tipo === 'figlio' && mattone.sezione && 
        mattone.mattone.startsWith('FRConsumoAnnuo')) {
        size = windowWidth / 3 - 30;
    }

    if (mattone.mattone === 'CorpoInfoFR' && mattone.figli) {
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
            {mattone.tipo && <Text style={styles.property}>Tipo: {mattone.tipo}</Text>}
            {mattone.sezione && <Text style={styles.property}>Sezione: {mattone.sezione}</Text>}
            {mattone.ordine && <Text style={styles.property}>Ordine: {mattone.ordine}</Text>}
          </View>

          <View style={styles.corpoInfoContainer}>
            <View style={styles.sezioneContainer}>
              {mattone.figli
                .filter((figlio: any) => figlio.sezione === "1")
                .sort((a: any, b: any) => (a.ordine || 0) - (b.ordine || 0))
                .map((figlio: any) => renderMattone(figlio, level + 1))}
            </View>
            <View style={styles.sezioneContainer}>
              {mattone.figli
                .filter((figlio: any) => figlio.sezione === "2")
                .sort((a: any, b: any) => (a.ordine || 0) - (b.ordine || 0))
                .map((figlio: any) => renderMattone(figlio, level + 1))}
            </View>
          </View>
        </View>
        </Pressable>
      );
    }

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

  const handleExport = async () => {
    if (!jsonData) return;
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `ordine-mattoni-${timestamp}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(jsonData, null, 2));
    
      // Condividi il file
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Esporta configurazione mattoni'
      });
    
      // Pulisci il file dopo la condivisione
      await FileSystem.deleteAsync(filePath);
    } catch (error) {
      alert('Errore durante l\'esportazione: ' + error);
    }
  };

  if (!jsonData) {
    return <Text>Loading...</Text>;
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={handleExport}
          >
            <Text style={styles.exportButtonText}>Esporta JSON</Text>
          </TouchableOpacity>
        </View>
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
            <Text style={styles.modalTitle}>Modifica Mattone</Text>
            <Text style={styles.modalSubtitle}>{selectedMattone?.mattone}</Text>

            <Text style={styles.inputLabel}>Ordine</Text> 
            <TextInput
              style={styles.input}
              value={newOrdine}
              onChangeText={setNewOrdine}
              keyboardType="numeric"
              placeholder="Nuovo ordine"
            />

            {selectedMattone?.sezione && (
              <>
                <Text style={styles.inputLabel}>Sezione</Text>
                <TextInput
                  style={styles.input}
                  value={newSezione}
                  onChangeText={setNewSezione}
                  placeholder="Nuova sezione (1 o 2)"
                />
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.buttonCancel]}
                onPress={() => {
                  setModalVisible(false);
                  setNewOrdine('');
                  setNewSezione('');
                }}
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
  corpoInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  sezioneContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  inputLabel: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  exportButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  exportButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default JsonReader;