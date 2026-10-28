import { $, FLOOR_CODES, FLOOR_NAMES, M_PER_PX, STEP_LEN_M, WALK_M_PER_MIN } from './constants.js';
import { getNodeByRef, getNodeLabel, findRouteLegs, FLOORS } from './graph.js';
import { state, showToast, saveRecent, formatPointName, deserializeRef, generateShareUrl, syncHistoryUrl } from './state.js';
import { fitViewport, zoomToRoute, setupViewportEvents, dragDistance } from './viewport.js';
import { renderFloor, drawActiveRoute, updateGuidanceBanner, openNodeCard, closeNodeCard, getActivePopupNode } from './renderer.js';
import { setupSearchEvents, startWashroomFlow } from './search.js';
import { generateStepList, navigateToStep } from './steps.js';

// ---- UI Refresh & Mode Sync ----
function refreshUI() {
  $('vf').textContent = formatPointName(state.startPoint);
  $('vt').textContent = formatPointName(state.destPoint);
  $('cf').classList.toggle('on', state.activeSelectMode === 's');
  $('ct').classList.toggle('on', state.activeSelectMode === 'd');
  $('cf').classList.toggle('set', !!state.startPoint);
  $('ct').classList.toggle('set', !!state.destPoint);

  const isMultiFloor = state.startPoint && state.destPoint && !state.destPoint.nearest && state.startPoint.f !== state.destPoint.f;
  $('cn').style.display = isMultiFloor ? 'flex' : 'none';
  $('clr').style.display = state.startPoint || state.destPoint ? 'block' : 'none';

  document.querySelectorAll('.qn button').forEach(btn => {
    btn.disabled = !state.startPoint;
  });

  syncHistoryUrl();
}

function setActiveSelectionMode(mode) {
  state.activeSelectMode = mode;
  $('ts').classList.toggle('on', mode === 's');
  $('td').classList.toggle('on', mode === 'd');
  $('q').placeholder = mode === 's' 
    ? 'Search starting room, stairs, lift...' 
    : 'Search destination room, facility, exit...';
  refreshUI();
}

function resetRoute() {
  state.currentRoute = null;
  state.steps = [];
  $('sum').style.display = 'none';
  $('steps').style.display = 'none';
  drawActiveRoute();
  updateGuidanceBanner();
}

function setLocationReference(ref) {
  saveRecent(ref);
  if (state.activeSelectMode === 's') {
    state.startPoint = ref;
    setActiveSelectionMode('d');
  } else {
    state.destPoint = ref;
  }
  state.washroomPickerMode = null;
  $('wc').innerHTML = '';
  $('q').value = '';
  $('dd').style.display = 'none';
  closeNodeCard();
  resetRoute();
  renderFloor(ref.f != null ? ref.f : state.currentFloor, onMapNodeClick, onMapConnectorClick);
  refreshUI();

  if (state.startPoint && state.destPoint) calculateRoute();
}

function onMapNodeClick(node) {
  if (state.washroomPickerMode) {
    if (node.t === state.washroomPickerMode.g) {
      setLocationReference({ f: state.currentFloor, id: node.id });
    } else {
      showToast('Select a washroom on this floor');
    }
    return;
  }
  openNodeCard(node);
}

function onMapConnectorClick(node) {
  if (!state.currentRoute) return;
  const targetFloor = (state.currentFloor === state.currentRoute.A.f ? state.currentRoute.B.f : state.currentRoute.A.f);
  const stepIdx = state.steps.findIndex(s => s.f === targetFloor);
  if (stepIdx >= 0) {
    navigateToStep(stepIdx, fl => renderFloor(fl, onMapNodeClick, onMapConnectorClick), drawActiveRoute);
  } else {
    renderFloor(targetFloor, onMapNodeClick, onMapConnectorClick);
  }
  showToast(`Switched to ${FLOOR_NAMES[targetFloor]} via ${node.id}`);
}

// ---- Calculate Optimal Route ----
function calculateRoute() {
  try {
    if (!state.startPoint || !state.destPoint) {
      showToast('Set both a start and a destination');
      return;
    }

    const preferredConn = state.stepFreeMode ? 'lift' : state.connectorType;

    let targetDest = state.destPoint;
    if (state.destPoint.nearest) {
      let bestWashroom = null;
      Object.values(FLOORS[state.startPoint.f].N).forEach(node => {
        if (node.t === state.destPoint.nearest) {
          const testLegs = findRouteLegs(state.startPoint, { f: state.startPoint.f, id: node.id }, preferredConn);
          if (testLegs && (!bestWashroom || testLegs.cost < bestWashroom.r.cost)) {
            bestWashroom = { r: testLegs, B: { f: state.startPoint.f, id: node.id } };
          }
        }
      });
      if (!bestWashroom) {
        showToast('No washroom found on this floor');
        return;
      }
      targetDest = bestWashroom.B;
    }

    if (state.startPoint.f === targetDest.f && state.startPoint.id === targetDest.id) {
      showToast('Start and destination are the same');
      return;
    }

    const routeLegs = findRouteLegs(state.startPoint, targetDest, preferredConn);
    if (!routeLegs) {
      showToast(`No path found between ${FLOOR_NAMES[state.startPoint.f]} and ${FLOOR_NAMES[targetDest.f]}`);
      return;
    }

    if (routeLegs.isFallback) {
      const usedConnName = routeLegs.usedConn === 'lift' ? 'Lift' : 'Stairs';
      showToast(`No ${preferredConn} route; routed via ${usedConnName} (${routeLegs.via}) instead`);
    }

    state.currentRoute = { r: routeLegs, A: state.startPoint, B: targetDest };
    state.steps = generateStepList(routeLegs, state.startPoint, targetDest);
    state.currentStepIndex = 0;

    const meters = Math.round(routeLegs.cost * M_PER_PX);
    const timeMinutes = Math.max(1, Math.round(meters / WALK_M_PER_MIN));
    const stepCount = Math.max(10, Math.round(meters / STEP_LEN_M / 10) * 10);
    $('route-dist').textContent = `${meters} m · ~${timeMinutes} min · ~${stepCount} steps`;
    const startNode = getNodeByRef(state.startPoint);
    const destNode = getNodeByRef(targetDest);

    $('sum').innerHTML = `
      <b>Route: ${getNodeLabel(startNode)} to ${getNodeLabel(destNode)}</b>
      <span>Total distance: ${meters} m (~${timeMinutes} min · ~${stepCount} steps)${routeLegs.via ? ' via ' + (routeLegs.usedConn === 'lift' ? 'Lift ' : 'Stairs ') + routeLegs.via : ''}${state.stepFreeMode ? ' · step-free' : ''}</span>
    `;
    $('sum').style.display = 'flex';
    $('steps').style.display = 'block';

    if (state.startPoint.f !== state.currentFloor) {
      renderFloor(state.startPoint.f, onMapNodeClick, onMapConnectorClick);
    } else {
      drawActiveRoute();
      updateGuidanceBanner();
    }

    if (routeLegs.legs && routeLegs.legs[0] && routeLegs.legs[0].pts) {
      zoomToRoute(routeLegs.legs[0].pts);
    }

    navigateToStep(0, fl => renderFloor(fl, onMapNodeClick, onMapConnectorClick), drawActiveRoute);
  } catch (err) {
    console.error('Route calculation error:', err);
    showToast('Unable to calculate route. Please check selected rooms.');
    resetRoute();
  }
}

// ---- Event Listeners Setup ----
function initializeApp() {
  setupViewportEvents();
  setupSearchEvents(
    ref => setLocationReference(ref),
    () => startWashroomFlow(
      fl => renderFloor(fl, onMapNodeClick, onMapConnectorClick),
      () => {
        resetRoute();
        refreshUI();
        if (state.startPoint) calculateRoute();
      }
    )
  );

  // Step Navigation Buttons
  $('pv').addEventListener('click', () => navigateToStep(state.currentStepIndex - 1, fl => renderFloor(fl, onMapNodeClick, onMapConnectorClick), drawActiveRoute));
  $('nx').addEventListener('click', () => navigateToStep(state.currentStepIndex + 1, fl => renderFloor(fl, onMapNodeClick, onMapConnectorClick), drawActiveRoute));
  $('ex2').addEventListener('click', () => {
    const list = $('sl');
    list.style.display = list.style.display === 'block' ? 'none' : 'block';
  });

  // Action Buttons
  $('calc').addEventListener('click', calculateRoute);
  $('ts').addEventListener('click', () => setActiveSelectionMode('s'));
  $('td').addEventListener('click', () => setActiveSelectionMode('d'));
  $('cf').addEventListener('click', () => setActiveSelectionMode('s'));
  $('ct').addEventListener('click', () => setActiveSelectionMode('d'));

  $('clr').addEventListener('click', () => {
    state.startPoint = null;
    state.destPoint = null;
    state.washroomPickerMode = null;
    $('wc').innerHTML = '';
    resetRoute();
    setActiveSelectionMode('s');
    renderFloor(state.currentFloor, onMapNodeClick, onMapConnectorClick);
    refreshUI();
  });

  // Endpoint clear buttons
  const clearEndpoint = which => {
    if (which === 's') state.startPoint = null;
    else state.destPoint = null;
    state.washroomPickerMode = null;
    $('wc').innerHTML = '';
    resetRoute();
    setActiveSelectionMode(which);
    renderFloor(state.currentFloor, onMapNodeClick, onMapConnectorClick);
    refreshUI();
  };
  $('cf-x').addEventListener('click', e => { e.stopPropagation(); clearEndpoint('s'); });
  $('ct-x').addEventListener('click', e => { e.stopPropagation(); clearEndpoint('d'); });

  $('sw').addEventListener('click', () => {
    if (state.destPoint && state.destPoint.nearest) {
      showToast("Cannot swap with dynamic washroom destination");
      return;
    }
    const temp = state.startPoint;
    state.startPoint = state.destPoint;
    state.destPoint = temp;
    resetRoute();
    renderFloor(state.currentFloor, onMapNodeClick, onMapConnectorClick);
    refreshUI();
    if (state.startPoint && state.destPoint) calculateRoute();
  });

  // Multi-floor connector buttons
  document.querySelectorAll('#cn button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.connectorType = btn.dataset.c;
      document.querySelectorAll('#cn button').forEach(x => x.classList.toggle('on', x === btn));
      if (state.currentRoute) calculateRoute();
      syncHistoryUrl();
    });
  });

  // Step-Free Mode
  $('sf').addEventListener('click', () => {
    state.stepFreeMode = !state.stepFreeMode;
    $('sf').setAttribute('aria-pressed', state.stepFreeMode);
    document.querySelector('#cn [data-c=stairs]').disabled = state.stepFreeMode;
    if (state.stepFreeMode) {
      state.connectorType = 'lift';
      document.querySelectorAll('#cn button').forEach(x => x.classList.toggle('on', x.dataset.c === 'lift'));
    }
    if (state.currentRoute) calculateRoute();
  });

  // Quick Navigation Facility Buttons
  document.querySelectorAll('.qn button').forEach(btn => {
    btn.addEventListener('click', () => {
      const typeCode = btn.dataset.q;
      if (!state.startPoint) {
        showToast('Please set a start point first');
        return;
      }

      if (typeCode === 'g' || typeCode === 'f') {
        state.destPoint = { nearest: typeCode };
      } else {
        let bestTarget = null;
        const searchFloors = typeCode === 'e' ? [0] : [state.startPoint.f];

        searchFloors.forEach(f => {
          Object.values(FLOORS[f].N).forEach(n => {
            if (n.t === typeCode && !(f === state.startPoint.f && n.id === state.startPoint.id)) {
              const testRoute = findRouteLegs(state.startPoint, { f, id: n.id }, state.connectorType);
              if (testRoute && (!bestTarget || testRoute.cost < bestTarget.cost)) {
                bestTarget = { cost: testRoute.cost, ref: { f, id: n.id } };
              }
            }
          });
        });

        if (!bestTarget) {
          showToast('None found nearby on this floor');
          return;
        }
        state.destPoint = bestTarget.ref;
      }

      refreshUI();
      renderFloor(state.currentFloor, onMapNodeClick, onMapConnectorClick);
      calculateRoute();
    });
  });

  // Node popup card actions
  $('nc-close').addEventListener('click', closeNodeCard);
  $('nc-set-start').addEventListener('click', () => {
    const node = getActivePopupNode();
    if (node) {
      state.activeSelectMode = 's';
      setLocationReference({ f: state.currentFloor, id: node.id });
    }
  });
  $('nc-set-dest').addEventListener('click', () => {
    const node = getActivePopupNode();
    if (node) {
      state.activeSelectMode = 'd';
      setLocationReference({ f: state.currentFloor, id: node.id });
    }
  });

  // Canvas map click dismisses popups
  $('map').addEventListener('click', () => {
    if (dragDistance <= 6) {
      closeNodeCard();
      $('fm').style.display = 'none';
      $('fb').setAttribute('aria-expanded', 'false');
      $('dd').style.display = 'none';
    }
  });

  // Floor dropdown button toggle
  $('fb').addEventListener('click', e => {
    e.stopPropagation();
    const menu = $('fm');
    const isOpening = menu.style.display !== 'block';
    menu.style.display = isOpening ? 'block' : 'none';
    $('fb').setAttribute('aria-expanded', isOpening ? 'true' : 'false');
  });

  // Inter-floor banner click
  $('bn').addEventListener('click', () => {
    if (state.currentRoute && state.currentRoute.r && state.currentRoute.r.via) {
      const targetFloor = (state.currentFloor === state.currentRoute.A.f ? state.currentRoute.B.f : state.currentRoute.A.f);
      const stepIdx = state.steps.findIndex(s => s.f === targetFloor);
      if (stepIdx >= 0) navigateToStep(stepIdx, fl => renderFloor(fl, onMapNodeClick, onMapConnectorClick), drawActiveRoute);
      else renderFloor(targetFloor, onMapNodeClick, onMapConnectorClick);
      showToast(`Switched to ${FLOOR_NAMES[targetFloor]}`);
    }
  });

  // Sidebar toggle
  $('col').addEventListener('click', () => {
    const min = $('side').classList.toggle('min');
    $('col').textContent = min ? '>' : '<';
    $('col').setAttribute('aria-expanded', String(!min));
  });

  // Label toggle
  $('gear').addEventListener('click', () => $('map').classList.toggle('nolab'));

  // Global Keyboard Shortcuts (Escape to close, 1-4 for floors, Enter to calculate)
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeNodeCard();
      $('fm').style.display = 'none';
      $('fb').setAttribute('aria-expanded', 'false');
      $('dd').style.display = 'none';
      $('qrm').hidden = true;
    } else if (document.activeElement.tagName !== 'INPUT') {
      if (['1', '2', '3', '4'].includes(e.key)) {
        const floorIdx = parseInt(e.key, 10) - 1;
        renderFloor(floorIdx, onMapNodeClick, onMapConnectorClick);
        showToast(`Switched to ${FLOOR_NAMES[floorIdx]}`);
      } else if (e.key === 'Enter') {
        if (state.startPoint && state.destPoint) {
          calculateRoute();
        }
      }
    }
  });

  // Share & QR Modal
  $('shr').addEventListener('click', () => {
    const url = generateShareUrl();
    $('qrl').textContent = url;
    try {
      const qr = qrcode(0, 'M');
      qr.addData(url);
      qr.make();
      $('qrb').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    } catch (e) {
      $('qrb').textContent = 'QR unavailable';
    }
    $('qrm').hidden = false;
  });

  $('qrx').addEventListener('click', () => $('qrm').hidden = true);
  $('qrm').addEventListener('click', e => { if (e.target.id === 'qrm') $('qrm').hidden = true; });
  $('qrc').addEventListener('click', () => {
    try {
      navigator.clipboard.writeText($('qrl').textContent)
        .then(() => showToast('Link copied!'), () => showToast('Copy failed'));
    } catch (e) {
      showToast('Copy not available');
    }
  });

  // Register PWA Service Worker (skipped on localhost so dev never serves stale modules)
  if ('serviceWorker' in navigator && !['localhost', '127.0.0.1'].includes(location.hostname)) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // Initial Floor Render & Deep Link Restore
  // Capture query first — refreshUI()/syncHistoryUrl() strips params on load
  const savedQuery = location.search;
  renderFloor(0, onMapNodeClick, onMapConnectorClick);
  fitViewport();
  setActiveSelectionMode('s');

  const urlParams = new URLSearchParams(savedQuery);
  const startParam = deserializeRef(urlParams.get('from'));
  const destParam = deserializeRef(urlParams.get('to'));

  if (urlParams.get('via') === 'lift') {
    state.connectorType = 'lift';
    document.querySelectorAll('#cn button').forEach(x => x.classList.toggle('on', x.dataset.c === 'lift'));
  }

  if (startParam && !startParam.nearest) {
    state.startPoint = startParam;
    setActiveSelectionMode('d');
  }
  if (destParam) {
    state.destPoint = destParam;
  }
  if (state.startPoint || state.destPoint) {
    renderFloor(state.startPoint ? state.startPoint.f : 0, onMapNodeClick, onMapConnectorClick);
    refreshUI();
  }
  if (state.startPoint && state.destPoint) {
    calculateRoute();
  }
}

// Start application
initializeApp();
