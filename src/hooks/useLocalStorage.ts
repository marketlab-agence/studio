import { useState, useEffect, useCallback } from 'react';

type UseLocalStorageOptions<T> = {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
};

/**
 * Hook pour persister l'état dans le Local Storage, avec synchronisation entre les onglets.
 * @param key La clé pour le local storage.
 * @param initialValue La valeur initiale.
 * @returns Une valeur d'état et une fonction pour la mettre à jour.
 */
export function useLocalStorage<T>(
    key: string, 
    initialValue: T | (() => T),
    options?: UseLocalStorageOptions<T>
) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue instanceof Function ? initialValue() : initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        return options?.deserializer ? options.deserializer(item) : JSON.parse(item);
      }
      return initialValue instanceof Function ? initialValue() : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue instanceof Function ? initialValue() : initialValue;
    }
  });
  
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== "undefined") {
            const serializedValue = options?.serializer
                ? options.serializer(valueToStore)
                : JSON.stringify(valueToStore)
          localStorage.setItem(key, serializedValue);
        }
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key, storedValue, options]
  );
  
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === key && e.newValue) {
          try {
            setStoredValue(options?.deserializer ? options.deserializer(e.newValue) : JSON.parse(e.newValue));
          } catch (error) {
            console.warn(`Error parsing stored value for key “${key}”:`, error);
          }
        }
      };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, options]);

  return [storedValue, setValue] as const;
}
