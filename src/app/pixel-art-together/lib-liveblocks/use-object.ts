import { useState, useEffect } from 'react';
import { useRoom, useStorage } from '@liveblocks/react'; // Assuming you're using the Liveblocks React SDK
import { LiveObject } from '@liveblocks/client';

export function useObject(name: string, initial?: any) {
  const room = useRoom();
  
  // Use useStorage with a selector function to access a specific part of the storage
  const rootStore = useStorage((root) => root?.get(name));  // This is the key part
  const [liveObject, setLiveObject] = useState<LiveObject | null>(null);

  useEffect(() => {
    // Watch for changes in rootStore, initialize if necessary
    const unsubscribeRoot = rootStore.subscribe((root) => {
      if (!root) return;

      // If the object does not exist, create it with initial data
      if (!root.get(name)) {
        root.set(name, new LiveObject(initial));
      }

      // Get the object and update the state
      const object = root.get(name);
      setLiveObject(object);

      // Subscribe to the live object for changes
      const unsubscribeObject = room.subscribe(object, (newObject) => {
        setLiveObject(newObject);
      });

      // Cleanup function to unsubscribe from the live object
      return () => {
        unsubscribeObject();
      };
    });

    // Cleanup the rootStore subscription when component unmounts
    return () => {
      unsubscribeRoot();
    };
  }, [name, rootStore, room, initial]);

  return liveObject;
}
