import React, { useEffect, useState } from 'react';
import { TileLayer } from 'react-leaflet';
import { fetchRainViewerRadar, RainViewerRadarInfo } from '../../lib/weather';

interface RainRadarLayerProps {
  opacity?: number;
}

export const RainRadarLayer: React.FC<RainRadarLayerProps> = ({ opacity = 0.65 }) => {
  const [radarInfo, setRadarInfo] = useState<RainViewerRadarInfo | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchRainViewerRadar().then((info) => {
      if (isMounted && info) {
        setRadarInfo(info);
      }
    });

    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetchRainViewerRadar().then((info) => {
        if (isMounted && info) {
          setRadarInfo(info);
        }
      });
    }, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!radarInfo) return null;

  // RainViewer tile format: {host}{path}/{size}/{z}/{x}/{y}/2/1_1.png
  // 2 = Universal Blue color scheme, 1_1 = smooth with snow
  const tileUrl = `${radarInfo.host}${radarInfo.path}/${radarInfo.tileSize}/{z}/{x}/{y}/2/1_1.png`;

  return (
    <TileLayer
      url={tileUrl}
      opacity={opacity}
      zIndex={25}
      attribution='&copy; <a href="https://www.rainviewer.com/api.html">RainViewer</a> radar'
    />
  );
};
