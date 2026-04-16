/**
 * WindowFrame
 *
 * Decorative overlay: dark vignette edges, wooden cross-bar, corner brackets.
 * Renders on top of the scene; never intercepts touch/pointer events.
 */

import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

export function WindowFrame() {
  return (
    // pointerEvents must live in style for web compatibility
    <View style={[StyleSheet.absoluteFill, styles.container]}>
      {/* Dark vignette edges */}
      <View style={[styles.edge, styles.edgeTop]} />
      <View style={[styles.edge, styles.edgeBottom]} />
      <View style={[styles.edge, styles.edgeLeft]} />
      <View style={[styles.edge, styles.edgeRight]} />

      {/* Window frame bars */}
      <View style={[styles.frameBar, styles.frameHorizontal]} />
      <View style={[styles.frameBar, styles.frameVertical]} />

      {/* Corner brackets */}
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />
    </View>
  );
}

const FRAME_BAR = 6;
const EDGE_SIZE = 80;
const FRAME_COLOR = '#1a1008';
const EDGE_COLOR = 'rgba(0,0,0,0.72)';
const CORNER_SIZE = 24;

// Cross-platform shadow: boxShadow on web, shadow* props on native
const frameShadow = Platform.select({
  web: { boxShadow: '0 2px 6px rgba(0,0,0,0.85)' } as object,
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.85,
    shadowRadius: 4,
  },
});

const styles = StyleSheet.create({
  container: {
    pointerEvents: 'none',
  },
  edge: {
    position: 'absolute',
  },
  edgeTop: {
    top: 0, left: 0, right: 0,
    height: EDGE_SIZE,
    backgroundColor: EDGE_COLOR,
  },
  edgeBottom: {
    bottom: 0, left: 0, right: 0,
    height: EDGE_SIZE,
    backgroundColor: EDGE_COLOR,
  },
  edgeLeft: {
    top: 0, bottom: 0, left: 0,
    width: EDGE_SIZE,
    backgroundColor: EDGE_COLOR,
  },
  edgeRight: {
    top: 0, bottom: 0, right: 0,
    width: EDGE_SIZE,
    backgroundColor: EDGE_COLOR,
  },
  frameBar: {
    position: 'absolute',
    backgroundColor: FRAME_COLOR,
    ...frameShadow,
  },
  frameHorizontal: {
    left: EDGE_SIZE,
    right: EDGE_SIZE,
    height: FRAME_BAR,
    top: '50%' as unknown as number,
    marginTop: -FRAME_BAR / 2,
  },
  frameVertical: {
    top: EDGE_SIZE,
    bottom: EDGE_SIZE,
    width: FRAME_BAR,
    left: '50%' as unknown as number,
    marginLeft: -FRAME_BAR / 2,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: FRAME_COLOR,
    borderWidth: FRAME_BAR,
  },
  cornerTL: {
    top: EDGE_SIZE - FRAME_BAR,
    left: EDGE_SIZE - FRAME_BAR,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTR: {
    top: EDGE_SIZE - FRAME_BAR,
    right: EDGE_SIZE - FRAME_BAR,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBL: {
    bottom: EDGE_SIZE - FRAME_BAR,
    left: EDGE_SIZE - FRAME_BAR,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBR: {
    bottom: EDGE_SIZE - FRAME_BAR,
    right: EDGE_SIZE - FRAME_BAR,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
});
