import { useState, useEffect, useCallback } from 'react';

type UseLocalStorageOptions<T> = {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
};

// A value that is not likely to be in the initial value
const FAKE_SSR_VALUE = 'FLVS_SSR';

function getValue<T>(key: string, initialValue: T | (() => T), options?: UseLocalStorageOptions<T>) {
  if (typeof window === 'undefined') {
    return FAKE_SSR_VALUE;
  }
  try {
    const savedValue = localStorage.getItem(key);
    if (savedValue !== null) {
      return options?.deserializer ? options.deserializer(savedValue) : JSON.parse(savedValue);
    }
    return initialValue instanceof Function ? initialValue() : initialValue;
  } catch (error) {
    console.warn(`Error reading localStorage key “${key}”:`, error);
    return initialValue instanceof Function ? initialValue() : initialValue;
  }
}

/**
 * Hook pour persister l'état dans le Local Storage.
 * @param key La clé pour le local storage.
 * @param initialValue La valeur initiale.
 * @returns Une valeur d'état et une fonction pour la mettre à jour.
 */
export function useLocalStorage<T>(
    key: string, 
    initialValue: T | (() => T),
    options?: UseLocalStorageOptions<T>
) {
  const [storedValue, setStoredValue] = useState<T | string>(() => getValue(key, initialValue, options));

  useEffect(() => {
    // This effect runs on the client after hydration
    // It replaces the server-side FAKE_SSR_VALUE with the actual localStorage value
    if (storedValue === FAKE_SSR_VALUE) {
        setStoredValue(getValue(key, initialValue, options));
    }
  }, [key, initialValue, options, storedValue]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev as T) : value;
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem(
              key,
              options?.serializer
                ? options.serializer(valueToStore)
                : JSON.stringify(valueToStore)
            );
          }
        } catch (e) {
          console.warn(`Error setting localStorage key “${key}”:`, e);
        }
        return valueToStore;
      });
    },
    [key, options]
  );

  return [storedValue as T, setValue] as const;
}
