export const USER_STATES = {
    ACTIVE: 'ACTIVO',
    INACTIVE: 'INACTIVO',
    PENDING: 'PENDIENTE',
};

export const USER_STATE_VALUES = Object.values(USER_STATES);

// PENDIENTE solo se recibe del backend (registro nuevo); un admin no puede asignarlo.
export const ASSIGNABLE_USER_STATES = [USER_STATES.ACTIVE, USER_STATES.INACTIVE];

export const isAssignableUserState = (state) => ASSIGNABLE_USER_STATES.includes(normalizeUserState(state));

export const normalizeUserState = (state) => String(state ?? '').trim().toUpperCase();

export const isValidUserState = (state) => USER_STATE_VALUES.includes(normalizeUserState(state));

export const isPendingUser = (user) => normalizeUserState(user?.state) === USER_STATES.PENDING;

export const isInactiveUser = (user) => normalizeUserState(user?.state) === USER_STATES.INACTIVE;
