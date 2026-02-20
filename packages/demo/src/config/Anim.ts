const Anim = {
  shake: [
    { rotation: 2, duration: 0.05 },
    { rotation: -2, duration: 0.05 },
    { rotation: 1, duration: 0.05 },
    { rotation: -1, duration: 0.05 },
    { rotation: 0, duration: 0.1 },
  ],
  zoomIn: [{ scale: 1.1, duration: 0.5 }],
  zoomOut: [{ scale: 1, duration: 0.5 }],
  panLeft: [{ x: -100, duration: 0.5 }],
  panRight: [{ x: 100, duration: 0.5 }],
  reset: [{ x: 0, y: 0, scale: 1, rotation: 0, duration: 0.5 }]
}

export default Anim