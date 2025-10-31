
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Map from './Map';

const MapGridAnimated = () => {
  const [maps, setMaps] = useState([
    { id: 1, location: null },
  ]);

  const addMap = () => {
    if (maps.length < 4) {
      const newId = maps.length ? Math.max(...maps.map(m => m.id)) + 1 : 1;
      setMaps([...maps, { id: newId, location: null }]);
    }
  };

  const removeMap = (id: number) => {
    setMaps(maps.filter(map => map.id !== id));
  };

  const updateLocation = (id: number, location: { lat: number; lng: number; name: string }) => {
    setMaps(maps.map(map => map.id === id ? { ...map, location } : map));
  };

  return (
    <div className="space-y-4 m-1/2">
      <div className="flex gap-4">
        <button
          onClick={addMap}
          className="px-4 py-2  px-2 py-1 rounded bg-emerald-100 text-emerald-700 font-medium"
        >
          Adicionar Mapa
        </button>
      </div>

      <div className={`grid grid-cols-${maps.length > 1 ? 2 : 1} gap-4`}>
        <AnimatePresence>
          {maps.map(({ id, location }) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="border rounded-lg overflow-hidden h-[500px] relative"
            >
              <button
                onClick={() => removeMap(id)}
                className="absolute top-2 right-2 bg-red-100 font-medium  text-red-700 px-2 py-1 rounded text-xs z-10"
              >
                Remover
              </button>
              <div className="h-[350px]">
                <Map initialLocation={location || undefined} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MapGridAnimated;
