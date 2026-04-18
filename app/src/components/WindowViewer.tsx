/**
 * WindowViewer
 *
 * Renders a looping video (or any media) larger than the viewport and pans it
 * in response to the animated tilt values. At full tilt, every part of the
 * source is reachable.
 *
 * Sizing:
 *   The source is scaled "cover"-style so that it exactly fills the viewport
 *   on at least one axis, then multiplied by `zoom` to create overhang on
 *   every side. Pan ranges are derived from that overhang, so tilt reaches
 *   the edges exactly (no black bars, no unreachable content).
 *
 * Props:
 *   source       - video source (require() or { uri })
 *   sourceAspect - width/height ratio of the source (default: 1.0 — square)
 *   zoom         - how far past "just covering" to scale (default: 1.3)
 *                  1.0 = no overhang. 1.5 = 25% overhang per side.
 *   animatedX/Y  - [-1, 1] Animated.Values from useDeviceOrientation
 */

import React from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useVideoPlayer, VideoSource, VideoView } from 'expo-video';

const AnimatedVideoView = Animated.createAnimatedComponent(VideoView);

interface WindowViewerProps {
  source: VideoSource;
  sourceAspect?: number;
  zoom?: number;
  animatedX: Animated.Value;
  animatedY: Animated.Value;
}

export function WindowViewer({
  source,
  sourceAspect = 1.0,
  zoom = 1.3,
  animatedX,
  animatedY,
}: WindowViewerProps) {
  const { width: vw, height: vh } = useWindowDimensions();

  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // "Cover" size: smallest box with the given aspect that still fully contains
  // the viewport. Height is whichever is larger — the viewport height, or the
  // height required to make a rectangle of this aspect wide enough to cover vw.
  const coverHeight = Math.max(vh, vw / sourceAspect);
  const coverWidth  = coverHeight * sourceAspect;

  // Apply zoom so there is overhang on every side to pan into.
  const mediaHeight = coverHeight * zoom;
  const mediaWidth  = coverWidth  * zoom;

  // Overhang per side = how far the media extends past the viewport edge.
  const maxOffsetX = (mediaWidth  - vw) / 2;
  const maxOffsetY = (mediaHeight - vh) / 2;

  // Map animated [-1,1] → pixel offsets. At ±1, the media edge meets the viewport edge.
  const translateX = animatedX.interpolate({
    inputRange: [-1, 1],
    outputRange: [maxOffsetX, -maxOffsetX],
  });

  const translateY = animatedY.interpolate({
    inputRange: [-1, 1],
    outputRange: [maxOffsetY, -maxOffsetY],
  });

  return (
    <View style={styles.container}>
      <AnimatedVideoView
        player={player}
        style={[
          styles.media,
          {
            width: mediaWidth,
            height: mediaHeight,
            transform: [{ translateX }, { translateY }],
          },
        ]}
        contentFit="cover"
        nativeControls={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  media: {
    position: 'absolute',
  },
});
