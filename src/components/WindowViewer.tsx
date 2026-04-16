/**
 * WindowViewer
 *
 * Renders an image larger than the viewport and pans it in response to the
 * animated tilt values. At full tilt, every part of the image is reachable.
 *
 * Sizing:
 *   The image is scaled "cover"-style so that it exactly fills the viewport
 *   on at least one axis, then multiplied by `zoom` to create overhang on
 *   every side. Pan ranges are derived from that overhang, so tilt reaches
 *   the image edges exactly (no black bars, no unreachable content).
 *
 * Props:
 *   source      - the image (require() or { uri })
 *   imageAspect - source width/height ratio (default: 1.0 — square)
 *   zoom        - how far past "just covering" to scale the image (default: 1.3)
 *                 1.0 = no overhang (nothing to pan). 1.5 = 25% overhang per side.
 *   animatedX/Y - [-1, 1] Animated.Values from useDeviceOrientation
 */

import React from 'react';
import { Animated, ImageSourcePropType, StyleSheet, useWindowDimensions, View } from 'react-native';

interface WindowViewerProps {
  source: ImageSourcePropType;
  imageAspect?: number;
  zoom?: number;
  animatedX: Animated.Value;
  animatedY: Animated.Value;
}

export function WindowViewer({
  source,
  imageAspect = 1.0,
  zoom = 1.3,
  animatedX,
  animatedY,
}: WindowViewerProps) {
  const { width: vw, height: vh } = useWindowDimensions();

  // "Cover" size: smallest box with the given aspect that still fully contains
  // the viewport. Height is whichever is larger — the viewport height, or the
  // height required to make a rectangle of this aspect wide enough to cover vw.
  const coverHeight = Math.max(vh, vw / imageAspect);
  const coverWidth  = coverHeight * imageAspect;

  // Apply zoom so there is overhang on every side to pan into.
  const imageHeight = coverHeight * zoom;
  const imageWidth  = coverWidth  * zoom;

  // Overhang per side = how far the image extends past the viewport edge.
  const maxOffsetX = (imageWidth  - vw) / 2;
  const maxOffsetY = (imageHeight - vh) / 2;

  // Map animated [-1,1] → pixel offsets. At ±1, the image edge meets the viewport edge.
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
      <Animated.Image
        source={source}
        style={[
          styles.image,
          {
            width: imageWidth,
            height: imageHeight,
            transform: [{ translateX }, { translateY }],
          },
        ]}
        resizeMode="cover"
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
  image: {
    position: 'absolute',
  },
});
