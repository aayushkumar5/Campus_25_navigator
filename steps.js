import { $, FLOOR_CODES, FLOOR_NAMES, M_PER_PX } from './constants.js';
import { calcDistance, getNodeByRef, getNodeLabel } from './graph.js';
import { state } from './state.js';

// Turn-by-Turn Leg Simplification and Segment Descriptions
export function simplifyPathPolyline(points) {
  const simplified = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const a = simplified[simplified.length - 1], b = points[i], c = points[i + 1];
    // Cross product to test if intermediate point represents a bend/turn
    if (Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) > 1) {
      simplified.push(b);
    }
  }
  simplified.push(points[points.length - 1]);

  const stepList = [];
  for (let i = 0; i < simplified.length - 1; i++) {
    const a = simplified[i], b = simplified[i + 1];
    const meters = Math.round(calcDistance(a, b) * M_PER_PX);
    let instruction = `Walk straight for ${meters} m`;

    if (i < simplified.length - 2) {
      const c = simplified[i + 2];
      const crossProduct = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
      if (Math.abs(crossProduct) > 1) {
        instruction += crossProduct > 0 ? ', then turn right' : ', then turn left';
      }
    }
    if (meters > 0) stepList.push({ t: instruction, p: b });
  }
  return stepList;
}

// Generate structured step list from multi-floor route result
export function generateStepList(routeResult, startRef, destRef) {
  const startNode = getNodeByRef(startRef);
  const steps = [
    {
      f: startRef.f,
      t: 'Start at ' + (startNode ? getNodeLabel(startNode) : startRef.id),
      p: routeResult.legs[0].pts[0]
    }
  ];

  const connectorLabel = routeResult.usedConn === 'lift' ? 'Lift' : 'Stairs';

  routeResult.legs.forEach((leg, idx) => {
    simplifyPathPolyline(leg.pts).forEach(step => steps.push({ f: leg.f, ...step }));

    if (idx === 0 && routeResult.legs.length > 1) {
      const direction = destRef.f > startRef.f ? 'up' : 'down';
      steps.push({
        f: leg.f,
        t: `Take the ${connectorLabel} (${routeResult.via}) ${direction} to ${FLOOR_NAMES[destRef.f]}`,
        p: leg.pts[leg.pts.length - 1]
      });
      steps.push({
        f: destRef.f,
        t: `Exit ${routeResult.via} on ${FLOOR_NAMES[destRef.f]}`,
        p: routeResult.legs[1].pts[0]
      });
    }
  });

  const lastLegPoints = routeResult.legs[routeResult.legs.length - 1].pts;
  const destNode = getNodeByRef(destRef);
  steps.push({
    f: destRef.f,
    t: 'Arrive at ' + (destNode ? getNodeLabel(destNode) : destRef.id),
    p: lastLegPoints[lastLegPoints.length - 1]
  });

  return steps;
}

// Navigate to a specific step index
export function navigateToStep(stepIdx, updateFloorCallback, drawRouteCallback) {
  if (!state.steps.length) return;
  state.currentStepIndex = Math.max(0, Math.min(state.steps.length - 1, stepIdx));
  const step = state.steps[state.currentStepIndex];

  $('sn').textContent = `Step ${state.currentStepIndex + 1} of ${state.steps.length} (${FLOOR_CODES[step.f]})`;
  $('stx').textContent = step.t;
  $('step-icon').textContent = `${state.currentStepIndex + 1}`;
  $('pv').disabled = !state.currentStepIndex;
  $('nx').disabled = state.currentStepIndex === state.steps.length - 1;

  const progressPct = state.steps.length > 1 ? (state.currentStepIndex / (state.steps.length - 1)) * 100 : 100;
  $('step-progress').style.width = `${progressPct}%`;

  $('sl').innerHTML = state.steps.map((item, idx) => `
    <li class="${idx === state.currentStepIndex ? 'on' : ''}" data-idx="${idx}" role="button" tabindex="0">
      <b>${idx + 1}.</b> ${item.t} (${FLOOR_CODES[item.f]})
    </li>
  `).join('');

  document.querySelectorAll('#sl li').forEach(li => {
    const handleStepSelect = () => navigateToStep(+li.dataset.idx, updateFloorCallback, drawRouteCallback);
    li.onclick = handleStepSelect;
    li.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleStepSelect();
      }
    };
  });

  const activeLi = document.querySelector(`#sl li[data-idx="${state.currentStepIndex}"]`);
  if (activeLi) {
    activeLi.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  if (step.f !== state.currentFloor) {
    updateFloorCallback(step.f);
  } else {
    drawRouteCallback();
  }
}
