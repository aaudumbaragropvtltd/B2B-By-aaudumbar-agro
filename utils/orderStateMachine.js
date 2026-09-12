// ============================================================================
// ORDER STATE MACHINE
// ============================================================================
// Defines valid state transitions for trade_orders.current_state.
// Enforces business rules about who can perform what action.
//
// States:
//   quotation_issued  → Initial state when order is created
//   price_locked_10   → 10% advance paid, price locked for buyer
//   warehouse_loading → Supplier confirms goods are being loaded
//   settled           → Final 90% paid, order complete
//   cancelled         → Order cancelled by buyer/admin
//   rerouted          → Order rerouted to fallback supplier by admin/system
// ============================================================================

/**
 * All valid order states.
 */
export const ORDER_STATES = {
  QUOTATION_ISSUED: 'quotation_issued',
  PRICE_LOCKED_10: 'price_locked_10',
  WAREHOUSE_LOADING: 'warehouse_loading',
  SETTLED: 'settled',
  CANCELLED: 'cancelled',
  REROUTED: 'rerouted',
};

/**
 * Human-readable state labels.
 */
export const STATE_LABELS = {
  quotation_issued: 'Quotation Issued',
  price_locked_10: 'Price Locked (10% Paid)',
  warehouse_loading: 'Warehouse Loading',
  settled: 'Settled',
  cancelled: 'Cancelled',
  rerouted: 'Rerouted',
};

/**
 * State display colors for UI.
 */
export const STATE_COLORS = {
  quotation_issued: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' },
  price_locked_10: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
  warehouse_loading: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500', border: 'border-purple-200' },
  settled: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-200' },
  rerouted: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500', border: 'border-orange-200' },
};

/**
 * The sequential stages for the progress bar (excludes cancelled/rerouted).
 */
export const PROGRESS_STAGES = [
  'quotation_issued',
  'price_locked_10',
  'warehouse_loading',
  'settled',
];

/**
 * Valid transition map.
 * Key: current state
 * Value: array of { nextState, action, allowedRoles, label, description }
 */
const TRANSITIONS = {
  quotation_issued: [
    {
      nextState: 'price_locked_10',
      action: 'pay_advance',
      allowedRoles: ['buyer'],
      label: 'Pay 10% Advance',
      description: 'Lock the price by paying 10% advance into escrow',
      icon: '💳',
    },
    {
      nextState: 'cancelled',
      action: 'cancel',
      allowedRoles: ['buyer', 'admin'],
      label: 'Cancel Order',
      description: 'Cancel this quotation',
      icon: '❌',
      variant: 'danger',
    },
  ],
  price_locked_10: [
    {
      nextState: 'warehouse_loading',
      action: 'confirm_loading',
      allowedRoles: ['supplier'],
      label: 'Confirm Loading',
      description: 'Confirm goods are being loaded at warehouse',
      icon: '🏭',
    },
    {
      nextState: 'cancelled',
      action: 'cancel',
      allowedRoles: ['buyer', 'admin'],
      label: 'Cancel Order',
      description: 'Cancel and refund the 10% advance',
      icon: '❌',
      variant: 'danger',
    },
    {
      nextState: 'rerouted',
      action: 'reroute',
      allowedRoles: ['admin'],
      label: 'Reroute Order',
      description: 'Reroute to a fallback supplier',
      icon: '🔄',
      variant: 'warning',
    },
  ],
  warehouse_loading: [
    {
      nextState: 'settled',
      action: 'pay_dock_balance',
      allowedRoles: ['buyer'],
      label: 'Pay 90% Dock Balance',
      description: 'Complete payment at warehouse dock via QR code',
      icon: '💳',
    },
    {
      nextState: 'cancelled',
      action: 'cancel',
      allowedRoles: ['admin'],
      label: 'Force Cancel',
      description: 'Admin-only: Force cancel after loading started',
      icon: '❌',
      variant: 'danger',
    },
  ],
  // Terminal states — no further transitions
  settled: [],
  cancelled: [],
  rerouted: [
    {
      nextState: 'quotation_issued',
      action: 'reissue_quotation',
      allowedRoles: ['admin'],
      label: 'Reissue Quotation',
      description: 'Create a new quotation with the fallback supplier',
      icon: '📋',
    },
  ],
};

/**
 * Check if a state transition is valid.
 *
 * @param {string} currentState - Current order state
 * @param {string} nextState - Desired next state
 * @param {string} userRole - Role of the user attempting the transition
 * @returns {{ valid: boolean, reason?: string }}
 */
export function canTransition(currentState, nextState, userRole) {
  const transitions = TRANSITIONS[currentState];

  if (!transitions) {
    return { valid: false, reason: `Unknown current state: ${currentState}` };
  }

  const match = transitions.find(t => t.nextState === nextState);

  if (!match) {
    return {
      valid: false,
      reason: `Cannot transition from "${STATE_LABELS[currentState]}" to "${STATE_LABELS[nextState] || nextState}"`,
    };
  }

  // Authorize 'both' and 'admin' for all buyer/supplier actions
  const isAuthorized =
    !userRole ||
    userRole === 'admin' ||
    userRole === 'both' ||
    match.allowedRoles.includes(userRole);

  if (!isAuthorized) {
    return {
      valid: false,
      reason: `Role "${userRole}" is not authorized for this action. Required: ${match.allowedRoles.join(' or ')}`,
    };
  }

  return { valid: true };
}

/**
 * Get available actions for a given state and role.
 * Returns the transition objects the user can perform.
 *
 * @param {string} currentState - Current order state
 * @param {string} userRole - Role of the user
 * @returns {Array<Object>} Available transition actions
 */
export function getNextActions(currentState, userRole) {
  const transitions = TRANSITIONS[currentState] || [];
  if (!userRole || userRole === 'admin' || userRole === 'both') {
    return transitions;
  }
  return transitions.filter(t => t.allowedRoles.includes(userRole));
}

/**
 * Check if an order is in a terminal (final) state.
 *
 * @param {string} state - Order state
 * @returns {boolean}
 */
export function isTerminalState(state) {
  return state === 'settled' || state === 'cancelled';
}

/**
 * Get the progress percentage for the progress bar.
 *
 * @param {string} state - Current order state
 * @returns {number} 0-100 percentage
 */
export function getProgressPercent(state) {
  const idx = PROGRESS_STAGES.indexOf(state);
  if (idx === -1) return 0; // cancelled/rerouted
  return ((idx + 1) / PROGRESS_STAGES.length) * 100;
}
