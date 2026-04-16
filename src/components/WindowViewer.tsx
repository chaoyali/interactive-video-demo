/**
 * WindowViewer
 *
 * Renders a panoramic image that pans in response to tiltX / tiltY values.
 * The image is wider than the viewport; tilt reveals the hidden portions.
 *
 * Props:
 *   source      - the panoramic image (require() or { uri })
 *   tiltX       - [-1, 1] left → right
 *   tiltY       - [-1, 1] up → down
 *   imageAspect - width/height ratio of the source image (default: 3.0)
 *   panRangeX   - how many viewport-widths the image can travel horizontally (default: 0.6)
 *   panRangeY   - how many viewport-heights the image can travel vertically (default: 0.3)
 */

import React from 'react';
import { Animated, ImageSourcePropType, StyleSheet, useWindowDimensions, View } from 'react-native';

interface WindowViewerProps {
  source: ImageSourcePropType;
  tiltX: number;
  tiltY: number;
  imageAspect?: number;
  panRangeX?: number;
  panRangeY?: number;
  animatedX: Animated.Value;
  animatedY: Animated.Value;
}

export function WindowViewer({
  source,
  imageAspect = 3.0,
  panRangeX = 0.6,
  panRangeY = 0.3,
  animatedX,
  animatedY,
}: WindowViewerProps) {
  const { width: vw, height: vh } = useWindowDimensions();

  // Image height fills the viewport; width is derived from aspect ratio
  const imageHeight = vh;
  const imageWidth = imageHeight * imageAspect;

  // Total travel distance in pixels
  const maxOffsetX = vw * panRangeX;
  const maxOffsetY = vh * panRangeY;

  // Map animated [-1,1] values → pixel offsets
  // Center (0) = image centered; edges reveal left/right
  const translateX = animatedX.interpolate({
    inputRange: [-1, 1],
    outputRange: [maxOffsetX, -maxOffsetX],
  });

  const translateY = animatedY.interpolate({
    inputRange: [-1, 1],
    outputRange: [maxOffsetY, -maxOffsetY], // inverted: tilt forward = pan down
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
