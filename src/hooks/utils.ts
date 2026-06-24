import { Alert } from 'react-native';

export function showError(err: unknown, fallback: string) {
  const msg = err instanceof Error ? err.message : '';
  const isOurs = msg && !/^(sqlite|SqliteError|SQLITE)/i.test(msg);
  Alert.alert('Error', isOurs ? msg : fallback);
}
