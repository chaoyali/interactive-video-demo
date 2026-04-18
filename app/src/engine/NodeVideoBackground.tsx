import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import type { VideoRef } from '@ivd/shared';

import { resolveVideo } from './videoRegistry';

type Props = {
  video: VideoRef;
  onEnd?: () => void;
  children?: React.ReactNode;
};

export function NodeVideoBackground({ video, onEnd, children }: Props) {
  const asset = resolveVideo(video.src);
  const player = useVideoPlayer(asset, (p) => {
    p.loop = video.loop ?? false;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    if (!onEnd) return;
    const sub = player.addListener('playToEnd', onEnd);
    return () => sub.remove();
  }, [player, onEnd]);

  return (
    <View style={styles.root}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        nativeControls={false}
        contentFit="cover"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
});
