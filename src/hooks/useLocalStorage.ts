import { useState, useEffect } from 'react';

function getValue<T>(key: string, initialValue: T | (() => T)) {
  if (typeof window === 'undefined') {
    return initialValue instanceof Function ? initialValue() : initialValue;
  }
  const savedValue = localStorage.getItem(key);
  if (savedValue !== null) {
    return JSON.parse(savedValue);
  }
  return initialValue instanceof Function ? initialValue() : initialValue;
}


/**
 * Hook pour persister l'état dans le Local Storage.
 * @param key La clé pour le local storage.
 * @param initialValue La valeur initiale.
 * @returns Une valeur d'état et une fonction pour la mettre à jour.
 */
export function useLocalStorage<T>(key: string, initialValue: T | (() => T)) {
  const [value, setValue] = useState<T>(() => getValue(key, initialValue));

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [value, key]);

  return [value, setValue] as const;
}
